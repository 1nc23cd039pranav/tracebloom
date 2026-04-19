import { useState, useEffect, useRef } from 'react'
import { db } from '../../services/firebase'
import { useAuth } from '../../context/AuthContext'
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore'
import { initMap, addMarker, drawRoute } from '../../services/maps'
import { Navigation2, MapPin, Clock, DollarSign, Truck, User, Leaf, Star, X, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RouteMapView() {
  const { currentUser } = useAuth()
  const mapRef = useRef(null)
  const [map, setMap] = useState(null)
  const [supplier, setSupplier] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orders, setOrders] = useState([])
  const [routeInfo, setRouteInfo] = useState(null)
  const [farmerData, setFarmerData] = useState(null)
  const [cropData, setCropData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hoveredOrderId, setHoveredOrderId] = useState(null)
  const [hoverCardPos, setHoverCardPos] = useState(null)
  const [hoverFarmerData, setHoverFarmerData] = useState(null)
  const [hoverCropData, setHoverCropData] = useState(null)

  // Load supplier data
  useEffect(() => {
    if (!currentUser) return

    const supplierQuery = query(
      collection(db, 'suppliers'),
      where('uid', '==', currentUser.uid)
    )

    const unsubscribe = onSnapshot(supplierQuery, (snapshot) => {
      if (snapshot.docs.length > 0) {
        setSupplier({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() })
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [currentUser])

  // Load hover farmer/crop data
  useEffect(() => {
    if (!hoveredOrderId) {
      setHoverFarmerData(null)
      setHoverCropData(null)
      return
    }

    const loadHoverData = async () => {
      try {
        const order = orders.find(o => o.id === hoveredOrderId)
        if (!order) return

        const farmerDoc = await getDoc(doc(db, 'users', order.farmerId))
        if (farmerDoc.exists()) {
          setHoverFarmerData(farmerDoc.data())
        }

        const cropDoc = await getDoc(doc(db, 'crops', order.cropId))
        if (cropDoc.exists()) {
          setHoverCropData(cropDoc.data())
        }
      } catch (error) {
        console.error('Error loading hover data:', error)
      }
    }

    loadHoverData()
  }, [hoveredOrderId, orders])

  // Load orders
  useEffect(() => {
    if (!supplier) return

    const ordersQuery = query(
      collection(db, 'orders'),
      where('supplierId', '==', supplier.id)
    )

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setOrders(ordersData)
    })

    return () => unsubscribe()
  }, [supplier])

  // Initialize map with all orders
  useEffect(() => {
    if (supplier && mapRef.current && !map) {
      const initializeMap = async () => {
        const mapInstance = await initMap(
          'routeMap',
          {
            lat: supplier.location.lat,
            lng: supplier.location.lng
          },
          11
        )
        if (mapInstance) {
          setMap(mapInstance)
          // Add supplier marker (orange - center)
          await addMarker(mapInstance, supplier.location, supplier.companyName, 'orange')
        }
      }
      initializeMap()
    }
  }, [supplier, map])

  // Display all pending orders on map
  useEffect(() => {
    if (!map || !orders.length) return

    const displayOrderMarkers = async () => {
      try {
        const pendingOrders = orders.filter(o => o.status === 'confirmed')
        
        for (const order of pendingOrders) {
          try {
            const farmerDoc = await getDoc(doc(db, 'users', order.farmerId))
            if (farmerDoc.exists()) {
              const farmerLocation = farmerDoc.data().location
              // Add green marker for pending orders (farmer location)
              await addMarker(map, farmerLocation, `Pending: ${order.quantityKg}kg`, 'green')
            }
          } catch (error) {
            console.error('Error adding pending order marker:', error)
          }
        }
      } catch (error) {
        console.error('Error displaying order markers:', error)
      }
    }

    displayOrderMarkers()
  }, [map, orders])

  // Display all active deliveries on map with routes
  useEffect(() => {
    if (!map || !orders.length) return

    const displayActiveDeliveries = async () => {
      try {
        const activeOrders = orders.filter(o => o.status === 'in-transit')
        
        for (const order of activeOrders) {
          try {
            const farmerDoc = await getDoc(doc(db, 'users', order.farmerId))
            if (farmerDoc.exists()) {
              const farmerLocation = farmerDoc.data().location
              // Add blue marker for active deliveries (destination)
              await addMarker(map, farmerLocation, `Delivering: ${order.quantityKg}kg`, 'blue')
              
              // Draw red route from supplier to farmer for active delivery
              await drawRoute(map, supplier.location, farmerLocation, '#ef4444')
            }
          } catch (error) {
            console.error('Error adding active delivery marker:', error)
          }
        }
      } catch (error) {
        console.error('Error displaying active deliveries:', error)
      }
    }

    displayActiveDeliveries()
  }, [map, orders, supplier])

  // Handle order selection
  useEffect(() => {
    if (selectedOrder && map) {
      const loadOrderDetails = async () => {
        try {
          // Get farmer data
          const farmerDoc = await getDoc(doc(db, 'users', selectedOrder.farmerId))
          if (farmerDoc.exists()) {
            setFarmerData(farmerDoc.data())
          }

          // Get crop data
          const cropDoc = await getDoc(doc(db, 'crops', selectedOrder.cropId))
          if (cropDoc.exists()) {
            setCropData(cropDoc.data())
          }

          const drawDeliveryRoute = async () => {
            try {
              const farmerLoc = farmerDoc.exists() ? farmerDoc.data().location : { lat: 28.7041, lng: 77.1025 }
              const origin = { lat: farmerLoc.lat, lng: farmerLoc.lng }
              const destination = { lat: 28.5244, lng: 77.1855 }

              // Clear previous markers and route
              if (map) {
                map.setCenter(origin)
                // Add farmer marker (green)
                await addMarker(map, origin, `${selectedOrder.farmerId === farmerDoc.id ? 'Farmer' : 'Pickup'}`, 'green')
                // Add buyer marker (blue)
                await addMarker(map, destination, 'Buyer Delivery', 'blue')
                // Add supplier marker (orange)
                await addMarker(map, { lat: supplier.location.lat, lng: supplier.location.lng }, supplier.companyName, 'orange')
              }

              // Draw route
              const routeData = await drawRoute(map, origin, destination, '#ef4444')
              if (routeData) {
                setRouteInfo(routeData)
              }
            } catch (error) {
              console.error('Error drawing route:', error)
              toast.error('Failed to draw route')
            }
          }
          drawDeliveryRoute()
        } catch (error) {
          console.error('Error loading order details:', error)
          toast.error('Failed to load order details')
        }
      }
      loadOrderDetails()
    }
  }, [selectedOrder, map, supplier])

  // Handle order hover to show farmer details
  const handleOrderMouseEnter = (order, e) => {
    setHoveredOrderId(order.id)
    const rect = e.currentTarget.getBoundingClientRect()
    setHoverCardPos({
      top: rect.top + window.scrollY,
      left: rect.right + 10
    })
  }

  const handleOrderMouseLeave = () => {
    setHoveredOrderId(null)
  }

  const handleStartDelivery = async () => {
    if (!selectedOrder) return

    try {
      await updateDoc(doc(db, 'orders', selectedOrder.id), {
        status: 'in-transit'
      })
      toast.success('Delivery started!')
      setSelectedOrder(null)
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Failed to start delivery')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading route map...</p>
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">No supplier data found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Delivery Route Map</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            {/* Map Legend */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-xs font-medium text-gray-700">Supplier</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs font-medium text-gray-700">Pending Order</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs font-medium text-gray-700">Active Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-4 bg-gray-400"></div>
                <span className="text-xs font-medium text-gray-700">Route</span>
              </div>
            </div>

            <div
              id="routeMap"
              ref={mapRef}
              className="bg-white rounded-xl shadow-md overflow-hidden"
              style={{ height: '500px' }}
            />

            {/* Route Info & Details */}
            {routeInfo && selectedOrder && farmerData && cropData && (
              <div className="mt-6 space-y-4">
                {/* Supplier Details Card */}
                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-supplier">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{supplier.companyName}</h3>
                      <p className="text-sm text-gray-600">{supplier.location?.city || 'Logistics Provider'}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded">
                      <span className="text-yellow-400">★</span>
                      <span className="font-bold text-gray-900 text-sm">{supplier.reliabilityScore}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-xs text-gray-600">Completion</p>
                      <p className="font-bold text-green-700">{supplier.completionRate}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600">Delivery</p>
                      <p className="font-bold text-blue-700">{supplier.deliveryTimeHours}h</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600">Radius</p>
                      <p className="font-bold text-orange-700">{supplier.deliveryRadius}km</p>
                    </div>
                  </div>
                </div>

                {/* Farmer Details Card */}
                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-farmer">
                  <div className="flex items-start gap-4">
                    <User className="w-8 h-8 text-farmer flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">{farmerData.name}</h3>
                      <p className="text-sm text-gray-600">{farmerData.location?.village}, {farmerData.location?.district}</p>
                    </div>
                  </div>
                </div>

                {/* Crop Details Card */}
                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-buyer">
                  <div className="flex items-start gap-4">
                    <Leaf className="w-8 h-8 text-buyer flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">{cropData.cropType}</h3>
                      <p className="text-sm text-gray-600">{selectedOrder.quantityKg}kg @ ₹{cropData.pricePerKg}/kg</p>
                    </div>
                  </div>
                </div>

                {/* Route & Pricing Card */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery & Costs</h2>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-supplier" />
                        <span className="text-gray-700">Distance</span>
                      </div>
                      <span className="font-bold text-gray-900">{routeInfo.distance}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-supplier" />
                        <span className="text-gray-700">Est. Time</span>
                      </div>
                      <span className="font-bold text-gray-900">{routeInfo.duration}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <Truck className="w-5 h-5 text-supplier" />
                        <span className="text-gray-700">Delivery Cost</span>
                      </div>
                      <span className="font-bold text-gray-900">₹{supplier.pricePerKg * selectedOrder.quantityKg}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 bg-green-50 px-3 rounded-lg border border-green-200">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-farmer" />
                        <span className="text-gray-700 font-medium">Total Cost</span>
                      </div>
                      <span className="font-bold text-farmer">₹{(cropData.pricePerKg + supplier.pricePerKg) * selectedOrder.quantityKg}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleStartDelivery}
                    className="w-full bg-supplier text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition font-semibold flex items-center justify-center gap-2"
                  >
                    <Navigation2 className="w-5 h-5" />
                    Start Delivery
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Orders List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Pending Orders</h2>
              {orders.filter(o => o.status === 'confirmed').length === 0 ? (
                <p className="text-gray-600 text-center py-8">No pending orders</p>
              ) : (
                <div className="space-y-3">
                  {orders.filter(o => o.status === 'confirmed').map(order => (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      onMouseEnter={(e) => handleOrderMouseEnter(order, e)}
                      onMouseLeave={handleOrderMouseLeave}
                      className={`p-3 rounded-lg cursor-pointer transition border-2 space-y-2 ${
                        selectedOrder?.id === order.id
                          ? 'border-supplier bg-orange-50'
                          : 'border-gray-200 hover:border-supplier'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900 text-sm">Order {order.id.substring(0, 8)}</p>
                        <span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded">📍 Pending</span>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600 bg-white rounded p-2">
                        <p className="flex items-center gap-1"><span>📦</span> <span className="font-medium text-gray-900">{order.quantityKg}kg</span></p>
                        <p className="flex items-center gap-1"><span>💰</span> <span className="font-medium text-farmer">₹{order.totalPrice || order.quantityKg * 150}</span></p>
                        <p className="flex items-center gap-1"><span>🎯</span> <span>Confirmed</span></p>
                      </div>
                      <div className="text-xs text-gray-500 pt-1 border-t border-gray-200">Ready for pickup</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Deliveries */}
            <div className="bg-white rounded-xl shadow-md p-6 mt-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Active Deliveries</h2>
              {orders.filter(o => o.status === 'in-transit').length === 0 ? (
                <p className="text-gray-600 text-center py-8">No active deliveries</p>
              ) : (
                <div className="space-y-3">
                  {orders.filter(o => o.status === 'in-transit').map(order => (
                    <div key={order.id} className="p-3 bg-blue-50 rounded-lg border-2 border-blue-300 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900 text-sm">Order {order.id.substring(0, 8)}</p>
                        <span className="inline-block px-2 py-0.5 bg-blue-200 text-blue-900 text-xs font-semibold rounded animate-pulse">🚗 In Transit</span>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600 bg-white rounded p-2">
                        <p className="flex items-center gap-1"><span>📦</span> <span className="font-medium text-gray-900">{order.quantityKg}kg</span></p>
                        <p className="flex items-center gap-1"><span>⏱️</span> <span>~{Math.ceil(Math.random() * 45) + 15}min remaining</span></p>
                        <p className="flex items-center gap-1"><span>📍</span> <span>On the way</span></p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-blue-600 h-1.5 rounded-full" style={{width: `${Math.ceil(Math.random() * 80) + 20}%`}}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hover Card - Farmer & Crop Details */}
        {hoveredOrderId && hoverFarmerData && hoverCropData && hoverCardPos && (
          <div
            className="fixed bg-white rounded-xl shadow-2xl border-2 border-farmer p-4 w-72 z-50 fade-in"
            style={{
              top: `${hoverCardPos.top}px`,
              left: `${hoverCardPos.left}px`,
              maxHeight: '400px',
              overflow: 'auto'
            }}
          >
            <button
              onClick={() => setHoveredOrderId(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Farmer Details */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-farmer flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-gray-900">{hoverFarmerData.name}</h4>
                  <p className="text-xs text-gray-600">{hoverFarmerData.location?.village}, {hoverFarmerData.location?.district}</p>
                </div>
              </div>
            </div>

            {/* Crop Details */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-start gap-3 mb-3">
                <Leaf className="w-5 h-5 text-buyer flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-gray-900">{hoverCropData.cropType}</h4>
                  <p className="text-xs text-gray-600">Quality Score: {hoverCropData.score}/100</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Soil Type:</span>
                  <span className="font-medium text-gray-900 capitalize">{hoverCropData.soilType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium text-gray-900">{hoverCropData.quantityKg}kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price/kg:</span>
                  <span className="font-medium text-farmer">₹{hoverCropData.pricePerKg}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-bold text-gray-900">₹{hoverCropData.pricePerKg * hoverCropData.quantityKg}</span>
                </div>
              </div>
            </div>

            {/* AI Analysis Preview */}
            {hoverCropData.geminiAnalysis && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-900 mb-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Grade: {hoverCropData.geminiAnalysis.grade || 'N/A'}
                </p>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {hoverCropData.geminiAnalysis.analysis?.substring(0, 100)}...
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
