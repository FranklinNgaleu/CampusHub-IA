from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from core.database import get_db
from core.security import get_current_user
from models.user import User, YearLevel
from models.project import Project, ProjectStatus, ProjectType, ProjectApplication, ProjectMember
from models.mentorship import Mentorship
from services.matching_service import (
    match_user_to_project,
    match_mentor_to_mentee,
)

router = APIRouter()

# Ordre des niveaux pour le mentorat
YEAR_ORDER = {"B1": 1, "B2": 2, "B3": 3, "M1": 4, "M2": 5}


class ProjectMatchResponse(BaseModel):
    project_id: int
    project_title: str
    project_type: str
    project_description: str
    total_score: float
    score_percent: int
    skill_score: float
    availability_score: float
    interest_score: float
    profile_score: float
    history_score: float
    explanation: str
    match_reason: str
    available_slots: int
    required_skills: list
    created_by: int  # ⭐ AJOUTÉ


class MentorMatchResponse(BaseModel):
    mentor_id: int
    mentor_name: str
    year_level: Optional[str]
    specialty: Optional[str]
    score_percent: int
    total_score: float
    skill_score: float
    availability_score: float
    interest_score: float
    profile_score: float
    history_score: float
    explanation: str
    match_reason: str
    is_available: bool
    active_mentees: int


class ProjectCreate(BaseModel):
    title: str
    description: str
    type: str = "tech"
    max_members: int = 5
    required_skills: List[str] = []
    required_hours_per_week: int = 8


# ─────────────────────────────────────────────────────────────
# GET /matching/projects
# ─────────────────────────────────────────────────────────────

