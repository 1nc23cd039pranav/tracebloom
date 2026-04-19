import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../../services/firebase'
import { useAuth } from '../../context/AuthContext'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ShoppingCart, Truck, CheckCircle } from 'lucide-react'

export default function BuyerDashboard() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState({
    ordersPlaced: 0,
    inTransit: 0,
    delivered: 0
  })
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) return

    const ordersQuery = query(
      collection(db, 'orders'),
      where('buyerId', '==', currentUser.uid)
    )

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setOrders(ordersData)

        const placed = ordersData.length
        const inTransit = ordersData.filter(o => o.status === 'in-transit').length
        const delivered = ordersData.filter(o => o.status === 'delivered').length

        setStats({
          ordersPlaced: placed,
          inTransit,
          delivered
        })

        // Calculate monthly spending
        const monthlyData = {}
        ordersData.forEach(order => {
          const date = new Date(order.createdAt?.toDate?.() || new Date())
          const month = date.toLocaleString('default', { month: 'short' })
          monthlyData[month] = (monthlyData[month] || 0) + (order.totalPrice || 0)
        })

        const chart = Object.entries(monthlyData).map(([month, spent]) => ({
          month,
          spent
        }))
        setChartData(chart)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching orders:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [currentUser])

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Buyer Dashboard</h1>
          <p className="text-gray-600">Track your orders and discover quality crops</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-buyer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Orders Placed</p>
                <p className="text-3xl font-bold text-gray-900">{stats.ordersPlaced}</p>
              </div>
              <ShoppingCart className="w-10 h-10 text-buyer opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">In Transit</p>
                <p className="text-3xl font-bold text-gray-900">{stats.inTransit}</p>
              </div>
              <Truck className="w-10 h-10 text-amber-500 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Delivered</p>
                <p className="text-3xl font-bold text-gray-900">{stats.delivered}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-buyer to-blue-600 rounded-xl shadow-md p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Find Quality Crops</h2>
              <p className="opacity-90">Browse verified farmers and quality metrics</p>
            </div>
            <button
              onClick={() => navigate('/buyer/marketplace')}
              className="bg-white text-buyer px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Browse Marketplace
            </button>
          </div>
        </div>

        {/* Spending Chart */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Monthly Spending</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value}`} />
                <Bar dataKey="spent" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Orders */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h2>
          {orders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <p className="text-gray-600 mb-4">No orders yet</p>
              <button
                onClick={() => navigate('/buyer/marketplace')}
                className="bg-buyer text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-xl shadow-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Order ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Crop</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Quantity</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.id.substring(0, 8)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {order.cropType || 'Crop'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'placed' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'confirmed' ? 'bg-purple-100 text-purple-800' :
                          order.status === 'in-transit' ? 'bg-amber-100 text-amber-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{order.quantityKg} kg</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{order.totalPrice}</td>
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
