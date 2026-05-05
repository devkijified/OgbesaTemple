'use client'
import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase'
import Link from 'next/link'

export default function Home() {
  const [session, setSession] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
  }, [])

  if (session) {
    // Check role and redirect
    supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (data?.role === 'babalawo') {
          window.location.href = '/admin'
        } else {
          window.location.href = '/dashboard'
        }
      })
    return null
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 'bold', color: '#78350f' }}>OGBESA</h1>
        <p style={{ fontSize: '20px', color: '#b45309' }}>Ifa Priesthood Portal</p>
        <Link href="/login">
          <button style={{ marginTop: '32px', backgroundColor: '#92400e', color: 'white', padding: '12px 32px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Enter Portal</button>
        </Link>
      </div>
    </div>
  )
}
