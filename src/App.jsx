import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import PrivateRoute from './components/PrivateRoute'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'

// Farmer Pages
import FarmerDashboard from './pages/farmer/FarmerDashboard'
import CropInputForm from './pages/farmer/CropInputForm'
import ScorecardView from './pages/farmer/ScorecardView'
import AIRecommendations from './pages/farmer/AIRecommendations'

// Middleman Pages
import SupplierDashboard from './pages/middleman/SupplierDashboard'
import RouteMapView from './pages/middleman/RouteMapView'

// Buyer Pages
import BuyerDashboard from './pages/buyer/BuyerDashboard'
import Marketplace from './pages/buyer/Marketplace'
import FarmerProfile from './pages/buyer/FarmerProfile'
import SupplierPicker from './pages/buyer/SupplierPicker'
import OrderConfirmation from './pages/buyer/OrderConfirmation'

// Seed demo data
import { seedDemoData } from './services/firebase'

export default function App() {
  // Seed demo data on app load (only once)
  React.useEffect(() => {
    seedDemoData()
  }, [])

  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Farmer Routes */}
              <Route
                path="/farmer/dashboard"
                element={
                  <PrivateRoute requiredRole="farmer">
                    <FarmerDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/farmer/add-crop"
                element={
                  <PrivateRoute requiredRole="farmer">
                    <CropInputForm />
                  </PrivateRoute>
                }
              />
              <Route
                path="/farmer/scorecard/:cropId"
                element={
                  <PrivateRoute requiredRole="farmer">
                    <ScorecardView />
                  </PrivateRoute>
                }
              />
              <Route
                path="/farmer/recommendations/:cropId"
                element={
                  <PrivateRoute requiredRole="farmer">
                    <AIRecommendations />
                  </PrivateRoute>
                }
              />

              {/* Middleman Routes */}
              <Route
                path="/middleman/dashboard"
                element={
                  <PrivateRoute requiredRole="middleman">
                    <SupplierDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/middleman/map"
                element={
                  <PrivateRoute requiredRole="middleman">
                    <RouteMapView />
                  </PrivateRoute>
                }
              />

              {/* Buyer Routes */}
              <Route
                path="/buyer/dashboard"
                element={
                  <PrivateRoute requiredRole="buyer">
                    <BuyerDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/buyer/marketplace"
                element={
                  <PrivateRoute requiredRole="buyer">
                    <Marketplace />
                  </PrivateRoute>
                }
              />
              <Route
                path="/buyer/farmer/:farmerId/:cropId"
                element={
                  <PrivateRoute requiredRole="buyer">
                    <FarmerProfile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/buyer/supplier-picker/:cropId"
                element={
                  <PrivateRoute requiredRole="buyer">
                    <SupplierPicker />
                  </PrivateRoute>
                }
              />
              <Route
                path="/buyer/order-confirmation"
                element={
                  <PrivateRoute requiredRole="buyer">
                    <OrderConfirmation />
                  </PrivateRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Toaster position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

import React from 'react'
