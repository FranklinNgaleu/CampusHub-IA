import { useState, useEffect, useRef } from 'react'
import { Card, Tag, Btn, SectionHeader, Avatar, Input } from '../components/UI.jsx'
import { matching, mentorat } from '../services/api'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import notificationService from '../services/notificationService'

const ml = `
  .mentors-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 14px; margin-top: 16px; }
  .mentor-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 18px;
    display: flex; gap: 13px; transition: all .2s; cursor: pointer;
  }
  .mentor-card:hover { border-color: var(--border2); transform: translateY(-2px); }
  .mentor-stats { display: flex; gap: 14px; margin-top: 8px; flex-wrap: wrap; }
  .m-stat { font-size: 11px; color: var(--muted); }
  .m-stat strong { color: var(--text); font-weight: 600; }
  .level-bar { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; margin-bottom: 14px; }
  .level-pill {
    padding: 5px 13px; border-radius: 7px;
    font-weight: 700; font-size: 12px;
  }
  .arrow-sep { color: var(--muted); font-size: 14px; }
  .form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px; }
  .form-group label { font-size: 12px; font-weight: 600; color: var(--muted); }
  .tab-buttons { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 10px; }
  .tab-btn { background: none; border: none; padding: 8px 16px; font-size: 14px; font-weight: 600; cursor: pointer; color: var(--muted); border-radius: 8px; transition: all 0.2s; }
  .tab-btn.active { background: var(--accent); color: white; }
  .chat-wrapper { display: flex; height: 480px; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; margin-top: 16px; }
  .chat-list { width: 210px; border-right: 1px solid var(--border); overflow-y: auto; background: var(--surface); }
  .chat-li { padding: 11px 13px; display: flex; align-items: center; gap: 9px; cursor: pointer; border-bottom: 1px solid var(--border); transition: background .15s; position: relative; }
  .chat-li:hover, .chat-li.active { background: var(--surface2); }
  .chat-li-name { font-weight: 600; font-size: 12px; }
  .chat-li-preview { font-size: 10px; color: var(--muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 110px; }
  .chat-main { flex: 1; display: flex; flex-direction: column; background: var(--bg); }
  .chat-head { padding: 12px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 9px; background: var(--surface); }
  .chat-input { padding: 10px; border-top: 1px solid var(--border); display: flex; gap: 7px; background: var(--surface); }
  .search-loading { display: flex; justify-content: center; align-items: center; padding: 40px; gap: 10px; }
  .spinner { width: 24px; height: 24px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite; }
  .search-box { display: flex; gap: 10px; margin-bottom: 20px; }
  .stars { display: flex; gap: 5px; cursor: pointer; }
  .star { font-size: 20px; color: var(--muted); transition: color 0.2s; }
  .star.active { color: #fbbf24; }
  .rating-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .rating-modal-content {
    background: var(--surface);
    border-radius: var(--radius);
    padding: 24px;
    width: 90%;
    max-width: 400px;
    border: 1px solid var(--border);
  }
  .notification-badge {
    background: var(--orange);
    color: white;
    border-radius: 10px;
    padding: 2px 6px;
    font-size: 10px;
    margin-left: 8px;
  }
  .unread-dot {
    background: var(--accent);
    width: 8px;
    height: 8px;
    border-radius: 50%;
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
  }
  .status-badge {
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 12px;
  }
  .status-pending {
    background: rgba(251, 146, 60, 0.15);
    color: var(--orange);
  }
  .status-accepted {
    background: rgba(52, 211, 153, 0.15);
    color: var(--green);
  }
  .session-card {
    background: var(--surface2);
    border-radius: var(--radius);
    padding: 15px;
    margin-bottom: 12px;
    border-left: 4px solid var(--accent);
  }
  .session-date {
    font-size: 12px;
    font-weight: 600;
    color: var(--accent);
    margin-bottom: 5px;
  }
  .session-topic {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 4px;
  }
  .session-location {
    font-size: 11px;
    color: var(--muted);
  }
  .feedback-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .feedback-modal-content {
    background: var(--surface);
    border-radius: var(--radius);
    padding: 24px;
    width: 90%;
    max-width: 400px;
    border: 1px solid var(--border);
  }
  .btn-icon {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    color: var(--muted);
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s;
  }
  .btn-icon:hover {
    color: var(--orange);
    background: rgba(251,146,60,0.1);
  }
  .btn-accept {
    background: var(--green);
    color: white;
    border: none;
    padding: 4px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 600;
    margin-left: 8px;
  }
  .btn-accept:hover {
    background: #2b9e6e;
    transform: translateY(-1px);
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 700px) { .mentors-grid { grid-template-columns: 1fr; } .chat-wrapper { flex-direction: column; height: auto; } .chat-list { width: 100%; height: 120px; display: flex; overflow-x: auto; flex-direction: row; } .chat-li { flex-direction: column; min-width: 80px; } .search-box { flex-direction: column; } }
`

