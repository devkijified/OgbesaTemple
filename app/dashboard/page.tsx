'use client'
import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase'
interface Consultation {
  id: string
  odu_ifa: string
  owo_awo_label: string
  appeasement: string
  ebo_details: string
  consultation_date: string
  notes: string
  profiles?: { full_name: string; email: string }
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  // Form state for new consultation
  const [formData, setFormData] = useState({
    client_email: '',
    odu_ifa: '',
    owo_awo_label: '',
    appeasement: '',
    ebo_details: '',
    notes: ''
  })

  const supabase = createClient()

  useEffect(() => {
    fetchUserAndData()
  }, [])

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
      await fetchConsultations(profile)
    }
    setLoading(false)
  }

  const fetchConsultations = async (profile: any) => {
    let query = supabase.from('consultations').select('*, profiles(full_name, email)')
    
    // If abore (client), only show their consultations
    if (profile?.role === 'abore') {
      query = query.eq('client_id', user?.id)
    }
    
    const { data, error } = await query.order('consultation_date', { ascending: false })
    if (!error && data) {
      setConsultations(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // First find or create client
    let clientId = null
    const { data: existingClient } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', formData.client_email)
      .single()
    
    if (existingClient) {
      clientId = existingClient.id
    } else {
      // Create new client profile
      const { data: newUser, error: signUpError } = await supabase.auth.signUp({
        email: formData.client_email,
        password: Math.random().toString(36).slice(-8), // Temporary password
      })
      
      if (newUser?.user) {
        clientId = newUser.user.id
        // Update profile with name
        await supabase
          .from('profiles')
          .update({ full_name: formData.client_email.split('@')[0], role: 'abore' })
          .eq('id', clientId)
      }
    }
    
    if (clientId) {
      const { error } = await supabase.from('consultations').insert({
        client_id: clientId,
        omo_awo_id: user?.id,
        odu_ifa: formData.odu_ifa,
        owo_awo_label: formData.owo_awo_label,
        appeasement: formData.appeasement,
        ebo_details: formData.ebo_details,
        notes: formData.notes,
        consultation_date: new Date().toISOString().split('T')[0]
      })
      
      if (!error) {
        alert('Consultation recorded successfully!')
        setShowForm(false)
        setFormData({
          client_email: '',
          odu_ifa: '',
          owo_awo_label: '',
          appeasement: '',
          ebo_details: '',
          notes: ''
        })
        await fetchConsultations(profile)
      } else {
        alert('Error: ' + error.message)
      }
    }
  }

  const isOmoAwo = profile?.role === 'omo_awo' || profile?.role === 'babalawo'

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-amber-800">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <div className="bg-amber-800 text-white p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold">OGBESA Temple</h1>
            <p className="text-amber-200 text-sm">Ifa Priesthood Portal</p>
          </div>
          <div className="flex gap-3">
            {isOmoAwo && (
              <button 
                onClick={() => setShowForm(!showForm)}
                className="bg-amber-700 px-4 py-2 rounded hover:bg-amber-600"
              >
                {showForm ? 'Cancel' : '+ New Consultation'}
              </button>
            )}
            <button 
              onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')}
              className="bg-amber-700 px-4 py-2 rounded hover:bg-amber-600"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto p-4">
        {/* Welcome Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-amber-900 mb-2">
            Àbọ̀̀, {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0]}
          </h2>
          <p className="text-gray-600">
            {isOmoAwo 
              ? `You are OMO AWO - initiate of the sacred mystery. Manage consultations and guide seekers.`
              : `Your sacred consultation records are kept here.`}
          </p>
          {profile?.omo_awo_level && (
            <p className="text-amber-700 text-sm mt-2">Level: {profile.omo_awo_level}</p>
          )}
        </div>
        
        {/* New Consultation Form */}
        {showForm && isOmoAwo && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-amber-900 mb-4">Record Ifa Consultation</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Seeker's Email</label>
                <input
                  type="email"
                  required
                  className="w-full p-2 border rounded"
                  value={formData.client_email}
                  onChange={(e) => setFormData({...formData, client_email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Odu Ifa</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Eji Ogbe, Oyeku Meji"
                  className="w-full p-2 border rounded"
                  value={formData.odu_ifa}
                  onChange={(e) => setFormData({...formData, odu_ifa: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Owo Awo Label</label>
                <input
                  type="text"
                  placeholder="Sacred marking from Odu"
                  className="w-full p-2 border rounded"
                  value={formData.owo_awo_label}
                  onChange={(e) => setFormData({...formData, owo_awo_label: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Appeasement / Ebo</label>
                <textarea
                  rows={3}
                  placeholder="What ebo was prescribed?"
                  className="w-full p-2 border rounded"
                  value={formData.appeasement}
                  onChange={(e) => setFormData({...formData, appeasement: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ebo Details (Offerings)</label>
                <textarea
                  rows={2}
                  placeholder="Specific offerings made"
                  className="w-full p-2 border rounded"
                  value={formData.ebo_details}
                  onChange={(e) => setFormData({...formData, ebo_details: e.target.value})}
                />
              </div>
              <button type="submit" className="bg-amber-800 text-white px-6 py-2 rounded hover:bg-amber-900">
                Save Consultation
              </button>
            </form>
          </div>
        )}
        
        {/* Consultations List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-amber-900 mb-4">
            {isOmoAwo ? 'All Consultations' : 'Your Sacred Records'}
          </h3>
          
          {consultations.length === 0 ? (
            <p className="text-gray-500">No consultations recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {consultations.map((consultation) => (
                <div key={consultation.id} className="border-l-4 border-amber-600 pl-4 py-2">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <p className="font-semibold text-amber-900">Odu: {consultation.odu_ifa}</p>
                      {consultation.owo_awo_label && (
                        <p className="text-sm text-amber-700">🏷️ {consultation.owo_awo_label}</p>
                      )}
                      {consultation.appeasement && (
                        <p className="text-sm text-gray-600">🕯️ {consultation.appeasement}</p>
                      )}
                      {consultation.profiles && !isOmoAwo && (
                        <p className="text-xs text-gray-500">Babalawo: {consultation.profiles.full_name}</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(consultation.consultation_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
