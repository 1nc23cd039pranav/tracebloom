import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import { LogOut, Leaf } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { currentUser, userRole } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      toast.success('Logged out successfully')
      navigate('/')
    } catch (error) {
      toast.error('Failed to logout')
    }
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-farmer">
          <Leaf className="w-6 h-6" />
          tracebloom
        </Link>

        <div className="flex items-center gap-6">
          {currentUser ? (
            <>
              <div className="flex items-center gap-4 text-sm">
                {userRole === 'farmer' && (
                  <>
                    <Link to="/farmer/dashboard" className="text-gray-700 hover:text-farmer transition">
                      Dashboard
                    </Link>
                    <Link to="/farmer/add-crop" className="text-gray-700 hover:text-farmer transition">
                      Add Crop
                    </Link>
                  </>
                )}
                {userRole === 'middleman' && (
                  <>
                    <Link to="/middleman/dashboard" className="text-gray-700 hover:text-farmer transition">
                      Dashboard
                    </Link>
                    <Link to="/middleman/map" className="text-gray-700 hover:text-farmer transition">
                      Map View
                    </Link>
                  </>
                )}
                {userRole === 'buyer' && (
                  <>
                    <Link to="/buyer/dashboard" className="text-gray-700 hover:text-farmer transition">
                      Dashboard
                    </Link>
                    <Link to="/buyer/marketplace" className="text-gray-700 hover:text-farmer transition">
                      Marketplace
                    </Link>
                  </>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-700 hover:text-farmer transition">
                Login
              </Link>
              <Link to="/register" className="bg-farmer text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
