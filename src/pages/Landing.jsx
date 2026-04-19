import { useNavigate } from 'react-router-dom'
import { Leaf, Truck, ShoppingCart, ArrowRight } from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()

  const roles = [
    {
      title: 'Farmer',
      description: 'Get AI-powered scores for your crops and improve yield',
      icon: Leaf,
      color: 'text-farmer',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      value: 'farmer'
    },
    {
      title: 'Supplier',
      description: 'Manage deliveries and connect with buyers efficiently',
      icon: Truck,
      color: 'text-supplier',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      value: 'middleman'
    },
    {
      title: 'Buyer',
      description: 'Find quality crops and place orders with verified suppliers',
      icon: ShoppingCart,
      color: 'text-buyer',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      value: 'buyer'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Connecting Farmers, Suppliers & Buyers
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Through AI-powered insights and intelligent supply chain management, tracebloom revolutionizes agricultural commerce
          </p>
          <div className="inline-block px-8 py-3 bg-farmer text-white rounded-lg font-semibold">
            🚀 Powered by Gemini AI & Real-time Data
          </div>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {roles.map((role) => {
            const Icon = role.icon
            return (
              <div
                key={role.value}
                className={`${role.bgColor} border-2 ${role.borderColor} rounded-xl p-8 hover:shadow-lg transition cursor-pointer`}
                onClick={() => navigate('/register', { state: { role: role.value } })}
              >
                <Icon className={`w-12 h-12 ${role.color} mb-4`} />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{role.title}</h3>
                <p className="text-gray-700 mb-6">{role.description}</p>
                <button className={`inline-flex items-center gap-2 ${role.color} font-semibold hover:gap-3 transition`}>
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )
          })}
        </div>

        {/* Features */}
        <div className="bg-white rounded-xl shadow-lg p-12 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Why Choose tracebloom?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">AI-Powered Scoring</h3>
              <p className="text-gray-600">Get instant AI analysis of crop quality based on farming inputs and image recognition</p>
            </div>
            <div>
              <div className="text-4xl mb-3">📍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Routing</h3>
              <p className="text-gray-600">Optimize delivery routes with real-time distance and time calculations</p>
            </div>
            <div>
              <div className="text-4xl mb-3">✅</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Quality Verified</h3>
              <p className="text-gray-600">All transactions backed by verified scores and transparent information</p>
            </div>
          </div>
        </div>

        {/* Demo Section */}
        <div className="bg-gradient-to-r from-farmer to-green-600 rounded-xl shadow-lg p-12 text-white text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Try the Demo</h2>
          <p className="text-lg opacity-90 mb-6">Sign up with demo credentials to explore all features</p>
          <button
            onClick={() => navigate('/register')}
            className="bg-white text-farmer px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition inline-block"
          >
            Explore Now
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 text-center">
        <p>© 2026 Tracebloom. Revolutionizing agricultural supply chains with AI.</p>
      </footer>
    </div>
  )
}
