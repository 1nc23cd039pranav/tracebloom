import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { setDoc, doc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../../services/firebase'
import toast from 'react-hot-toast'
import { Leaf } from 'lucide-react'

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'farmer',
    village: '',
    district: '',
    companyName: '',
    coverageAreas: '',
    pricePerKg: '',
    deliveryRadius: ''
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.fullName || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      const uid = userCredential.user.uid

      let userData = {
        name: formData.fullName,
        email: formData.email,
        role: formData.role,
        createdAt: serverTimestamp()
      }

      if (formData.role === 'farmer') {
        userData.location = {
          lat: 28.7041,
          lng: 77.1025,
          village: formData.village,
          district: formData.district
        }
      } else if (formData.role === 'middleman') {
        userData.companyName = formData.companyName
        userData.pricePerKg = parseFloat(formData.pricePerKg)
        userData.deliveryRadius = parseFloat(formData.deliveryRadius)
        userData.coverageAreas = formData.coverageAreas.split(',').map(area => area.trim())
        userData.location = {
          lat: 28.6139,
          lng: 77.2090,
          city: formData.companyName
        }
        
        // Also create supplier document
        const supplierData = {
          uid: uid,
          name: formData.companyName,
          companyName: formData.companyName,
          pricePerKg: parseFloat(formData.pricePerKg),
          deliveryRadius: parseFloat(formData.deliveryRadius),
          coverageAreas: formData.coverageAreas.split(',').map(area => area.trim()),
          reliabilityScore: 5.0,
          completionRate: 100,
          deliveryTimeHours: 24,
          location: {
            lat: 28.6139,
            lng: 77.2090,
            city: formData.companyName
          },
          createdAt: serverTimestamp()
        }
        try {
          await setDoc(doc(db, 'suppliers', uid), supplierData)
          console.log('Supplier document created successfully for:', uid)
        } catch (supplierError) {
          console.error('Failed to create supplier document:', supplierError)
          toast.error('Warning: Supplier profile not fully created')
        }
      } else if (formData.role === 'buyer') {
        userData.location = {
          lat: 28.5244,
          lng: 77.1855,
          village: 'Buyer Location',
          district: 'Delhi'
        }
      }

      await setDoc(doc(db, 'users', uid), userData)

      toast.success('Registration successful!')
      navigate(`/${formData.role}/dashboard`)
    } catch (error) {
      console.error('Registration error:', error)
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Email already in use')
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Invalid email address')
      } else {
        toast.error('Registration failed: ' + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const isFarmer = formData.role === 'farmer'
  const isMiddleman = formData.role === 'middleman'

  return (
    <div className="min-h-screen bg-gradient-to-br from-farmer to-green-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Leaf className="w-8 h-8 text-farmer" />
          <h1 className="text-2xl font-bold text-gray-900">Tracebloom</h1>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
        <p className="text-gray-600 mb-6">Join the agricultural revolution</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Your full name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-farmer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-farmer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-farmer"
            >
              <option value="farmer">Farmer</option>
              <option value="middleman">Middleman (Supplier)</option>
              <option value="buyer">Buyer</option>
            </select>
          </div>

          {isFarmer && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Village</label>
                <input
                  type="text"
                  name="village"
                  value={formData.village}
                  onChange={handleChange}
                  placeholder="Your village"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-farmer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  placeholder="Your district"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-farmer"
                />
              </div>
            </>
          )}

          {isMiddleman && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Your company name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-farmer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price Per KG (₹)</label>
                <input
                  type="number"
                  name="pricePerKg"
                  value={formData.pricePerKg}
                  onChange={handleChange}
                  placeholder="25"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-farmer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Radius (km)</label>
                <input
                  type="number"
                  name="deliveryRadius"
                  value={formData.deliveryRadius}
                  onChange={handleChange}
                  placeholder="50"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-farmer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coverage Areas (comma separated)</label>
                <input
                  type="text"
                  name="coverageAreas"
                  value={formData.coverageAreas}
                  onChange={handleChange}
                  placeholder="Delhi, Noida, Gurgaon"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-farmer"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-farmer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-farmer"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-farmer text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-farmer font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}