const YEAR_LEVELS = ['B1', 'B2', 'B3', 'M1', 'M2']
const LEVEL_COLOR = { B1: '#fbbf24', B2: '#fb923c', B3: '#34d399', M1: '#a78bfa', M2: '#4f7cff' }

// ⭐ ORDRE DES NIVEAUX POUR LE MENTORAT ⭐
const LEVEL_ORDER = { "B1": 1, "B2": 2, "B3": 3, "M1": 4, "M2": 5 }

export default function MentorLoop({ addToast }) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('mentors')
  const [allMentors, setAllMentors] = useState([])
  const [filteredMentors, setFilteredMentors] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [mentorships, setMentorships] = useState([])
  const [messages, setMessages] = useState({})
  const [currentMentorship, setCurrentMentorship] = useState(null)
  const [msgInput, setMsgInput] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [showMentorForm, setShowMentorForm] = useState(false)
  const [mentorApplication, setMentorApplication] = useState({ specialty: '', bio: '', hours_per_week: 5 })
  const [unreadCount, setUnreadCount] = useState(0)
  const [conversationsWithUnread, setConversationsWithUnread] = useState({})
  const [notifiedMessageIds, setNotifiedMessageIds] = useState(new Set())
  const pollingRef = useRef(null)
  const messagesEndRef = useRef(null)
  const [pendingRequests, setPendingRequests] = useState({})

  // États pour les sessions
  const [sessions, setSessions] = useState([])
  const [selectedMentorshipForSession, setSelectedMentorshipForSession] = useState(null)
  const [newSession, setNewSession] = useState({
    scheduled_at: '',
    duration_min: 60,
    location: '',
    topic: ''
  })
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [feedbackText, setFeedbackText] = useState('')

  // États pour la notation du mentor
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [selectedMentorship, setSelectedMentorship] = useState(null)
  const [ratingValue, setRatingValue] = useState(0)
  const [ratingFeedback, setRatingFeedback] = useState('')
  const [isSubmittingRating, setIsSubmittingRating] = useState(false)

  // Auto-scroll vers le dernier message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [currentMentorship, messages])

  useEffect(() => {
    loadAllMentors()
    loadMentorships()
    loadAllSessions()

    // Polling toutes les 5 secondes
    pollingRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkNewMessages()
        loadMentorships() // Recharger les mentorats pour mettre à jour les statuts
      }
    }, 5000)

    // Nettoyage du Set des messages notifiés toutes les heures
    const cleanup = setInterval(() => {
      setNotifiedMessageIds(new Set())
    }, 3600000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (cleanup) clearInterval(cleanup)
    }
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredMentors(allMentors)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = allMentors.filter(mentor =>
        mentor.mentor_name?.toLowerCase().includes(term) ||
        mentor.specialty?.toLowerCase().includes(term) ||
        mentor.year_level?.toLowerCase().includes(term)
      )
      setFilteredMentors(filtered)
    }
  }, [searchTerm, allMentors])

  // ⭐ NOUVEAU : Accepter une demande de mentorat
  const acceptMentorship = async (mentorshipId, partnerName) => {
    try {
      const response = await api.put(`/api/mentorat/${mentorshipId}/accept`)
      console.log('Acceptation réponse:', response)
      
      addToast('✅', 'Demande acceptée', `Vous êtes maintenant mentor de ${partnerName}`)
      
      // Recharger toutes les données
      await loadMentorships()
      await loadAllSessions()
      
      // Si on est dans l'onglet sessions, rafraîchir l'affichage
      if (activeTab === 'sessions') {
        setSelectedMentorshipForSession(mentorshipId)
      }
      
    } catch (error) {
      console.error('Erreur acceptation:', error)
      addToast('❌', 'Erreur', error.response?.data?.detail || "Impossible d'accepter la demande")
    }
  }

  // Charger toutes les sessions
  const loadAllSessions = async () => {
    try {
      const res = await mentorat.getAll()
      const mentorshipsList = res.data || []
      
      if (mentorshipsList.length === 0) {
        setSessions([])
        return
      }
      
      const allSessions = []
      
      for (const mentorship of mentorshipsList) {
        if (!mentorship || !mentorship.id) continue
        // ⭐ Inclure les mentorats actifs seulement pour les sessions
        if (mentorship.status !== 'active') continue
        
        try {
          const sessionsRes = await mentorat.getSessions(mentorship.id)
          const mentorshipSessions = (sessionsRes.data || []).map(s => ({
            ...s,
            mentorship_id: mentorship.id,
            partner_name: mentorship.partner_name,
            role: mentorship.role
          }))
          allSessions.push(...mentorshipSessions)
        } catch (error) {
          console.error(`Erreur pour mentorat ${mentorship.id}:`, error)
        }
      }
      
      const sortedSessions = allSessions.sort((a, b) => 
        new Date(a.scheduled_at) - new Date(b.scheduled_at)
      )
      setSessions(sortedSessions)
      
    } catch (error) {
      console.error('Erreur chargement sessions:', error)
      setSessions([])
    }
  }

  // Créer une session
  const createSession = async () => {
    if (!selectedMentorshipForSession) {
      addToast('❌', 'Erreur', 'Veuillez sélectionner un mentorat')
      return
    }
    
    if (!newSession.scheduled_at) {
      addToast('⚠️', 'Date requise', 'Veuillez sélectionner une date')
      return
    }
    
    try {
      const sessionData = {
        scheduled_at: new Date(newSession.scheduled_at).toISOString(),
        duration_min: parseInt(newSession.duration_min),
        location: newSession.location,
        topic: newSession.topic
      }
      
      await mentorat.createSession(selectedMentorshipForSession, sessionData)
      
      addToast('✅', 'Session planifiée', 'La session a été ajoutée au calendrier')
      setNewSession({ scheduled_at: '', duration_min: 60, location: '', topic: '' })
      setSelectedMentorshipForSession(null)
      await loadAllSessions()
      
    } catch (error) {
      console.error('Erreur création session:', error)
      const errorMsg = error.response?.data?.detail || "Impossible de planifier la session"
      addToast('❌', 'Erreur', errorMsg)
    }
  }

  // Supprimer une session
  const deleteSession = async (sessionId, mentorshipId, sessionTopic) => {
    if (window.confirm(`Supprimer la session "${sessionTopic || 'sans titre'}" ?`)) {
      try {
        await api.delete(`/api/mentorat/${mentorshipId}/sessions/${sessionId}`)
        addToast('🗑️', 'Session supprimée', 'La session a été supprimée')
        loadAllSessions()
      } catch (error) {
        console.error('Erreur suppression:', error)
        addToast('❌', 'Erreur', error.response?.data?.detail || 'Impossible de supprimer la session')
      }
    }
  }

  // Supprimer une conversation (mentorat)
  const deleteConversation = async (mentorshipId, partnerName) => {
    if (window.confirm(`Supprimer la conversation avec ${partnerName} ?\n\nTous les messages seront définitivement supprimés.`)) {
      try {
        await api.delete(`/api/mentorat/${mentorshipId}`)
        addToast('🗑️', 'Conversation supprimée', `La conversation avec ${partnerName} a été supprimée`)
        
        setMessages(prev => {
          const newMessages = { ...prev }
          delete newMessages[mentorshipId]
          return newMessages
        })
        
        await loadMentorships()
        
        if (currentMentorship === mentorshipId) {
          setCurrentMentorship(null)
          setMsgInput('')
        }
        
        await loadAllSessions()
        
      } catch (error) {
        console.error('Erreur suppression:', error)
        addToast('❌', 'Erreur', error.response?.data?.detail || 'Impossible de supprimer la conversation')
      }
    }
  }

  // Soumettre un feedback
  const submitFeedback = async () => {
    if (feedbackRating === 0) {
      addToast('⚠️', 'Note requise', 'Veuillez donner une note')
      return
    }
    try {
      await mentorat.submitFeedback(
        selectedSession.mentorship_id,
        selectedSession.id,
        feedbackRating,
        feedbackText
      )
      addToast('⭐', 'Merci !', 'Votre évaluation a été enregistrée')
      setShowFeedbackModal(false)
      setFeedbackRating(0)
      setFeedbackText('')
      loadAllSessions()
    } catch (error) {
      console.error('Erreur feedback:', error)
      addToast('❌', 'Erreur', "Impossible d'enregistrer l'évaluation")
    }
  }

  // Vérifier les nouveaux messages
  const checkNewMessages = async () => {
    try {
      const res = await mentorat.getAll()
      const currentMentorships = res.data || []

      for (const m of currentMentorships) {
        if (!m || !m.id) continue
        
        try {
          const msgsRes = await mentorat.getMessages(m.id)
          const msgs = msgsRes.data || []
          
          for (const msg of msgs) {
            const msgKey = `${m.id}_${msg.id}`
            
            if (!msg.is_mine && !msg.is_read && !notifiedMessageIds.has(msgKey)) {
              setNotifiedMessageIds(prev => {
                const next = new Set(prev)
                next.add(msgKey)
                return next
              })
              
              setConversationsWithUnread(prev => ({ ...prev, [m.id]: true }))
              setUnreadCount(prev => prev + 1)
              
              if (addToast) {
                addToast('💬', `📨 Nouveau message de ${m.partner_name}`, msg.content.substring(0, 60))
              }
              notificationService.notifyNewMessage(m.partner_name, msg.content)
            }
          }
        } catch (error) {
          console.error(`Erreur vérification messages pour mentorat ${m.id}:`, error)
        }
      }
    } catch (error) {
      console.error('Erreur vérification:', error)
    }
  }

  const loadAllMentors = async () => {
    setIsSearching(true)
    try {
      const res = await matching.getMentors({ top_k: 50 })
      setAllMentors(res.data || [])
      setFilteredMentors(res.data || [])
    } catch (error) {
      console.error('Erreur chargement mentors:', error)
      if (addToast) addToast('❌', 'Erreur', 'Impossible de charger les mentors')
    } finally {
      setIsSearching(false)
    }
  }

  const loadMentorships = async () => {
    try {
      const res = await mentorat.getAll()
      console.log('Mentorats chargés:', res.data) // Debug
      setMentorships(res.data || [])

      const pending = {}
      const unread = {}

      for (const m of res.data || []) {
        if (m.status === 'pending') {
          pending[m.partner_id] = true
        }

        const msgsRes = await mentorat.getMessages(m.id)
        const msgs = msgsRes.data || []

        setMessages(prev => ({ ...prev, [m.id]: msgs }))

        const unreadMsgs = msgs.filter(msg => !msg.is_read && !msg.is_mine)
        if (unreadMsgs.length > 0) {
          unread[m.id] = true
        }
      }

      setPendingRequests(pending)
      setConversationsWithUnread(unread)

      let totalUnread = Object.values(unread).filter(v => v === true).length
      setUnreadCount(totalUnread)

    } catch (error) {
      console.error('Erreur chargement relations:', error)
    }
  }

  const hasContactedMentor = (mentorId) => {
    return mentorships.some(m => m.partner_id === mentorId)
  }

  const isRequestPending = (mentorId) => {
    const mentorship = mentorships.find(m => m.partner_id === mentorId)
    return mentorship && mentorship.status === 'pending'
  }

  const createMentorship = async (mentorId, mentorName, mentorLevel) => {
    const userLevel = user?.year_level || "B1"
    const userOrder = LEVEL_ORDER[userLevel]
    const mentorOrder = LEVEL_ORDER[mentorLevel]
    
    if (mentorOrder <= userOrder) {
      addToast('⚠️', 'Hiérarchie incorrecte', `Un mentor doit avoir un niveau supérieur. Votre niveau: ${userLevel} → Mentor: ${mentorLevel}`)
      return
    }
    
    if (hasContactedMentor(mentorId)) {
      if (isRequestPending(mentorId)) {
        if (addToast) addToast('⏳', 'Demande déjà envoyée', `Vous avez déjà contacté ${mentorName}. Veuillez attendre sa réponse.`)
      } else {
        if (addToast) addToast('💬', 'Déjà en contact', `Vous êtes déjà en contact avec ${mentorName}. Allez dans l'onglet Messages.`)
      }
      return
    }

    try {
      await mentorat.create(mentorId)
      if (addToast) addToast('🧑‍🏫', 'Demande envoyée !', `Votre demande a été envoyée à ${mentorName}`)
      loadMentorships()
    } catch (error) {
      const errorMsg = error.response?.data?.detail || "Impossible d'envoyer la demande"
      if (addToast) addToast('❌', 'Erreur', errorMsg)
    }
  }

  const becomeMentor = async () => {
    try {
      await api.put('/api/users/me', {
        specialty: mentorApplication.specialty,
        bio: mentorApplication.bio,
        hours_per_week: parseInt(mentorApplication.hours_per_week),
        is_available: true
      })
      if (addToast) addToast('✅', 'Demande envoyée !', 'Votre demande pour devenir mentor a été enregistrée')
      setShowMentorForm(false)
      setMentorApplication({ specialty: '', bio: '', hours_per_week: 5 })
      loadAllMentors()
    } catch (error) {
      if (addToast) addToast('❌', 'Erreur', "Impossible de soumettre la demande")
    }
  }

  const openRatingModal = (mentorship) => {
    setSelectedMentorship(mentorship)
    setRatingValue(0)
    setRatingFeedback('')
    setShowRatingModal(true)
  }

  const submitRating = async () => {
    if (ratingValue === 0) {
      if (addToast) addToast('⚠️', 'Note requise', 'Veuillez sélectionner une note')
      return
    }

    setIsSubmittingRating(true)
    try {
      await api.post(`/api/mentorat/${selectedMentorship.id}/rate`, {
        rating: ratingValue,
        feedback: ratingFeedback
      })
      if (addToast) addToast('⭐', 'Merci !', 'Votre évaluation a bien été enregistrée')
      setShowRatingModal(false)
      loadMentorships()
    } catch (error) {
      console.error('Erreur notation:', error)
      if (addToast) addToast('❌', 'Erreur', error.response?.data?.detail || "Impossible d'enregistrer la note")
    } finally {
      setIsSubmittingRating(false)
    }
  }

  const loadMessages = async (mentorshipId) => {
    try {
      const res = await mentorat.getMessages(mentorshipId)
      const msgs = res.data || []
      setMessages(prev => ({ ...prev, [mentorshipId]: msgs }))
      setCurrentMentorship(mentorshipId)
      
      for (const msg of msgs) {
        if (!msg.is_read && !msg.is_mine) {
          try {
            await api.put(`/api/mentorat/${mentorshipId}/messages/${msg.id}/read`)
          } catch (e) {
            console.error('Erreur lors du marquage:', e)
          }
        }
      }
      
      const freshRes = await mentorat.getMessages(mentorshipId)
      const freshMsgs = freshRes.data || []
      setMessages(prev => ({ ...prev, [mentorshipId]: freshMsgs }))
      
      setConversationsWithUnread(prev => {
        const updated = { ...prev, [mentorshipId]: false }
        setUnreadCount(Object.values(updated).filter(v => v === true).length)
        return updated
      })
      
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
      
    } catch (error) {
      console.error('Erreur chargement messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!msgInput.trim() || !currentMentorship) return

    const currentMentorshipData = mentorships.find(m => m.id === currentMentorship)
    const recipientName = currentMentorshipData?.partner_name

    try {
      await mentorat.sendMessage(currentMentorship, msgInput)
      const res = await mentorat.getMessages(currentMentorship)
      const msgs = res.data || []
      setMessages(prev => ({ ...prev, [currentMentorship]: msgs }))
      setMsgInput('')

      if (addToast) addToast('📤', 'Message envoyé', `Votre message a été envoyé à ${recipientName}`)
      loadMentorships()

      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)

    } catch (error) {
      if (addToast) addToast('❌', 'Erreur', "Impossible d'envoyer le message")
    }
  }

  const currentMessages = currentMentorship ? (messages[currentMentorship] || []) : []

  const StarRating = ({ rating, onRate, size = 'normal' }) => {
    const [hover, setHover] = useState(0)
    const starSize = size === 'small' ? 16 : 20

    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`star ${(hover || rating) >= star ? 'active' : ''}`}
            style={{ fontSize: starSize }}
            onMouseEnter={() => onRate && setHover(star)}
            onMouseLeave={() => onRate && setHover(0)}
            onClick={() => onRate && onRate(star)}
          >
            ★
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="fade-up">
      <style>{ml}</style>

      {/* MODAL DE NOTATION DU MENTOR */}
      {showRatingModal && (
        <div className="rating-modal" onClick={() => setShowRatingModal(false)}>
          <div className="rating-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>⭐ Noter votre mentor</h3>
            <p style={{ marginBottom: 16, color: 'var(--muted)' }}>
              {selectedMentorship?.partner_name}
            </p>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <StarRating rating={ratingValue} onRate={setRatingValue} />
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
                {ratingValue === 1 && '★ Très insatisfait'}
                {ratingValue === 2 && '★★ Insatisfait'}
                {ratingValue === 3 && '★★★ Moyen'}
                {ratingValue === 4 && '★★★★ Satisfait'}
                {ratingValue === 5 && '★★★★★ Très satisfait'}
              </div>
            </div>
            <textarea
              className="input"
              placeholder="Partagez votre expérience (optionnel)..."
              rows={3}
              value={ratingFeedback}
              onChange={(e) => setRatingFeedback(e.target.value)}
              style={{ marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Btn variant="secondary" onClick={() => setShowRatingModal(false)}>Annuler</Btn>
              <Btn onClick={submitRating} disabled={isSubmittingRating}>
                {isSubmittingRating ? 'Envoi...' : 'Envoyer la note'}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE FEEDBACK POUR SESSION */}
      {showFeedbackModal && (
        <div className="feedback-modal" onClick={() => setShowFeedbackModal(false)}>
          <div className="feedback-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>⭐ Évaluer la session</h3>
            <p style={{ marginBottom: 16, color: 'var(--muted)' }}>
              Session du {new Date(selectedSession?.scheduled_at).toLocaleDateString('fr-FR')}
            </p>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <StarRating rating={feedbackRating} onRate={setFeedbackRating} />
            </div>
            <textarea
              className="input"
              placeholder="Votre commentaire (optionnel)..."
              rows={3}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              style={{ marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Btn variant="secondary" onClick={() => setShowFeedbackModal(false)}>Annuler</Btn>
              <Btn onClick={submitFeedback}>Envoyer</Btn>
            </div>
          </div>
        </div>
      )}

      <SectionHeader
        title="🧑‍🏫 MentorLoop"
        sub="Mentorat inter-promotions — B1 à M2"
        action={
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn onClick={loadAllMentors}>🔄 Actualiser</Btn>
            <Btn variant="secondary" onClick={() => setShowMentorForm(!showMentorForm)}>
              👑 Devenir mentor
            </Btn>
          </div>
        }
      />

      {showMentorForm && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 15, fontWeight: 700, fontSize: 14 }}>👑 Devenir mentor</div>
          <div className="form-group">
            <label>Votre spécialité</label>
            <input className="input" placeholder="Ex: Data Science, Développement Web..." value={mentorApplication.specialty} onChange={e => setMentorApplication({...mentorApplication, specialty: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Bio / Parcours</label>
            <textarea className="input" placeholder="Présentez-vous aux étudiants..." rows={3} value={mentorApplication.bio} onChange={e => setMentorApplication({...mentorApplication, bio: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Disponibilité (heures/semaine)</label>
            <input className="input" type="number" min="1" max="20" value={mentorApplication.hours_per_week} onChange={e => setMentorApplication({...mentorApplication, hours_per_week: e.target.value})} />
          </div>
          <Btn onClick={becomeMentor}>📝 Devenir mentor</Btn>
        </Card>
      )}

      <div className="tab-buttons">
        <button className={`tab-btn ${activeTab === 'mentors' ? 'active' : ''}`} onClick={() => setActiveTab('mentors')}>
          👥 Rechercher un mentor
        </button>
        <button className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}>
          💬 Messages {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
        </button>
        <button className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`} onClick={() => setActiveTab('sessions')}>
          📅 Sessions {sessions.filter(s => s.status === 'scheduled').length > 0 && <span className="notification-badge">{sessions.filter(s => s.status === 'scheduled').length}</span>}
        </button>
      </div>

      {activeTab === 'mentors' && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div className="card-title">🔗 Hiérarchie des niveaux de mentorat</div>
            <div className="level-bar">
              {YEAR_LEVELS.map((level, idx, arr) => {
                const userLevel = user?.year_level || "B1"
                const isUserLevel = level === userLevel
                const isHigher = LEVEL_ORDER[level] > LEVEL_ORDER[userLevel]
                
                return (
                  <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div 
                      className="level-pill" 
                      style={{ 
                        background: isUserLevel ? 'rgba(79,124,255,0.2)' : (isHigher ? 'rgba(52,211,153,0.1)' : 'var(--surface2)'),
                        border: isUserLevel ? '2px solid var(--accent)' : '1px solid var(--border)',
                        color: isUserLevel ? 'var(--accent)' : (isHigher ? 'var(--green)' : 'var(--muted)')
                      }}
                    >
                      {level}
                      {isUserLevel && ' 👈 votre niveau'}
                      {!isUserLevel && isHigher && ' ✅'}
                    </div>
                    {idx < arr.length - 1 && <span className="arrow-sep">→</span>}
                  </div>
                )
              })}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10 }}>
              📌 Vous pouvez uniquement être mentoré par des étudiants de niveau supérieur.
              {user?.year_level === 'M2' && " Vous êtes au niveau maximum, vous ne pouvez plus avoir de mentor."}
            </div>
          </Card>

          <div className="search-box">
            <Input
              icon="🔍"
              placeholder="Rechercher par nom, matière ou spécialité..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <Btn onClick={loadAllMentors} disabled={isSearching}>
              {isSearching ? 'Recherche...' : 'Rechercher'}
            </Btn>
          </div>

          {isSearching ? (
            <div className="search-loading">
              <div className="spinner"></div>
              <span>Recherche de mentors en cours...</span>
            </div>
          ) : filteredMentors.filter(m => {
            const userLevel = user?.year_level || "B1"
            return LEVEL_ORDER[m.year_level] > LEVEL_ORDER[userLevel]
          }).length === 0 ? (
            <Card style={{ textAlign: 'center', padding: 40 }}>
              <div>🎓 Aucun mentor disponible (niveau supérieur requis)</div>
              <Btn variant="secondary" style={{ marginTop: 16 }} onClick={() => setShowMentorForm(true)}>
                👑 Devenir mentor vous-même
              </Btn>
            </Card>
          ) : (
            <div className="mentors-grid">
              {filteredMentors.map(m => {
                const userLevel = user?.year_level || "B1"
                const alreadyContacted = hasContactedMentor(m.mentor_id)
                const isPending = isRequestPending(m.mentor_id)
                
                if (LEVEL_ORDER[m.year_level] <= LEVEL_ORDER[userLevel]) return null

                return (
                  <div key={m.mentor_id} className="mentor-card">
                    <Avatar initials={m.mentor_name?.charAt(0) || 'M'} color="#4f7cff" size={44} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{m.mentor_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
                        {m.year_level} — {m.specialty || 'Spécialité non renseignée'}
                      </div>
                      <div className="mentor-stats">
                        <div className="m-stat"><strong>Score IA</strong> {m.score_percent}% match</div>
                        <div className="m-stat"><strong>Disponible</strong> {m.is_available ? 'Oui' : 'Non'}</div>
                        {typeof m.profile_score === 'number' && (
                          <div className="m-stat"><strong>Contexte</strong> {Math.round(m.profile_score * 100)}%</div>
                        )}
                        {typeof m.history_score === 'number' && (
                          <div className="m-stat"><strong>Expérience</strong> {Math.round(m.history_score * 100)}%</div>
                        )}
                        {m.match_reason && (
                          <div className="m-stat" style={{ minWidth: 200, color: 'var(--muted)' }}><em>{m.match_reason}</em></div>
                        )}
                      </div>
                      <div style={{ marginTop: 10, display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Tag color={m.is_available ? 'green' : 'orange'}>
                          {m.is_available ? 'Disponible' : 'Indisponible'}
                        </Tag>

                        {alreadyContacted ? (
                          <span className={`status-badge ${isPending ? 'status-pending' : 'status-accepted'}`}>
                            {isPending ? '⏳ Demande envoyée - En attente' : '💬 Déjà en contact'}
                          </span>
                        ) : (
                          m.is_available && (
                            <Btn size="sm" onClick={() => createMentorship(m.mentor_id, m.mentor_name, m.year_level)}>
                              Contacter
                            </Btn>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="chat-wrapper">
          <div className="chat-list">
            {mentorships.map(m => {
              // Déterminer si l'utilisateur actuel est le mentor dans cette relation
              const isCurrentUserMentor = m.role === 'mentor'
              const isPendingRequest = m.status === 'pending'
              
              return (
                <div
                  key={m.id}
                  className={`chat-li ${currentMentorship === m.id ? 'active' : ''}`}
                  onClick={() => loadMessages(m.id)}
                >
                  <Avatar initials={m.partner_name?.charAt(0) || '?'} color="#4f7cff" size={28} />
                  <div style={{ flex: 1 }}>
                    <div className="chat-li-name">
                      {m.partner_name}
                      {isPendingRequest && (
                        <span className="status-badge status-pending" style={{ marginLeft: 8, fontSize: 9 }}>
                          En attente
                        </span>
                      )}
                      {m.status === 'active' && (
                        <span className="status-badge status-accepted" style={{ marginLeft: 8, fontSize: 9 }}>
                          Actif
                        </span>
                      )}
                    </div>
                    <div className="chat-li-preview">
                      {messages[m.id]?.[messages[m.id].length - 1]?.content?.substring(0, 35) || 'Nouvelle conversation'}
                    </div>
                  </div>
                  {conversationsWithUnread[m.id] && <div className="unread-dot" />}
                  
                  {/* ⭐ BOUTON ACCEPTER POUR LES MENTORS ⭐ */}
                  {isPendingRequest && isCurrentUserMentor && (
                    <button
                      className="btn-accept"
                      onClick={(e) => {
                        e.stopPropagation()
                        acceptMentorship(m.id, m.partner_name)
                      }}
                      title="Accepter la demande de mentorat"
                    >
                      ✅ Accepter
                    </button>
                  )}
                  
                  {/* Bouton supprimer */}
                  <button
                    className="btn-icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteConversation(m.id, m.partner_name)
                    }}
                    title="Supprimer la conversation"
                  >
                    🗑️
                  </button>
                </div>
              )
            })}
            {mentorships.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>
                Aucune conversation. Utilisez la recherche pour trouver un mentor !
              </div>
            )}
          </div>

          <div className="chat-main">
            <div className="chat-head">
              <Avatar initials={currentMentorship ? mentorships.find(m => m.id === currentMentorship)?.partner_name?.charAt(0) || '?' : '?'} color="#4f7cff" size={28} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  {currentMentorship ? mentorships.find(m => m.id === currentMentorship)?.partner_name || 'Conversation' : 'Sélectionnez une conversation'}
                </div>
              </div>
              {currentMentorship && mentorships.find(m => m.id === currentMentorship)?.role === 'mentoré' && (
                <Btn size="sm" variant="secondary" onClick={() => openRatingModal(mentorships.find(m => m.id === currentMentorship))}>
                  ⭐ Noter le mentor
                </Btn>
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {currentMessages.map((msg, idx) => (
                <div key={idx} style={{ 
                  textAlign: msg.is_mine ? 'right' : 'left', 
                  marginBottom: '12px' 
                }}>
                  <div style={{
                    display: 'inline-block',
                    maxWidth: '70%',
                    padding: '10px 14px',
                    borderRadius: '18px',
                    backgroundColor: msg.is_mine ? '#4f7cff' : '#2a2a3a',
                    color: msg.is_mine ? '#fff' : '#e8eaf2',
                    textAlign: 'left',
                    wordWrap: 'break-word'
                  }}>
                    {msg.content}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: '#888',
                    marginTop: '4px'
                  }}>
                    {new Date(msg.sent_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              {currentMessages.length === 0 && currentMentorship && (
                <div style={{ textAlign: 'center', color: '#888', padding: '40px' }}>
                  Aucun message. Envoyez votre premier message !
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {currentMentorship && (
              <div className="chat-input">
                <input
                  className="input"
                  style={{ flex: 1 }}
                  value={msgInput}
                  placeholder="Écrire un message…"
                  onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                />
                <Btn size="sm" onClick={sendMessage}>Envoyer</Btn>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ONGLET SESSIONS */}
      {activeTab === 'sessions' && (
        <div>
          {/* Sélection du mentorat - Uniquement ceux où l'utilisateur est mentor ET actifs */}
          <Card style={{ marginBottom: 20 }}>
            <div style={{ marginBottom: 15, fontWeight: 700, fontSize: 14 }}>👥 Sélectionner un mentorat (en tant que mentor)</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {mentorships
                .filter(m => m.status === 'active' && m.role === 'mentor') // ⭐ UNIQUEMENT LES ACTIFS
                .map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMentorshipForSession(m.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: selectedMentorshipForSession === m.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                      background: selectedMentorshipForSession === m.id ? 'var(--accent)' : 'var(--surface)',
                      color: selectedMentorshipForSession === m.id ? 'white' : 'var(--text)',
                      cursor: 'pointer'
                    }}
                  >
                    {m.partner_name} (mentoré)
                  </button>
                ))}
            </div>
            {mentorships.filter(m => m.status === 'active' && m.role === 'mentor').length === 0 && (
              <div style={{ color: 'var(--muted)', marginTop: 10 }}>
                Vous n'êtes actuellement mentor d'aucun étudiant. Les demandes doivent être acceptées d'abord.
              </div>
            )}
          </Card>

          {/* Formulaire de planification */}
          {selectedMentorshipForSession && (
            (() => {
              const mentorship = mentorships.find(m => m.id === selectedMentorshipForSession)
              const isMentor = mentorship?.role === 'mentor'
              const isActive = mentorship?.status === 'active'
              
              if (!isActive) {
                return (
                  <Card style={{ marginBottom: 20, textAlign: 'center', padding: 30, background: 'rgba(251,146,60,0.1)' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
                    <div>Cette demande de mentorat est en attente.</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
                      Le mentor doit d'abord accepter la demande dans l'onglet Messages.
                    </div>
                  </Card>
                )
              }
              
              return isMentor ? (
                <Card style={{ marginBottom: 20 }}>
                  <div style={{ marginBottom: 15, fontWeight: 700, fontSize: 14 }}>
                    📅 Planifier une session avec {mentorship?.partner_name}
                  </div>
                  <div className="form-group">
                    <label>Date et heure *</label>
                    <input 
                      type="datetime-local" 
                      className="input" 
                      value={newSession.scheduled_at} 
                      onChange={e => setNewSession({...newSession, scheduled_at: e.target.value})} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Durée (minutes)</label>
                    <select 
                      className="input" 
                      value={newSession.duration_min} 
                      onChange={e => setNewSession({...newSession, duration_min: e.target.value})}
                    >
                      <option value="30">30 minutes</option>
                      <option value="60">1 heure</option>
                      <option value="90">1h30</option>
                      <option value="120">2 heures</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Lieu (ou lien visio)</label>
                    <input 
                      className="input" 
                      placeholder="Ex: Salle 204, Google Meet, Zoom..." 
                      value={newSession.location} 
                      onChange={e => setNewSession({...newSession, location: e.target.value})} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Sujet</label>
                    <input 
                      className="input" 
                      placeholder="Ex: Révision Python, Aide sur le projet..." 
                      value={newSession.topic} 
                      onChange={e => setNewSession({...newSession, topic: e.target.value})} 
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <Btn variant="secondary" onClick={() => {
                      setSelectedMentorshipForSession(null)
                      setNewSession({ scheduled_at: '', duration_min: 60, location: '', topic: '' })
                    }}>
                      Annuler
                    </Btn>
                    <Btn onClick={createSession}>📅 Planifier la session</Btn>
                  </div>
                </Card>
              ) : (
                <Card style={{ marginBottom: 20, textAlign: 'center', padding: 30, background: 'rgba(251,146,60,0.1)' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
                  <div>Vous n'êtes pas le mentor de cette relation.</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
                    Seul le mentor peut planifier des sessions.
                  </div>
                </Card>
              )
            })()
          )}

          {!selectedMentorshipForSession && (
            <Card style={{ marginBottom: 20, textAlign: 'center', padding: 30 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
              <div>Sélectionnez un mentorat (en tant que mentor) pour planifier une session</div>
            </Card>
          )}

          {/* Liste des sessions existantes */}
          <Card title="📅 Mes sessions">
            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
                <div>Aucune session planifiée</div>
              </div>
            ) : (
              sessions.map(session => {
                const isPast = new Date(session.scheduled_at) < new Date()
                const canGiveFeedback = isPast && session.status === 'scheduled' && session.role === 'mentoré' && !session.mentee_rating
                const isCreator = session.role === 'mentor'
                
                return (
                  <div key={session.id} className="session-card">
                    <div className="session-date">
                      {new Date(session.scheduled_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      {isPast && <Tag color="orange" style={{ marginLeft: 8 }}>Passée</Tag>}
                    </div>
                    <div className="session-topic">{session.topic || 'Session de mentorat'}</div>
                    <div className="session-location">
                      📍 {session.location || 'Lieu à définir'} • ⏱️ {session.duration_min} min
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                      <div>
                        <Tag color={session.status === 'scheduled' ? (isPast ? 'orange' : 'green') : 'orange'}>
                          {session.status === 'scheduled' ? (isPast ? 'Passée' : 'À venir') : session.status}
                        </Tag>
                        {session.mentee_rating && <Tag color="purple" style={{ marginLeft: 8 }}>⭐ Notée</Tag>}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {canGiveFeedback && (
                          <Btn size="sm" onClick={() => {
                            setSelectedSession(session)
                            setShowFeedbackModal(true)
                          }}>
                            📝 Évaluer
                          </Btn>
                        )}
                        {isCreator && (
                          <Btn size="sm" variant="secondary" onClick={() => deleteSession(session.id, session.mentorship_id, session.topic)}>
                            🗑️ Supprimer
                          </Btn>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </Card>
        </div>
      )}
    </div>
  )
}