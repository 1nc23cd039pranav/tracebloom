import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, collection, doc, setDoc, getDoc, query, where, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export const seedDemoData = async () => {
  // Force reseed by clearing old flag (change version when updating demo data)
  const demoVersion = 'v2'
  if (localStorage.getItem(`demo_seeded_${demoVersion}`)) return

  const batch = writeBatch(db)
  const now = serverTimestamp()

  try {
    // Multiple Demo Farmers
    const farmers = [
      { id: 'demo_farmer_001', name: 'Rajesh Kumar', lat: 28.7041, lng: 77.1025, village: 'Dehli Village', district: 'Delhi' },
      { id: 'demo_farmer_002', name: 'Anil Singh', lat: 28.5244, lng: 77.1855, village: 'Noida Farm', district: 'Noida' },
      { id: 'demo_farmer_003', name: 'Harpreet Kaur', lat: 28.4595, lng: 77.2272, village: 'Gurgaon Fields', district: 'Gurgaon' },
      { id: 'demo_farmer_004', name: 'Vikram Patel', lat: 28.6692, lng: 77.4538, village: 'East Delhi', district: 'Delhi' }
    ]

    farmers.forEach(farmer => {
      batch.set(doc(db, 'users', farmer.id), {
        name: farmer.name,
        email: `${farmer.id}@demo.com`,
        role: 'farmer',
        location: {
          lat: farmer.lat,
          lng: farmer.lng,
          village: farmer.village,
          district: farmer.district
        },
        createdAt: now
      })
    })

    // Multiple Demo Suppliers
    const suppliers = [
      {
        id: 'demo_supplier_001',
        name: 'Express Logistics',
        companyName: 'Express Logistics Ltd',
        pricePerKg: 2.0,
        deliveryRadius: 50,
        reliabilityScore: 4.8,
        completionRate: 95,
        deliveryTimeHours: 24,
        lat: 28.6139,
        lng: 77.2090,
        city: 'New Delhi'
      },
      {
        id: 'demo_supplier_002',
        name: 'Green Routes',
        companyName: 'Agricultural Transport Co',
        pricePerKg: 2.2,
        deliveryRadius: 60,
        reliabilityScore: 4.5,
        completionRate: 92,
        deliveryTimeHours: 18,
        lat: 28.5355,
        lng: 77.3910,
        city: 'Noida'
      },
      {
        id: 'demo_supplier_003',
        name: 'Farm Connect',
        companyName: 'Farm Connect Services',
        pricePerKg: 1.8,
        deliveryRadius: 70,
        reliabilityScore: 4.7,
        completionRate: 96,
        deliveryTimeHours: 16,
        lat: 28.4089,
        lng: 77.0385,
        city: 'Gurgaon'
      }
    ]

    suppliers.forEach(sup => {
      // Create user document for supplier
      batch.set(doc(db, 'users', sup.id), {
        name: sup.name,
        email: `${sup.id}@demo.com`,
        role: 'middleman',
        companyName: sup.companyName,
        createdAt: now
      })
      
      // Create supplier document
      batch.set(doc(db, 'suppliers', sup.id), {
        uid: sup.id,
        name: sup.name,
        companyName: sup.companyName,
        pricePerKg: sup.pricePerKg,
        deliveryRadius: sup.deliveryRadius,
        reliabilityScore: sup.reliabilityScore,
        completionRate: sup.completionRate,
        deliveryTimeHours: sup.deliveryTimeHours,
        location: { lat: sup.lat, lng: sup.lng, city: sup.city },
        coverageAreas: ['Delhi', 'Noida', 'Gurgaon'],
        createdAt: now
      })
    })

    // Multiple Demo Buyers
    const buyers = [
      { id: 'demo_buyer_001', name: 'Priya Enterprises', lat: 28.5244, lng: 77.1855 },
      { id: 'demo_buyer_002', name: 'Agro Traders Ltd', lat: 28.6139, lng: 77.2090 }
    ]

    buyers.forEach(buyer => {
      batch.set(doc(db, 'users', buyer.id), {
        name: buyer.name,
        email: `${buyer.id}@demo.com`,
        role: 'buyer',
        location: { lat: buyer.lat, lng: buyer.lng, village: 'Market Area', district: 'Delhi' },
        createdAt: now
      })
    })

    // Multiple Demo Crops with variety
    const crops = [
      // Farmer 1 - Rajesh Kumar
      {
        farmerId: 'demo_farmer_001',
        farmerName: 'Rajesh Kumar',
        type: 'Wheat',
        soilType: 'loamy',
        fertilizerType: 'organic',
        seedQuality: 'high',
        irrigationType: 'drip',
        aiAdopted: true,
        imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500',
        score: 87,
        pricePerKg: 28,
        quantity: 500,
        lat: 28.7041,
        lng: 77.1025
      },
      {
        farmerId: 'demo_farmer_001',
        farmerName: 'Rajesh Kumar',
        type: 'Rice',
        soilType: 'clay',
        fertilizerType: 'chemical',
        seedQuality: 'medium',
        irrigationType: 'flood',
        aiAdopted: false,
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f70504c8a?w=500',
        score: 64,
        pricePerKg: 18,
        quantity: 800,
        lat: 28.7041,
        lng: 77.1025
      },
      {
        farmerId: 'demo_farmer_001',
        farmerName: 'Rajesh Kumar',
        type: 'Corn',
        soilType: 'sandy',
        fertilizerType: 'chemical',
        seedQuality: 'low',
        irrigationType: 'rainfed',
        aiAdopted: false,
        imageUrl: 'https://images.unsplash.com/photo-1585250230676-e1f3facda375?w=500',
        score: 42,
        pricePerKg: 12,
        quantity: 300,
        lat: 28.7041,
        lng: 77.1025
      },
      // Farmer 2 - Anil Singh
      {
        farmerId: 'demo_farmer_002',
        farmerName: 'Anil Singh',
        type: 'Tomato',
        soilType: 'loamy',
        fertilizerType: 'organic',
        seedQuality: 'high',
        irrigationType: 'drip',
        aiAdopted: true,
        imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcccf?w=500',
        score: 92,
        pricePerKg: 35,
        quantity: 400,
        lat: 28.5244,
        lng: 77.1855
      },
      {
        farmerId: 'demo_farmer_002',
        farmerName: 'Anil Singh',
        type: 'Onion',
        soilType: 'loamy',
        fertilizerType: 'mixed',
        seedQuality: 'high',
        irrigationType: 'drip',
        aiAdopted: true,
        imageUrl: 'https://images.unsplash.com/photo-1595424770541-49d6a90f2a99?w=500',
        score: 88,
        pricePerKg: 32,
        quantity: 600,
        lat: 28.5244,
        lng: 77.1855
      },
      // Farmer 3 - Harpreet Kaur
      {
        farmerId: 'demo_farmer_003',
        farmerName: 'Harpreet Kaur',
        type: 'Potato',
        soilType: 'loamy',
        fertilizerType: 'organic',
        seedQuality: 'high',
        irrigationType: 'drip',
        aiAdopted: true,
        imageUrl: 'https://images.unsplash.com/photo-1599599810694-f3f5c4f6d7ce?w=500',
        score: 89,
        pricePerKg: 22,
        quantity: 1000,
        lat: 28.4595,
        lng: 77.2272
      },
      {
        farmerId: 'demo_farmer_003',
        farmerName: 'Harpreet Kaur',
        type: 'Spinach',
        soilType: 'loamy',
        fertilizerType: 'organic',
        seedQuality: 'high',
        irrigationType: 'drip',
        aiAdopted: true,
        imageUrl: 'https://images.unsplash.com/photo-1599599810964-e9cad964c2d7?w=500',
        score: 91,
        pricePerKg: 38,
        quantity: 200,
        lat: 28.4595,
        lng: 77.2272
      },
      // Farmer 4 - Vikram Patel
      {
        farmerId: 'demo_farmer_004',
        farmerName: 'Vikram Patel',
        type: 'Carrot',
        soilType: 'sandy',
        fertilizerType: 'mixed',
        seedQuality: 'medium',
        irrigationType: 'flood',
        aiAdopted: false,
        imageUrl: 'https://images.unsplash.com/photo-1638662996302-d9a3cbea6ae2?w=500',
        score: 71,
        pricePerKg: 20,
        quantity: 500,
        lat: 28.6692,
        lng: 77.4538
      },
      {
        farmerId: 'demo_farmer_004',
        farmerName: 'Vikram Patel',
        type: 'Cucumber',
        soilType: 'loamy',
        fertilizerType: 'organic',
        seedQuality: 'high',
        irrigationType: 'drip',
        aiAdopted: true,
        imageUrl: 'https://images.unsplash.com/photo-1602313364178-f5a7f42c6c4d?w=500',
        score: 85,
        pricePerKg: 25,
        quantity: 300,
        lat: 28.6692,
        lng: 77.4538
      }
    ]

    crops.forEach((crop, idx) => {
      const cropId = `demo_crop_${String(idx + 1).padStart(3, '0')}`
      batch.set(doc(db, 'crops', cropId), {
        farmerId: crop.farmerId,
        farmerName: crop.farmerName,
        cropType: crop.type,
        soilType: crop.soilType,
        fertilizerType: crop.fertilizerType,
        seedQuality: crop.seedQuality,
        irrigationType: crop.irrigationType,
        aiAdopted: crop.aiAdopted,
        imageUrl: crop.imageUrl,
        geminiAnalysis: {
          qualityScore: Math.floor(crop.score / 10) + Math.floor(Math.random() * 3),
          issues: crop.score < 70 ? ['Quality concerns detected'] : [],
          suggestions: ['Monitor crop regularly', 'Continue current practices']
        },
        score: crop.score,
        scoreBreakdown: {
          soil: Math.floor(crop.score * 0.3),
          fertilizer: Math.floor(crop.score * 0.3),
          seed: Math.floor(crop.score * 0.2),
          irrigation: Math.floor(crop.score * 0.15),
          aiAdoption: crop.aiAdopted ? 10 : 0
        },
        status: 'available',
        pricePerKg: crop.pricePerKg,
        quantityKg: crop.quantity,
        harvestDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
        location: { lat: crop.lat, lng: crop.lng, village: 'Farm Village' },
        createdAt: now
      })
    })

    // Multiple Demo Orders in different statuses
    const orders = [
      { buyerId: 'demo_buyer_001', farmerId: 'demo_farmer_001', supplierId: 'demo_supplier_001', cropId: 'demo_crop_001', qty: 100, status: 'confirmed' },
      { buyerId: 'demo_buyer_001', farmerId: 'demo_farmer_001', supplierId: 'demo_supplier_002', cropId: 'demo_crop_002', qty: 150, status: 'in-transit' },
      { buyerId: 'demo_buyer_001', farmerId: 'demo_farmer_002', supplierId: 'demo_supplier_001', cropId: 'demo_crop_004', qty: 80, status: 'delivered' },
      { buyerId: 'demo_buyer_002', farmerId: 'demo_farmer_003', supplierId: 'demo_supplier_003', cropId: 'demo_crop_005', qty: 120, status: 'confirmed' },
      { buyerId: 'demo_buyer_002', farmerId: 'demo_farmer_004', supplierId: 'demo_supplier_002', cropId: 'demo_crop_008', qty: 90, status: 'pending' }
    ]

    orders.forEach((order, idx) => {
      const orderId = `demo_order_${String(idx + 1).padStart(3, '0')}`
      batch.set(doc(db, 'orders', orderId), {
        buyerId: order.buyerId,
        farmerId: order.farmerId,
        supplierId: order.supplierId,
        cropId: order.cropId,
        quantityKg: order.qty,
        totalPrice: order.qty * (20 + Math.random() * 20),
        status: order.status,
        route: { distance: 30 + Math.random() * 40, duration: 1 + Math.random() * 3, supplierId: order.supplierId },
        createdAt: now
      })
    })

    await batch.commit()
    localStorage.setItem('demo_seeded_v2', 'true')
    console.log('Demo data seeded successfully')
    console.log('📋 Demo Credentials:')
    console.log('Farmers: demo_farmer_001@demo.com to demo_farmer_004@demo.com (password: demo123)')
    console.log('Suppliers: demo_supplier_001@demo.com to demo_supplier_003@demo.com (password: demo123)')
    console.log('Buyers: demo_buyer_001@demo.com, demo_buyer_002@demo.com (password: demo123)')
    console.log('To use demo data: Register with these emails or register a new account')
  } catch (error) {
    console.error('Error seeding demo data:', error)
  }
}

export const logDemoCredentials = () => {
  console.log('📋 TRACEBLOOM DEMO CREDENTIALS:')
  console.log('================================')
  console.log('🌾 FARMERS:')
  console.log('  Email: demo_farmer_001@demo.com')
  console.log('  Password: demo123')
  console.log('')
  console.log('🚚 SUPPLIERS (Middleman):')
  console.log('  Email: demo_supplier_001@demo.com')
  console.log('  Password: demo123')
  console.log('')
  console.log('🛒 BUYERS:')
  console.log('  Email: demo_buyer_001@demo.com')
  console.log('  Password: demo123')
  console.log('')
  console.log('Note: If these accounts don\'t work, please register a new account')
  console.log('================================')
}
