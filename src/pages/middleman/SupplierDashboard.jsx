import { useState, useEffect } from 'react'
import { db } from '../../services/firebase'
import { useAuth } from '../../context/AuthContext'
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Package, Star, Navigation2, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SupplierDashboard() {
  const { currentUser } = useAuth()
  const [supplierData, setSupplierData] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({})

  // Auto-create supplier document if user profile exists but supplier document doesn't
  const createSupplierDocumentFromUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        if (userData.role === 'middleman' && userData.companyName) {
          const supplierData = {
            uid: uid,
            name: userData.companyName,
            companyName: userData.companyName,
            pricePerKg: userData.pricePerKg || 25,
            deliveryRadius: userData.deliveryRadius || 50,
            coverageAreas: userData.coverageAreas || ['Default Region'],
            reliabilityScore: 5.0,
            completionRate: 100,
            deliveryTimeHours: 24,
            location: userData.location || {
              lat: 28.6139,
              lng: 77.2090,
              city: userData.companyName
            },
            createdAt: serverTimestamp()
          }
          await setDoc(doc(db, 'suppliers', uid), supplierData)
          console.log('Auto-created supplier document for:', uid)
          toast.success('Supplier profile initialized!')
          return supplierData
        }
      }
      return null
    } catch (error) {
      console.error('Failed to create supplier document:', error)
      return null
    }
  }

  useEffect(() => {
    if (!currentUser) return

    const supplierQuery = query(
      collection(db, 'suppliers'),
      where('uid', '==', currentUser.uid)
    )

    const unsubscribe = onSnapshot(
      supplierQuery,
      async (snapshot) => {
        if (snapshot.docs.length > 0) {
          const supplier = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
          setSupplierData(supplier)
          setEditData(supplier)
          setLoading(false)
        } else {
          // Supplier document not found, try to auto-create it from user data
          console.warn('Supplier document not found, attempting to auto-create...')
          const createdSupplier = await createSupplierDocumentFromUserData(currentUser.uid)
          if (createdSupplier) {
            setSupplierData({ id: currentUser.uid, ...createdSupplier })
            setEditData({ id: currentUser.uid, ...createdSupplier })
          }
          setLoading(false)
        }
      },
      (error) => {
        console.error('Error fetching supplier:', error)
        toast.error('Failed to load supplier data')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [currentUser])

  useEffect(() => {
    if (!supplierData) return

    const ordersQuery = query(
      collection(db, 'orders'),
      where('supplierId', '==', supplierData.id)
    )

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setOrders(ordersData)
      }
    )

    return () => unsubscribe()
  }, [supplierData])

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, 'suppliers', supplierData.id), {
        pricePerKg: parseFloat(editData.pricePerKg),
        deliveryRadius: parseFloat(editData.deliveryRadius),
        coverageAreas: editData.coverageAreas.split(',').map(a => a.trim())
      })
      setSupplierData({
        ...supplierData,
        pricePerKg: parseFloat(editData.pricePerKg),
        deliveryRadius: parseFloat(editData.deliveryRadius),
        coverageAreas: editData.coverageAreas.split(',').map(a => a.trim())
      })
      setEditMode(false)
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    }
  }

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus
      })
      toast.success('Order status updated')
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Failed to update order')
    }
  }

  const chartData = [
    { name: 'Your Price', value: supplierData?.pricePerKg || 0 },
    { name: 'Market Avg', value: 25 }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    )
  }

  if (!supplierData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-12 max-w-md text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Initializing Supplier Profile</h2>
          <p className="text-gray-600 mb-6">
            We're setting up your supplier profile. If this takes too long, please refresh the page or try logging in again.
          </p>
          <div className="space-y-3">
            <p className="text-sm text-gray-500 font-semibold">If you're having issues:</p>
            <ol className="text-left text-gray-700 text-sm space-y-2">
              <li>1. Check your internet connection</li>
              <li>2. Refresh the page (Ctrl+R)</li>
              <li>3. <span className="font-semibold">Log out</span> and <span className="font-semibold">log in</span> again</li>
              <li>4. Contact support if problem persists</li>
            </ol>
            <button 
              onClick={() => window.location.reload()}
              className="w-full mt-6 bg-supplier text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition font-semibold"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {supplierData.companyName}
          </h1>
          <p className="text-gray-600">Manage orders and delivery operations</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-supplier">
            <p className="text-gray-600 text-sm mb-1">Active Orders</p>
            <p className="text-3xl font-bold text-gray-900">
              {orders.filter(o => o.status !== 'delivered').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
            <p className="text-gray-600 text-sm mb-1">Avg Rating</p>
            <p className="text-3xl font-bold text-gray-900 flex items-center gap-1">
              {supplierData.reliabilityScore}
              <span className="text-yellow-400">★</span>
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-buyer">
            <p className="text-gray-600 text-sm mb-1">Completion Rate</p>
            <p className="text-3xl font-bold text-gray-900">{supplierData.completionRate}%</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-farmer">
            <p className="text-gray-600 text-sm mb-1">Coverage Radius</p>
            <p className="text-3xl font-bold text-gray-900">{supplierData.deliveryRadius}km</p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Profile Settings</h2>
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="text-supplier hover:text-orange-700 transition font-semibold"
              >
                Edit
              </button>
            )}
          </div>

          {editMode ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price per KG (₹)</label>
                <input
                  type="number"
                  value={editData.pricePerKg}
                  onChange={(e) => setEditData(prev => ({ ...prev, pricePerKg: e.target.value }))}
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-supplier"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Radius (km)</label>
                <input
                  type="number"
                  value={editData.deliveryRadius}
                  onChange={(e) => setEditData(prev => ({ ...prev, deliveryRadius: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-supplier"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coverage Areas (comma separated)</label>
                <input
                  type="text"
                  value={Array.isArray(editData.coverageAreas) ? editData.coverageAreas.join(', ') : editData.coverageAreas}
                  onChange={(e) => setEditData(prev => ({ ...prev, coverageAreas: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-supplier"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-supplier text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition font-semibold"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="flex-1 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-gray-600 text-sm mb-1">Price per KG</p>
                <p className="text-2xl font-bold text-gray-900">₹{supplierData.pricePerKg}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Delivery Radius</p>
                <p className="text-2xl font-bold text-gray-900">{supplierData.deliveryRadius}km</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Coverage Areas</p>
                <p className="text-sm font-medium text-gray-900">{supplierData.coverageAreas.join(', ')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Price Comparison */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-supplier" />
            Price Comparison
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#d97706" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Orders */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-supplier" />
            Active Orders
          </h2>
          {orders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <p className="text-gray-600">No orders yet</p>
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
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Distance</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
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
                          order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'in-transit' ? 'bg-amber-100 text-amber-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{order.quantityKg} kg</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {order.route?.distance || '-'}km
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="in-transit">In Transit</option>
                          <option value="delivered">Delivered</option>
                        </select>
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
