import { useState, useEffect } from 'react'
import { Tag, Btn, ProgressBar, SectionHeader, Card } from '../components/UI.jsx'
import { matching } from '../services/api'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const tm = `
  .project-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 14px; margin-bottom: 22px; }
  .project-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 18px;
    transition: all .2s; cursor: pointer; position: relative; overflow: hidden;
  }
  .project-card:hover { border-color: var(--border2); transform: translateY(-2px); }
  .project-top  { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; }
  .project-title{ font-weight:700; font-size:14px; margin-bottom:6px; }
  .project-desc { color:var(--muted); font-size:12px; line-height:1.5; margin-bottom:12px; }
  .project-skills{ display:flex; flex-wrap:wrap; gap:5px; margin-bottom:12px; }
  .project-foot { display:flex; align-items:center; justify-content:space-between; }
  .algo-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; margin-top:16px; }
  .algo-item {
    text-align:center; padding:14px 10px;
    background:var(--surface2); border-radius:10px; border:1px solid var(--border);
  }
  .algo-pct { font-family:var(--font-display); font-size:22px; font-weight:800; margin-bottom:3px; }
  .algo-name{ font-weight:600; font-size:12px; margin-bottom:5px; }
  .algo-desc{ font-size:10px; color:var(--muted); }
  .filter-row{ display:flex; gap:7px; margin-bottom:18px; flex-wrap:wrap; }
  .form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px; }
  .form-group label { font-size: 12px; font-weight: 600; color: var(--muted); }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  @media (max-width:820px) { .project-grid { grid-template-columns:1fr; } .algo-grid { grid-template-columns:repeat(2,1fr); } .form-row { grid-template-columns:1fr; } }
`

const TYPE_COLOR = {
  tech: { bg: 'rgba(79,124,255,.1)', text: 'var(--accent)', line: 'var(--accent)' },
  data: { bg: 'rgba(52,211,153,.1)', text: 'var(--green)', line: 'var(--green)' },
  design: { bg: 'rgba(244,114,182,.1)', text: 'var(--pink)', line: 'var(--pink)' },
  business: { bg: 'rgba(251,146,60,.1)', text: 'var(--orange)', line: 'var(--orange)' },
}

