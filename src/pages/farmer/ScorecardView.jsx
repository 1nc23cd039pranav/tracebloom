import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../../services/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { getScoreLabel, getScoreColor } from '../../utils/scoreCalculator'
import { getScoreExplanation } from '../../services/gemini'
import { Award, HelpCircle, Lightbulb, BarChart3, Share2 } from 'lucide-react'
import ScoreBadge from '../../components/ScoreBadge'
import toast from 'react-hot-toast'

export default function ScorecardView() {
  const { cropId } = useParams()
  const navigate = useNavigate()
  const [crop, setCrop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showExplanation, setShowExplanation] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [explanationLoading, setExplanationLoading] = useState(false)

  useEffect(() => {
    const loadCrop = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'crops', cropId))
        if (docSnap.exists()) {
          setCrop({ id: cropId, ...docSnap.data() })
        }
      } catch (error) {
        console.error('Error loading crop:', error)
        toast.error('Failed to load crop scorecard')
      } finally {
        setLoading(false)
      }
    }
    loadCrop()
  }, [cropId])

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
      console.error('Error getting explanation:', error)
      toast.error('Failed to get explanation')
    } finally {
      setExplanationLoading(false)
    }
  }

  const handleListForSale = async () => {
    try {
      await updateDoc(doc(db, 'crops', cropId), {
        status: 'available'
      })
      setCrop(prev => ({ ...prev, status: 'available' }))
      toast.success('Crop listed for sale!')
    } catch (error) {
      console.error('Error updating crop:', error)
      toast.error('Failed to list crop')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading scorecard...</p>
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

  const scoreLabel = getScoreLabel(crop.score)
  const scoreColor = getScoreColor(crop.score)
  const maxScore = 100

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{crop.cropType} Scorecard</h1>
            <p className="text-gray-600">Complete farming performance analysis</p>
          </div>
          <button
            onClick={() => navigate('/farmer/dashboard')}
            className="text-gray-600 hover:text-gray-900 transition"
          >
            ← Back
          </button>
        </div>

        {/* Main Score Circle */}
        <div className="bg-white rounded-xl shadow-md p-12 mb-8 text-center score-circle">
          <div className={`w-48 h-48 rounded-full bg-${scoreColor}-100 mx-auto flex items-center justify-center mb-6`}>
            <div>
              <div className="text-6xl font-bold text-gray-900">{crop.score}</div>
              <div className="text-lg font-semibold text-gray-700">/100</div>
            </div>
          </div>
          <h2 className={`text-3xl font-bold mb-2 text-${scoreColor}-800`}>{scoreLabel}</h2>
          <p className="text-gray-600 max-w-lg mx-auto">
            Your crop demonstrates {scoreLabel.toLowerCase()} farming practices. The score is based on soil type, fertilizer use, seed quality, irrigation methods, and AI adoption.
          </p>
        </div>

        {/* Score Breakdown */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-farmer" />
            Score Breakdown
          </h2>
          <div className="space-y-4">
            {[
              { label: 'Soil Type', value: crop.scoreBreakdown.soil, max: 25 },
              { label: 'Fertilizer', value: crop.scoreBreakdown.fertilizer, max: 30 },
              { label: 'Seed Quality', value: crop.scoreBreakdown.seed, max: 25 },
              { label: 'Irrigation', value: crop.scoreBreakdown.irrigation, max: 10 },
              { label: 'AI Adoption', value: crop.scoreBreakdown.aiAdoption, max: 10 }
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-900">{item.label}</span>
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

        {/* Crop Image */}
        {crop.imageUrl && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <img src={crop.imageUrl} alt={crop.cropType} className="w-full h-96 object-cover" />
          </div>
        )}

        {/* AI Analysis */}
        {crop.geminiAnalysis && Object.keys(crop.geminiAnalysis).length > 0 && (
          <div className="space-y-4 mb-8">
            {/* Summary Card */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl shadow-md p-8 border border-blue-300">
              <h2 className="text-xl font-bold text-blue-900 mb-4">🔬 AI Crop Analysis Report</h2>
              
              {/* Score & Grade Grid */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                {crop.geminiAnalysis.qualityScore && (
                  <div className="bg-white rounded-lg p-4 text-center">
                    <p className="text-gray-600 text-xs">Quality Score</p>
                    <p className="text-2xl font-bold text-blue-900">{crop.geminiAnalysis.qualityScore}/10</p>
                  </div>
                )}
                {crop.geminiAnalysis.grade && (
                  <div className="bg-white rounded-lg p-4 text-center">
                    <p className="text-gray-600 text-xs">Grade</p>
                    <p className="text-2xl font-bold text-blue-900">{crop.geminiAnalysis.grade}</p>
                  </div>
                )}
                {crop.geminiAnalysis.overallHealth && (
                  <div className="bg-white rounded-lg p-4 text-center">
                    <p className="text-gray-600 text-xs">Health Status</p>
                    <p className="text-sm font-bold text-blue-900 capitalize">{crop.geminiAnalysis.overallHealth}</p>
                  </div>
                )}
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-gray-600 text-xs">Recommendation</p>
                  <p className="text-sm font-bold text-blue-900">
                    {crop.geminiAnalysis.qualityScore >= 8 ? '✅ Excellent' : crop.geminiAnalysis.qualityScore >= 6 ? '👍 Good' : '⚠️ Fair'}
                  </p>
                </div>
              </div>

              {/* Overall Analysis */}
              {crop.geminiAnalysis.analysis && (
                <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold text-blue-900">Analysis: </span>
                    {crop.geminiAnalysis.analysis}
                  </p>
                </div>
              )}
            </div>

            {/* Issues Section */}
            {crop.geminiAnalysis.issues && crop.geminiAnalysis.issues.length > 0 && (
              <div className="bg-red-50 rounded-xl shadow-md p-6 border border-red-200">
                <p className="text-red-900 font-bold mb-4 text-lg">🚨 Issues Detected:</p>
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
                <p className="text-green-900 font-bold mb-4 text-lg">💡 Improvement Suggestions (4 Key Actions):</p>
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

        {/* Score Explanation Modal Button */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <button
            onClick={() => {
              setShowExplanation(!showExplanation)
              if (!showExplanation && !explanation) {
                getExplanation()
              }
            }}
            className="flex items-center gap-2 text-farmer font-semibold hover:text-green-700 transition"
          >
            <HelpCircle className="w-5 h-5" />
            {showExplanation ? 'Hide' : 'Show'} Score Explanation
          </button>

          {showExplanation && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              {explanationLoading ? (
                <p className="text-gray-600">Loading explanation...</p>
              ) : (
                <p className="text-gray-700 leading-relaxed">{explanation}</p>
              )}
            </div>
          )}
        </div>

        {/* AI Recommendations */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <button
            onClick={() => navigate(`/farmer/recommendations/${cropId}`)}
            className="flex items-center gap-2 w-full justify-between p-4 hover:bg-green-50 transition rounded-lg border border-farmer"
          >
            <div className="flex items-center gap-2 text-farmer font-semibold">
              <Lightbulb className="w-5 h-5" />
              View AI Recommendations
            </div>
            <span className="text-farmer">→</span>
          </button>
        </div>

        {/* Actions */}
        <div className="bg-gradient-to-r from-farmer to-green-600 rounded-xl shadow-md p-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold mb-1">Ready to sell?</h3>
              <p className="opacity-90">List this crop on the marketplace</p>
            </div>
            {crop.status !== 'available' ? (
              <button
                onClick={handleListForSale}
                className="bg-white text-farmer px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition whitespace-nowrap"
              >
                List for Sale
              </button>
            ) : (
              <span className="px-6 py-3 bg-green-700 rounded-lg font-semibold">Listed ✓</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
