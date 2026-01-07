import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext' // 1. Use Auth Hook
import { FiArrowLeft, FiPackage, FiCheckCircle, FiTrash2, FiUsers, FiAward, FiExternalLink, FiX } from 'react-icons/fi'

const Community = () => {
  const navigate = useNavigate()
  const { user } = useAuth() // 2. Get user context

  const [leaderboard, setLeaderboard] = useState([])
  const [toCollect, setToCollect] = useState([])
  const [beingCollected, setBeingCollected] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('to_collect')
  
  const [selectedWaste, setSelectedWaste] = useState(null)
  const [finalAmount, setFinalAmount] = useState('')

  useEffect(() => {
    fetchCommunityData()
  }, [])

  const fetchCommunityData = async () => {
    setLoading(true)
    try {
      // API endpoints based on your swagger.json
      const [lbRes, collRes, ownRes] = await Promise.all([
        api.get('/reports/top-contributors'),
        api.get('/reservations/my/collector'),
        api.get('/reservations/my/owner')
      ])

      setLeaderboard(lbRes.data?.data || [])
      setToCollect(collRes.data?.data || [])
      setBeingCollected(ownRes.data?.data || [])
    } catch (err) {
      console.error("Sync Error:", err)
      toast.error('Failed to sync community data')
    } finally {
      setLoading(false)
    }
  }

  const handleCollect = async () => {
    if (!finalAmount || finalAmount <= 0) return toast.error('Please enter a valid amount')
    try {
      const res = await api.put(`/reservations/${selectedWaste.reservation_id}`, {
        status: 'collected',
        actual_amount: parseFloat(finalAmount)
      })
      toast.success(res.data?.triggerMessage || 'Waste collected successfully!')
      setSelectedWaste(null)
      fetchCommunityData() 
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    }
  }

  const cancelReservation = async (id) => {
    if(!window.confirm("Cancel this reservation?")) return
    try {
      await api.delete(`/reservations/${id}`)
      toast.success('Reservation cancelled')
      fetchCommunityData()
    } catch (err) {
      toast.error('Action failed')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER & BACK BUTTON */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="btn btn-circle btn-ghost bg-white shadow-sm hover:bg-emerald-50 text-emerald-600 border border-slate-200"
            >
              <FiArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Community Hub</h1>
              <p className="text-slate-500 text-sm">Welcome back, {user?.first_name || 'Hero'}!</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: RESERVATIONS */}
          <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
            <div className="flex bg-slate-50/50 border-b">
              <button 
                onClick={() => setActiveTab('to_collect')}
                className={`flex-1 py-4 text-sm font-bold ${activeTab === 'to_collect' ? 'bg-white text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400'}`}
              >
                Items to Collect
              </button>
              <button 
                onClick={() => setActiveTab('my_listings_reserved')}
                className={`flex-1 py-4 text-sm font-bold ${activeTab === 'my_listings_reserved' ? 'bg-white text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400'}`}
              >
                My Items
              </button>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-20"><span className="loading loading-spinner text-emerald-500"></span></div>
              ) : (
                <div className="space-y-4">
                  {(activeTab === 'to_collect' ? toCollect : beingCollected).map((item) => (
                    <div key={item.reservation_id} className="flex items-center justify-between p-4 border rounded-xl hover:shadow-sm transition-all">
                      <div>
                        <h4 className="font-bold text-slate-800">{item.waste_type_name}</h4>
                        <div className="flex gap-2 mt-1">
                          <span className="badge badge-sm badge-ghost uppercase">{item.status}</span>
                          <span className="text-xs text-slate-400">{item.amount} {item.unit || 'kg'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {activeTab === 'to_collect' && item.status === 'reserved' && (
                          <button 
                            onClick={() => { setSelectedWaste(item); setFinalAmount(item.amount); }}
                            className="btn btn-success btn-sm text-white"
                          >
                            Collect
                          </button>
                        )}
                        <button onClick={() => cancelReservation(item.reservation_id)} className="btn btn-ghost btn-sm text-red-400">
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: LEADERBOARD */}
          <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-fit">
            <div className="bg-emerald-600 p-4 text-white font-bold flex items-center gap-2">
              <FiUsers /> Top Contributors
            </div>
            <div className="p-2">
              {leaderboard.map((u, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${u.user_id === user?.user_id ? 'bg-emerald-50 border border-emerald-100' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400">#{index+1}</span>
                    <span className={`text-sm ${u.user_id === user?.user_id ? 'font-bold text-emerald-700' : 'font-medium'}`}>
                      {u.first_name} {u.user_id === user?.user_id ? '(You)' : ''}
                    </span>
                  </div>
                  <span className="text-emerald-600 font-bold text-sm">{u.total_waste_count} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLLECT MODAL */}
        {selectedWaste && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-xl">
              <h3 className="text-xl font-bold mb-4">Confirm Amount</h3>
              <input 
                type="number" 
                className="input input-bordered w-full mb-6"
                value={finalAmount}
                onChange={(e) => setFinalAmount(e.target.value)}
              />
              <div className="flex flex-col gap-2">
                <button onClick={handleCollect} className="btn btn-primary bg-emerald-600 border-none">Finish & Earn Pts</button>
                <button onClick={() => setSelectedWaste(null)} className="btn btn-ghost">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Community