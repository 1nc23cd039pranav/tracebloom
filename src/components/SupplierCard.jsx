export default function SupplierCard({ supplier, isSelected, onSelect }) {
  const renderStars = (score) => {
    return [...Array(5)].map((_, i) => (
      <span key={i} className={i < Math.round(score) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
    ))
  }

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-farmer bg-green-50'
          : 'border-gray-200 hover:border-farmer'
      }`}
    >
      <h3 className="font-bold text-gray-900 mb-2">{supplier.companyName}</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Price/KG</span>
          <span className="font-semibold">₹{supplier.pricePerKg}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Rating</span>
          <div className="flex gap-0.5">
            {renderStars(supplier.reliabilityScore)}
          </div>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Delivery Time</span>
          <span className="font-semibold">{supplier.deliveryTimeHours}h</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Coverage</span>
          <span className="font-semibold">{supplier.deliveryRadius}km</span>
        </div>
        <div className="pt-2">
          <p className="text-gray-600 text-xs">Areas: {supplier.coverageAreas.join(', ')}</p>
        </div>
      </div>
    </div>
  )
}
