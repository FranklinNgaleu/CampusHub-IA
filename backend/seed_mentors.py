"""
Script de seed pour les données de développement.
Exécuter : python seed_mentors.py
"""

import asyncio
from core.seeder import seed_database


if __name__ == "__main__":
    asyncio.run(seed_database())
