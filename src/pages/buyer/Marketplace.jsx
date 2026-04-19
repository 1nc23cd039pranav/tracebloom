import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../../services/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import CropCard from '../../components/CropCard'
import { Search, Filter } from 'lucide-react'

export default function Marketplace() {
  const navigate = useNavigate()
  const [crops, setCrops] = useState([])
  const [filteredCrops, setFilteredCrops] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    minScore: 0,
    cropType: '',
    sortBy: 'score'
  })

  useEffect(() => {
    const cropsQuery = query(
      collection(db, 'crops'),
      where('status', '==', 'available')
    )

    const unsubscribe = onSnapshot(
      cropsQuery,
      (snapshot) => {
        const cropsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setCrops(cropsData)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching crops:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    let filtered = crops.filter(crop => {
      const matchesSearch = !searchTerm || 
        crop.cropType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crop.farmerName.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesScore = crop.score >= filters.minScore
      
      const matchesCropType = !filters.cropType || 
        crop.cropType.toLowerCase().includes(filters.cropType.toLowerCase())
      
      return matchesSearch && matchesScore && matchesCropType
    })

    // Sort
    if (filters.sortBy === 'score') {
      filtered.sort((a, b) => b.score - a.score)
    } else if (filters.sortBy === 'price-asc') {
      filtered.sort((a, b) => a.pricePerKg - b.pricePerKg)
    } else if (filters.sortBy === 'price-desc') {
      filtered.sort((a, b) => b.pricePerKg - a.pricePerKg)
    } else if (filters.sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }

    setFilteredCrops(filtered)
  }, [crops, searchTerm, filters])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading marketplace...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Crop Marketplace</h1>
          <p className="text-gray-600">Discover quality crops from verified farmers</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by crop name or farmer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-buyer bg-white"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Score</label>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.minScore}
              onChange={(e) => setFilters(prev => ({ ...prev, minScore: parseInt(e.target.value) }))}
              className="w-full"
            />
            <p className="text-sm text-gray-600 mt-1">{filters.minScore}+</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Crop Type</label>
            <input
              type="text"
              placeholder="Filter by type..."
              value={filters.cropType}
              onChange={(e) => setFilters(prev => ({ ...prev, cropType: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-buyer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-buyer"
            >
              <option value="score">Highest Score</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        {/* Results */}
        {filteredCrops.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No crops found matching your criteria</p>
            <p className="text-gray-500 text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCrops.map(crop => (
              <div
                key={crop.id}
                onClick={() => navigate(`/buyer/farmer/${crop.farmerId}/${crop.id}`)}
              >
                <CropCard crop={crop} />
              </div>
            ))}
          </div>
        )}

        {/* Results Count */}
        {filteredCrops.length > 0 && (
          <div className="mt-8 text-center text-gray-600">
            Showing <span className="font-semibold">{filteredCrops.length}</span> crop{filteredCrops.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
