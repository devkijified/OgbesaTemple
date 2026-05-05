'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  const isPriest = user?.email?.includes('priest')

  return (
    <div className="min-h-screen bg-amber-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-amber-900">
            Welcome, {isPriest ? 'Priest' : 'Seeker'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isPriest ? 'Manage consultations and records' : 'View your sacred records'}
          </p>
        </div>
      </div>
    </div>
  )
}
