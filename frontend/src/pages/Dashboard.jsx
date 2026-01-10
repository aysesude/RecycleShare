import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiLogOut, FiUser, FiMail, FiPhone, FiCalendar, FiShield } from 'react-icons/fi'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-eco-50 via-white to-emerald-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-eco-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-eco-gradient rounded-xl flex items-center justify-center">
                <span className="text-xl">🌿</span>
              </div>
              <span className="text-xl font-bold text-emerald-700">RecycleShare</span>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.firstName}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-eco-gradient flex items-center justify-center text-white text-sm font-bold">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </div>
                )}
                <span className="text-gray-700 font-medium">{user?.firstName}</span>
              </div>
              {/* Admin Panel Button - only for admins */}
              {user?.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  className="btn btn-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-none hover:from-emerald-600 hover:to-teal-600"
                >
                  <FiShield className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">Admin Panel</span>
                </button>
              )}
              <button
                onClick={handleLogout}
                className="btn btn-ghost btn-sm text-gray-600 hover:text-red-500 hover:bg-red-50"
              >
                <FiLogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="eco-card p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Welcome back, {user?.firstName}! 👋
              </h1>
              <p className="text-gray-600">
                Ready to make a difference today? Start sharing and recycling!
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full">
                <FiShield className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {user?.isVerified ? 'Verified Account' : 'Pending Verification'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="eco-card p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FiUser className="text-emerald-500" />
              Profile Information
            </h2>

            <div className="flex flex-col items-center mb-6">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.firstName}
                  className="w-24 h-24 rounded-full border-4 border-eco-100 mb-4"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-eco-gradient flex items-center justify-center text-white text-3xl font-bold mb-4">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
              )}
              <h3 className="text-xl font-semibold text-gray-800">
                {user?.firstName} {user?.lastName}
              </h3>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mt-2 capitalize">
                {user?.role}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-600">
                <FiMail className="w-5 h-5 text-emerald-500" />
                <span className="text-sm">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <FiPhone className="w-5 h-5 text-emerald-500" />
                <span className="text-sm">{user?.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <FiCalendar className="w-5 h-5 text-emerald-500" />
                <span className="text-sm">
                  Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                  }) : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="eco-card p-6 h-full">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                🎯 Quick Actions
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={() => navigate('/listings')} className="flex items-center gap-4 p-4 bg-eco-50 rounded-xl hover:bg-eco-100 transition-colors group">
                  <div className="w-12 h-12 bg-eco-gradient rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    ♻️
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-800">Start Recycling</h3>
                    <p className="text-sm text-gray-500">Share recyclable items</p>
                  </div>
                </button>

                <button onClick={() => navigate('/browse')} className="flex items-center gap-4 p-4 bg-eco-50 rounded-xl hover:bg-eco-100 transition-colors group">
                  <div className="w-12 h-12 bg-eco-gradient rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    🔍
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-800">Browse Items</h3>
                    <p className="text-sm text-gray-500">Find items near you</p>
                  </div>
                </button>

                <button onClick={() => navigate('/impact')} className="flex items-center gap-4 p-4 bg-eco-50 rounded-xl hover:bg-eco-100 transition-colors group">
                  <div className="w-12 h-12 bg-eco-gradient rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    📊
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-800">View Impact</h3>
                    <p className="text-sm text-gray-500">See your eco stats</p>
                  </div>
                </button>

                <button onClick={() => navigate('/community')} className="flex items-center gap-4 p-4 bg-eco-50 rounded-xl hover:bg-eco-100 transition-colors group">
                  <div className="w-12 h-12 bg-eco-gradient rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    👥
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-800">Community</h3>
                    <p className="text-sm text-gray-500">Connect with others</p>
                  </div>
                </button>
              </div>

              {/* Stats Preview */}
              <div className="mt-6 p-4 bg-gradient-to-r from-emerald-500 to-eco-500 rounded-xl text-white">
                <h3 className="font-semibold mb-3">🌍 Your Eco Impact</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-xs text-emerald-100">Items Shared</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">0 kg</p>
                    <p className="text-xs text-emerald-100">CO₂ Saved</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-xs text-emerald-100">Connections</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-eco-100 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            © 2026 RecycleShare. Making the world greener, one share at a time 🌍
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Dashboard
