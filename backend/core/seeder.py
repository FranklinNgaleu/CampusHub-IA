from datetime import datetime, timedelta
from sqlalchemy import select

from core.database import AsyncSessionLocal
from core.security import hash_password
from models.user import User, YearLevel, UserRole
from models.skill import UserSkill, SkillLevel, SkillCategory
from models.club import Club, ClubMember
from models.event import Event, EventRegistration
from models.mentorship import Mentorship


async def _get_user_by_email(db, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def _get_club_by_name(db, name: str) -> Club | None:
    result = await db.execute(select(Club).where(Club.name == name))
    return result.scalar_one_or_none()


async def _get_event_by_title(db, title: str) -> Event | None:
    result = await db.execute(select(Event).where(Event.title == title))
    return result.scalar_one_or_none()


async def _create_or_update_user(db, payload: dict) -> User:
    user = await _get_user_by_email(db, payload["email"])
    if user:
        for key, value in payload.items():
            if key == "hashed_password" and value is None:
                continue
            setattr(user, key, value)
        return user

    user = User(**payload)
    db.add(user)
    await db.flush()
    return user


async def _reset_user_skills(db, user: User, skills: list[tuple[str, SkillCategory, SkillLevel, str | None]]):
    result = await db.execute(select(UserSkill).where(UserSkill.user_id == user.id))
    for existing in result.scalars().all():
        await db.delete(existing)

    for name, category, level, description in skills:
        db.add(
            UserSkill(
                user_id=user.id,
                name=name,
                category=category,
                level=level,
                is_validated=True,
                description=description,
            )
        )


async def _create_or_update_club(db, name: str, description: str, icon: str, category: str, admin: User) -> Club:
    club = await _get_club_by_name(db, name)
    if club:
        club.description = description
        club.icon = icon
        club.category = category
        club.admin_id = admin.id
        return club

    club = Club(
        name=name,
        description=description,
        icon=icon,
        category=category,
        admin_id=admin.id,
    )
    db.add(club)
    await db.flush()
    return club


async def _create_or_update_event(db, title: str, description: str, emoji: str, event_date: datetime, location: str, event_type: str, capacity: int, organizer: User, club: Club | None = None) -> Event:
    event = await _get_event_by_title(db, title)
    if event:
        event.description = description
        event.emoji = emoji
        event.event_date = event_date
        event.location = location
        event.event_type = event_type
        event.capacity = capacity
        event.organizer_id = organizer.id
        event.club_id = club.id if club else None
        event.is_published = True
        event.is_cancelled = False
        return event

    event = Event(
        title=title,
        description=description,
        emoji=emoji,
        event_date=event_date,
        location=location,
        event_type=event_type,
        capacity=capacity,
        organizer_id=organizer.id,
        club_id=club.id if club else None,
        is_published=True,
        is_cancelled=False,
        skill_tags="Data, Design, Product",
    )
    db.add(event)
    await db.flush()
    return event


async def _ensure_event_registration(db, event: Event, user: User):
    result = await db.execute(
        select(EventRegistration).where(
            EventRegistration.event_id == event.id,
            EventRegistration.user_id == user.id,
        )
    )
    registration = result.scalar_one_or_none()
    if registration:
        return registration

    registration = EventRegistration(event_id=event.id, user_id=user.id, status="confirmed")
    db.add(registration)
    return registration


async def _ensure_club_member(db, club: Club, user: User, role: str = "membre"):
    result = await db.execute(
        select(ClubMember).where(
            ClubMember.club_id == club.id,
            ClubMember.user_id == user.id,
        )
    )
    membership = result.scalar_one_or_none()
    if membership:
        membership.role = role
        membership.is_active = True
        return membership

    membership = ClubMember(club_id=club.id, user_id=user.id, role=role, is_active=True)
    db.add(membership)
    return membership


async def _ensure_mentorship(db, mentor: User, mentee: User, goals: str):
    result = await db.execute(
        select(Mentorship).where(
            Mentorship.mentor_id == mentor.id,
            Mentorship.mentee_id == mentee.id,
        )
    )
    mentorship = result.scalar_one_or_none()
    if mentorship:
        mentorship.goals = goals
        mentorship.status = "active"
        mentorship.match_score = 0.8
        return mentorship

    mentorship = Mentorship(
        mentor_id=mentor.id,
        mentee_id=mentee.id,
        match_score=0.8,
        status="active",
        goals=goals,
    )
    db.add(mentorship)
    return mentorship


async def seed_database() -> None:
    async with AsyncSessionLocal() as db:
        print("🚀 Initialisation des données de seed...")

        student = await _create_or_update_user(db, {
            "email": "test_final@campus.fr",
            "hashed_password": hash_password("password123"),
            "first_name": "Test",
            "last_name": "Final",
            "year_level": YearLevel.B1,
            "role": UserRole.STUDENT,
            "specialty": "Informatique",
            "bio": "Étudiant engagé à la recherche d'un mentor pour ses projets IA.",
            "is_active": True,
            "is_available": True,
            "hours_per_week": 12,
            "linkedin_url": "https://linkedin.com/in/test-final",
        })

        mentor_1 = await _create_or_update_user(db, {
            "email": "thomas.berger@campus.fr",
            "hashed_password": hash_password("password123"),
            "first_name": "Thomas",
            "last_name": "Berger",
            "year_level": YearLevel.M1,
            "role": UserRole.MENTOR,
            "specialty": "Data Science & Machine Learning",
            "bio": "Expert en Data Science avec 5 ans d'expérience. Je peux vous aider sur Python, Pandas, et Scikit-learn.",
            "is_active": True,
            "is_available": True,
            "hours_per_week": 14,
            "linkedin_url": "https://linkedin.com/in/thomas-berger",
        })

        mentor_2 = await _create_or_update_user(db, {
            "email": "camille.dupont@campus.fr",
            "hashed_password": hash_password("password123"),
            "first_name": "Camille",
            "last_name": "Dupont",
            "year_level": YearLevel.M2,
            "role": UserRole.MENTOR,
            "specialty": "Design UX/UI & Product Design",
            "bio": "Designer passionnée par l'UX et l'UI. Je peux vous aider avec Figma, Adobe XD et les méthodes de design.",
            "is_active": True,
            "is_available": True,
            "hours_per_week": 10,
            "linkedin_url": "https://linkedin.com/in/camille-dupont",
        })

        club_admin = await _create_or_update_user(db, {
            "email": "lucas.admin@campus.fr",
            "hashed_password": hash_password("password123"),
            "first_name": "Lucas",
            "last_name": "Martin",
            "year_level": YearLevel.M2,
            "role": UserRole.CLUB_ADMIN,
            "specialty": "Entrepreneuriat & événementiel",
            "bio": "Coordinateur de clubs et d'événements étudiant, je soutiens les communautés CampusHub.",
            "is_active": True,
            "is_available": True,
            "hours_per_week": 8,
            "linkedin_url": "https://linkedin.com/in/lucas-martin",
        })

        await _reset_user_skills(db, mentor_1, [
            ("Python", SkillCategory.DATA, SkillLevel.EXPERT, "Analyse de données, modélisation et ML."),
            ("Machine Learning", SkillCategory.DATA, SkillLevel.ADVANCED, "Projets de classification, régression et NLP."),
            ("Data Science", SkillCategory.DATA, SkillLevel.ADVANCED, "Nettoyage de données, visualisation, pipelines."),
            ("Pandas", SkillCategory.DATA, SkillLevel.ADVANCED, "Manipulation de séries temporelles et de gros jeux de données."),
            ("Scikit-learn", SkillCategory.DATA, SkillLevel.INTERMEDIATE, "Création et évaluation de modèles ML."),
        ])

        await _reset_user_skills(db, mentor_2, [
            ("Figma", SkillCategory.DESIGN, SkillLevel.EXPERT, "Conception d'interfaces et prototypage rapide."),
            ("UI/UX Design", SkillCategory.DESIGN, SkillLevel.ADVANCED, "Méthodes centrées utilisateur et wireframes."),
            ("Adobe XD", SkillCategory.DESIGN, SkillLevel.ADVANCED, "Design d'interfaces pour applications web et mobiles."),
            ("Sketch", SkillCategory.DESIGN, SkillLevel.INTERMEDIATE, "Design d'écrans et livrables graphiques."),
            ("Design Thinking", SkillCategory.SOFT, SkillLevel.ADVANCED, "Ateliers créatifs et résolution de problèmes."),
        ])

        await _reset_user_skills(db, student, [
            ("Python", SkillCategory.TECH, SkillLevel.INTERMEDIATE, "Bases de Python et automatisation."),
            ("PowerPoint", SkillCategory.SOFT, SkillLevel.INTERMEDIATE, "Présentation claire de projets et résultats."),
            ("Communication", SkillCategory.SOFT, SkillLevel.ADVANCED, "Travail en équipe et expression orale."),
        ])

        club_data = [
            ("Club IA CampusHub", "Communauté dédiée aux projets IA, aux ateliers de data science et aux challenges étudiants.", "🤖", "Tech"),
            ("Club Design & Produit", "Club axé sur l'UX/UI, le design produit et la création de prototypes.", "🎨", "Design"),
        ]

        clubs = []
        for name, description, icon, category in club_data:
            club = await _create_or_update_club(db, name, description, icon, category, club_admin)
            clubs.append(club)
            await _ensure_club_member(db, club, club_admin, role="admin")
            await _ensure_club_member(db, club, mentor_2 if category == "Design" else mentor_1, role="membre")
            await _ensure_club_member(db, club, student)

        event_1 = await _create_or_update_event(
            db,
            title="Bootcamp Data & IA",
            description="Atelier intensif pour découvrir les bonnes pratiques en data science et machine learning.",
            emoji="🧠",
            event_date=datetime.now() + timedelta(days=5),
            location="Campus Hub - Salle A",
            event_type="Atelier",
            capacity=40,
            organizer=club_admin,
            club=clubs[0],
        )

        event_2 = await _create_or_update_event(
            db,
            title="Design Sprint Campus",
            description="Session collaborative pour concevoir une interface utilisateur en une journée.",
            emoji="🎨",
            event_date=datetime.now() + timedelta(days=10),
            location="Amphi B",
            event_type="Workshop",
            capacity=30,
            organizer=club_admin,
            club=clubs[1],
        )

        await _ensure_event_registration(db, event_1, student)
        await _ensure_event_registration(db, event_2, mentor_2)

        await _ensure_mentorship(db, mentor_1, student, "Je cherche un mentor pour améliorer mes projets IA et ma préparation d'entretien.")

        await db.commit()

        print("✅ Seed data ajoutées ou mises à jour avec succès !")
        print("   - comptes étudiantes et mentors créés")
        print("   - clubs et événements générés")
        print("   - relation de mentorat et inscriptions aux événements créées")


if __name__ == "__main__":
    import asyncio

    asyncio.run(seed_database())
