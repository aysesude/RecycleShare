import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { FiArrowLeft, FiMapPin, FiBox, FiUsers, FiX, FiCalendar, FiAlignLeft, FiUser, FiPhone, FiClock } from 'react-icons/fi'

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
      const [lbRes, collRes, ownRes, allWasteRes] = await Promise.all([
        api.get('/reports/top-contributors'),
        api.get('/reservations/my/collector'),
        api.get('/reservations/my/owner'),
        api.get('/waste') 
      ])
      
      const allWaste = allWasteRes.data?.data || []
      
      const enhance = (resList, type) => resList.map(res => {
        const wasteInfo = allWaste.find(w => String(w.waste_id) === String(res.waste_id)) || {}
        
        return {
          ...res,
          display_name: res.type_name || wasteInfo.type_name || 'Recyclable Item',
          display_desc: res.waste_description || wasteInfo.description || 'No description provided',
          display_amount: res.amount || wasteInfo.amount || '0',
          display_unit: res.official_unit || wasteInfo.official_unit || 'kg',
          
          city: res.city || wasteInfo.city || 'N/A',
          district: res.district || wasteInfo.district || '',
          neighborhood: res.neighborhood || wasteInfo.neighborhood || '',
          street: res.street || wasteInfo.street || '',
          address_details: res.address_details || wasteInfo.address_details || '',
          
          contact_label: type === 'collector' ? "Waste Owner" : "Collector Info",
          contact_name: type === 'collector' ? (res.owner_name || 'Anonymous User') : (res.collector_name || 'Assigned Collector'),
          contact_phone: type === 'collector' ? (res.owner_phone || 'N/A') : (res.collector_phone || 'N/A')
        }
      })

      setLeaderboard(lbRes.data?.data || [])
      setToCollect(enhance(collRes.data?.data || [], 'collector'))
      setMyResv(enhance(ownRes.data?.data || [], 'owner'))
    } catch (err) {
      toast.error('Failed to sync community data')
    } finally {
      setLoading(false)
    }
  }

  const handleCollectAction = async () => {
    if (!editAmount || parseFloat(editAmount) <= 0) {
      return toast.error("Please enter a valid amount");
    }

    try {
      // Call new dedicated endpoint for completing collection
      await api.post(`/reservations/${selectedItem.reservation_id}/complete-collection`, {
        actual_amount: parseFloat(editAmount)
      });

      toast.success('Waste collected successfully! Points awarded.');
      setSelectedItem(null);
      fetchInitialData(); 
    } catch (err) {
      console.error("Update Error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Error updating collection');
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8 uppercase font-bold">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/dashboard')} className="btn btn-circle btn-ghost bg-white shadow-sm text-emerald-600 border-none">
            <FiArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-black tracking-tighter text-slate-800">Community Hub</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main List */}
          <div className="lg:col-span-8 bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
            <div className="flex bg-slate-50/50 border-b p-2 gap-2">
              <button onClick={() => setActiveTab('collector')} className={`flex-1 py-4 text-xs rounded-xl transition-all ${activeTab === 'collector' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>To Collect</button>
              <button onClick={() => setActiveTab('owner')} className={`flex-1 py-4 text-xs rounded-xl transition-all ${activeTab === 'owner' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>My Items</button>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-20"><span className="loading loading-spinner text-emerald-500"></span></div>
              ) : (
                <div className="space-y-4">
                  {(activeTab === 'collector' ? toCollect : myResv).map(item => (
                    <div key={item.reservation_id} className="flex justify-between items-center p-6 border border-slate-100 rounded-3xl hover:border-emerald-200 transition-all bg-white">
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl"><FiBox /></div>
                        <div>
                          <h4 className="text-slate-800 text-sm">{item.display_name}</h4>
                          <p className="text-xs text-slate-400 uppercase tracking-wide">{item.display_amount} {item.display_unit} • {item.status}</p>
                        </div>
                      </div>
                      <button onClick={() => { setSelectedItem(item); setEditAmount(item.display_amount); }} className="btn btn-sm btn-ghost bg-slate-100 px-6 rounded-xl">View Details</button>
                    </div>
                  ))}
                  {(activeTab === 'collector' ? toCollect : myResv).length === 0 && <p className="text-center py-10 font-bold text-slate-300">No records found.</p>}
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="lg:col-span-4">
             <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 sticky top-8">
                <h3 className="text-xs mb-4 flex items-center gap-2 text-emerald-600 uppercase"><FiUsers /> Top Contributors</h3>
                <div className="space-y-3">
                  {leaderboard.map((u, i) => (
                    <div key={i} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-xl transition-colors">
                      <span className="text-slate-600 font-bold text-sm">{u.first_name}</span>
                      <span className="text-emerald-600 font-black text-sm">{u.total_waste_count} PTS</span>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>

        {/* DETAILS MODAL */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl relative animate-in fade-in zoom-in duration-150">
              <button onClick={() => setSelectedItem(null)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors"><FiX size={24}/></button>
              
              <div className="mb-6">
                <h3 className="text-3xl font-black text-slate-800 uppercase leading-none mb-2">{selectedItem.display_name}</h3>
                <p className="text-emerald-600 font-black text-xl">{selectedItem.display_amount} {selectedItem.display_unit}</p>
              </div>

              <div className="space-y-3 mb-8">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4">
                  <FiAlignLeft className="text-slate-400 mt-1" />
                  <div className="text-sm text-slate-600">
                    <p className="font-black text-slate-400 uppercase text-[10px] tracking-widest mb-1">Waste Description</p>
                    <p className="font-medium italic">"{selectedItem.display_desc}"</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4">
                  <FiClock className="text-blue-500 mt-1" />
                  <div className="text-sm">
                    <p className="font-black text-blue-400 uppercase text-[10px] tracking-widest mb-1">Pickup Time</p>
                    <p className="text-blue-700 font-bold uppercase">
                        {new Date(selectedItem.pickup_datetime).toLocaleDateString('en-GB')} at {new Date(selectedItem.pickup_datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>

                {/* ADDRESS: Only shows for Collector tab */}
                {activeTab === 'collector' && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4">
                    <FiMapPin className="text-emerald-500 mt-1" />
                    <div className="text-sm">
                      <p className="font-black text-slate-400 uppercase text-[10px] tracking-widest mb-1">Pickup Address</p>
                      <p className="text-slate-700 font-bold">{selectedItem.neighborhood}, {selectedItem.street}</p>
                      <p className="text-slate-500 text-xs font-bold uppercase">{selectedItem.district} / {selectedItem.city}</p>
                      {selectedItem.address_details && <p className="text-slate-400 text-[11px] mt-1 italic">{selectedItem.address_details}</p>}
                    </div>
                  </div>
                )}

                <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex gap-4">
                  <FiUser className="text-orange-500 mt-1" />
                  <div className="text-sm">
                    <p className="font-black text-orange-400 uppercase text-[10px] tracking-widest mb-1">{selectedItem.contact_label}</p>
                    <p className="text-orange-900 font-bold mb-1">{selectedItem.contact_name}</p>
                    <p className="text-orange-700 font-black text-lg flex items-center gap-2">
                        <FiPhone size={16}/> {selectedItem.contact_phone}
                    </p>
                  </div>
                </div>
              </div>

              {activeTab === 'collector' && selectedItem.status === 'waiting' ? (
                <div className="space-y-4">
                  <div className="bg-slate-100 p-4 rounded-2xl">
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">Measured Amount</label>
                    <input type="number" className="w-full bg-transparent border-none text-xl font-black focus:ring-0 outline-none" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
                  </div>
                  <button onClick={handleCollectAction} className="btn btn-primary w-full h-16 bg-emerald-600 border-none text-white rounded-2xl font-black text-lg shadow-lg shadow-emerald-200">Complete Collection</button>
                </div>
              ) : (
                <button onClick={() => setSelectedItem(null)} className="btn btn-ghost w-full h-14 text-slate-400 font-bold border border-slate-100 rounded-2xl uppercase">Close</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Community