import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../../services/firebase'
import { useAuth } from '../../context/AuthContext'
import { doc, getDoc, collection, getDocs, query, where, onSnapshot } from 'firebase/firestore'
import { initMap, addMarker, drawDottedRoute } from '../../services/maps'
import SupplierCard from '../../components/SupplierCard'
import { MapPin, Truck, Star, CheckCircle, MapIcon, DollarSign, X, Navigation2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SupplierPicker() {
  const { cropId } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const mapRef = useRef(null)
  const [crop, setCrop] = useState(null)
  const [suppliers, setSuppliers] = useState([])
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [map, setMap] = useState(null)
  const [routeInfo, setRouteInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [routeLoading, setRouteLoading] = useState(false)
  const [hoveredSupplierId, setHoveredSupplierId] = useState(null)
  const [hoverCardPos, setHoverCardPos] = useState(null)
  const [allRoutes, setAllRoutes] = useState([])
  const [supplierOrders, setSupplierOrders] = useState([])
  const [supplierPendingOrders, setSupplierPendingOrders] = useState([])
  const [supplierActiveDeliveries, setSupplierActiveDeliveries] = useState([])

  // Load crop and suppliers
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load crop
        const cropDoc = await getDoc(doc(db, 'crops', cropId))
        if (cropDoc.exists()) {
          setCrop({ id: cropId, ...cropDoc.data() })
        }

        // Load all suppliers
        const suppliersSnapshot = await getDocs(collection(db, 'suppliers'))
        const suppliersData = suppliersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setSuppliers(suppliersData)
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Failed to load suppliers')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [cropId])

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !map && suppliers.length > 0) {
      const initializeMap = async () => {
        const mapInstance = await initMap(
          'supplierPickerMap',
          {
            lat: 28.5244,
            lng: 77.1855
          },
          10
        )
        if (mapInstance) {
          setMap(mapInstance)
          // Add all supplier markers
          for (const supplier of suppliers) {
            await addMarker(mapInstance, supplier.location, supplier.companyName, 'orange')
          }
        }
      }
      initializeMap()
    }
  }, [suppliers, map])

  // Draw routes for all suppliers
  useEffect(() => {
    if (map && crop && suppliers.length > 0) {
      const drawAllRoutes = async () => {
        try {
          const destination = {
            lat: crop.location?.lat || 28.5244,
            lng: crop.location?.lng || 77.1855
          }

          const routes = []
          for (const supplier of suppliers) {
            const origin = {
              lat: supplier.location.lat,
              lng: supplier.location.lng
            }

            // Draw light gray dotted routes for all suppliers
            const routeData = await drawDottedRoute(map, origin, destination, '#9CA3AF')
            if (routeData) {
              routes.push({
                supplierId: supplier.id,
                routeData
              })
            }
          }
          setAllRoutes(routes)
        } catch (error) {
          console.error('Error drawing all routes:', error)
        }
      }

      drawAllRoutes()
    }
  }, [map, crop, suppliers])

  // Load selected supplier's orders
  useEffect(() => {
    if (!selectedSupplier) {
      setSupplierOrders([])
      setSupplierPendingOrders([])
      setSupplierActiveDeliveries([])
      return
    }

    const ordersQuery = query(
      collection(db, 'orders'),
      where('supplierId', '==', selectedSupplier.id)
    )

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setSupplierOrders(allOrders)
      setSupplierPendingOrders(allOrders.filter(o => o.status === 'confirmed'))
      setSupplierActiveDeliveries(allOrders.filter(o => o.status === 'in-transit'))
    })

    return () => unsubscribe()
  }, [selectedSupplier])

  // Handle supplier selection - highlight their route
  useEffect(() => {
    if (selectedSupplier && map && crop) {
      setRouteLoading(true)
      const drawSelectionRoute = async () => {
        try {
          const origin = {
            lat: selectedSupplier.location.lat,
            lng: selectedSupplier.location.lng
          }
          const destination = {
            lat: crop.location?.lat || 28.5244,
            lng: crop.location?.lng || 77.1855
          }

          console.log('Drawing highlighted route from', origin, 'to', destination)
          // Draw red dotted route for selected supplier (more prominent)
          const routeData = await drawDottedRoute(map, origin, destination, '#ef4444')
          console.log('Route data:', routeData)
          if (routeData) {
            setRouteInfo(routeData)
          } else {
            // Set default route info if drawRoute doesn't return data
            const distance = Math.round(Math.sqrt(Math.pow(destination.lat - origin.lat, 2) + Math.pow(destination.lng - origin.lng, 2)) * 111)
            setRouteInfo({
              distance: `${distance} km`,
              duration: `${Math.ceil(distance / 40)} hours`,
              distanceValue: distance,
              durationValue: Math.ceil(distance / 40)
            })
          }
        } catch (error) {
          console.error('Error drawing route:', error)
          toast.error('Unable to calculate route. Showing default estimates.')
          // Set default route info even on error
          setRouteInfo({
            distance: '35-50 km',
            duration: '1-2 hours',
            distanceValue: 42,
            durationValue: 1.5
          })
        } finally {
          setRouteLoading(false)
        }
      }
      drawSelectionRoute()
    }
  }, [selectedSupplier, map, crop])

  const handlePlaceOrder = () => {
    if (!selectedSupplier) {
      toast.error('Please select a supplier')
      return
    }

    // Navigate to order confirmation with order data
    navigate(`/buyer/order-confirmation`, {
      state: {
        cropId,
        farmerId: crop.farmerId,
        supplierId: selectedSupplier.id,
        quantity: crop.quantityKg,
        totalPrice: crop.pricePerKg * crop.quantityKg,
        routeInfo
      }
    })
  }

  // Handle supplier hover to show details card
  const handleSupplierMouseEnter = (supplier, e) => {
    setHoveredSupplierId(supplier.id)
    const rect = e.currentTarget.getBoundingClientRect()
    setHoverCardPos({
      top: rect.top + window.scrollY,
      left: rect.right + 10
    })
  }

  const handleSupplierMouseLeave = () => {
    setHoveredSupplierId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading suppliers...</p>
      </div>
    )
  }

  if (!crop) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Crop not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="text-buyer hover:underline mb-6 font-medium"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose a Supplier</h1>
        <p className="text-gray-600 mb-8">Select a delivery supplier for your order</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Suppliers List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 space-y-3 max-h-96 overflow-y-auto">
              {suppliers.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No suppliers available</p>
              ) : (
                suppliers.map(supplier => (
                  <div 
                    key={supplier.id} 
                    onClick={() => setSelectedSupplier(supplier)}
                    onMouseEnter={(e) => handleSupplierMouseEnter(supplier, e)}
                    onMouseLeave={handleSupplierMouseLeave}
                  >
                    <SupplierCard
                      supplier={supplier}
                      isSelected={selectedSupplier?.id === supplier.id}
                      onSelect={() => setSelectedSupplier(supplier)}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Map and Info */}
          <div className="lg:col-span-2">
            {/* Map */}
            <div
              id="supplierPickerMap"
              ref={mapRef}
              className="bg-white rounded-xl shadow-md overflow-hidden mb-6"
              style={{ height: '400px' }}
            />

            {/* Route Info */}
            {selectedSupplier && (
              routeLoading ? (
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                  <p className="text-gray-600 text-center">Calculating route details...</p>
                </div>
              ) : routeInfo ? (
                <div className="space-y-6">
                  {/* Supplier Details Card */}
                  <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-supplier">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{selectedSupplier.companyName}</h3>
                        <p className="text-sm text-gray-600">{selectedSupplier.location?.city || 'Delivery Service'}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded-lg">
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        <span className="font-bold text-gray-900">{selectedSupplier.reliabilityScore || 4.5}</span>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Completion Rate</p>
                        <p className="text-lg font-bold text-green-700">{selectedSupplier.completionRate || 95}%</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Delivery Time</p>
                        <p className="text-lg font-bold text-blue-700">{selectedSupplier.deliveryTimeHours || 24}h</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Radius</p>
                        <p className="text-lg font-bold text-orange-700">{selectedSupplier.deliveryRadius || 50}km</p>
                      </div>
                    </div>

                    {/* Coverage Areas */}
                    {selectedSupplier.coverageAreas && selectedSupplier.coverageAreas.length > 0 && (
                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <MapIcon className="w-4 h-4" />
                          Coverage Areas
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedSupplier.coverageAreas.map((area, idx) => (
                            <span key={idx} className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Delivery Route Card */}
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Delivery & Costs</h2>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                        <MapPin className="w-5 h-5 text-buyer flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600">Distance</p>
                          <p className="font-bold text-gray-900">{routeInfo.distance}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                        <Truck className="w-5 h-5 text-buyer flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600">Est. Time</p>
                          <p className="font-bold text-gray-900">{routeInfo.duration}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 col-span-2">
                        <DollarSign className="w-5 h-5 text-buyer flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Delivery Cost</p>
                          <p className="font-bold text-gray-900">₹{selectedSupplier.pricePerKg * crop.quantityKg}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
                      <p className="text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 inline text-blue-600 mr-2" />
                        <span className="font-semibold text-blue-900">{selectedSupplier.companyName}</span> will deliver <span className="font-semibold">{crop.quantityKg}kg</span> of <span className="font-semibold">{crop.cropType}</span> for <span className="font-semibold text-buyer">₹{crop.pricePerKg * crop.quantityKg}</span>
                      </p>
                    </div>

                    <button
                      onClick={handlePlaceOrder}
                      className="w-full bg-buyer text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition font-semibold flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Confirm Order
                    </button>
                  </div>

                  {/* Supplier Performance & Orders */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pending Orders */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-xl">📍</span> Pending Orders
                      </h3>
                      {supplierPendingOrders.length === 0 ? (
                        <p className="text-gray-600 text-center py-6 text-sm">No pending orders</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {supplierPendingOrders.map(order => (
                            <div key={order.id} className="p-2.5 rounded-lg border-2 border-green-200 bg-green-50">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-semibold text-gray-900 text-xs">Order {order.id.substring(0, 8)}</p>
                                <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded">Ready</span>
                              </div>
                              <div className="text-xs text-gray-600 space-y-0.5">
                                <p className="flex items-center gap-1"><span>📦</span> <span className="font-medium text-gray-900">{order.quantityKg}kg</span></p>
                                <p className="flex items-center gap-1"><span>💰</span> <span className="font-medium text-buyer">₹{order.totalPrice || order.quantityKg * 150}</span></p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Active Deliveries */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-xl">🚗</span> Active Deliveries
                      </h3>
                      {supplierActiveDeliveries.length === 0 ? (
                        <p className="text-gray-600 text-center py-6 text-sm">No active deliveries</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {supplierActiveDeliveries.map(order => (
                            <div key={order.id} className="p-2.5 rounded-lg border-2 border-blue-300 bg-blue-50">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-semibold text-gray-900 text-xs">Order {order.id.substring(0, 8)}</p>
                                <span className="px-1.5 py-0.5 bg-blue-200 text-blue-900 text-xs font-semibold rounded animate-pulse">Transit</span>
                              </div>
                              <div className="text-xs text-gray-600 space-y-0.5 mb-1.5">
                                <p className="flex items-center gap-1"><span>📦</span> <span className="font-medium text-gray-900">{order.quantityKg}kg</span></p>
                                <p className="flex items-center gap-1"><span>⏱️</span> <span>~{Math.ceil(Math.random() * 45) + 15}min</span></p>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1">
                                <div className="bg-blue-600 h-1 rounded-full" style={{width: `${Math.ceil(Math.random() * 80) + 20}%`}}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null
            )}

            {/* No Supplier Selected */}
            {!selectedSupplier && (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Select a supplier to see delivery details</p>
              </div>
            )}
          </div>
        </div>

        {/* Hover Card - Supplier Details */}
        {hoveredSupplierId && hoverCardPos && (
          <div
            className="fixed bg-white rounded-xl shadow-2xl border-2 border-supplier p-4 w-72 z-50 fade-in"
            style={{
              top: `${hoverCardPos.top}px`,
              left: `${hoverCardPos.left}px`,
              maxHeight: '400px',
              overflow: 'auto'
            }}
          >
            <button
              onClick={() => setHoveredSupplierId(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>

            {suppliers.find(s => s.id === hoveredSupplierId) && (
              <div>
                {/* Supplier Company Info */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-supplier flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{suppliers.find(s => s.id === hoveredSupplierId)?.companyName}</h4>
                      <p className="text-xs text-gray-600">{suppliers.find(s => s.id === hoveredSupplierId)?.location?.city}</p>
                    </div>
                  </div>
                </div>

                {/* Supplier Stats */}
                <div className="mb-4 pb-4 border-b border-gray-200 space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Star className="w-4 h-4" /> Rating
                    </span>
                    <span className="font-bold text-gray-900">{suppliers.find(s => s.id === hoveredSupplierId)?.reliabilityScore || 4.5}⭐</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completion Rate</span>
                    <span className="font-bold text-green-700">{suppliers.find(s => s.id === hoveredSupplierId)?.completionRate || 95}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Time</span>
                    <span className="font-bold text-blue-700">{suppliers.find(s => s.id === hoveredSupplierId)?.deliveryTimeHours || 24}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Radius</span>
                    <span className="font-bold text-orange-700">{suppliers.find(s => s.id === hoveredSupplierId)?.deliveryRadius || 50}km</span>
                  </div>
                </div>

                {/* Pricing */}
                <div className="mb-4 pb-4 border-b border-gray-200 bg-orange-50 rounded p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" /> Price/kg
                    </span>
                    <span className="font-bold text-orange-700">₹{suppliers.find(s => s.id === hoveredSupplierId)?.pricePerKg || 'N/A'}</span>
                  </div>
                </div>

                {/* Coverage Areas */}
                {suppliers.find(s => s.id === hoveredSupplierId)?.coverageAreas && suppliers.find(s => s.id === hoveredSupplierId)?.coverageAreas.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-900 mb-2 flex items-center gap-1">
                      <MapIcon className="w-3 h-3" />
                      Coverage
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {suppliers.find(s => s.id === hoveredSupplierId)?.coverageAreas.map((area, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
