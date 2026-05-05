'use client'
import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [consultations, setConsultations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
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
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profile)
      
      let query = supabase.from('consultations').select('*, profiles(full_name, email)')
      
      if (profile?.role === 'abore') {
        query = query.eq('client_id', user.id)
      }
      
      const { data } = await query.order('consultation_date', { ascending: false })
      if (data) setConsultations(data)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    let clientId = null
    const { data: existingClient } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', formData.client_email)
      .single()
    
    if (existingClient) {
      clientId = existingClient.id
    } else {
      const { data: newUser, error: signUpError } = await supabase.auth.signUp({
        email: formData.client_email,
        password: Math.random().toString(36).slice(-8),
      })
      
      if (newUser?.user) {
        clientId = newUser.user.id
        await supabase
          .from('profiles')
          .upsert({ id: clientId, full_name: formData.client_email.split('@')[0], email: formData.client_email, role: 'abore' })
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
        await fetchUserAndData()
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
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-amber-900 mb-2">
            Àbọ̀̀, {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0]}
          </h2>
          <p className="text-gray-600">
            {isOmoAwo 
              ? `You are OMO AWO - initiate of the sacred mystery.`
              : `Your sacred consultation records are kept here.`}
          </p>
        </div>
        
        {showForm && isOmoAwo && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-amber-900 mb-4">Record Ifa Consultation</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Seeker's Email</label>
                <input type="email" required className="w-full p-2 border rounded" value={formData.client_email} onChange={(e) => setFormData({...formData, client_email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Odu Ifa</label>
                <input type="text" required className="w-full p-2 border rounded" value={formData.odu_ifa} onChange={(e) => setFormData({...formData, odu_ifa: e.target.value})} />
              </div>
              <button type="submit" className="bg-amber-800 text-white px-6 py-2 rounded">Save Consultation</button>
            </form>
          </div>
        )}
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-amber-900 mb-4">
            {isOmoAwo ? 'All Consultations' : 'Your Sacred Records'}
          </h3>
          {consultations.length === 0 ? (
            <p className="text-gray-500">No consultations recorded yet.</p>
          ) : (
            consultations.map((c) => (
              <div key={c.id} className="border-l-4 border-amber-600 pl-4 py-2 mb-3">
                <p className="font-semibold">Odu: {c.odu_ifa}</p>
                {c.owo_awo_label && <p className="text-sm text-amber-700">🏷️ {c.owo_awo_label}</p>}
                <p className="text-xs text-gray-400">{new Date(c.consultation_date).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
