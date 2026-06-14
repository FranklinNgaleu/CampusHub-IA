"""
Service de Matching IA pour CampusHub
"""

from dataclasses import dataclass
from difflib import SequenceMatcher
from typing import Optional
import re
import unicodedata

YEAR_ORDER = {"B1": 1, "B2": 2, "B3": 3, "M1": 4, "M2": 5}
LEVEL_SCORES = {"débutant": 1, "intermédiaire": 2, "avancé": 3, "expert": 4}


@dataclass
class MatchResult:
    entity_id: int
    total_score: float
    skill_score: float
    availability_score: float
    interest_score: float
    profile_score: float
    history_score: float
    explanation: str
    match_reason: str

    @property
    def score_percent(self) -> int:
        return round(self.total_score * 100)


def normalize_text(text: str) -> str:
    if not text:
        return ""
    normalized = unicodedata.normalize("NFKD", text)
    normalized = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    normalized = normalized.lower().strip()
    normalized = re.sub(r"[^a-z0-9\s]+", " ", normalized)
    return re.sub(r"\s+", " ", normalized).strip()


def text_similarity(a: str, b: str) -> float:
    a_norm = normalize_text(a)
    b_norm = normalize_text(b)
    if not a_norm or not b_norm:
        return 0.0

    if a_norm == b_norm:
        return 1.0

    ratio = SequenceMatcher(None, a_norm, b_norm).ratio()
    tokens_a = set(a_norm.split())
    tokens_b = set(b_norm.split())
    if not tokens_a or not tokens_b:
        return ratio

    overlap = len(tokens_a & tokens_b) / max(len(tokens_a | tokens_b), 1)
    return max(ratio, overlap)


def compute_skill_score(user_skills: list, required_skills: list) -> float:
    if not required_skills:
        return 0.50

    user_map = {
        normalize_text(s["name"]): LEVEL_SCORES.get(s.get("level", "débutant"), 1)
        for s in user_skills
    }

    total_weight = 0.0
    matched_weight = 0.0

    for req in required_skills:
        req_name = normalize_text(req.get("name", ""))
        req_level = LEVEL_SCORES.get(req.get("level", "débutant"), 1)
        total_weight += req_level

        if not req_name:
            continue

        if req_name in user_map:
            coverage = min(user_map[req_name] / req_level, 1.0)
            matched_weight += req_level * coverage
            continue

        best_similarity = 0.0
        best_level = 0
        for user_name, user_level in user_map.items():
            similarity = text_similarity(req_name, user_name)
            if similarity > best_similarity:
                best_similarity = similarity
                best_level = user_level

        if best_similarity >= 0.65:
            coverage = min(best_level / req_level, 1.0) * best_similarity
            matched_weight += req_level * coverage

    return matched_weight / total_weight if total_weight > 0 else 0.0


def compute_availability_score(user_hours: int, project_hours: int) -> float:
    if project_hours <= 0:
        return 1.0
    return min(user_hours / project_hours, 1.0)


def compute_interest_score(user_specialty: Optional[str], project_type: Optional[str]) -> float:
    if not user_specialty or not project_type:
        return 0.35

    specialty_lower = normalize_text(user_specialty)
    project_lower = normalize_text(project_type)
    specialty_tokens = set(specialty_lower.split())
    project_tokens = set(project_lower.split())

    data_tokens = {"data", "ia", "intelligence", "machine", "learning", "ml"}
    tech_tokens = {"tech", "informatique", "dev", "development", "backend", "frontend", "fullstack"}
    design_tokens = {"design", "ux", "ui", "graphisme"}
    business_tokens = {"marketing", "business", "commerce", "vente", "gestion"}

    if project_tokens & data_tokens and specialty_tokens & data_tokens:
        return 0.95
    if project_tokens & tech_tokens and specialty_tokens & tech_tokens:
        return 0.92
    if project_tokens & design_tokens and specialty_tokens & design_tokens:
        return 0.95
    if project_tokens & business_tokens and specialty_tokens & business_tokens:
        return 0.90
    if project_tokens & specialty_tokens:
        return 0.80

    return 0.50


def compute_profile_fit_score(
    user_specialty: Optional[str],
    user_bio: Optional[str],
    project_title: str,
    project_description: str,
    project_type: Optional[str],
    required_skills: list,
) -> float:
    user_text = " ".join(filter(None, [user_specialty, user_bio]))
    title_text = project_title or ""
    description_text = project_description or ""
    skills_text = " ".join(filter(None, [project_type, " ".join(required_skills)]))

    if not user_text:
        return 0.35

    title_similarity = text_similarity(user_text, title_text)
    description_similarity = text_similarity(user_text, description_text)
    skills_similarity = text_similarity(user_text, skills_text)

    score = title_similarity * 0.25 + description_similarity * 0.45 + skills_similarity * 0.30
    return min(max(score, 0.25), 1.0)


def compute_history_score(completed_projects: int, avg_rating: float) -> float:
    project_bonus = min(completed_projects * 0.05, 0.45)
    rating_score = (avg_rating / 5.0) * 0.55 if avg_rating > 0 else 0.20
    return min(project_bonus + rating_score, 1.0)


