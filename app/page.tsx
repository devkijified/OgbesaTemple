import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-amber-50">
      <div className="max-w-4xl mx-auto p-8 text-center">
        <h1 className="text-4xl font-bold text-amber-900 mb-4">OGBESA Temple</h1>
        <p className="text-xl text-amber-700 mb-8">Sacred Ifa Consultations & Records</p>
        <Link href="/login">
          <button className="bg-amber-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-900">
            Enter Portal
          </button>
        </Link>
      </div>
    </div>
  )
}
