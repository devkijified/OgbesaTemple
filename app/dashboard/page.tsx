'use client'
import { useEffect, useState } from 'react'
import { createClient } from '../../../lib/supabase'

interface Consultation {
  id: string
  odu_ifa: string
  omo_awo_label: string
  appeasement: string
  ebo_details: string
  consultation_date: string
  notes: string
  client: { full_name: string; email: string; phone: string }
  omo_awo: { full_name: string; omo_awo_level: string }
}

interface Profile {
  id: string
  full_name: string
  email: string
  role: string
  omo_awo_level: string
  phone: string
  created_at: string
}

export default function PriestDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [clients, setClients] = useState<Profile[]>([])
  const [omoAwos, setOmoAwos] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [stats, setStats] = useState({ totalConsultations: 0, totalClients: 0, totalOmoAwos: 0 })
  
  const [formData, setFormData] = useState({
    client_id: '',
    client_email: '',
    client_name: '',
    client_phone: '',
    omo_awo_id: '',
    odu_ifa: '',
    omo_awo_label: '',
    appeasement: '',
    ebo_details: '',
    notes: ''
  })

  const supabase = createClient()

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    
    // Get current user profile
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profile)
    }
    
    // Fetch all consultations with client and omo awo info
    const { data: consultationsData } = await supabase
      .from('consultations')
      .select(`
        *,
        client:profiles!consultations_client_id_fkey (full_name, email, phone),
        omo_awo:profiles!consultations_omo_awo_id_fkey (full_name, omo_awo_level)
      `)
      .order('consultation_date', { ascending: false })
    
    if (consultationsData) setConsultations(consultationsData)
    
    // Fetch all clients (abore)
    const { data: clientsData } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'abore')
      .order('created_at', { ascending: false })
    
    if (clientsData) setClients(clientsData)
    
    // Fetch all OMO AWO initiates
    const { data: omoAwosData } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['omo_awo', 'babalawo'])
      .order('created_at', { ascending: false })
    
    if (omoAwosData) setOmoAwos(omoAwosData)
    
    // Set stats
    setStats({
      totalConsultations: consultationsData?.length || 0,
      totalClients: clientsData?.length || 0,
      totalOmoAwos: omoAwosData?.length || 0
    })
    
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    let clientId = formData.client_id
    
    if (!clientId && formData.client_email) {
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
            phone: formData.client_phone,
            role: 'abore' 
          })
        }
      }
    }
    
    if (clientId) {
      const { error } = await supabase.from('consultations').insert({
        client_id: clientId,
        omo_awo_id: formData.omo_awo_id || profile?.id,
        odu_ifa: formData.odu_ifa,
        omo_awo_label: formData.omo_awo_label,
        appeasement: formData.appeasement,
        ebo_details: formData.ebo_details,
        notes: formData.notes,
        consultation_date: new Date().toISOString().split('T')[0]
      })
      
      if (!error) {
        alert('Consultation recorded successfully!')
        setShowForm(false)
        setFormData({
          client_id: '', client_email: '', client_name: '', client_phone: '',
          omo_awo_id: '', odu_ifa: '', omo_awo_label: '', appeasement: '', ebo_details: '', notes: ''
        })
        fetchAllData()
      } else {
        alert('Error: ' + error.message)
      }
    }
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#78350f' }}>Loading sacred records...</div>
    </div>
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fffbeb' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#1a1a2e', color: 'white', padding: '16px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>OGBESA Temple</h1>
            <p style={{ fontSize: '14px', color: '#fcd34d' }}>Babalawo Priest Console</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setShowForm(!showForm)} style={{ backgroundColor: '#d97706', padding: '8px 16px', borderRadius: '8px', border: 'none', color: 'white', cursor: 'pointer' }}>
              {showForm ? 'Cancel' : '+ New Consultation'}
            </button>
            <button onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')} style={{ backgroundColor: '#92400e', padding: '8px 16px', borderRadius: '8px', border: 'none', color: 'white', cursor: 'pointer' }}>
              Logout
            </button>
          </div>
        </div>
      </div>
      
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '36px' }}>📜</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#78350f' }}>{stats.totalConsultations}</div>
            <div style={{ color: '#6b7280' }}>Total Consultations</div>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '36px' }}>👥</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#78350f' }}>{stats.totalClients}</div>
            <div style={{ color: '#6b7280' }}>Registered Seekers</div>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '36px' }}>🔮</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#78350f' }}>{stats.totalOmoAwos}</div>
            <div style={{ color: '#6b7280' }}>OMO AWO Initiates</div>
          </div>
        </div>
        
        {/* New Consultation Form */}
        {showForm && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#78350f', marginBottom: '16px' }}>Record New Ifa Consultation</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Select Seeker</label>
                  <select value={formData.client_id} onChange={(e) => setFormData({...formData, client_id: e.target.value, client_email: '', client_name: ''})} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}>
                    <option value="">-- Select Client --</option>
                    {clients.map(client => <option key={client.id} value={client.id}>{client.full_name} ({client.email})</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Or New Seeker Email</label>
                  <input type="email" value={formData.client_email} onChange={(e) => setFormData({...formData, client_email: e.target.value, client_id: ''})} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>OMO AWO (Priest)</label>
                  <select value={formData.omo_awo_id} onChange={(e) => setFormData({...formData, omo_awo_id: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}>
                    <option value="">-- Select OMO AWO --</option>
                    {omoAwos.map(omo => <option key={omo.id} value={omo.id}>{omo.full_name} ({omo.omo_awo_level || omo.role})</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Odu Ifa</label>
                  <input type="text" required value={formData.odu_ifa} onChange={(e) => setFormData({...formData, odu_ifa: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>OMO AWO Label</label>
                  <select value={formData.omo_awo_label} onChange={(e) => setFormData({...formData, omo_awo_label: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}>
                    <option value="">-- Select Label --</option>
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
              </div>
              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Appeasement / Ebo</label>
                <textarea rows={3} value={formData.appeasement} onChange={(e) => setFormData({...formData, appeasement: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
              </div>
              <button type="submit" style={{ marginTop: '16px', backgroundColor: '#92400e', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer' }}>Save Consultation</button>
            </form>
          </div>
        )}
        
        {/* Consultations Table */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#78350f', marginBottom: '16px' }}>All Consultations</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Date</th>
                <th style={{ padding: '12px' }}>Seeker</th>
                <th style={{ padding: '12px' }}>Odu Ifa</th>
                <th style={{ padding: '12px' }}>OMO AWO Label</th>
                <th style={{ padding: '12px' }}>Priest</th>
              </tr>
            </thead>
            <tbody>
              {consultations.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>{new Date(c.consultation_date).toLocaleDateString()}</td>
                  <td style={{ padding: '12px' }}>{c.client?.full_name}</td>
                  <td style={{ padding: '12px', fontWeight: '500' }}>{c.odu_ifa}</td>
                  <td style={{ padding: '12px' }}>{c.omo_awo_label}</td>
                  <td style={{ padding: '12px' }}>{c.omo_awo?.full_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
