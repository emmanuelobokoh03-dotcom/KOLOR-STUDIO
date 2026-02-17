import { Sparkles } from 'lucide-react'

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-violet-600 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">Dashboard Coming Soon</h1>
          <p className="text-xl text-gray-600">
            The visual pipeline and lead management features are being built...
          </p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
