import enum
from datetime import datetime, date
from typing import Optional, List

from sqlalchemy import String, Enum, ForeignKey, DateTime, Text, Date, Integer, JSON, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class ProjectStatus(str, enum.Enum):
    DRAFT = "brouillon"
    OPEN = "ouvert"
    IN_PROGRESS = "en cours"
    COMPLETED = "terminé"
    CANCELLED = "annulé"


class ProjectType(str, enum.Enum):
    TECH = "tech"
    DATA = "data"
    DESIGN = "design"
    BUSINESS = "business"
    RESEARCH = "recherche"
    OPEN_INNOVATION = "open_innovation"


class ApplicationStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    # type: Mapped[ProjectType] = mapped_column(Enum(ProjectType), nullable=False)
    type: Mapped[ProjectType] = mapped_column(Enum(ProjectType, values_callable=lambda obj: [e.value for e in obj]),nullable=False)
    # status: Mapped[ProjectStatus] = mapped_column(Enum(ProjectStatus), default=ProjectStatus.OPEN, nullable=False)
    status: Mapped[ProjectStatus] = mapped_column(Enum(ProjectStatus, values_callable=lambda obj: [e.value for e in obj]),default=ProjectStatus.OPEN,nullable=False)

    required_skills: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    max_members: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    required_hours_per_week: Mapped[int] = mapped_column(Integer, default=8)

    supervisor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    embedding: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    members: Mapped[List["ProjectMember"]] = relationship(
        "ProjectMember",
        foreign_keys="ProjectMember.project_id",
        back_populates="project",
        cascade="all, delete-orphan"
    )
    applications: Mapped[List["ProjectApplication"]] = relationship(
        "ProjectApplication",
        foreign_keys="ProjectApplication.project_id",
        back_populates="project",
        cascade="all, delete-orphan"
    )

    @property
    def accepted_members_count(self) -> int:
        return len([m for m in self.members if m.status == "accepted"])

    @property
    def available_slots(self) -> int:
        return max(0, self.max_members - self.accepted_members_count)


class ProjectMember(Base):
    __tablename__ = "project_members"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    role: Mapped[str] = mapped_column(String(100), default="membre")
    status: Mapped[str] = mapped_column(String(50), default="accepted")
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    project: Mapped["Project"] = relationship(
        "Project",
        foreign_keys=[project_id],
        back_populates="members"
    )
    user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="project_memberships"
    )


class ProjectApplication(Base):
    __tablename__ = "project_applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    applicant_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    match_score: Mapped[float] = mapped_column(Float, default=0.0)
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default=ApplicationStatus.PENDING)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    project: Mapped["Project"] = relationship(
        "Project",
        foreign_keys=[project_id],
        back_populates="applications"
    )