import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../../services/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { getScoreLabel } from '../../utils/scoreCalculator'
import ScoreBadge from '../../components/ScoreBadge'
import { getScoreExplanation } from '../../services/gemini'
import { User, MapPin, Award } from 'lucide-react'
import toast from 'react-hot-toast'

export default function FarmerProfile() {
  const { farmerId, cropId } = useParams()
  const navigate = useNavigate()
  const [farmer, setFarmer] = useState(null)
  const [crop, setCrop] = useState(null)
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(true)
  const [explanationLoading, setExplanationLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load crop
        const cropDoc = await getDoc(doc(db, 'crops', cropId))
        if (cropDoc.exists()) {
          setCrop({ id: cropId, ...cropDoc.data() })
        }

        // Load farmer
        const farmerDoc = await getDoc(doc(db, 'users', farmerId))
        if (farmerDoc.exists()) {
          setFarmer({ id: farmerId, ...farmerDoc.data() })
        }
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [farmerId, cropId])

  const getExplanation = async () => {
    if (explanation) return
    setExplanationLoading(true)
    try {
      const text = await getScoreExplanation(crop.scoreBreakdown, {
        soilType: crop.soilType,
        fertilizerType: crop.fertilizerType,
        seedQuality: crop.seedQuality,
        irrigationType: crop.irrigationType
      })
      setExplanation(text)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setExplanationLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading farmer profile...</p>
      </div>
    )
  }

  if (!farmer || !crop) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Profile not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate('/buyer/marketplace')}
          className="text-buyer hover:underline mb-6 font-medium"
        >
          ← Back to Marketplace
        </button>

        {/* Crop Image */}
        {crop.imageUrl && (
          <div className="mb-8">
            <img src={crop.imageUrl} alt={crop.cropType} className="w-full h-96 object-cover rounded-xl shadow-md" />
          </div>
        )}

        {/* Farmer Profile Card */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-farmer/10 flex items-center justify-center">
                <User className="w-8 h-8 text-farmer" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{farmer.name}</h1>
                <p className="text-gray-600 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {farmer.location?.village || 'Unknown'}, {farmer.location?.district || ''}
                </p>
              </div>
            </div>
            <ScoreBadge score={crop.score} />
          </div>
        </div>

        {/* Crop Details */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{crop.cropType}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-gray-600 text-sm mb-1">Price per KG</p>
              <p className="text-2xl font-bold text-gray-900">₹{crop.pricePerKg}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Quantity</p>
              <p className="text-2xl font-bold text-gray-900">{crop.quantityKg}kg</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Harvest Date</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(crop.harvestDate?.toDate?.() || crop.harvestDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Price</p>
              <p className="text-2xl font-bold text-buyer">₹{crop.pricePerKg * crop.quantityKg}</p>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-farmer" />
            Quality Breakdown
          </h2>
          <div className="space-y-4">
            {[
              { label: 'Soil Type', value: crop.scoreBreakdown.soil, max: 25, type: crop.soilType },
              { label: 'Fertilizer', value: crop.scoreBreakdown.fertilizer, max: 30, type: crop.fertilizerType },
              { label: 'Seed Quality', value: crop.scoreBreakdown.seed, max: 25, type: crop.seedQuality },
              { label: 'Irrigation', value: crop.scoreBreakdown.irrigation, max: 10, type: crop.irrigationType },
              { label: 'AI Adoption', value: crop.scoreBreakdown.aiAdoption, max: 10, type: crop.aiAdopted ? 'Yes' : 'No' }
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-600">{item.type}</p>
                  </div>
                  <span className="font-semibold text-farmer">{item.value}/{item.max}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-farmer h-2 rounded-full"
                    style={{ width: `${(item.value / item.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Score Explanation */}
        <div className="bg-blue-50 rounded-xl shadow-md p-8 mb-8 border border-blue-200">
          <button
            onClick={getExplanation}
            className="text-blue-900 font-semibold hover:text-blue-700 transition mb-4"
          >
            {explanation ? 'Hide' : 'Show'} Score Explanation
          </button>
          {explanation && (
            <p className="text-gray-700 leading-relaxed text-sm">
              {explanationLoading ? 'Loading...' : explanation}
            </p>
          )}
        </div>

        {/* AI Analysis Results */}
        {crop.geminiAnalysis && Object.keys(crop.geminiAnalysis).length > 0 && (
          <div className="space-y-4 mb-8">
            {/* Summary Card */}
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl shadow-md p-8 border border-purple-300">
              <h2 className="text-xl font-bold text-purple-900 mb-4">🔬 AI Quality Analysis</h2>
              
              {/* Score & Grade Grid */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                {crop.geminiAnalysis.qualityScore && (
                  <div className="bg-white rounded-lg p-4 text-center">
                    <p className="text-gray-600 text-xs">Quality Score</p>
                    <p className="text-2xl font-bold text-purple-900">{crop.geminiAnalysis.qualityScore}/10</p>
                  </div>
                )}
                {crop.geminiAnalysis.grade && (
                  <div className="bg-white rounded-lg p-4 text-center">
                    <p className="text-gray-600 text-xs">Grade</p>
                    <p className="text-2xl font-bold text-purple-900">{crop.geminiAnalysis.grade}</p>
                  </div>
                )}
                {crop.geminiAnalysis.overallHealth && (
                  <div className="bg-white rounded-lg p-4 text-center">
                    <p className="text-gray-600 text-xs">Health Status</p>
                    <p className="text-sm font-bold text-purple-900 capitalize">{crop.geminiAnalysis.overallHealth}</p>
                  </div>
                )}
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-gray-600 text-xs">Recommendation</p>
                  <p className="text-sm font-bold text-purple-900">
                    {crop.geminiAnalysis.qualityScore >= 8 ? '✅ Premium' : crop.geminiAnalysis.qualityScore >= 6 ? '👍 Good' : '⚠️ Fair'}
                  </p>
                </div>
              </div>

              {/* Overall Analysis */}
              {crop.geminiAnalysis.analysis && (
                <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500">
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold text-purple-900">Analysis: </span>
                    {crop.geminiAnalysis.analysis}
                  </p>
                </div>
              )}
            </div>

            {/* Issues Section */}
            {crop.geminiAnalysis.issues && crop.geminiAnalysis.issues.length > 0 && (
              <div className="bg-red-50 rounded-xl shadow-md p-6 border border-red-200">
                <p className="text-red-900 font-bold mb-3">🚨 Issues Detected:</p>
                <ul className="space-y-2">
                  {crop.geminiAnalysis.issues.map((issue, idx) => (
                    <li key={idx} className="text-sm text-red-800 flex gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions Section - 4 Steps */}
            {crop.geminiAnalysis.suggestions && crop.geminiAnalysis.suggestions.length > 0 && (
              <div className="bg-green-50 rounded-xl shadow-md p-6 border border-green-200">
                <p className="text-green-900 font-bold mb-4">💡 Improvement Suggestions:</p>
                <div className="space-y-3">
                  {crop.geminiAnalysis.suggestions.map((sug, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                      <p className="text-sm text-gray-800">
                        <span className="font-bold text-green-700">Step {idx + 1}: </span>
                        {sug}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-buyer to-blue-600 rounded-xl shadow-md p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">Ready to order?</h3>
              <p className="opacity-90">Choose a supplier to arrange delivery</p>
            </div>
            <button
              onClick={() => navigate(`/buyer/supplier-picker/${crop.id}`)}
              className="bg-white text-buyer px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition whitespace-nowrap"
            >
              Select Supplier
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
