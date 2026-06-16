# 🎓 CampusHub IA

**Plateforme intelligente de matching compétences · projets · clubs · mentorat · événements**

> Projet étudiant — Développement Mai → Juillet 2026  
> Stack : FastAPI · React · SQLite · Railway · Supabase

---

## 📋 Table des matières

1. [Présentation du projet](#-présentation-du-projet)
2. [Architecture du projet](#-architecture-du-projet)
3. [Prérequis — outils à installer](#-prérequis--outils-à-installer)
4. [Installation et lancement](#-installation-et-lancement)
5. [Structure des dossiers](#-structure-des-dossiers)
6. [Les modules fonctionnels](#-les-modules-fonctionnels)
7. [Routes API disponibles](#-routes-api-disponibles)
8. [Variables d'environnement](#-variables-denvironnement)
9. [Contribuer au projet](#-contribuer-au-projet)
10. [État d'avancement](#-état-davancement)

---

## 🚀 Présentation du projet

CampusHub IA est une plateforme web qui connecte les étudiants entre eux : matching automatique avec des projets, mise en relation mentors/mentorés, gestion des clubs et recommandation d'événements campus.

**5 modules principaux :**

| Module | Description |
|--------|-------------|
| **SkillShare** | Créer et partager son profil de compétences (tech + soft skills) |
| **TalentMatch** | Algorithme de matching qui associe les étudiants aux projets adaptés |
| **MentorLoop** | Mise en relation M1 (mentors) ↔ B1 (mentorés) avec chat et sessions |
| **KPIs Campus** | Dashboard des clubs avec indicateurs de performance |
| **EventBoost** | Recommandation d'événements campus basée sur le profil étudiant |

---

## 🏗 Architecture du projet

```
Frontend React (Vite + Axios)   →   Backend FastAPI (Python)   →   Base de données SQLite
     :5173                               :8000                         campushub.db
```

Le frontend appelle l'API backend via HTTP. Le backend gère l'authentification JWT, la logique métier et l'accès à la base de données via SQLAlchemy async.

---

## 🛠 Prérequis — outils à installer

Installez ces outils **dans l'ordre** avant de cloner le projet.

### 1. Git
Pour gérer le code source en équipe.

- Télécharger : https://git-scm.com/downloads
- Vérifier : `git --version`

### 2. Python 3.11+
Nécessaire pour faire tourner le backend FastAPI.

- Télécharger : https://www.python.org/downloads/
- **⚠️ Cocher "Add Python to PATH"** pendant l'installation sur Windows
- Vérifier : `python --version`

### 3. Node.js 20+
Nécessaire pour faire tourner le frontend React.

- Télécharger : https://nodejs.org/ (choisir la version LTS)
- Vérifier : `node --version` et `npm --version`

### 4. VS Code
Éditeur de code recommandé pour toute l'équipe.

- Télécharger : https://code.visualstudio.com/
- Extensions recommandées à installer dans VS Code :
  - **Python** (Microsoft)
  - **ES7+ React/Redux/React-Native snippets**
  - **GitLens**
  - **REST Client** (pour tester les routes API directement depuis VS Code)

---

## ⚙️ Installation et lancement

### 1. Cloner le projet

```bash
git clone https://github.com/<votre-organisation>/campushub-ia.git
cd campushub-ia
```

---

### 2. Lancer le Backend (FastAPI)

```bash
# Se placer dans le dossier backend
cd backend

# Créer un environnement virtuel Python
python -m venv venv

# Activer l'environnement virtuel
# Sur Windows :
venv\Scripts\activate
# Sur Mac/Linux :
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Lancer le serveur
uvicorn main:app --reload --port 8000
```

✅ Backend accessible sur : **http://localhost:8000**  
📖 Documentation Swagger interactive : **http://localhost:8000/docs**  
🔍 Vérifier que l'API tourne : **http://localhost:8000/health**

> La base de données SQLite (`campushub.db`) est créée automatiquement au premier lancement.

---

### 3. Peupler la base de données avec des données de test

Une fois le backend lancé, dans un **autre terminal** (avec le venv activé) :

```bash
cd backend
python seed_mentors.py
```

Cela crée 3 comptes de test :

| Email | Mot de passe | Niveau | Rôle |
|-------|-------------|--------|------|
| `test_final@campus.fr` | `password123` | B1 | Étudiant |
| `thomas.berger@campus.fr` | `password123` | M1 | Mentor |
| `camille.dupont@campus.fr` | `password123` | M2 | Mentor |

---

### 4. Lancer le Frontend (React + Vite)

Ouvrir un **nouveau terminal** (laisser le backend tourner) :

```bash
# Se placer dans le dossier frontend
cd frontend

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

✅ Frontend accessible sur : **http://localhost:5173**

---

### Astuce : deux terminaux en parallèle dans VS Code

`Ctrl+Shift+5` (ou le bouton `+` dans le terminal) pour ouvrir un second terminal et lancer backend et frontend en même temps.

---

## 📁 Structure des dossiers

```
campushub-ia/
│
├── backend/                        # Tout le code Python
│   ├── main.py                     # Point d'entrée FastAPI + CORS
│   ├── requirements.txt            # Dépendances Python à installer
│   ├── campushub.db                # Base de données SQLite (créée au lancement)
│   ├── seed_mentors.py             # Script pour créer des données de test
│   ├── check_db.py                 # Script pour inspecter la base de données
│   │
│   ├── core/
│   │   ├── config.py               # Configuration (lit les variables d'environnement)
│   │   ├── database.py             # Connexion SQLAlchemy async
│   │   └── security.py             # JWT : hash, création et vérification des tokens
│   │
│   ├── models/                     # Tables de la base de données (SQLAlchemy)
│   │   ├── user.py                 # Table users
│   │   ├── skill.py                # Table user_skills
│   │   ├── project.py              # Tables projects, project_members, project_applications
│   │   ├── mentorship.py           # Tables mentorships, mentoring_sessions, mentor_messages
│   │   ├── club.py                 # Tables clubs, club_members
│   │   └── event.py                # Tables events, event_registrations
│   │
│   ├── routers/                    # Routes de l'API
│   │   ├── auth.py                 # Inscription, connexion, déconnexion, refresh token
│   │   ├── users.py                # Profil utilisateur
│   │   ├── skills.py               # Gestion des compétences
│   │   ├── matching.py             # Matching projets et mentors
│   │   ├── mentorat.py             # Mentorats, sessions, messages, feedback
│   │   ├── clubs.py                # Clubs et KPIs
│   │   ├── events.py               # Événements et inscriptions
│   │   └── admin.py                # Dashboard admin (réservé au rôle admin)
│   │
│   ├── services/
│   │   └── matching_service.py     # Algorithme de matching (score compétences + dispo + intérêts)
│   │
│   ├── static/
│   │   └── avatars/                # Photos de profil uploadées
│   │
│   └── tests/                      # Tests automatiques (à compléter)
│
├── frontend/                       # Tout le code React
│   ├── index.html
│   ├── package.json                # Dépendances Node.js
│   ├── vite.config.js
│   │
│   └── src/
│       ├── main.jsx                # Point d'entrée React
│       ├── App.jsx                 # Layout (sidebar + topbar + routing entre pages)
│       │
│       ├── context/
│       │   └── AuthContext.jsx     # Session utilisateur globale (JWT stocké en localStorage)
│       │
│       ├── services/
│       │   ├── api.js              # Toutes les fonctions d'appel API (Axios)
│       │   └── notificationService.js  # Notifications push navigateur
│       │
│       ├── components/
│       │   ├── ProtectedRoute.jsx  # Redirige vers /login si non connecté
│       │   └── UI.jsx              # Composants réutilisables : Btn, Card, Badge...
│       │
│       └── pages/
│           ├── Login.jsx           # Page connexion
│           ├── Register.jsx        # Page inscription (prénom, nom, email, niveau, spécialité)
│           ├── Dashboard.jsx       # Vue d'ensemble
│           ├── SkillShare.jsx      # Gestion des compétences
│           ├── TalentMatch.jsx     # Matching avec les projets
│           ├── MentorLoop.jsx      # Mentorat, chat, planification de sessions
│           ├── KPIsCampus.jsx      # Dashboard des clubs
│           └── EventBoost.jsx      # Événements campus
│
└── README.md
```

---

## 🧩 Les modules fonctionnels

### Authentification
- Inscription : email, prénom, nom, mot de passe (min. 8 caractères), niveau (B1/B2/B3/M1/M2), spécialité
- Connexion : email + mot de passe → reçoit un `access_token` (JWT, valide 60 min) et un `refresh_token` (valide 30 jours)
- Le token est stocké dans le `localStorage` du navigateur et envoyé automatiquement dans chaque requête
- Toutes les pages (sauf `/login` et `/register`) sont protégées : sans token valide → redirection automatique vers `/login`
- Déconnexion : supprime les tokens du localStorage

### SkillShare
Les étudiants ajoutent leurs compétences avec un nom, une catégorie et un niveau (débutant / intermédiaire / avancé / expert). Ces compétences alimentent l'algorithme de matching.

### TalentMatch
L'algorithme calcule un score de compatibilité entre l'étudiant et chaque projet disponible selon 4 critères pondérés : compétences (50%), disponibilités (20%), intérêts (20%), historique (10%). Les projets sont affichés triés par score décroissant.

### MentorLoop
- Recherche et demande de mentorat à un étudiant M1/M2
- Chat intégré entre mentor et mentoré (messages en temps réel par polling)
- Planification de sessions de mentorat (date, durée, lieu, sujet)
- Feedback post-session par le mentoré (note + commentaire)
- **Note :** bug de comparaison de timezone corrigé dans `routers/mentorat.py`

### KPIs Campus
- Liste des clubs actifs avec le nombre de membres
- Indicateurs globaux : total clubs, total membres, événements organisés
- Rejoindre ou quitter un club
- Créer un nouveau club

### EventBoost
- Liste de tous les événements campus
- Inscription et désinscription aux événements
- Création d'événements (accessible aux responsables de club et admins)

---

## 🔌 Routes API disponibles

Documentation complète et testable sur **http://localhost:8000/docs**.

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Créer un compte |
| POST | `/api/auth/login` | Se connecter (retourne les tokens JWT) |
| POST | `/api/auth/logout` | Se déconnecter |
| POST | `/api/auth/refresh` | Renouveler le token d'accès |
| GET | `/api/users/me` | Profil de l'utilisateur connecté |
| PUT | `/api/users/me` | Modifier son profil |
| GET | `/api/skills` | Mes compétences |
| POST | `/api/skills` | Ajouter une compétence |
| PUT | `/api/skills/{id}` | Modifier une compétence |
| DELETE | `/api/skills/{id}` | Supprimer une compétence |
| GET | `/api/matching/projects` | Projets recommandés (triés par score) |
| GET | `/api/matching/mentors` | Mentors recommandés |
| POST | `/api/matching/projects/{id}/apply` | Postuler à un projet |
| GET | `/api/mentorat` | Mes relations de mentorat |
| POST | `/api/mentorat` | Demander un mentor |
| GET | `/api/mentorat/{id}/messages` | Messages d'un mentorat |
| POST | `/api/mentorat/{id}/messages` | Envoyer un message |
| GET | `/api/mentorat/{id}/sessions` | Sessions planifiées |
| POST | `/api/mentorat/{id}/sessions` | Planifier une session |
| POST | `/api/mentorat/{id}/sessions/{sid}/feedback` | Soumettre un feedback |
| GET | `/api/clubs` | Liste des clubs |
| GET | `/api/clubs/kpis` | KPIs globaux des clubs |
| POST | `/api/clubs` | Créer un club |
| POST | `/api/clubs/{id}/join` | Rejoindre un club |
| DELETE | `/api/clubs/{id}/leave` | Quitter un club |
| GET | `/api/events` | Tous les événements |
| POST | `/api/events` | Créer un événement |
| POST | `/api/events/{id}/register` | S'inscrire à un événement |
| DELETE | `/api/events/{id}/register` | Se désinscrire |
| GET | `/api/admin/dashboard` | Stats globales (admin uniquement) |
| GET | `/api/admin/users` | Liste des utilisateurs (admin uniquement) |
| GET | `/health` | Vérifier que l'API tourne |

---

## 🔐 Variables d'environnement

Le fichier `config.py` lit les variables depuis un fichier `.env` placé dans `backend/`. Créez ce fichier manuellement :

```bash
# Dans le dossier backend/
touch .env
```

Contenu du `.env` :

```env
# Base de données — SQLite en développement local (ne pas modifier)
DATABASE_URL=sqlite+aiosqlite:///./campushub.db

# Clé secrète pour signer les tokens JWT
# IMPORTANT : changer cette valeur en production
# Pour générer une clé sécurisée : openssl rand -hex 32
SECRET_KEY=dev-secret-key-change-in-production

ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30

# Email (optionnel — laisser vide si pas utilisé)
SMTP_USER=
SMTP_PASS=



## 📊 État d'avancement

### ✅ Terminé
- Structure complète backend + frontend
- Authentification JWT (inscription, connexion, déconnexion, refresh token)
- 12 tables en base de données : users, skills, projects, mentorships, sessions, messages, clubs, events...
- Toutes les routes API des 5 modules implémentées
- Algorithme de matching (score compétences + disponibilités + intérêts + historique)
- Interface React complète : toutes les pages, sidebar, navigation, toasts, notifications push
- Chat MentorLoop avec polling
- Planification de sessions de mentorat
- Feedback post-session
- Script de données de test (`seed_mentors.py`) avec 3 comptes prêts à l'emploi
- Script d'inspection de la base de données (`check_db.py`)
- Bug timezone sessions mentorat corrigé

### 📌 À faire
- Tests unitaires backend (dossier `tests/` vide — objectif : couverture ≥ 70%)
- Fichier `.env.example` à créer pour guider les nouveaux membres
- `.gitignore` côté backend (pour exclure `.env`, `venv/`, `campushub.db`, `__pycache__/`)
- Migration vers PostgreSQL (Supabase) pour la mise en production
- Déploiement sur Railway
- Pipeline CI/CD GitHub Actions
- Application mobile Flutter (Phase 2)

---

## 👥 Équipe

| Rôle | Personne | Responsabilités |
|------|----------|----------------|
| Cheffe de projet | Kelly | Trello, réunions sprint, validation PR |
| Dev Backend & IA | Stéphane | FastAPI, BDD, algorithme matching |
| Dev Frontend & UX | Franklin | React, composants, pages |
| Infra / DevOps | Carelle | Docker, Railway, Supabase, CI/CD |
| Dev Junior / QA | Dayane | Tests, données de test, documentation |
| Dev Junior / QA | Maimouna | Tests, README, composants React |

---

*CampusHub IA — Projet étudiant confidentiel*

pret
