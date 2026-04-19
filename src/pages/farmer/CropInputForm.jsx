import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, storage } from '../../services/firebase'
import { useAuth } from '../../context/AuthContext'
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { analyzeCropImage, getFarmingAdvice } from '../../services/gemini'
import { calculateScore } from '../../utils/scoreCalculator'
import toast from 'react-hot-toast'
import { ChevronRight, Upload, Loader } from 'lucide-react'

export default function CropInputForm() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [step, setStep] = useState(1)
  const [imagePreview, setImagePreview] = useState(null)
  const [analyzeLoading, setAnalyzeLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState(null)

  const [formData, setFormData] = useState({
    cropType: '',
    quantity: '',
    pricePerKg: '',
    harvestDate: '',
    soilType: 'loamy',
    fertilizerType: 'organic',
    seedQuality: 'high',
    irrigationType: 'drip',
    imageFile: null,
    aiAdopted: false
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB')
        return
      }
      
      setFormData(prev => ({
        ...prev,
        imageFile: file
      }))

      // Show preview immediately
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)

      // Auto-analyze image after upload
      autoAnalyzeImage(file)
    }
  }

  const autoAnalyzeImage = async (file) => {
    setAnalyzeLoading(true)
    toast.loading('Analyzing image...', { id: 'analyze' })
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const base64 = e.target.result.split(',')[1]
          // Pass cropType to get crop-specific fallback analysis
          const analysis = await analyzeCropImage(base64, file.type, formData.cropType || 'crop')
          setAiAnalysis(analysis)
          toast.dismiss('analyze')
          toast.success('Image analysis completed! ✅')
        } catch (error) {
          console.error('Error analyzing image:', error)
          toast.dismiss('analyze')
          toast.error('Analysis failed or timed out, using default')
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error in auto-analyze:', error)
      toast.dismiss('analyze')
      toast.error('Could not analyze image')
    } finally {
      setAnalyzeLoading(false)
    }
  }

  const validateStep = () => {
    if (step === 1) {
      if (!formData.cropType || !formData.quantity || !formData.pricePerKg || !formData.harvestDate) {
        toast.error('Please fill in all fields in Step 1')
        return false
      }
    } else if (step === 2) {
      // Step 2 is always valid (has defaults)
      return true
    } else if (step === 3) {
      if (!formData.imageFile) {
        toast.error('Please upload a crop image')
        return false
      }
      // Image analysis is optional - doesn't block submission
    }
    return true
  }

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1)
    }
  }

  const uploadImageInBackground = async (cropId, imageFile) => {
    try {
      const storageRef = ref(storage, `crops/${Date.now()}_${imageFile.name}`)
      await uploadBytes(storageRef, imageFile)
      const imageUrl = await getDownloadURL(storageRef)
      // Update crop with image URL
      await updateDoc(doc(db, 'crops', cropId), { imageUrl })
      console.log('Image uploaded successfully for crop:', cropId)
    } catch (error) {
      console.error('Background image upload failed:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateStep()) return

    setSubmitLoading(true)
    try {
      // Step 1: Calculate score immediately (no wait)
      toast.loading('Calculating score...', { id: 'calc' })
      const scoreResult = calculateScore({
        soilType: formData.soilType,
        fertilizerType: formData.fertilizerType,
        seedQuality: formData.seedQuality,
        irrigationType: formData.irrigationType,
        aiAdopted: formData.aiAdopted
      })
      toast.dismiss('calc')

      // Step 2: Prepare crop data
      const farmerName = currentUser?.email?.split('@')[0] || 'Farmer'
      const farmerLocation = 'Village, District'
      
      const cropData = {
        farmerId: currentUser.uid,
        farmerName: farmerName,
        cropType: formData.cropType,
        soilType: formData.soilType,
        fertilizerType: formData.fertilizerType,
        seedQuality: formData.seedQuality,
        irrigationType: formData.irrigationType,
        aiAdopted: formData.aiAdopted,
        imageUrl: '', // Will be updated in background
        geminiAnalysis: aiAnalysis || {},
        recommendations: [],
        score: scoreResult.total,
        scoreBreakdown: scoreResult.breakdown,
        status: 'available',
        pricePerKg: parseFloat(formData.pricePerKg),
        quantityKg: parseInt(formData.quantity),
        harvestDate: new Date(formData.harvestDate),
        location: {
          lat: 28.7041,
          lng: 77.1025,
          village: 'Farm Village'
        },
        createdAt: serverTimestamp()
      }

      // Step 3: Save crop to Firestore immediately
      toast.loading('Saving crop...', { id: 'save' })
      const docRef = await addDoc(collection(db, 'crops'), cropData)
      toast.dismiss('save')
      toast.success('Crop added successfully!')

      // Step 4: Upload image in background (non-blocking)
      if (formData.imageFile) {
        uploadImageInBackground(docRef.id, formData.imageFile)
      }

      // Step 5: Get farming advice in background (non-blocking)
      getFarmingAdvice({
        soilType: formData.soilType,
        fertilizerType: formData.fertilizerType,
        seedQuality: formData.seedQuality,
        irrigationType: formData.irrigationType,
        cropType: formData.cropType,
        location: farmerLocation
      })
        .then(recommendations => {
          if (recommendations && recommendations.length > 0) {
            updateDoc(doc(db, 'crops', docRef.id), {
              recommendations: recommendations
            })
          }
        })
        .catch(err => console.warn('Failed to get farming advice:', err))

      // Navigate to dashboard to see the crop immediately
      navigate('/farmer/dashboard')
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error('Failed to add crop: ' + error.message)
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Crop</h1>
          <p className="text-gray-600">Get an AI-powered score for your farm inputs</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 flex items-center gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                s <= step
                  ? 'bg-farmer text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {s}
              </div>
              {s < 3 && (
                <div className={`h-1 w-12 ${s < step ? 'bg-farmer' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-8">
          {/* Step 1: Crop Details */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Crop Details</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Crop Type</label>
                <input
                  type="text"
                  name="cropType"
                  value={formData.cropType}
                  onChange={handleChange}
                  placeholder="e.g., Wheat, Rice, Corn"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-farmer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity (kg)</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="500"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-farmer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price per KG (₹)</label>
                  <input
                    type="number"
                    name="pricePerKg"
                    value={formData.pricePerKg}
                    onChange={handleChange}
                    placeholder="25"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-farmer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Harvest Date</label>
                <input
                  type="date"
                  name="harvestDate"
                  value={formData.harvestDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-farmer"
                />
              </div>
            </div>
          )}

          {/* Step 2: Farming Inputs */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Farming Inputs</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Soil Type</label>
                  <select
                    name="soilType"
                    value={formData.soilType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-farmer"
                  >
                    <option value="loamy">Loamy</option>
                    <option value="clay">Clay</option>
                    <option value="sandy">Sandy</option>
                    <option value="silt">Silt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fertilizer Type</label>
                  <select
                    name="fertilizerType"
                    value={formData.fertilizerType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-farmer"
                  >
                    <option value="organic">Organic</option>
                    <option value="chemical">Chemical</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Seed Quality</label>
                  <select
                    name="seedQuality"
                    value={formData.seedQuality}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-farmer"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Irrigation Type</label>
                  <select
                    name="irrigationType"
                    value={formData.irrigationType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-farmer"
                  >
                    <option value="drip">Drip</option>
                    <option value="flood">Flood</option>
                    <option value="rainfed">Rainfed</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="aiAdopted"
                  checked={formData.aiAdopted}
                  onChange={handleChange}
                  className="w-5 h-5 text-farmer rounded"
                />
                <span className="text-gray-700 font-medium">I followed AI recommendations this season</span>
              </label>
            </div>
          )}

          {/* Step 3: Image Upload & AI Analysis */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Crop Image & AI Analysis</h2>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-farmer rounded-lg p-8 text-center cursor-pointer hover:bg-green-50 transition"
              >
                {imagePreview ? (
                  <div>
                    <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-cover mx-auto mb-4 rounded" />
                    <p className="text-gray-600 mb-2">Click to change image</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-12 h-12 text-farmer mx-auto mb-4" />
                    <p className="text-gray-700 font-medium mb-2">Upload crop image</p>
                    <p className="text-gray-600 text-sm">PNG, JPG up to 5MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />

              {analyzeLoading && (
                <div className="flex items-center justify-center gap-2 text-farmer font-semibold p-4 bg-green-50 rounded-lg">
                  <Loader className="w-5 h-5 animate-spin" />
                  Analyzing image with AI...
                </div>
              )}

              {aiAnalysis && (
                <div className="space-y-4">
                  {/* Summary Card */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-300">
                    <h3 className="font-bold text-blue-900 mb-4 text-lg">🔬 AI Crop Analysis Report</h3>
                    
                    {/* Score & Grade */}
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-600">Quality Score</p>
                        <p className="font-bold text-lg text-blue-900">{aiAnalysis.qualityScore}/10</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-600">Grade</p>
                        <p className="font-bold text-lg text-blue-900">{aiAnalysis.grade}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-600">Health Status</p>
                        <p className="font-bold text-sm text-blue-900 capitalize">{aiAnalysis.overallHealth}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-600">Recommendation</p>
                        <p className="font-bold text-sm text-blue-900">
                          {aiAnalysis.qualityScore >= 8 ? '✅ Excellent' : aiAnalysis.qualityScore >= 6 ? '👍 Good' : '⚠️ Fair'}
                        </p>
                      </div>
                    </div>

                    {/* Overall Analysis */}
                    {aiAnalysis.analysis && (
                      <div className="bg-white rounded-lg p-3 mb-4 border-l-4 border-blue-500">
                        <p className="text-sm text-gray-800">
                          <span className="font-semibold text-blue-900">Analysis: </span>
                          {aiAnalysis.analysis}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Issues Section */}
                  {aiAnalysis.issues && aiAnalysis.issues.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <p className="text-red-900 font-semibold mb-3">🚨 Issues Detected:</p>
                      <ul className="space-y-2">
                        {aiAnalysis.issues.map((issue, idx) => (
                          <li key={idx} className="text-sm text-red-800 flex gap-2">
                            <span className="text-red-500 font-bold">•</span>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggestions Section */}
                  {aiAnalysis.suggestions && aiAnalysis.suggestions.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="text-green-900 font-semibold mb-3">💡 Improvement Suggestions (4 Key Actions):</p>
                      <div className="space-y-3">
                        {aiAnalysis.suggestions.map((sug, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-3 border-l-4 border-green-500">
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
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
              >
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 bg-farmer text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitLoading}
                className="flex-1 bg-farmer text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Submitting (please wait)...
                  </>
                ) : (
                  'Submit Crop'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
