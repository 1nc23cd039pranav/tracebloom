import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { db } from '../../services/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { getFarmingAdvice } from '../../services/gemini'
import { AlertCircle, CheckCircle, TrendingUp, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

const categoryIcons = {
  soil: AlertCircle,
  fertilizer: TrendingUp,
  irrigation: Zap,
  seed: CheckCircle,
  general: TrendingUp
}

const priorityColors = {
  high: 'bg-red-100 text-red-800 border-red-300',
  medium: 'bg-amber-100 text-amber-800 border-amber-300',
  low: 'bg-green-100 text-green-800 border-green-300'
}

export default function AIRecommendations() {
  const { cropId } = useParams()
  const [crop, setCrop] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [adoptedRecommendations, setAdoptedRecommendations] = useState(new Set())

  useEffect(() => {
    const loadData = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'crops', cropId))
        if (docSnap.exists()) {
          const cropData = { id: cropId, ...docSnap.data() }
          setCrop(cropData)

          const recs = await getFarmingAdvice({
            soilType: cropData.soilType,
            fertilizerType: cropData.fertilizerType,
            seedQuality: cropData.seedQuality,
            irrigationType: cropData.irrigationType,
            cropType: cropData.cropType,
            location: cropData.location?.village || 'Farm'
          })
          setRecommendations(recs)
        }
      } catch (error) {
        console.error('Error loading recommendations:', error)
        toast.error('Failed to load recommendations')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [cropId])

  const handleAdoptRecommendation = async (index) => {
    try {
      const newAdopted = new Set(adoptedRecommendations)
      if (newAdopted.has(index)) {
        newAdopted.delete(index)
      } else {
        newAdopted.add(index)
      }
      setAdoptedRecommendations(newAdopted)

      // Update in Firestore
      await updateDoc(doc(db, 'crops', cropId), {
        aiAdopted: newAdopted.size > 0
      })

      const action = newAdopted.has(index) ? 'adopted' : 'removed'
      toast.success(`Recommendation ${action}`)
    } catch (error) {
      console.error('Error updating recommendation:', error)
      toast.error('Failed to update recommendation')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading recommendations...</p>
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Recommendations</h1>
          <p className="text-gray-600">{crop.cropType} - Smart farming suggestions tailored for your crop</p>
        </div>

        {/* Recommendations Grid */}
        {recommendations.length > 0 ? (
          <div className="grid gap-6">
            {recommendations.map((rec, idx) => {
              const Icon = categoryIcons[rec.category] || TrendingUp
              const isAdopted = adoptedRecommendations.has(idx)

              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-farmer hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <Icon className="w-6 h-6 text-farmer mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{rec.title}</h3>
                        <p className="text-gray-700 text-sm leading-relaxed">{rec.description}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border whitespace-nowrap ml-4 ${priorityColors[rec.priority] || priorityColors.medium}`}>
                      {rec.priority?.charAt(0).toUpperCase() + rec.priority?.slice(1)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-xs text-gray-600 uppercase tracking-wide">{rec.category}</span>
                    <button
                      onClick={() => handleAdoptRecommendation(idx)}
                      className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
                        isAdopted
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      {isAdopted ? 'Adopted' : 'Mark as Adopted'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-gray-600 mb-4">No recommendations available at this time.</p>
            <p className="text-gray-500 text-sm">Try updating your crop details for new suggestions.</p>
          </div>
        )}

        {/* Summary */}
        {adoptedRecommendations.size > 0 && (
          <div className="mt-8 bg-green-50 rounded-xl shadow-sm p-6 border border-green-200">
            <h3 className="font-bold text-green-900 mb-2">Progress</h3>
            <p className="text-green-800">
              You have adopted <span className="font-semibold">{adoptedRecommendations.size}</span> of <span className="font-semibold">{recommendations.length}</span> recommendations. Keep implementing these practices to improve your score!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
