import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { FiArrowLeft, FiMapPin, FiBox, FiUsers, FiX, FiCalendar, FiAlignLeft } from 'react-icons/fi'

const Community = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [leaderboard, setLeaderboard] = useState([])
  const [toCollect, setToCollect] = useState([]) 
  const [myResv, setMyResv] = useState([])      
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
      // We fetch top contributors, reservations, and the full waste list.
      // The /waste endpoint already includes joined data (type_name, city, neighborhood).
      const [lbRes, collRes, ownRes, allWasteRes] = await Promise.all([
        api.get('/reports/top-contributors'),
        api.get('/reservations/my/collector'),
        api.get('/reservations/my/owner'),
        api.get('/waste') 
      ])
      
      const allWaste = allWasteRes.data?.data || []
      
      /**
       * ENHANCE FUNCTION
       * Maps the raw reservation data to the rich metadata found in the waste table.
       */
      const enhance = (resList) => resList.map(res => {
        // We use String() to ensure comparison works regardless of data type (int vs string)
        const wasteInfo = allWaste.find(w => String(w.waste_id) === String(res.waste_id)) || {}
        
        return {
          ...res,
          display_name: wasteInfo.type_name || 'Recyclable Item',
          display_desc: wasteInfo.description || 'No description provided',
          display_amount: wasteInfo.amount || '0',
          display_unit: wasteInfo.official_unit || 'kg',
          // Location data pulled from the joined user info in the waste object
          city: wasteInfo.city || 'N/A',
          district: wasteInfo.district || '',
          neighborhood: wasteInfo.neighborhood || '',
          owner_full_name: `${wasteInfo.first_name || ''} ${wasteInfo.last_name || ''}`.trim()
        }
      })

      setLeaderboard(lbRes.data?.data || [])
      setToCollect(enhance(collRes.data?.data || []))
      setMyResv(enhance(ownRes.data?.data || []))
    } catch (err) {
      console.error("Fetch error:", err)
      toast.error('Could not load community data')
    } finally {
      setLoading(false)
    }
  }

  const handleCollectAction = async () => {
    if (!editAmount || parseFloat(editAmount) <= 0) {
      return toast.error("Please enter a valid amount collected")
    }

    try {
      await api.put(`/reservations/${selectedItem.reservation_id}`, {
        status: 'collected',
        actual_amount: parseFloat(editAmount)
      })
      toast.success('Collection Confirmed!')
      setSelectedItem(null)
      fetchInitialData() 
    } catch (err) {
      toast.error('Update failed')
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/dashboard')} className="btn btn-circle btn-ghost bg-white shadow-sm border border-slate-200 text-emerald-600">
            <FiArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Community Hub</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-8 bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
            <div className="flex bg-slate-50/50 border-b p-2 gap-2">
              <button 
                onClick={() => setActiveTab('collector')} 
                className={`flex-1 py-4 font-black text-xs uppercase rounded-xl transition-all ${activeTab === 'collector' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
              >
                To Collect
              </button>
              <button 
                onClick={() => setActiveTab('owner')} 
                className={`flex-1 py-4 font-black text-xs uppercase rounded-xl transition-all ${activeTab === 'owner' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
              >
                My Items
              </button>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-20"><span className="loading loading-spinner text-emerald-500"></span></div>
              ) : (
                <div className="space-y-4">
                  {(activeTab === 'collector' ? toCollect : myResv).length === 0 ? (
                    <div className="text-center py-20 text-slate-400 font-bold">No reservations found</div>
                  ) : (
                    (activeTab === 'collector' ? toCollect : myResv).map(item => (
                      <div key={item.reservation_id} className="flex justify-between items-center p-6 border border-slate-100 rounded-3xl bg-white hover:border-emerald-200 transition-all">
                        <div className="flex gap-4 items-center">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl"><FiBox /></div>
                          <div>
                            <h4 className="font-black text-slate-800 uppercase text-sm">{item.display_name}</h4>
                            <p className="text-xs font-bold text-slate-400">{item.display_amount} {item.display_unit} • <span className="uppercase text-emerald-600">{item.status}</span></p>
                          </div>
                        </div>
                        <button 
                          onClick={() => { setSelectedItem(item); setEditAmount(item.display_amount); }} 
                          className="btn btn-sm btn-ghost bg-slate-100 font-bold px-6 rounded-xl"
                        >
                          View Details
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard Sidebar */}
          <div className="lg:col-span-4">
             <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 sticky top-8">
                <h3 className="font-black text-slate-800 uppercase text-xs mb-4 flex items-center gap-2 text-emerald-600"><FiUsers /> Top Contributors</h3>
                <div className="space-y-3">
                  {leaderboard.map((u, i) => (
                    <div key={i} className="flex justify-between items-center text-sm p-2 rounded-xl hover:bg-slate-50">
                      <span className="text-slate-500 font-bold">{u.first_name} {u.last_name?.charAt(0)}.</span>
                      <span className="font-black text-emerald-600">{u.total_waste_count} pts</span>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>

        {/* Details Modal */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl relative animate-in zoom-in duration-150">
              <button onClick={() => setSelectedItem(null)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600"><FiX size={24}/></button>
              
              <div className="mb-8">
                <h3 className="text-3xl font-black text-slate-800 uppercase leading-none mb-2">{selectedItem.display_name}</h3>
                <p className="text-emerald-600 font-black text-xl">{selectedItem.display_amount} {selectedItem.display_unit}</p>
              </div>

              <div className="space-y-4 mb-10">
                <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex gap-4">
                  <FiAlignLeft className="text-slate-400 mt-1" />
                  <div className="text-sm">
                    <p className="font-black text-slate-400 uppercase text-[10px] tracking-widest mb-1">Waste Description</p>
                    <p className="text-slate-600 font-medium italic">"{selectedItem.display_desc}"</p>
                  </div>
                </div>

                <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex gap-4">
                  <FiMapPin className="text-emerald-500 mt-1" />
                  <div className="text-sm">
                    <p className="font-black text-slate-400 uppercase text-[10px] tracking-widest mb-1">Pickup Location</p>
                    <p className="text-slate-700 font-bold">
                        {selectedItem.neighborhood}, {selectedItem.district}
                        <br />
                        {selectedItem.city}
                    </p>
                  </div>
                </div>

                <div className="p-5 bg-blue-50 rounded-[2rem] border border-blue-100 flex gap-4">
                  <FiCalendar className="text-blue-500 mt-1" />
                  <div className="text-sm">
                    <p className="font-black uppercase text-[10px] tracking-widest mb-1 text-blue-400">Pickup Scheduled</p>
                    <p className="text-blue-700 font-bold">
                        {new Date(selectedItem.pickup_datetime).toLocaleDateString()} at {new Date(selectedItem.pickup_datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Area: Only collector can confirm collection */}
              {activeTab === 'collector' && selectedItem.status !== 'collected' ? (
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label"><span className="label-text font-bold text-slate-500">Confirm Actual Weight/Amount</span></label>
                    <input 
                        type="number" 
                        className="input input-bordered w-full font-black text-lg rounded-2xl" 
                        value={editAmount} 
                        onChange={(e) => setEditAmount(e.target.value)} 
                    />
                  </div>
                  <button onClick={handleCollectAction} className="btn btn-primary w-full h-16 bg-emerald-600 border-none text-white rounded-2xl font-black uppercase">Complete Collection</button>
                </div>
              ) : (
                <button onClick={() => setSelectedItem(null)} className="btn btn-ghost w-full h-14 text-slate-400 font-bold border border-slate-100 rounded-2xl">Close</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Community