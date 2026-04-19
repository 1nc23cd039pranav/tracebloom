import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { db } from '../../services/firebase'
import { useAuth } from '../../context/AuthContext'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { CheckCircle, Package, MapPin, Clock, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'

export default function OrderConfirmation() {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [orderId, setOrderId] = useState(null)
  const [loading, setLoading] = useState(true)

  const orderData = location.state

  useEffect(() => {
    const createOrder = async () => {
      if (!orderData || !currentUser) {
        navigate('/buyer/marketplace')
        return
      }

      try {
        const order = {
          buyerId: currentUser.uid,
          farmerId: orderData.farmerId,
          supplierId: orderData.supplierId,
          cropId: orderData.cropId,
          quantityKg: orderData.quantity,
          totalPrice: orderData.totalPrice,
          status: 'placed',
          route: {
            distance: orderData.routeInfo?.distance || '-',
            duration: orderData.routeInfo?.duration || '-',
            supplierId: orderData.supplierId
          },
          createdAt: serverTimestamp()
        }

        const docRef = await addDoc(collection(db, 'orders'), order)
        setOrderId(docRef.id)
        toast.success('Order placed successfully!')
      } catch (error) {
        console.error('Error creating order:', error)
        toast.error('Failed to place order')
        navigate('/buyer/marketplace')
      } finally {
        setLoading(false)
      }
    }

    createOrder()
  }, [orderData, currentUser, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Processing your order...</p>
      </div>
    )
  }

  if (!orderId || !orderData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Order information not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {/* Success Animation */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 mb-6 animate-bounce">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600 text-lg">Your order has been successfully placed</p>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="mb-8">
            <p className="text-gray-600 text-sm mb-1">Order ID</p>
            <p className="text-3xl font-bold text-gray-900 font-mono">{orderId.substring(0, 12).toUpperCase()}...</p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Quantity</p>
                <p className="font-bold text-gray-900">{orderData.quantity}kg</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Price</p>
                <p className="font-bold text-gray-900">₹{orderData.totalPrice}</p>
              </div>
            </div>
            {orderData.routeInfo && (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Distance</p>
                    <p className="font-bold text-gray-900">{orderData.routeInfo.distance}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Est. Delivery</p>
                    <p className="font-bold text-gray-900">{orderData.routeInfo.duration}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-8">
            <p className="text-sm text-blue-900">
              Your order is being prepared for shipment. You can track the status in your dashboard.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/buyer/dashboard')}
            className="px-6 py-3 bg-buyer text-white rounded-lg hover:bg-blue-600 transition font-semibold"
          >
            Track Order
          </button>
          <button
            onClick={() => navigate('/buyer/marketplace')}
            className="px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition font-semibold"
          >
            Continue Shopping
          </button>
        </div>

        {/* Tips */}
        <div className="mt-12 bg-white rounded-xl shadow-md p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">What's Next?</h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold text-sm flex-shrink-0">1</span>
              <span>Supplier will confirm and prepare the shipment</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold text-sm flex-shrink-0">2</span>
              <span>Track your delivery in real-time on the dashboard</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold text-sm flex-shrink-0">3</span>
              <span>Receive and verify your order upon delivery</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
