import ScoreBadge from './ScoreBadge'

export default function CropCard({ crop, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow cursor-pointer overflow-hidden border border-gray-100"
    >
      <div className="aspect-video overflow-hidden bg-gray-200">
        <img
          src={crop.imageUrl}
          alt={crop.cropType}
          className="w-full h-full object-cover hover:scale-105 transition-transform"
        />
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-gray-900">{crop.cropType}</h3>
            <p className="text-sm text-gray-600">{crop.farmerName}</p>
          </div>
          <ScoreBadge score={crop.score} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-gray-600">Price</p>
            <p className="font-semibold text-gray-900">₹{crop.pricePerKg}/kg</p>
          </div>
          <div>
            <p className="text-gray-600">Quantity</p>
            <p className="font-semibold text-gray-900">{crop.quantityKg} kg</p>
          </div>
        </div>
      </div>
    </div>
  )
}
