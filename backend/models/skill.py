import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Enum, ForeignKey, Boolean, DateTime, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class SkillLevel(str, enum.Enum):
    BEGINNER = "débutant"
    INTERMEDIATE = "intermédiaire"
    ADVANCED = "avancé"
    EXPERT = "expert"


class SkillCategory(str, enum.Enum):
    TECH = "Développement"
    DATA = "Data & IA"
    DESIGN = "Design"
    BUSINESS = "Business"
    LANGUAGE = "Langues"
    SOFT = "Soft Skills"
    OTHER = "Autre"


class UserSkill(Base):
    __tablename__ = "user_skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    # category: Mapped[SkillCategory] = mapped_column(Enum(SkillCategory), default=SkillCategory.OTHER, nullable=False)
    # level: Mapped[SkillLevel] = mapped_column(Enum(SkillLevel), default=SkillLevel.BEGINNER, nullable=False)
    category: Mapped[SkillCategory] = mapped_column(Enum(SkillCategory, values_callable=lambda obj: [e.value for e in obj]),default=SkillCategory.OTHER,nullable=False)

    level: Mapped[SkillLevel] = mapped_column(Enum(SkillLevel, values_callable=lambda obj: [e.value for e in obj]),default=SkillLevel.BEGINNER,nullable=False)

    is_validated: Mapped[bool] = mapped_column(Boolean, default=False)
    validated_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relation
    user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="skills"
    )

    def __repr__(self):
        return f"<UserSkill user={self.user_id} name={self.name} level={self.level}>"