'use client'
import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase'

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        window.location.href = '/login'
        return
      }
      
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profile?.role !== 'babalawo') {
        window.location.href = '/dashboard'
        return
      }
      
      setUser(user)
      setLoading(false)
    }
    
    checkAccess()
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading admin panel...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ backgroundColor: '#1a1a2e', color: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>OGBESA Admin Panel</h1>
          <p>Welcome, Babalawo {user?.email}</p>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#78350f', marginBottom: '16px' }}>Admin Dashboard</h2>
          <p>Your admin dashboard is working! Full features coming soon.</p>
        </div>
        
        <button 
          onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')}
          style={{ marginTop: '20px', backgroundColor: '#92400e', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>
    </div>
  )
}