export default function TalentMatch({ addToast }) {
  const { user } = useAuth()
  const [filter, setFilter] = useState('tous')
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [appliedProjects, setAppliedProjects] = useState(new Set())
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    type: 'tech',
    required_skills: '',
    max_members: 5,
    required_hours_per_week: 8
  })

  useEffect(() => {
    fetchProjects()
  }, [filter])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const params = filter !== 'tous' ? { type: filter } : {}
      const res = await matching.getProjects(params)
      setProjects(res.data || [])
    } catch (error) {
      console.error('Erreur chargement projets:', error)
      addToast('❌', 'Erreur', 'Impossible de charger les projets')
    } finally {
      setLoading(false)
    }
  }

  const applyToProject = async (projectId, projectTitle) => {
    if (appliedProjects.has(projectId)) {
      addToast('⚠️', 'Déjà postulé', `Vous avez déjà postulé à ${projectTitle}`)
      return
    }
    try {
      await matching.applyToProject(projectId)
      setAppliedProjects(prev => new Set([...prev, projectId]))
      addToast('✅', 'Candidature envoyée !', `Vous avez postulé à ${projectTitle}`)
    } catch (error) {
      addToast('❌', 'Erreur', error.response?.data?.detail || "Impossible de postuler")
    }
  }

  const createProject = async () => {
    if (!newProject.title.trim()) {
      addToast('⚠️', 'Erreur', 'Le titre du projet est requis')
      return
    }
    try {
      const skillsList = newProject.required_skills
        .split(',')
        .filter(s => s.trim())
        .map(s => s.trim())
      
      await matching.createProject({
        title: newProject.title,
        description: newProject.description,
        type: newProject.type,
        required_skills: skillsList,
        max_members: parseInt(newProject.max_members),
        required_hours_per_week: parseInt(newProject.required_hours_per_week)
      })
      
      addToast('✅', 'Projet créé !', `${newProject.title} a été publié`)
      setShowCreateForm(false)
      setNewProject({
        title: '',
        description: '',
        type: 'tech',
        required_skills: '',
        max_members: 5,
        required_hours_per_week: 8
      })
      fetchProjects()
    } catch (error) {
      console.error('Erreur création:', error)
      addToast('❌', 'Erreur', error.response?.data?.detail || "Impossible de créer le projet")
    }
  }

  const deleteProject = async (projectId, projectTitle) => {
    if (window.confirm(`Supprimer le projet "${projectTitle}" ?\n\nCette action est irréversible.`)) {
      try {
        await api.delete(`/api/matching/projects/${projectId}`)
        addToast('🗑️', 'Projet supprimé', `Le projet "${projectTitle}" a été supprimé`)
        fetchProjects()
      } catch (error) {
        console.error('Erreur suppression:', error)
        addToast('❌', 'Erreur', error.response?.data?.detail || "Impossible de supprimer le projet")
      }
    }
  }

  const types = ['tous', 'tech', 'data', 'design', 'business']

  if (loading) {
    return <div className="card" style={{ textAlign: 'center', padding: 40 }}>Chargement des projets...</div>
  }

  return (
    <div className="fade-up">
      <style>{tm}</style>

      <SectionHeader
        title="🎯 TalentMatch"
        sub="Algorithme IA — projets recommandés selon votre profil"
        action={<Btn onClick={() => setShowCreateForm(!showCreateForm)}>{showCreateForm ? 'Annuler' : '+ Proposer un projet'}</Btn>}
      />

      {showCreateForm && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 15, fontWeight: 700, fontSize: 14 }}>📝 Nouveau projet</div>
          <div className="form-group">
            <label>Titre du projet *</label>
            <input className="input" placeholder="Ex: Application Mobile Campus" value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="input" placeholder="Décrivez votre projet..." rows={3} value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Type de projet</label>
              <select className="input" value={newProject.type} onChange={e => setNewProject({...newProject, type: e.target.value})}>
                <option value="tech">💻 Tech / Développement</option>
                <option value="data">📊 Data / IA</option>
                <option value="design">🎨 Design / UX</option>
                <option value="business">💼 Business / Marketing</option>
              </select>
            </div>
            <div className="form-group">
              <label>Nombre de places</label>
              <input className="input" type="number" min="1" max="20" value={newProject.max_members} onChange={e => setNewProject({...newProject, max_members: e.target.value})} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Compétences requises</label>
              <input className="input" placeholder="Python, React, Figma (séparées par des virgules)" value={newProject.required_skills} onChange={e => setNewProject({...newProject, required_skills: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Heures/semaine requises</label>
              <input className="input" type="number" min="1" max="40" value={newProject.required_hours_per_week} onChange={e => setNewProject({...newProject, required_hours_per_week: e.target.value})} />
            </div>
          </div>
          <Btn onClick={createProject}>🚀 Publier le projet</Btn>
        </Card>
      )}

      <div className="filter-row">
        {types.map(t => (
          <Btn key={t} variant={filter === t ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Btn>
        ))}
      </div>

      <div className="project-grid">
        {projects.map(p => {
          const c = TYPE_COLOR[p.project_type] || TYPE_COLOR.tech
          const isApplied = appliedProjects.has(p.project_id)
          const isCreator = p.created_by === user?.id
          return (
            <div key={p.project_id} className="project-card">
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: c.line, borderRadius: '0 0 var(--radius) var(--radius)' }} />
              <div className="project-top">
                <span className="tag" style={{ background: c.bg, color: c.text }}>{p.project_type}</span>
                <Tag color="green">🎯 {p.score_percent || 0}%</Tag>
              </div>
              <div className="project-title">{p.project_title}</div>
              <div className="project-desc">{p.project_description?.substring(0, 120)}...</div>
              <div className="project-skills">
                {(p.required_skills || []).slice(0, 4).map((s, idx) => (
                  <Tag key={idx}>{typeof s === 'string' ? s : s.name}</Tag>
                ))}
              </div>
              <div style={{ marginBottom: 12 }}>
                <ProgressBar value={p.score_percent || 0} color={c.line} />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10, fontSize: 11, color: 'var(--muted)' }}>
                {typeof p.profile_score === 'number' && (
                  <span>Contexte {Math.round(p.profile_score * 100)}%</span>
                )}
                {typeof p.history_score === 'number' && (
                  <span>Historique {Math.round(p.history_score * 100)}%</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>
                {p.match_reason || p.explanation}
              </div>
              <div className="project-foot">
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {p.available_slots || 0} poste(s) disponible(s)
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {isCreator && (
                    <Btn size="sm" variant="secondary" onClick={() => deleteProject(p.project_id, p.project_title)}>
                      🗑️ Supprimer
                    </Btn>
                  )}
                  <Btn size="sm" variant={isApplied ? 'secondary' : 'primary'} onClick={() => applyToProject(p.project_id, p.project_title)}>
                    {isApplied ? '✓ Postulé' : 'Postuler'}
                  </Btn>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {projects.length === 0 && !showCreateForm && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          Aucun projet trouvé. Soyez le premier à en créer un !
        </div>
      )}

      <div className="card">
        <div className="card-title">🧠 Comment fonctionne le matching IA</div>
        <div className="algo-grid">
          {[
            { pct: '45%', name: 'Compétences', color: 'var(--accent)', desc: 'Similarité sur vos compétences' },
            { pct: '20%', name: 'Disponibilités', color: 'var(--green)', desc: 'Heures disponibles' },
            { pct: '15%', name: 'Intérêts', color: 'var(--accent2)', desc: 'Alignement spécialité' },
            { pct: '10%', name: 'Contexte', color: 'var(--pink)', desc: 'Adaptation projet / profil' },
            { pct: '10%', name: 'Historique', color: 'var(--orange)', desc: 'Expérience antérieure' },
          ].map(a => (
            <div key={a.name} className="algo-item">
              <div className="algo-pct" style={{ color: a.color }}>{a.pct}</div>
              <div className="algo-name">{a.name}</div>
              <div className="algo-desc">{a.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}