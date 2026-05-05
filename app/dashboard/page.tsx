'use client'
import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase'

interface Consultation {
  id: string
  odu_ifa: string
  omo_awo_label: string
  appeasement: string
  ebo_details: string
  consultation_date: string
  notes: string
  status: string
  client?: { full_name: string; email: string }
  omo_awo?: { full_name: string; omo_awo_level: string }
}

interface Profile {
  id: string
  full_name: string
  email: string
  role: string
  omo_awo_level: string
  phone: string
  initiator_id: string
  initiator?: { full_name: string }
}

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [myConsultations, setMyConsultations] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState('received')
  
  const [formData, setFormData] = useState({
    client_email: '',
    client_name: '',
    odu_ifa: '',
    omo_awo_label: '',
    appeasement: '',
    ebo_details: '',
    notes: ''
  })

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, initiator:profiles!profiles_initiator_id_fkey (full_name)')
        .eq('id', user.id)
        .single()
      setProfile(profile)
      
      // If OMO AWO - get consultations they performed
      if (profile?.role === 'omo_awo') {
        const { data: performed } = await supabase
          .from('consultations')
          .select(`*, client:profiles!consultations_client_id_fkey (full_name, email)`)
          .eq('omo_awo_id', user.id)
          .order('consultation_date', { ascending: false })
        
        if (performed) setMyConsultations(performed)
      }
      
      // Get consultations where user is the client
      const { data: received } = await supabase
        .from('consultations')
        .select(`*, omo_awo:profiles!consultations_omo_awo_id_fkey (full_name, omo_awo_level)`)
        .eq('client_id', user.id)
        .order('consultation_date', { ascending: false })
      
      if (received) setConsultations(received)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    let clientId = profile?.id
    
    if (formData.client_email && formData.client_email !== profile?.email) {
      const { data: existingClient } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', formData.client_email)
        .single()
      
      if (existingClient) {
        clientId = existingClient.id
      } else {
        const { data: newUser } = await supabase.auth.signUp({
          email: formData.client_email,
          password: Math.random().toString(36).slice(-8),
        })
        
        if (newUser?.user) {
          clientId = newUser.user.id
          await supabase.from('profiles').upsert({ 
            id: clientId, 
            full_name: formData.client_name || formData.client_email.split('@')[0], 
            email: formData.client_email, 
            role: 'abore' 
          })
        }
      }
    }
    
    let omoAwoId = profile?.role === 'omo_awo' ? profile?.id : null
    
    if (profile?.role === 'abore') {
      const { data: availableOmoAwo } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'omo_awo')
        .limit(1)
        .single()
      
      if (availableOmoAwo) {
        omoAwoId = availableOmoAwo.id
      }
    }
    
    const { error } = await supabase.from('consultations').insert({
      client_id: clientId,
      omo_awo_id: omoAwoId,
      odu_ifa: formData.odu_ifa || 'Awaiting Divination',
      omo_awo_label: formData.omo_awo_label || 'Awaiting Assessment',
      appeasement: formData.appeasement,
      ebo_details: formData.ebo_details,
      notes: formData.notes,
      status: profile?.role === 'abore' ? 'pending' : 'completed',
      consultation_date: new Date().toISOString().split('T')[0]
    })
    
    if (!error) {
      alert(profile?.role === 'abore' ? 'Consultation requested! An OMO AWO will attend to you.' : 'Consultation recorded successfully!')
      setShowForm(false)
      setFormData({ client_email: '', client_name: '', odu_ifa: '', omo_awo_label: '', appeasement: '', ebo_details: '', notes: '' })
      fetchData()
    } else {
      alert('Error: ' + error.message)
    }
  }

  const getRoleTitle = () => {
    if (profile?.role === 'omo_awo') return `OMO AWO - ${profile?.omo_awo_level || 'Initiate'}`
    return 'Abore (Seeker)'
  }

  const getRoleColor = () => {
    if (profile?.role === 'omo_awo') return '#4a1d1d'
    return '#78350f'
  }

  const canGiveConsultations = profile?.role === 'omo_awo'
  const canRequestConsultations = true

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#78350f' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fffbeb' }}>
      {/* Header */}
      <div style={{ backgroundColor: getRoleColor(), color: 'white', padding: '16px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>OGBESA Temple</h1>
            <p style={{ fontSize: '14px', color: '#fcd34d' }}>{getRoleTitle()}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setShowForm(!showForm)} style={{ backgroundColor: '#d97706', padding: '8px 16px', borderRadius: '8px', border: 'none', color: 'white', cursor: 'pointer' }}>
              {showForm ? 'Cancel' : canGiveConsultations ? '+ New Consultation' : '+ Request Consultation'}
            </button>
            <button onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')} style={{ backgroundColor: '#92400e', padding: '8px 16px', borderRadius: '8px', border: 'none', color: 'white', cursor: 'pointer' }}>
              Logout
            </button>
          </div>
        </div>
      </div>
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Welcome Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#78350f', marginBottom: '8px' }}>
            Àbọ̀̀, {profile?.full_name?.split(' ')[0] || profile?.email?.split('@')[0]}
          </h2>
          <p style={{ color: '#b45309', fontWeight: '500' }}>{getRoleTitle()}</p>
          
          {profile?.role === 'omo_awo' && profile?.initiator && (
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>
              Initiated by: {profile.initiator.full_name}
            </p>
          )}
          
          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
            <p style={{ fontSize: '14px', color: '#92400e' }}>
              {profile?.role === 'omo_awo' && '📿 You are OMO AWO - an initiate. You can record consultations and guide seekers.'}
              {profile?.role === 'abore' && '🔮 You are a Seeker. Request consultations and view your sacred records.'}
            </p>
          </div>
        </div>
        
        {/* Form */}
        {showForm && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#78350f', marginBottom: '16px' }}>
              {canGiveConsultations ? 'Record Consultation' : 'Request Consultation'}
            </h3>
            <form onSubmit={handleSubmit}>
              {canGiveConsultations && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Seeker Email</label>
                  <input type="email" value={formData.client_email} onChange={(e) => setFormData({...formData, client_email: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                </div>
              )}
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Odu Ifa</label>
                <input type="text" required={canGiveConsultations} value={formData.odu_ifa} onChange={(e) => setFormData({...formData, odu_ifa: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} placeholder={canGiveConsultations ? "e.g., Eji Ogbe" : "Optional"} />
              </div>
              
              {canGiveConsultations && (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>OMO AWO Label</label>
                    <select value={formData.omo_awo_label} onChange={(e) => setFormData({...formData, omo_awo_label: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}>
                      <option value="">-- Select --</option>
                      <option value="OMO AWO Alafia">OMO AWO Alafia - Peace</option>
                      <option value="OMO AWO Aduro">OMO AWO Aduro - Healing</option>
                      <option value="OMO AWO Ose">OMO AWO Ose - Thanksgiving</option>
                      <option value="OMO AWO Otura">OMO AWO Otura - Guidance</option>
                      <option value="OMO AWO Irosun">OMO AWO Irosun - Cleansing</option>
                      <option value="OMO AWO Obara">OMO AWO Obara - Prosperity</option>
                      <option value="OMO AWO Odi">OMO AWO Odi - Justice</option>
                      <option value="OMO AWO Iwori">OMO AWO Iwori - Wisdom</option>
                    </select>
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Appeasement</label>
                    <textarea rows={3} value={formData.appeasement} onChange={(e) => setFormData({...formData, appeasement: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                  </div>
                </>
              )}
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Notes</label>
                <textarea rows={2} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
              </div>
              
              <button type="submit" style={{ backgroundColor: '#92400e', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer' }}>
                {canGiveConsultations ? 'Save' : 'Submit Request'}
              </button>
            </form>
          </div>
        )}
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '2px solid #e5e7eb' }}>
          <button onClick={() => setActiveTab('received')} style={{ padding: '12px 20px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: activeTab === 'received' ? '600' : '400', color: activeTab === 'received' ? '#92400e' : '#6b7280', borderBottom: activeTab === 'received' ? '2px solid #92400e' : 'none' }}>📋 Received</button>
          {canGiveConsultations && <button onClick={() => setActiveTab('given')} style={{ padding: '12px 20px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: activeTab === 'given' ? '600' : '400', color: activeTab === 'given' ? '#92400e' : '#6b7280', borderBottom: activeTab === 'given' ? '2px solid #92400e' : 'none' }}>📿 Given</button>}
        </div>
        
        {/* Received Tab */}
        {activeTab === 'received' && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#78350f', marginBottom: '16px' }}>Consultations Received</h3>
            {consultations.length === 0 ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>No consultations yet.</p>
            ) : (
              consultations.map((c) => (
                <div key={c.id} style={{ borderLeft: '4px solid #d97706', paddingLeft: '16px', marginBottom: '16px', padding: '12px', backgroundColor: '#fffbeb', borderRadius: '8px' }}>
                  <p><strong>Odu:</strong> {c.odu_ifa}</p>
                  {c.omo_awo_label !== 'Awaiting Assessment' && <p><strong>Label:</strong> {c.omo_awo_label}</p>}
                  {c.appeasement && <p><strong>Appeasement:</strong> {c.appeasement}</p>}
                  {c.omo_awo && <p><strong>OMO AWO:</strong> {c.omo_awo.full_name}</p>}
                  {c.status === 'pending' && <p style={{ color: '#d97706' }}>⏳ Pending</p>}
                  <p style={{ fontSize: '12px', color: '#9ca3af' }}>{new Date(c.consultation_date).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        )}
        
        {/* Given Tab */}
        {activeTab === 'given' && canGiveConsultations && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#78350f', marginBottom: '16px' }}>Consultations Given</h3>
            {myConsultations.length === 0 ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>No consultations given yet.</p>
            ) : (
              myConsultations.map((c) => (
                <div key={c.id} style={{ borderLeft: '4px solid #b45309', paddingLeft: '16px', marginBottom: '16px', padding: '12px', backgroundColor: '#fffbeb', borderRadius: '8px' }}>
                  <p><strong>Odu:</strong> {c.odu_ifa}</p>
                  <p><strong>Label:</strong> {c.omo_awo_label}</p>
                  {c.client && <p><strong>Seeker:</strong> {c.client.full_name}</p>}
                  <p style={{ fontSize: '12px', color: '#9ca3af' }}>{new Date(c.consultation_date).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
// Add this at the bottom of the dashboard, before the closing div
{profile?.role === 'babalawo' && (
  <div style={{ marginTop: '24px', textAlign: 'center' }}>
    <a href="/admin" style={{ color: '#92400e', textDecoration: 'underline' }}>
      Go to Admin Panel →
    </a>
  </div>
)}
