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
  profiles?: { full_name: string; email: string }
}

interface Profile {
  id: string
  full_name: string
  email: string
  role: string
  omo_awo_level: string
  phone: string
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [clients, setClients] = useState<Profile[]>([])
  
  const [formData, setFormData] = useState({
    client_id: '',
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
    fetchUserAndData()
    fetchClients()
  }, [])

  const fetchClients = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'abore')
    if (data) setClients(data)
  }

  const fetchUserAndData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    
    if (user) {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profile)
      
      // Fetch consultations based on role
      let query = supabase.from('consultations').select(`
        *,
        profiles!consultations_client_id_fkey (full_name, email)
      `)
      
      // If abore (regular client), only show their consultations
      if (profile?.role === 'abore') {
        query = query.eq('client_id', user.id)
      }
      
      const { data, error } = await query.order('consultation_date', { ascending: false })
      if (!error && data) {
        setConsultations(data)
      }
    }
    setLoading(false)
  }

  const getRoleTitle = (role: string, level?: string) => {
    if (role === 'babalawo') return 'Babalawo (Full Priest)'
    if (role === 'omo_awo') return `OMO AWO - ${level || 'Initiate'}`
    return 'Seeker (Abore)'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    let clientId = formData.client_id
    
    if (!clientId && formData.client_email) {
      // Check if client exists
      const { data: existingClient } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', formData.client_email)
        .single()
      
      if (existingClient) {
        clientId = existingClient.id
      } else {
        // Create new client
        const { data: newUser, error: signUpError } = await supabase.auth.signUp({
          email: formData.client_email,
          password: Math.random().toString(36).slice(-8),
        })
        
        if (newUser?.user) {
          clientId = newUser.user.id
          await supabase
            .from('profiles')
            .upsert({ 
              id: clientId, 
              full_name: formData.client_name || formData.client_email.split('@')[0], 
              email: formData.client_email, 
              role: 'abore' 
            })
        }
      }
    }
    
    if (clientId) {
      const consultationData = {
        client_id: clientId,
        omo_awo_id: user?.id,
        odu_ifa: formData.odu_ifa,
        omo_awo_label: formData.omo_awo_label,
        appeasement: formData.appeasement,
        ebo_details: formData.ebo_details,
        notes: formData.notes,
        consultation_date: new Date().toISOString().split('T')[0]
      }
      
      const { error } = await supabase.from('consultations').insert(consultationData)
      
      if (!error) {
        alert('Consultation recorded successfully!')
        setShowForm(false)
        setFormData({
          client_id: '',
          client_email: '',
          client_name: '',
          odu_ifa: '',
          omo_awo_label: '',
          appeasement: '',
          ebo_details: '',
          notes: ''
        })
        await fetchUserAndData()
        await fetchClients()
      } else {
        alert('Error: ' + error.message)
      }
    }
  }

  const isPriestOrInitiate = profile?.role === 'omo_awo' || profile?.role === 'babalawo'

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#78350f', fontSize: '18px' }}>Loading sacred records...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fffbeb' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#78350f', color: 'white', padding: '16px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>OGBESA Temple</h1>
            <p style={{ fontSize: '14px', color: '#fcd34d' }}>Ifa Priesthood Portal</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {isPriestOrInitiate && (
              <button 
                onClick={() => setShowForm(!showForm)}
                style={{ backgroundColor: '#92400e', padding: '8px 16px', borderRadius: '8px', border: 'none', color: 'white', cursor: 'pointer' }}
              >
                {showForm ? 'Cancel' : '+ New Consultation'}
              </button>
            )}
            <button 
              onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')}
              style={{ backgroundColor: '#92400e', padding: '8px 16px', borderRadius: '8px', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Welcome Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#78350f', marginBottom: '8px' }}>
            Àbọ̀̀, {profile?.full_name || user?.email?.split('@')[0]}
          </h2>
          <p style={{ color: '#b45309', fontWeight: '500', fontSize: '16px' }}>
            {getRoleTitle(profile?.role, profile?.omo_awo_level)}
          </p>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>
            {isPriestOrInitiate 
              ? `You are OMO AWO - initiate of the sacred mystery. Record consultations and guide seekers on their spiritual journey.`
              : `Your sacred consultation records are kept here for reference.`}
          </p>
        </div>
        
        {/* New Consultation Form */}
        {showForm && isPriestOrInitiate && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#78350f', marginBottom: '16px' }}>Record Ifa Consultation</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Select Existing Client</label>
                <select 
                  value={formData.client_id}
                  onChange={(e) => setFormData({...formData, client_id: e.target.value, client_email: '', client_name: ''})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
                >
                  <option value="">-- Select Client --</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.full_name} ({client.email})</option>
                  ))}
                </select>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Or New Client Email</label>
                <input 
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => setFormData({...formData, client_email: e.target.value, client_id: ''})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
                  placeholder="newclient@example.com"
                />
              </div>
              
              {formData.client_email && !formData.client_id && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Client Name</label>
                  <input 
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
                    placeholder="Full name"
                  />
                </div>
              )}
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Odu Ifa</label>
                <input 
                  type="text"
                  required
                  value={formData.odu_ifa}
                  onChange={(e) => setFormData({...formData, odu_ifa: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
                  placeholder="e.g., Eji Ogbe, Oyeku Meji, Iwori Meji"
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>OMO AWO Label</label>
                <select
                  value={formData.omo_awo_label}
                  onChange={(e) => setFormData({...formData, omo_awo_label: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
                >
                  <option value="">-- Select OMO AWO Label --</option>
                  <option value="OMO AWO Alafia">OMO AWO Alafia - Peace & Harmony</option>
                  <option value="OMO AWO Aduro">OMO AWO Aduro - Healing & Protection</option>
                  <option value="OMO AWO Ose">OMO AWO Ose - Thanksgiving</option>
                  <option value="OMO AWO Otura">OMO AWO Otura - Divine Guidance</option>
                  <option value="OMO AWO Irosun">OMO AWO Irosun - Spiritual Cleansing</option>
                  <option value="OMO AWO Obara">OMO AWO Obara - Prosperity</option>
                  <option value="OMO AWO Odi">OMO AWO Odi - Justice</option>
                  <option value="OMO AWO Iwori">OMO AWO Iwori - Wisdom</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Appeasement / Ebo</label>
                <textarea
                  rows={3}
                  value={formData.appeasement}
                  onChange={(e) => setFormData({...formData, appeasement: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
                  placeholder="Describe the prescribed ebo or appeasement..."
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Ebo Details (Offerings)</label>
                <textarea
                  rows={2}
                  value={formData.ebo_details}
                  onChange={(e) => setFormData({...formData, ebo_details: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
                  placeholder="Specific offerings made..."
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
                  placeholder="Additional notes..."
                />
              </div>
              
              <button 
                type="submit" 
                style={{ backgroundColor: '#92400e', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}
              >
                Save Consultation
              </button>
            </form>
          </div>
        )}
        
        {/* Consultations List */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#78350f', marginBottom: '16px' }}>
            {isPriestOrInitiate ? 'All Sacred Consultations' : 'Your Sacred Records'}
          </h3>
          
          {consultations.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>No consultations recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {consultations.map((consultation) => (
                <div key={consultation.id} style={{ borderLeft: '4px solid #d97706', paddingLeft: '16px', paddingTop: '8px', paddingBottom: '8px', backgroundColor: '#fffbeb', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <p style={{ fontWeight: '700', color: '#78350f', fontSize: '18px' }}>
                        📖 Odu: {consultation.odu_ifa}
                      </p>
                      {consultation.omo_awo_label && (
                        <p style={{ fontSize: '14px', color: '#b45309', marginTop: '4px' }}>
                          🏷️ <strong>OMO AWO Label:</strong> {consultation.omo_awo_label}
                        </p>
                      )}
                      {consultation.appeasement && (
                        <p style={{ fontSize: '14px', color: '#4b5563', marginTop: '4px' }}>
                          🕯️ <strong>Appeasement:</strong> {consultation.appeasement}
                        </p>
                      )}
                      {consultation.ebo_details && (
                        <p style={{ fontSize: '14px', color: '#4b5563', marginTop: '4px' }}>
                          📿 <strong>Ebo Details:</strong> {consultation.ebo_details}
                        </p>
                      )}
                      {consultation.profiles && !isPriestOrInitiate && (
                        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                          Babalawo: {consultation.profiles.full_name}
                        </p>
                      )}
                      {consultation.notes && (
                        <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px', fontStyle: 'italic' }}>
                          📝 {consultation.notes}
                        </p>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                      📅 {new Date(consultation.consultation_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e5e7eb', color: '#9ca3af', fontSize: '12px' }}>
          <p>OGBESA Temple - Preserving the wisdom of Orunmila</p>
          <p style={{ marginTop: '4px' }}>Ifa Priesthood Portal | Sacred Consultations & Records</p>
        </div>
      </div>
    </div>
  )
}
