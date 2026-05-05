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

export default function AdminDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [clients, setClients] = useState<Profile[]>([])
  const [omoAwos, setOmoAwos] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState('consultations')
  const [stats, setStats] = useState({ 
    totalConsultations: 0, 
    totalClients: 0, 
    totalOmoAwos: 0,
    pendingConsultations: 0
  })
  
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
    notes: '',
    status: 'completed'
  })

  const supabase = createClient()

  useEffect(() => {
    checkAdminAccess()
    fetchAllData()
  }, [])

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profile?.role !== 'babalawo') {
        window.location.href = '/dashboard'
      }
    } else {
      window.location.href = '/login'
    }
  }

  const fetchAllData = async () => {
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profile)
    }
    
    // Fetch all consultations with relations
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
      totalOmoAwos: omoAwosData?.length || 0,
      pendingConsultations: consultationsData?.filter(c => c.status === 'pending').length || 0
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
        status: formData.status,
        consultation_date: new Date().toISOString().split('T')[0]
      })
      
      if (!error) {
        alert('Consultation recorded successfully!')
        setShowForm(false)
        setFormData({
          client_id: '', client_email: '', client_name: '', client_phone: '',
          omo_awo_id: '', odu_ifa: '', omo_awo_label: '', appeasement: '', ebo_details: '', notes: '', status: 'completed'
        })
        fetchAllData()
      } else {
        alert('Error: ' + error.message)
      }
    }
  }

  const updateConsultationStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('consultations')
      .update({ status })
      .eq('id', id)
    
    if (!error) {
      alert(`Consultation marked as ${status}`)
      fetchAllData()
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#78350f' }}>Loading admin dashboard...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#1a1a2e', color: 'white', padding: '16px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>OGBESA Temple</h1>
            <p style={{ fontSize: '14px', color: '#fcd34d' }}>Babalawo Admin Console</p>
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
        {/* Welcome */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#78350f' }}>Welcome, Babalawo {profile?.full_name}</h2>
          <p style={{ color: '#6b7280' }}>Manage consultations, initiates, and seekers from this central console.</p>
        </div>
        
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '32px' }}>📜</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#78350f' }}>{stats.totalConsultations}</div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>Total Consultations</div>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '32px' }}>⏳</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#d97706' }}>{stats.pendingConsultations}</div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>Pending</div>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '32px' }}>👥</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#78350f' }}>{stats.totalClients}</div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>Seekers</div>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '32px' }}>🔮</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#78350f' }}>{stats.totalOmoAwos}</div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>OMO AWO</div>
          </div>
        </div>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '2px solid #e5e7eb', backgroundColor: 'white', borderRadius: '12px 12px 0 0', padding: '0 16px' }}>
          <button onClick={() => setActiveTab('consultations')} style={{ padding: '12px 20px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: activeTab === 'consultations' ? '600' : '400', color: activeTab === 'consultations' ? '#92400e' : '#6b7280', borderBottom: activeTab === 'consultations' ? '2px solid #92400e' : 'none' }}>📋 All Consultations</button>
          <button onClick={() => setActiveTab('clients')} style={{ padding: '12px 20px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: activeTab === 'clients' ? '600' : '400', color: activeTab === 'clients' ? '#92400e' : '#6b7280', borderBottom: activeTab === 'clients' ? '2px solid #92400e' : 'none' }}>👥 Seekers</button>
          <button onClick={() => setActiveTab('omoawos')} style={{ padding: '12px 20px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: activeTab === 'omoawos' ? '600' : '400', color: activeTab === 'omoawos' ? '#92400e' : '#6b7280', borderBottom: activeTab === 'omoawos' ? '2px solid #92400e' : 'none' }}>🔮 OMO AWO</button>
        </div>
        
        {/* New Consultation Form */}
        {showForm && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#78350f', marginBottom: '16px' }}>Record New Consultation</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '500' }}>Select Seeker</label>
                  <select value={formData.client_id} onChange={(e) => setFormData({...formData, client_id: e.target.value, client_email: ''})} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', marginTop: '4px' }}>
                    <option value="">-- Select --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '500' }}>Or New Seeker Email</label>
                  <input type="email" value={formData.client_email} onChange={(e) => setFormData({...formData, client_email: e.target.value, client_id: ''})} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', marginTop: '4px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '500' }}>OMO AWO (Priest)</label>
                  <select value={formData.omo_awo_id} onChange={(e) => setFormData({...formData, omo_awo_id: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', marginTop: '4px' }}>
                    <option value="">-- Select OMO AWO --</option>
                    {omoAwos.map(o => <option key={o.id} value={o.id}>{o.full_name} ({o.omo_awo_level || o.role})</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '500' }}>Odu Ifa</label>
                  <input type="text" required value={formData.odu_ifa} onChange={(e) => setFormData({...formData, odu_ifa: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', marginTop: '4px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '500' }}>OMO AWO Label</label>
                  <select value={formData.omo_awo_label} onChange={(e) => setFormData({...formData, omo_awo_label: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', marginTop: '4px' }}>
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
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '500' }}>Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', marginTop: '4px' }}>
                    <option value="completed">Completed</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500' }}>Appeasement / Ebo</label>
                <textarea rows={3} value={formData.appeasement} onChange={(e) => setFormData({...formData, appeasement: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', marginTop: '4px' }} />
              </div>
              <button type="submit" style={{ marginTop: '16px', backgroundColor: '#92400e', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer' }}>Save Consultation</button>
            </form>
          </div>
        )}
        
        {/* Consultations Tab */}
        {activeTab === 'consultations' && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Date</th>
                  <th style={{ padding: '12px' }}>Seeker</th>
                  <th style={{ padding: '12px' }}>Odu Ifa</th>
                  <th style={{ padding: '12px' }}>OMO AWO Label</th>
                  <th style={{ padding: '12px' }}>Priest</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px' }}>Action</th>
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
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '20px', 
                        fontSize: '12px',
                        backgroundColor: c.status === 'completed' ? '#10b981' : c.status === 'pending' ? '#f59e0b' : '#6b7280',
                        color: 'white'
                      }}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {c.status === 'pending' && (
                        <button onClick={() => updateConsultationStatus(c.id, 'completed')} style={{ backgroundColor: '#10b981', color: 'white', padding: '4px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px' }}>
                          Mark Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Name</th>
                  <th style={{ padding: '12px' }}>Email</th>
                  <th style={{ padding: '12px' }}>Phone</th>
                  <th style={{ padding: '12px' }}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px' }}>{c.full_name}</td>
                    <td style={{ padding: '12px' }}>{c.email}</td>
                    <td style={{ padding: '12px' }}>{c.phone || '-'}</td>
                    <td style={{ padding: '12px' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* OMO AWO Tab */}
        {activeTab === 'omoawos' && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Name</th>
                  <th style={{ padding: '12px' }}>Email</th>
                  <th style={{ padding: '12px' }}>Level</th>
                  <th style={{ padding: '12px' }}>Role</th>
                  <th style={{ padding: '12px' }}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {omoAwos.map((o) => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px' }}>{o.full_name}</td>
                    <td style={{ padding: '12px' }}>{o.email}</td>
                    <td style={{ padding: '12px' }}>{o.omo_awo_level || '-'}</td>
                    <td style={{ padding: '12px' }}>{o.role}</td>
                    <td style={{ padding: '12px' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                   </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
