'use client'
import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase'
import Link from 'next/link'

export default function Home() {
  const [session, setSession] = useState<any>(null)
  const [checking, setChecking] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Check user role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        
        if (profile?.role === 'babalawo') {
          window.location.href = '/admin'
        } else {
          window.location.href = '/dashboard'
        }
      }
      setChecking(false)
    }
    
    checkUser()
  }, [])

  if (checking) {
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
