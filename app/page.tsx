'use client'
import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase'
import Link from 'next/link'

export default function Home() {
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          console.log('User logged in:', session.user.email)
          
          // Get user profile
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()
          
          if (error) {
            console.error('Error fetching profile:', error)
          }
          
          console.log('User role:', profile?.role)
          
          // Redirect based on role
          if (profile?.role === 'babalawo') {
            console.log('Redirecting to /admin')
            window.location.href = '/admin'
          } else {
            console.log('Redirecting to /dashboard')
            window.location.href = '/dashboard'
          }
        } else {
          setLoading(false)
        }
      } catch (err) {
        console.error('Error:', err)
        setLoading(false)
      }
    }
    
    checkUser()
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#78350f' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 'bold', color: '#78350f', marginBottom: '8px' }}>OGBESA</h1>
        <p style={{ fontSize: '20px', color: '#b45309', marginBottom: '32px' }}>Ifa Priesthood Portal</p>
        <Link href="/login">
          <button style={{ backgroundColor: '#92400e', color: 'white', padding: '12px 32px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
            Enter Portal
          </button>
        </Link>
      </div>
    </div>
  )
}
