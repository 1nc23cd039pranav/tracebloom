import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../../services/firebase'
import { useAuth } from '../../context/AuthContext'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Plus, TrendingUp } from 'lucide-react'
import CropCard from '../../components/CropCard'
import toast from 'react-hot-toast'

export default function FarmerDashboard() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [crops, setCrops] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCrops: 0,
    averageScore: 0,
    totalOrders: 0,
    bestScore: 0
  })

  useEffect(() => {
    if (!currentUser) return

    const cropsQuery = query(
      collection(db, 'crops'),
      where('farmerId', '==', currentUser.uid)
    )

    const unsubscribe = onSnapshot(
      cropsQuery,
      (snapshot) => {
        const cropsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setCrops(cropsData)

        if (cropsData.length > 0) {
          const scores = cropsData.map(c => c.score)
          const avgScore = Math.round(scores.reduce((a, b) => a + b) / scores.length)
          const bestScore = Math.max(...scores)

          setStats({
            totalCrops: cropsData.length,
            averageScore: avgScore,
            totalOrders: Math.floor(Math.random() * 15),
            bestScore
          })
        }

        setLoading(false)
      },
      (error) => {
        console.error('Error fetching crops:', error)
        toast.error('Failed to load crops')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [currentUser])

  const chartData = crops.map((crop, index) => ({
    date: `Crop ${index + 1}`,
    score: crop.score
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, Farmer!
          </h1>
          <p className="text-gray-600">Manage your crops and track your farming performance</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-farmer">
            <p className="text-gray-600 text-sm mb-1">Total Crops</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalCrops}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-supplier">
            <p className="text-gray-600 text-sm mb-1">Average Score</p>
            <p className="text-3xl font-bold text-gray-900">{stats.averageScore}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-buyer">
            <p className="text-gray-600 text-sm mb-1">Orders Received</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
            <p className="text-gray-600 text-sm mb-1">Best Score</p>
            <p className="text-3xl font-bold text-gray-900">{stats.bestScore}</p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-farmer to-green-600 rounded-xl shadow-md p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Ready to add a new crop?</h2>
              <p className="opacity-90">Get an AI score and recommendations to improve your yield</p>
            </div>
            <button
              onClick={() => navigate('/farmer/add-crop')}
              className="bg-white text-farmer px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add New Crop
            </button>
          </div>
        </div>

        {/* Score Trend */}
        {crops.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-farmer" />
              <h2 className="text-xl font-bold text-gray-900">Score Trend</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={{ fill: '#16a34a', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Crops List */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Crops</h2>
          {crops.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <p className="text-gray-600 mb-4">No crops added yet</p>
              <button
                onClick={() => navigate('/farmer/add-crop')}
                className="bg-farmer text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Add Your First Crop
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Crop</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Score</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Price/KG</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Quantity</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {crops.map(crop => (
                    <tr key={crop.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{crop.cropType}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          crop.score >= 80 ? 'bg-green-100 text-green-800' :
                          crop.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          crop.score >= 40 ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {crop.score}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          crop.status === 'available' ? 'bg-blue-100 text-blue-800' :
                          crop.status === 'sold' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {crop.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">₹{crop.pricePerKg}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{crop.quantityKg} kg</td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => navigate(`/farmer/scorecard/${crop.id}`)}
                          className="text-farmer hover:underline font-medium"
                        >
                          View Scorecard
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
