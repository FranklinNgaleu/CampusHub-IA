import enum
from datetime import datetime
from typing import Optional, List

from sqlalchemy import String, Boolean, DateTime, Enum, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class UserRole(str, enum.Enum):
    STUDENT = "student"
    MENTOR = "mentor"
    CLUB_ADMIN = "club_admin"
    ADMIN = "admin"


class YearLevel(str, enum.Enum):
    B1 = "B1"
    B2 = "B2"
    B3 = "B3"
    M1 = "M1"
    M2 = "M2"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)

    # role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.STUDENT, nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, values_callable=lambda obj: [e.value for e in obj]),default=UserRole.STUDENT,nullable=False)
    # year_level: Mapped[Optional[YearLevel]] = mapped_column(Enum(YearLevel), nullable=True)
    year_level: Mapped[YearLevel] = mapped_column(Enum(YearLevel, values_callable=lambda obj: [e.value for e in obj]),nullable=False)
    specialty: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    hours_per_week: Mapped[int] = mapped_column(Integer, default=10)

    linkedin_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relations AVEC lazy="selectin" pour éviter MissingGreenlet
    skills: Mapped[List["UserSkill"]] = relationship(
        "UserSkill",
        foreign_keys="UserSkill.user_id",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin"  # ← CORRECTION IMPORTANTE
    )
    project_memberships: Mapped[List["ProjectMember"]] = relationship(
        "ProjectMember",
        foreign_keys="ProjectMember.user_id",
        back_populates="user",
        lazy="selectin"
    )
    mentorships_as_mentor: Mapped[List["Mentorship"]] = relationship(
        "Mentorship",
        foreign_keys="Mentorship.mentor_id",
        back_populates="mentor",
        lazy="selectin"
    )
    mentorships_as_mentee: Mapped[List["Mentorship"]] = relationship(
        "Mentorship",
        foreign_keys="Mentorship.mentee_id",
        back_populates="mentee",
        lazy="selectin"
    )
    event_registrations: Mapped[List["EventRegistration"]] = relationship(
        "EventRegistration",
        foreign_keys="EventRegistration.user_id",
        back_populates="user",
        lazy="selectin"
    )
    club_memberships: Mapped[List["ClubMember"]] = relationship(
        "ClubMember",
        foreign_keys="ClubMember.user_id",
        back_populates="user",
        lazy="selectin"
    )

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    def __repr__(self):
        return f"<User id={self.id} email={self.email} level={self.year_level}>"