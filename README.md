# Tracebloom - AI-Driven Farmer-Buyer Integrated Supply Chain Platform

A complete working prototype of an AI-powered agricultural supply chain platform connecting farmers, suppliers, and buyers through intelligent pricing, quality scoring, and optimized logistics.

## 🚀 Features

## For Farmers
- ✅ Multi-step crop input form with AI validation
- 📊 AI-powered crop scoring (0-100 scale)
- 🖼️ Crop image analysis using Gemini Vision
- 💡 Personalized farming recommendations
- 📈 Score trend tracking and analytics
- 📋 Dashboard with crop management

## For Suppliers/Middlemen
- 🚚 Order management and tracking
- 📍 Google Maps integration for route optimization
- 📊 Price comparison analytics
- ⭐ Reliability metrics and performance tracking
- 📦 Delivery radius and coverage management

## For Buyers
- 🛒 Real-time crop marketplace
- 🔍 Advanced filtering (score, price, crop type)
- 👨‍🌾 Detailed farmer profiles with quality breakdown
- 📦 Smart supplier picker with route visualization
- 📦 Order tracking and confirmation

## 🏗️ Project Structure

```
src/
├── main.jsx                    # Entry point
├── App.jsx                     # Main routing
├── index.css                   # Global styles
├── services/
│   ├── firebase.js            # Firebase config & Firestore
│   ├── gemini.js              # Gemini AI integration
│   └── maps.js                # Google Maps API
├── context/
│   ├── AuthContext.jsx        # Authentication state
│   └── ThemeContext.jsx       # Theme management
├── utils/
│   └── scoreCalculator.js    # Score calculation logic
├── components/
│   ├── Navbar.jsx
│   ├── PrivateRoute.jsx
│   ├── ScoreBadge.jsx
│   ├── CropCard.jsx
│   ├── SupplierCard.jsx
│   └── LoadingSpinner.jsx
└── pages/
    ├── Landing.jsx
    ├── Auth/
    │   ├── Login.jsx
    │   └── Register.jsx
    ├── farmer/
    │   ├── FarmerDashboard.jsx
    │   ├── CropInputForm.jsx
    │   ├── ScorecardView.jsx
    │   └── AIRecommendations.jsx
    ├── middleman/
    │   ├── SupplierDashboard.jsx
    │   └── RouteMapView.jsx
    └── buyer/
        ├── BuyerDashboard.jsx
        ├── Marketplace.jsx
        ├── FarmerProfile.jsx
        ├── SupplierPicker.jsx
        └── OrderConfirmation.jsx
```

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, React Router v6, TailwindCSS
- **Backend:** Firebase (Auth, Firestore, Storage)
- **AI:** Google Gemini 1.5 Flash
- **Maps:** Google Maps JS API
- **Charts:** Recharts
- **Icons:** Lucide React
- **Notifications:** React Hot Toast

## 📋 Setup Instructions
## Prerequisites
- Node.js 16+ and npm/yarn
- Firebase project
- Google Cloud project with APIs enabled:
  - Gemini API
  - Maps JavaScript API
  - Routes API

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Create `.env` file** with your API credentials:
```bash
cp .env.example .env
```

Add your keys:
```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_KEY=your_gemini_api_key
VITE_MAPS_KEY=your_google_maps_api_key
```

3. **Start development server:**
```bash
npm run dev
```

The app will open at `http://localhost:5173`

4. **Build for production:**
```bash
npm run build
```

## 📊 Database Schema

### Collections

**users/{uid}**
- name, email, role (farmer/middleman/buyer)
- location, createdAt

**crops/{cropId}**
- farmerId, farmerName, cropType
- soilType, fertilizerType, seedQuality, irrigationType
- aiAdopted, imageUrl, geminiAnalysis
- score, scoreBreakdown, status
- pricePerKg, quantityKg, harvestDate, location

**suppliers/{supplierId}**
- uid, name, companyName
- pricePerKg, deliveryRadius
- reliabilityScore, completionRate, deliveryTimeHours
- location, coverageAreas

**orders/{orderId}**
- buyerId, farmerId, supplierId, cropId
- quantityKg, totalPrice, status
- route (distance, duration), createdAt

## 🎨 UI/UX

- Mobile-first responsive design
- Color theme:
  - Farmer (Green): `#16a34a`
  - Supplier (Orange): `#d97706`
  - Buyer (Blue): `#2563eb`
- Real-time updates with Firestore listeners
- Loading states and error handling
- Toast notifications for all interactions

## ✨ Key Features Implemented

### Scoring System
- Weighted calculation across 5 dimensions
- Soil, fertilizer, seed, irrigation, AI adoption
- Color-coded badges (Excellent/Good/Average/Poor)

### AI Integration
1. **Crop Image Analysis** - Detects quality, grade, issues
2. **Farming Recommendations** - Context-aware suggestions
3. **Score Explanations** - Natural language feedback

### Real-time Features
- Marketplace updates when new crops listed
- Order status tracking live
- Firestore onSnapshot listeners throughout

### Maps Integration
- Multi-marker visualization
- Route optimization with directions API
- Distance and time calculations
- Fallback to text if maps unavailable

## 🔐 Authentication & Authorization

- Firebase email/password auth
- Role-based access control (RBAC)
- PrivateRoute guards on protected pages
- Automatic role detection on login

## 📝 Demo Data

The app seeds demo data on first run:
- 1 demo farmer with 3 crops (scores: 87, 64, 42)
- 2 demo suppliers
- 1 demo buyer
- 2 sample orders

## 🚀 Deployment

### Build
```bash
npm run build
```

### Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 📖 Usage

### For Farmers
1. Register as Farmer
2. Go to "Add New Crop"
3. Fill 3-step form with crop details
4. Upload crop image for AI analysis
5. View score and recommendations
6. List crop for sale

### For Buyers
1. Register as Buyer
2. Browse marketplace with filters
3. Click crop to view farmer profile
4. Select supplier for delivery
5. Confirm order and track

### For Suppliers
1. Register as Middleman
2. View active orders
3. Use Map View for route optimization
4. Update delivery status
5. Track performance metrics

## 🐛 Error Handling

- Try/catch blocks on all async operations
- User-friendly error messages via toast
- Fallback UI for failed API calls
- Input validation on forms
- File size validation for images (< 5MB)

## 🔄 Future Enhancements

- Payment integration (Stripe/PayPal)
- SMS/Email notifications
- Advanced analytics dashboard
- Farmer network/community features
- Seasonal pricing predictions
- Quality certification system
- Multi-language support

## 📄 License

MIT License - feel free to use this project for learning and commercial purposes.

## 👨‍💻 Support

For issues or questions:
1. Check the component documentation
2. Review Firestore rules in Firebase Console
3. Verify all environment variables are set
4. Check browser console for errors

---

Built with ❤️ using React, Firebase & Gemini AI
