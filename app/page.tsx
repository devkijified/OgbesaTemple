import Link from 'next/link'

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fffbeb', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', padding: '60px 20px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 'bold', color: '#78350f', marginBottom: '16px' }}>
          OGBESA
        </h1>
        <p style={{ fontSize: '20px', color: '#b45309', marginBottom: '8px' }}>
          Ifa Priesthood Portal
        </p>
        <div style={{ width: '96px', height: '2px', backgroundColor: '#d97706', margin: '24px auto' }}></div>
        <p style={{ color: '#4b5563', maxWidth: '500px', margin: '0 auto 32px auto' }}>
          Sacred consultations, records management, and spiritual guidance
        </p>
        <Link href="/login">
          <button style={{ backgroundColor: '#92400e', color: 'white', padding: '12px 32px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>
            Enter Portal
          </button>
        </Link>
      </div>
    </div>
  )
}