@router.get("/projects", response_model=List[ProjectMatchResponse])
async def get_project_matches(
    top_k: int = Query(default=10, ge=1, le=50),
    min_score: float = Query(default=0.30, ge=0.0, le=1.0),
    type: Optional[str] = Query(default=None, description="Filtrer par type de projet"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retourne les projets ouverts triés par score de matching IA."""
    
    stmt = select(Project).where(Project.status == ProjectStatus.OPEN).options(selectinload(Project.members))
    if type:
        stmt = stmt.where(Project.type == type)

    result = await db.execute(stmt)
    projects = result.scalars().all()

    user_skills = [{"name": s.name, "level": s.level.value} for s in current_user.skills]

    completed_projects_count = await db.scalar(
        select(func.count(ProjectMember.id))
        .join(Project)
        .where(
            ProjectMember.user_id == current_user.id,
            ProjectMember.status == "accepted",
            Project.status == ProjectStatus.COMPLETED,
        )
    )

    avg_mentee_rating = await db.scalar(
        select(func.avg(Mentorship.mentee_rating))
        .where(
            Mentorship.mentee_id == current_user.id,
            Mentorship.mentee_rating != None,
        )
    )
    user_history = {
        "completed_projects": int(completed_projects_count or 0),
        "avg_rating": float(avg_mentee_rating or 0.0),
    }

    matches = []
    for project in projects:
        match = match_user_to_project(
            user_skills=user_skills,
            user_specialty=current_user.specialty,
            user_bio=current_user.bio,
            user_hours_per_week=current_user.hours_per_week,
            user_history=user_history,
            project={
                "id": project.id,
                "title": project.title,
                "description": project.description,
                "type": project.type.value,
                "required_skills": project.required_skills or [],
                "required_hours_per_week": project.required_hours_per_week,
            },
        )

        if match.total_score >= min_score:
            matches.append(ProjectMatchResponse(
                project_id=project.id,
                project_title=project.title,
                project_type=project.type.value,
                project_description=project.description[:200] + "…" if len(project.description) > 200 else project.description,
                total_score=match.total_score,
                score_percent=match.score_percent,
                skill_score=match.skill_score,
                availability_score=match.availability_score,
                interest_score=match.interest_score,
                profile_score=match.profile_score,
                history_score=match.history_score,
                explanation=match.explanation,
                match_reason=match.match_reason,
                available_slots=project.available_slots,
                required_skills=project.required_skills or [],
                created_by=project.created_by,  # ⭐ AJOUTÉ
            ))

    matches.sort(key=lambda x: x.total_score, reverse=True)
    return matches[:top_k]


# ─────────────────────────────────────────────────────────────
# POST /matching/projects (Créer un projet)
# ─────────────────────────────────────────────────────────────

@router.post("/projects", status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Créer un nouveau projet"""
    
    try:
        project_type = ProjectType(project_data.type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Type de projet invalide. Choisir parmi: {[t.value for t in ProjectType]}")
    
    new_project = Project(
        title=project_data.title,
        description=project_data.description,
        type=project_type,
        required_skills=project_data.required_skills,
        max_members=project_data.max_members,
        required_hours_per_week=project_data.required_hours_per_week,
        status=ProjectStatus.OPEN,
        created_by=current_user.id,
    )
    
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)
    
    return {
        "id": new_project.id,
        "title": new_project.title,
        "description": new_project.description,
        "type": new_project.type.value,
        "max_members": new_project.max_members,
        "required_skills": new_project.required_skills,
        "required_hours_per_week": new_project.required_hours_per_week,
        "status": new_project.status.value,
        "created_by": new_project.created_by,
        "created_at": new_project.created_at.isoformat(),
    }


# ─────────────────────────────────────────────────────────────
# POST /matching/projects/{id}/apply
# ─────────────────────────────────────────────────────────────

@router.post("/projects/{project_id}/apply", status_code=status.HTTP_201_CREATED)
async def apply_to_project(
    project_id: int,
    message: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Postuler à un projet."""
    
    result = await db.execute(
        select(Project)
        .where(Project.id == project_id)
        .options(selectinload(Project.members), selectinload(Project.applications))
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    if project.status != ProjectStatus.OPEN:
        raise HTTPException(status_code=400, detail="Ce projet n'accepte plus de candidatures")
    if project.available_slots == 0:
        raise HTTPException(status_code=400, detail="Aucune place disponible dans ce projet")

    existing = next((a for a in project.applications if a.applicant_id == current_user.id), None)
    if existing:
        raise HTTPException(status_code=400, detail="Vous avez déjà postulé à ce projet")

    user_skills = [{"name": s.name, "level": s.level.value} for s in current_user.skills]
    match = match_user_to_project(
        user_skills=user_skills,
        user_specialty=current_user.specialty,
        user_bio=current_user.bio,
        user_hours_per_week=current_user.hours_per_week,
        user_history={"completed_projects": 0, "avg_rating": 0.0},
        project={
            "id": project.id,
            "title": project.title,
            "description": project.description,
            "type": project.type.value,
            "required_skills": project.required_skills or [],
            "required_hours_per_week": project.required_hours_per_week,
        },
    )

    application = ProjectApplication(
        project_id=project_id,
        applicant_id=current_user.id,
        match_score=match.total_score,
        message=message,
        status="pending",
    )
    db.add(application)
    await db.commit()
    await db.refresh(application)

    return {
        "message": "Candidature envoyée avec succès",
        "application_id": application.id,
        "match_score_percent": match.score_percent,
    }


# ─────────────────────────────────────────────────────────────
# DELETE /matching/projects/{project_id} (Supprimer un projet)
# ─────────────────────────────────────────────────────────────

@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Supprimer un projet - seul le créateur peut le faire"""
    
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    if project.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Seul le créateur peut supprimer ce projet")
    
    await db.delete(project)
    await db.commit()
    
    return {"message": "Projet supprimé avec succès"}


# ─────────────────────────────────────────────────────────────
# GET /matching/mentors
# ─────────────────────────────────────────────────────────────

@router.get("/mentors", response_model=List[MentorMatchResponse])
async def get_mentor_matches(
    top_k: int = Query(default=10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retourne les mentors compatibles pour l'utilisateur connecté.
    Un mentor doit avoir un niveau supérieur (B1 → B2 → B3 → M1 → M2).
    """
    level_order = {"B1": 1, "B2": 2, "B3": 3, "M1": 4, "M2": 5}
    
    mentee_level_str = current_user.year_level.value if current_user.year_level else "B1"
    mentee_order = level_order.get(mentee_level_str, 1)
    
    eligible_levels = []
    for level, order in level_order.items():
        if order > mentee_order:
            eligible_levels.append(level)
    
    if not eligible_levels:
        return []
    
    stmt = select(User).where(
        User.year_level.in_(eligible_levels),
        User.is_active == True,
        User.is_available == True
    ).options(selectinload(User.skills), selectinload(User.mentorships_as_mentor))
    
    result = await db.execute(stmt)
    mentors = result.scalars().all()

    matches = []
    for mentor in mentors:
        active_mentees = len([m for m in mentor.mentorships_as_mentor if m.status == "active"])

        mentor_match = match_mentor_to_mentee(
            mentor={
                "id": mentor.id,
                "year_level": mentor.year_level.value if mentor.year_level else None,
                "specialty": mentor.specialty,
                "bio": mentor.bio,
                "full_name": mentor.full_name,
                "is_available": mentor.is_available,
            },
            mentee={
                "id": current_user.id,
                "year_level": current_user.year_level.value if current_user.year_level else None,
                "specialty": current_user.specialty,
                "bio": current_user.bio,
            },
            mentor_skills=[{"name": s.name, "level": s.level.value} for s in mentor.skills],
            mentee_skills=[{"name": s.name, "level": s.level.value} for s in current_user.skills],
        )

        if not mentor_match:
            continue

        matches.append(MentorMatchResponse(
            mentor_id=mentor.id,
            mentor_name=mentor.full_name,
            year_level=mentor.year_level.value if mentor.year_level else None,
            specialty=mentor.specialty,
            score_percent=mentor_match.score_percent,
            total_score=mentor_match.total_score,
            skill_score=mentor_match.skill_score,
            availability_score=mentor_match.availability_score,
            interest_score=mentor_match.interest_score,
            profile_score=mentor_match.profile_score,
            history_score=mentor_match.history_score,
            explanation=mentor_match.explanation,
            match_reason=mentor_match.match_reason,
            is_available=mentor.is_available,
            active_mentees=active_mentees,
        ))

    matches.sort(key=lambda x: x.score_percent, reverse=True)
    return matches[:top_k]