def build_match_reason(
    skill_score: float,
    availability_score: float,
    interest_score: float,
    profile_score: float,
    history_score: float,
) -> str:
    reasons = []

    if skill_score >= 0.8:
        reasons.append("Fort alignement des compétences")
    elif skill_score >= 0.5:
        reasons.append("Compétences compatibles")
    else:
        reasons.append("Compétences à renforcer")

    if profile_score >= 0.8:
        reasons.append("Contexte projet très adapté")
    elif profile_score >= 0.5:
        reasons.append("Contexte projet aligné")
    else:
        reasons.append("Contexte à améliorer")

    if interest_score >= 0.8:
        reasons.append("Spécialité alignée")
    elif interest_score >= 0.5:
        reasons.append("Intérêt partiellement aligné")
    else:
        reasons.append("Spécialité éloignée")

    if availability_score < 0.6:
        reasons.append("Disponibilité limitée")

    if history_score >= 0.6:
        reasons.append("Expérience précédente valorisée")
    elif history_score < 0.35:
        reasons.append("Profil en phase de découverte")

    return ". ".join(reasons) + ".\n"


def match_user_to_project(
    user_skills: list,
    user_specialty: Optional[str],
    user_bio: Optional[str],
    user_hours_per_week: int,
    user_history: dict,
    project: dict,
) -> MatchResult:
    skill_score = compute_skill_score(user_skills, project.get("required_skills", []))
    availability_score = compute_availability_score(user_hours_per_week, project.get("required_hours_per_week", 8))
    interest_score = compute_interest_score(user_specialty, project.get("type"))
    profile_score = compute_profile_fit_score(
        user_specialty,
        user_bio,
        project.get("title", ""),
        project.get("description", ""),
        project.get("type"),
        [req.get("name", "") for req in project.get("required_skills", [])],
    )
    history_score = compute_history_score(user_history.get("completed_projects", 0), user_history.get("avg_rating", 0.0))

    total = (
        skill_score * 0.45
        + availability_score * 0.20
        + interest_score * 0.15
        + profile_score * 0.10
        + history_score * 0.10
    )

    explanation = (
        f"Compétences {skill_score:.0%} · Dispo {availability_score:.0%} · "
        f"Intérêts {interest_score:.0%} · Contexte {profile_score:.0%}"
    )
    match_reason = build_match_reason(
        skill_score,
        availability_score,
        interest_score,
        profile_score,
        history_score,
    )

    return MatchResult(
        entity_id=project["id"],
        total_score=round(min(total, 1.0), 4),
        skill_score=round(skill_score, 4),
        availability_score=round(availability_score, 4),
        interest_score=round(interest_score, 4),
        profile_score=round(profile_score, 4),
        history_score=round(history_score, 4),
        explanation=explanation,
        match_reason=match_reason,
    )


def match_mentor_to_mentee(
    mentor: dict,
    mentee: dict,
    mentor_skills: list,
    mentee_skills: list,
) -> Optional[MatchResult]:
    mentor_order = YEAR_ORDER.get(mentor.get("year_level", ""), 0)
    mentee_order = YEAR_ORDER.get(mentee.get("year_level", ""), 0)

    if mentor_order <= mentee_order:
        return None

    mentee_weak = {s["name"].lower() for s in mentee_skills if s.get("level") in ("débutant", "intermédiaire")}
    mentor_strong = {s["name"].lower() for s in mentor_skills if s.get("level") in ("avancé", "expert")}

    if mentee_weak:
        skill_score = min(len(mentor_strong & mentee_weak) / len(mentee_weak), 1.0)
    else:
        skill_score = 0.40

    interest_score = compute_interest_score(mentee.get("specialty"), mentor.get("specialty"))
    profile_score = compute_profile_fit_score(
        mentee.get("specialty"),
        mentee.get("bio"),
        mentor.get("full_name", ""),
        mentor.get("bio", ""),
        mentor.get("specialty"),
        [skill.get("name", "") for skill in mentor_skills],
    )
    availability_score = 1.0 if mentor.get("is_available") else 0.0
    level_bonus = min((mentor_order - mentee_order) * 0.10, 0.40)

    total = (
        skill_score * 0.40
        + interest_score * 0.20
        + availability_score * 0.15
        + profile_score * 0.15
        + level_bonus * 0.10
    )

    explanation = (
        f"Expertise {skill_score:.0%} · Spécialité {interest_score:.0%} · "
        f"Disponibilité {availability_score:.0%} · Contexte {profile_score:.0%}"
    )
    history_score = min(0.20 + level_bonus * 0.5, 0.40)
    match_reason = build_match_reason(
        skill_score,
        availability_score,
        interest_score,
        profile_score,
        history_score,
    )

    return MatchResult(
        entity_id=mentor["id"],
        total_score=round(min(total, 1.0), 4),
        skill_score=round(skill_score, 4),
        availability_score=round(availability_score, 4),
        interest_score=round(interest_score, 4),
        profile_score=round(profile_score, 4),
        history_score=round(history_score, 4),
        explanation=explanation,
        match_reason=match_reason,
    )


def rank_matches(matches: list, top_k: int = 10, min_score: float = 0.30) -> list:
    """Trie et filtre les matchings par score."""
    filtered = [m for m in matches if m.total_score >= min_score]
    return sorted(filtered, key=lambda x: x.total_score, reverse=True)[:top_k]
