import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { FiArrowLeft, FiMapPin, FiInfo, FiCheckCircle, FiUsers, FiX, FiUser, FiCalendar, FiClock } from 'react-icons/fi'

const Community = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [leaderboard, setLeaderboard] = useState([])
  const [toCollect, setToCollect] = useState([]) 
  const [myResv, setMyResv] = useState([])      
  const [wasteTypes, setWasteTypes] = useState([]) // DATABASE TYPES
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('collector')
  
  const [selectedItem, setSelectedItem] = useState(null)
  const [editAmount, setEditAmount] = useState('')

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      // 1. Fetch Waste Types from Database first
      const typeRes = await api.get('/waste/types')
      const typesList = typeRes.data?.data || typeRes.data || []
      setWasteTypes(typesList)

      // 2. Fetch Lists and Leaderboard
      const [lbRes, collRes, ownRes] = await Promise.all([
        api.get('/reports/top-contributors'),
        api.get('/reservations/my/collector'),
        api.get('/reservations/my/owner')
      ])
      
      setLeaderboard(lbRes.data?.data || [])
      setToCollect(collRes.data?.data || [])
      setMyResv(ownRes.data?.data || [])
    } catch (err) {
      toast.error('Failed to sync data with database')
    } finally {
      setLoading(false)
    }
  }

  // Helper to find name from database types
  const getTypeName = (item) => {
    if (item.waste_type_name) return item.waste_type_name
    const found = wasteTypes.find(t => t.type_id === item.type_id)
    return found ? found.type_name : 'Recyclable Waste'
  }

  const handleCollectAction = async () => {
    try {
      await api.put(`/reservations/${selectedItem.reservation_id}`, {
        status: 'collected',
        actual_amount: parseFloat(editAmount)
      })
      toast.success('Collected! Points updated.')
      setSelectedItem(null)
      fetchInitialData() 
    } catch (err) {
      toast.error('Update failed')
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/dashboard')} className="btn btn-circle btn-ghost bg-white shadow-sm border border-slate-200 text-emerald-600">
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Community Hub</h1>
            <p className="text-slate-500 text-sm">Welcome, {user?.first_name} | <span className="text-emerald-600 font-bold">{user?.total_points || 0} Points</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
            <div className="flex bg-slate-50/50 border-b p-2 gap-2">
              <button onClick={() => setActiveTab('collector')} className={`flex-1 py-3 font-bold text-sm rounded-xl transition-all ${activeTab === 'collector' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>To Collect</button>
              <button onClick={() => setActiveTab('owner')} className={`flex-1 py-3 font-bold text-sm rounded-xl transition-all ${activeTab === 'owner' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>My Items</button>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-20"><span className="loading loading-spinner text-emerald-500"></span></div>
              ) : (
                <div className="space-y-4">
                  {(activeTab === 'collector' ? toCollect : myResv).map(item => (
                    <div key={item.reservation_id} className="flex justify-between items-center p-5 border border-slate-50 rounded-2xl bg-slate-50/20 hover:bg-white hover:shadow-md transition-all">
                      <div>
                        <h4 className="font-bold text-slate-800 uppercase text-sm tracking-tight">{getTypeName(item)}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase">{item.status}</span>
                          <span className="text-xs font-bold text-slate-400">{item.amount} {item.unit || 'kg'}</span>
                        </div>
                      </div>
                      <button onClick={() => { setSelectedItem(item); setEditAmount(item.amount); }} className="btn btn-sm btn-ghost text-emerald-600 font-bold">Details</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* LEADERBOARD */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-emerald-600 p-5 text-white font-bold flex items-center gap-2"><FiUsers /> Top Contributors</div>
              <div className="p-4 space-y-2">
                {leaderboard.map((u, index) => (
                  <div key={index} className={`flex justify-between items-center p-3 rounded-xl ${u.user_id === user?.user_id ? 'bg-emerald-50 border border-emerald-100' : ''}`}>
                    <span className="text-sm font-medium text-slate-600">{index + 1}. {u.first_name}</span>
                    <span className="text-xs font-black text-emerald-600">{u.total_waste_count} items</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* DETAILS MODAL */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">Recycle Detail</span>
                <button onClick={() => setSelectedItem(null)} className="btn btn-sm btn-circle btn-ghost"><FiX /></button>
              </div>

              <h3 className="text-2xl font-black text-slate-800 uppercase mb-1 leading-tight">{getTypeName(selectedItem)}</h3>
              <p className="text-emerald-600 font-bold text-lg mb-4">{selectedItem.amount} {selectedItem.unit || 'kg'}</p>

              <div className="space-y-3 mb-8">
                {/* CONDITIONAL: Address for Collector, Time for Owner */}
                {activeTab === 'collector' ? (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3">
                    <FiMapPin className="text-emerald-500 mt-1" />
                    <div className="text-sm">
                      <p className="font-bold text-slate-700 uppercase text-[10px]">Pickup Location</p>
                      <p className="text-slate-500">{selectedItem.city}, {selectedItem.district}, {selectedItem.neighborhood}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-3">
                    <FiCalendar className="text-blue-500 mt-1" />
                    <div className="text-sm text-blue-700">
                      <p className="font-bold uppercase text-[10px]">Pickup Scheduled For</p>
                      <p className="font-bold">{new Date(selectedItem.pickup_datetime).toLocaleDateString()}</p>
                      <p className="flex items-center gap-1 font-medium"><FiClock size={12}/> {new Date(selectedItem.pickup_datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3">
                  <FiUser className="text-slate-400 mt-1" />
                  <div className="text-sm">
                    <p className="font-bold text-slate-700 uppercase text-[10px]">{activeTab === 'collector' ? 'Owner' : 'Collector'}</p>
                    <p className="text-slate-500">{activeTab === 'collector' ? selectedItem.owner_name : (selectedItem.collector_name || 'Assigned')}</p>
                  </div>
                </div>

                {activeTab === 'collector' && selectedItem.status !== 'collected' && (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase mb-2">Final Weight Confirmation</p>
                    <input type="number" className="input input-bordered w-full bg-white font-bold" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
                  </div>
                )}
              </div>

              {activeTab === 'collector' && selectedItem.status !== 'collected' ? (
                <button onClick={handleCollectAction} className="btn btn-primary w-full h-14 bg-emerald-600 border-none text-white rounded-2xl font-bold shadow-lg">Confirm Collection</button>
              ) : (
                <button onClick={() => setSelectedItem(null)} className="btn btn-ghost w-full h-14 text-slate-400 font-bold border rounded-2xl">Close</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Community