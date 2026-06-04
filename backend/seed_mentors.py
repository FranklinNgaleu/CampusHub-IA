"""
Script pour créer/mettre à jour les mentors dans la base de données
Exécuter: python seed_mentors.py
"""

import asyncio
import sys
import os

# Ajouter le chemin du projet
sys.path.append(os.path.dirname(os.path.abspath(__file__)))


from core.database import AsyncSessionLocal
from core.security import hash_password
from models.user import User, YearLevel, UserRole
from models.skill import UserSkill, SkillLevel, SkillCategory
from sqlalchemy import select
from models.mentorship import Mentorship
from models.project import ProjectMember
from models.event import EventRegistration
from models.club import ClubMember


async def create_or_update_mentors():
    """Crée ou met à jour les comptes mentors"""
    
    async with AsyncSessionLocal() as db:
        print("🚀 Début de la configuration des mentors...")
        
        # ============================================================
        # 1. CRÉER/METTRE À JOUR LE COMPTE B1 (ÉTUDIANT)
        # ============================================================
        print("\n📝 Étape 1: Configuration du compte B1...")
        
        result = await db.execute(select(User).where(User.email == "test_final@campus.fr"))
        student = result.scalar_one_or_none()
        
        if student:
            print(f"✅ Compte B1 existe déjà: {student.email}")
        else:
            student = User(
                email="test_final@campus.fr",
                hashed_password=hash_password("password123"),
                first_name="Test",
                last_name="Final",
                year_level=YearLevel.B1,
                role=UserRole.STUDENT,
                specialty="Informatique",
                is_active=True,
                is_available=True,
                hours_per_week=15
            )
            db.add(student)
            await db.flush()
            print(f"✨ Compte B1 créé: {student.email}")
        
        # ============================================================
        # 2. CRÉER/METTRE À JOUR LE MENTOR M1 (Thomas Berger)
        # ============================================================
        print("\n📝 Étape 2: Configuration du mentor M1 (Thomas Berger)...")
        
        result = await db.execute(select(User).where(User.email == "thomas.berger@campus.fr"))
        mentor_m1 = result.scalar_one_or_none()
        
        if mentor_m1:
            # Mettre à jour les informations
            mentor_m1.first_name = "Thomas"
            mentor_m1.last_name = "Berger"
            mentor_m1.year_level = YearLevel.M1
            mentor_m1.role = UserRole.MENTOR
            mentor_m1.specialty = "Data Science & Machine Learning"
            mentor_m1.bio = "Expert en Data Science avec 5 ans d'expérience. Je peux vous aider sur Python, Pandas, Scikit-learn et les projets IA."
            mentor_m1.is_available = True
            mentor_m1.hours_per_week = 12
            print(f"✅ Mentor M1 mis à jour: {mentor_m1.email}")
        else:
            mentor_m1 = User(
                email="thomas.berger@campus.fr",
                hashed_password=hash_password("password123"),
                first_name="Thomas",
                last_name="Berger",
                year_level=YearLevel.M1,
                role=UserRole.MENTOR,
                specialty="Data Science & Machine Learning",
                bio="Expert en Data Science avec 5 ans d'expérience. Je peux vous aider sur Python, Pandas, Scikit-learn et les projets IA.",
                is_active=True,
                is_available=True,
                hours_per_week=12
            )
            db.add(mentor_m1)
            await db.flush()
            print(f"✨ Mentor M1 créé: {mentor_m1.email}")
        
        # ============================================================
        # 3. CRÉER/METTRE À JOUR LE MENTOR M2 (Camille Dupont)
        # ============================================================
        print("\n📝 Étape 3: Configuration du mentor M2 (Camille Dupont)...")
        
        result = await db.execute(select(User).where(User.email == "camille.dupont@campus.fr"))
        mentor_m2 = result.scalar_one_or_none()
        
        if mentor_m2:
            mentor_m2.first_name = "Camille"
            mentor_m2.last_name = "Dupont"
            mentor_m2.year_level = YearLevel.M2
            mentor_m2.role = UserRole.MENTOR
            mentor_m2.specialty = "Design UX/UI & Product Design"
            mentor_m2.bio = "Designer passionnée par l'UX et l'UI. Je peux vous aider sur Figma, Adobe XD et les principes de design."
            mentor_m2.is_available = True
            mentor_m2.hours_per_week = 10
            print(f"✅ Mentor M2 mis à jour: {mentor_m2.email}")
        else:
            mentor_m2 = User(
                email="camille.dupont@campus.fr",
                hashed_password=hash_password("password123"),
                first_name="Camille",
                last_name="Dupont",
                year_level=YearLevel.M2,
                role=UserRole.MENTOR,
                specialty="Design UX/UI & Product Design",
                bio="Designer passionnée par l'UX et l'UI. Je peux vous aider sur Figma, Adobe XD et les principes de design.",
                is_active=True,
                is_available=True,
                hours_per_week=10
            )
            db.add(mentor_m2)
            await db.flush()
            print(f"✨ Mentor M2 créé: {mentor_m2.email}")
        
        # ============================================================
        # 4. SUPPRIMER LES ANCIENNES COMPÉTENCES ET AJOUTER LES NOUVELLES
        # ============================================================
        print("\n📝 Étape 4: Configuration des compétences...")
        
        # Compétences pour Thomas Berger (M1)
        result = await db.execute(select(UserSkill).where(UserSkill.user_id == mentor_m1.id))
        old_skills = result.scalars().all()
        for skill in old_skills:
            await db.delete(skill)
        
        skills_m1 = [
            ("Python", SkillCategory.DATA, SkillLevel.EXPERT),
            ("Machine Learning", SkillCategory.DATA, SkillLevel.ADVANCED),
            ("Data Science", SkillCategory.DATA, SkillLevel.ADVANCED),
            ("Pandas", SkillCategory.DATA, SkillLevel.ADVANCED),
            ("Scikit-learn", SkillCategory.DATA, SkillLevel.INTERMEDIATE),
        ]
        
        for name, category, level in skills_m1:
            skill = UserSkill(
                user_id=mentor_m1.id,
                name=name,
                category=category,
                level=level,
                is_validated=True
            )
            db.add(skill)
        print(f"✅ {len(skills_m1)} compétences ajoutées pour Thomas Berger")
        
        # Compétences pour Camille Dupont (M2)
        result = await db.execute(select(UserSkill).where(UserSkill.user_id == mentor_m2.id))
        old_skills = result.scalars().all()
        for skill in old_skills:
            await db.delete(skill)
        
        skills_m2 = [
            ("Figma", SkillCategory.DESIGN, SkillLevel.EXPERT),
            ("UI/UX Design", SkillCategory.DESIGN, SkillLevel.ADVANCED),
            ("Adobe XD", SkillCategory.DESIGN, SkillLevel.ADVANCED),
            ("Sketch", SkillCategory.DESIGN, SkillLevel.INTERMEDIATE),
            ("Design Thinking", SkillCategory.SOFT, SkillLevel.ADVANCED),
        ]
        
        for name, category, level in skills_m2:
            skill = UserSkill(
                user_id=mentor_m2.id,
                name=name,
                category=category,
                level=level,
                is_validated=True
            )
            db.add(skill)
        print(f"✅ {len(skills_m2)} compétences ajoutées pour Camille Dupont")
        
        # ============================================================
        # 5. AFFICHER LE RÉSUMÉ
        # ============================================================
        await db.commit()
        
        print("\n" + "="*60)
        print("✅ CONFIGURATION TERMINÉE !")
        print("="*60)
        
        print("\n📋 RÉSUMÉ DES COMPTES :")
        print("-"*50)
        print("\n👨‍🎓 ÉTUDIANT B1 :")
        print(f"   📧 Email: test_final@campus.fr")
        print(f"   🔑 Mot de passe: password123")
        print(f"   📚 Niveau: B1")
        
        print("\n🧑‍🏫 MENTOR M1 :")
        print(f"   📧 Email: thomas.berger@campus.fr")
        print(f"   🔑 Mot de passe: password123")
        print(f"   📚 Niveau: M1")
        print(f"   💼 Spécialité: Data Science & Machine Learning")
        
        print("\n🧑‍🏫 MENTOR M2 :")
        print(f"   📧 Email: camille.dupont@campus.fr")
        print(f"   🔑 Mot de passe: password123")
        print(f"   📚 Niveau: M2")
        print(f"   💼 Spécialité: Design UX/UI & Product Design")
        
        print("\n" + "="*60)
        print("🚀 Pour tester la recherche de mentors :")
        print("   1. Connectez-vous avec le compte B1")
        print("   2. Allez dans MentorLoop")
        print("   3. Cliquez sur 'Rechercher un mentor'")
        print("="*60)


async def main():
    try:
        await create_or_update_mentors()
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())