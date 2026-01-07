import { useState, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { FiUsers, FiPackage, FiCheckCircle, FiTrash2, FiExternalLink, FiX, FiAward } from 'react-icons/fi'

const Community = () => {
  const [leaderboard, setLeaderboard] = useState([])
  const [myReservations, setMyReservations] = useState([]) // Reservations I will collect
  const [incomingRequests, setIncomingRequests] = useState([]) // Reservations made to my listings
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('to_collect') // 'to_collect' | 'my_listings_reserved'
  
  const [selectedWaste, setSelectedWaste] = useState(null)
  const [finalAmount, setFinalAmount] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Endpoint mapping based on swagger.json
      const [lbRes, collectorRes, ownerRes] = await Promise.all([
        api.get('/reports/top-contributors'), 
        api.get('/reservations/my/collector'), 
        api.get('/reservations/my/owner')
      ])
      
      setLeaderboard(lbRes.data?.data || lbRes.data || [])
      setMyReservations(collectorRes.data?.data || collectorRes.data || [])
      setIncomingRequests(ownerRes.data?.data || ownerRes.data || [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to sync community data')
    } finally {
      setLoading(false)
    }
  }

  const handleCollect = async () => {
    if (!finalAmount || finalAmount <= 0) return toast.error('Please enter a valid amount')
    
    try {
      // Using PUT /reservations/{id} to update status to collected
      const res = await api.put(`/reservations/${selectedWaste.reservation_id}`, {
        status: 'collected',
        actual_amount: parseFloat(finalAmount)
      })
      
      toast.success(res.data?.triggerMessage || 'Waste collected successfully!', {
        icon: <FiAward className="text-yellow-500" />
      })
      
      setSelectedWaste(null)
      fetchData() 
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transaction failed')
    }
  }

  const cancelReservation = async (id) => {
    if(!window.confirm("Are you sure you want to cancel this reservation?")) return
    try {
      // Using DELETE /reservations/{id}
      await api.delete(`/reservations/${id}`)
      toast.success('Reservation cancelled')
      fetchData()
    } catch (err) {
      toast.error('Could not cancel reservation')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* RESERVATIONS SECTION */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[400px]">
            <div className="flex border-b">
              <button 
                onClick={() => setActiveTab('to_collect')}
                className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === 'to_collect' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                Items to Collect
              </button>
              <button 
                onClick={() => setActiveTab('my_listings_reserved')}
                className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === 'my_listings_reserved' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                My Items Being Collected
              </button>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-20"><span className="loading loading-spinner text-emerald-500"></span></div>
              ) : (
                <div className="space-y-4">
                  {(activeTab === 'to_collect' ? myReservations : incomingRequests).length === 0 ? (
                    <p className="text-center text-slate-400 py-10">No active reservations found.</p>
                  ) : (
                    (activeTab === 'to_collect' ? myReservations : incomingRequests).map((item) => (
                      <div key={item.reservation_id} className="flex items-center justify-between p-4 border rounded-xl bg-white hover:border-emerald-200 transition-colors">
                        <div>
                          <h4 className="font-bold text-slate-800">{item.waste_type_name || "Waste Item"}</h4>
                          <p className="text-xs text-slate-500 mt-1">📅 Pickup: {new Date(item.pickup_datetime).toLocaleString()}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="badge badge-ghost badge-sm font-semibold">{item.amount || item.weight} units</span>
                            <span className="text-[10px] text-slate-400 uppercase self-center">Status: {item.status}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {activeTab === 'to_collect' && item.status === 'reserved' && (
                            <button 
                              onClick={() => { setSelectedWaste(item); setFinalAmount(item.amount); }}
                              className="btn btn-success btn-sm text-white capitalize"
                            >
                              <FiCheckCircle /> Collect
                            </button>
                          )}
                          <button onClick={() => cancelReservation(item.reservation_id)} className="btn btn-ghost btn-sm text-red-400">
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TOP CONTRIBUTORS (LEADERBOARD) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-emerald-600 p-5 text-white font-bold flex items-center justify-between">
              <div className="flex items-center gap-2"><FiUsers /> Leaderboard</div>
              <span className="text-[10px] bg-white/20 px-2 py-1 rounded">GLOBAL</span>
            </div>
            <div className="p-2">
              {leaderboard.map((user, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${index < 3 ? 'bg-yellow-400 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">{user.first_name} {user.last_name}</p>
                      <p className="text-[9px] text-slate-400 uppercase tracking-tighter">{user.city || 'Eco Hero'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-600 font-black text-sm">{user.total_waste_count || user.waste_count}</span>
                    <p className="text-[8px] text-slate-400 font-bold">LISTINGS</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* COLLECT MODAL */}
      {selectedWaste && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Confirm Collection</h3>
            <p className="text-sm text-slate-500 mb-6">Enter the final measured amount to complete the process.</p>
            
            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Final Amount</label>
            <input 
              type="number" 
              className="input input-bordered w-full mt-1 mb-8 text-xl font-bold focus:ring-2 focus:ring-emerald-500"
              value={finalAmount}
              onChange={(e) => setFinalAmount(e.target.value)}
            />
            
            <div className="flex flex-col gap-2">
              <button onClick={handleCollect} className="btn btn-primary bg-emerald-600 border-none hover:bg-emerald-700 h-12">
                Confirm & Earn Points
              </button>
              <button onClick={() => setSelectedWaste(null)} className="btn btn-ghost text-slate-400">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Community