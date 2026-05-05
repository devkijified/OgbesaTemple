import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 sacred-pattern">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            {/* Sacred Symbol */}
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-amber-800/10 mb-8">
              <span className="text-4xl">🔮</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-amber-900 mb-6">
              OGBESA
              <span className="block text-2xl md:text-3xl text-amber-700 mt-2">Temple of Ifa</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto mb-4">
              Sacred Ifa Consultations & Records Management
            </p>
            
            <div className="w-24 h-0.5 bg-amber-600 mx-auto my-8"></div>
            
            <p className="text-gray-600 max-w-lg mx-auto mb-12">
              Preserving the wisdom of Orunmila through sacred consultations, 
              spiritual guidance, and ancestral records.
            </p>
            
            <Link href="/login">
              <button className="group bg-amber-800 hover:bg-amber-900 text-white font-semibold px-8 py-4 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl inline-flex items-center gap-2">
                Enter Sacred Portal
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="bg-white/50 backdrop-blur-sm py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">📿</div>
              <h3 className="font-semibold text-amber-900 mb-2">Ifa Divination</h3>
              <p className="text-sm text-gray-600">Sacred Odu readings and spiritual guidance</p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">📜</div>
              <h3 className="font-semibold text-amber-900 mb-2">Records Portal</h3>
              <p className="text-sm text-gray-600">Access your consultation history anytime</p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🎙️</div>
              <h3 className="font-semibold text-amber-900 mb-2">Session Recordings</h3>
              <p className="text-sm text-gray-600">Listen back to your sacred consultations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
