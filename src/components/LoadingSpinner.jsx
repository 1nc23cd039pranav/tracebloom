import { Loader } from 'lucide-react'

export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <Loader className="w-12 h-12 text-farmer animate-spin mb-4" />
      <p className="text-gray-600 font-medium">{text}</p>
    </div>
  )
}
