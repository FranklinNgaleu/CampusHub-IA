from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from core.config import settings
from core.database import create_tables
from core.seeder import seed_database
from routers import auth, users, skills, matching, mentorat, clubs, events, admin, certifications


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialise l'application."""
    try:
        await create_tables()
        if settings.SEED_ON_STARTUP:
            await seed_database()
    except Exception as exc:
        print(f"❌ Erreur au démarrage de l'application : {exc}")
        raise
    yield


app = FastAPI(
    title="CampusHub IA",
    description="Plateforme intelligente de matching compétences",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configuration CORS - Ultra permissive pour le développement
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Servir les fichiers statiques
app.mount("/static", StaticFiles(directory="static"), name="static")

# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentification"])
app.include_router(users.router, prefix="/api/users", tags=["Utilisateurs"])
app.include_router(skills.router, prefix="/api/skills", tags=["SkillShare"])
app.include_router(matching.router, prefix="/api/matching", tags=["TalentMatch"])
app.include_router(mentorat.router, prefix="/api/mentorat", tags=["MentorLoop"])
app.include_router(clubs.router, prefix="/api/clubs", tags=["KPIs Campus"])
app.include_router(events.router, prefix="/api/events", tags=["EventBoost"])
app.include_router(admin.router, prefix="/api/admin", tags=["Administration"])
app.include_router(certifications.router, prefix="/api/certifications", tags=["Certifications"])


@app.get("/")
async def root():
    return {"status": "ok", "service": "CampusHub IA", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}