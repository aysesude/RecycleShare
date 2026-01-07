import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { FiArrowLeft, FiPackage, FiMapPin, FiInfo, FiCheckCircle, FiTrash2, FiUsers, FiX, FiUser } from 'react-icons/fi'

const Community = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [leaderboard, setLeaderboard] = useState([])
  const [toCollect, setToCollect] = useState([]) // Benim toplayacaklarım
  const [myResv, setMyResv] = useState([])       // Benim ilanlarım (rezerve edilmiş)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('collector')
  
  const [selectedItem, setSelectedItem] = useState(null)
  const [editAmount, setEditAmount] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [lbRes, collRes, ownRes] = await Promise.all([
        api.get('/reports/top-contributors'),
        api.get('/reservations/my/collector'),
        api.get('/reservations/my/owner')
      ])
      setLeaderboard(lbRes.data?.data || [])
      setToCollect(collRes.data?.data || [])
      setMyResv(ownRes.data?.data || [])
    } catch (err) {
      toast.error('Sync Error: Connection failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCollectAction = async () => {
    if (!editAmount || editAmount <= 0) return toast.error('Please enter a valid amount')
    try {
      await api.put(`/reservations/${selectedItem.reservation_id}`, {
        status: 'collected',
        actual_amount: parseFloat(editAmount)
      })
      toast.success('Successfully collected! Points added.')
      setSelectedItem(null)
      fetchData()
    } catch (err) {
      toast.error('Update failed')
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8 text-slate-800">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/dashboard')} className="btn btn-circle btn-ghost bg-white shadow-sm border border-slate-200 text-emerald-600">
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Community Hub</h1>
            <p className="text-slate-500 text-sm">Welcome, {user?.first_name}! Score: <span className="font-bold text-emerald-600">{user?.total_points || 0}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* RESERVATIONS LIST */}
          <div className="lg:col-span-8 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
            <div className="flex bg-slate-50 border-b border-slate-100 p-1">
              <button 
                onClick={() => setActiveTab('collector')}
                className={`flex-1 py-3 font-bold text-sm rounded-2xl transition-all ${activeTab === 'collector' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                To Collect
              </button>
              <button 
                onClick={() => setActiveTab('owner')}
                className={`flex-1 py-3 font-bold text-sm rounded-2xl transition-all ${activeTab === 'owner' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                My Items (Reserved)
              </button>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-emerald-500"></span></div>
              ) : (
                <div className="grid gap-4">
                  {(activeTab === 'collector' ? toCollect : myResv).map(item => (
                    <div key={item.reservation_id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 border border-slate-50 rounded-2xl bg-slate-50/30 hover:bg-white hover:shadow-md transition-all group">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                          {item.waste_type_name?.charAt(0) || 'W'}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 uppercase text-xs tracking-widest">{item.waste_type_name}</h4>
                          <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{item.description || 'Eco-friendly waste'}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.status === 'collected' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                              {item.status.toUpperCase()}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">{item.amount} {item.unit || 'KG'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => { setSelectedItem(item); setEditAmount(item.amount); }}
                        className="btn btn-sm bg-white border-slate-200 text-slate-700 hover:bg-emerald-600 hover:text-white rounded-lg shadow-sm mt-4 sm:mt-0"
                      >
                        <FiInfo size={14} className="mr-1" /> See Details
                      </button>
                    </div>
                  ))}
                  {(activeTab === 'collector' ? toCollect : myResv).length === 0 && (
                    <div className="text-center py-20 text-slate-400 italic">Nothing to show here yet.</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* LEADERBOARD */}
          <div className="lg:col-span-4">
             <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-emerald-600 p-5 text-white font-bold flex items-center gap-2">
                  <FiUsers /> Top Contributors
                </div>
                <div className="p-4 space-y-1">
                  {leaderboard.map((u, index) => (
                    <div key={index} className={`flex justify-between items-center p-3 rounded-xl ${u.user_id === user?.user_id ? 'bg-emerald-50 border border-emerald-100' : ''}`}>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${index < 3 ? 'bg-yellow-100 text-yellow-600' : 'text-slate-300'}`}>
                          {index + 1}
                        </span>
                        <span className={`text-sm ${u.user_id === user?.user_id ? 'font-bold text-emerald-700' : 'text-slate-600'}`}>
                          {u.first_name} {u.user_id === user?.user_id ? '(You)' : ''}
                        </span>
                      </div>
                      <span className="text-xs font-black text-emerald-600">{u.total_waste_count} items</span>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>

{/* SHARED DETAIL MODAL */}
{selectedItem && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
    <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
            {activeTab === 'collector' ? 'Collection Details' : 'Reservation Info'}
          </span>
          <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-slate-100 rounded-full"><FiX size={20}/></button>
        </div>

        {/* Atık Tipi ve Açıklama */}
        <h3 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">
          {selectedItem.waste_type_name || "General Waste"}
        </h3>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          {selectedItem.description ? selectedItem.description : `${selectedItem.waste_type_name} ready for recycling.`}
        </p>

        <div className="space-y-3 mb-8">
          
          {/* TO COLLECT SEKMESİ: ADRES GÖSTER */}
          {activeTab === 'collector' ? (
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <FiMapPin className="text-emerald-500 mt-1" />
              <div className="text-sm">
                <p className="font-bold text-slate-700 uppercase text-[10px] tracking-widest">Pickup Address</p>
                <p className="text-slate-500">{selectedItem.city}, {selectedItem.district}, {selectedItem.neighborhood}</p>
                <p className="text-slate-400 text-xs italic">{selectedItem.street} St. No: {selectedItem.address_details}</p>
              </div>
            </div>
          ) : (
            /* MY ITEMS SEKMESİ: PICKUP DATE & TIME GÖSTER */
            <div className="flex items-start gap-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
              <div className="mt-1 text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="Ref-8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-sm">
                <p className="font-bold text-emerald-700 uppercase text-[10px] tracking-widest">Scheduled Pickup</p>
                <p className="text-slate-700 font-bold text-lg">
                  {selectedItem.pickup_datetime 
                    ? new Date(selectedItem.pickup_datetime).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
                    : 'Date not set'}
                </p>
                <p className="text-emerald-600 font-medium">
                  At: {selectedItem.pickup_datetime 
                    ? new Date(selectedItem.pickup_datetime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                    : 'Time not set'}
                </p>
              </div>
            </div>
          )}

          {/* Kişi Bilgisi */}
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <FiUser className="text-blue-500 mt-1" />
            <div className="text-sm">
              <p className="font-bold text-slate-700 uppercase text-[10px] tracking-widest">
                {activeTab === 'collector' ? 'Owner' : 'Collector'}
              </p>
              <p className="text-slate-500">
                {activeTab === 'collector' ? selectedItem.owner_name : (selectedItem.collector_name || 'Anonymous User')}
              </p>
            </div>
          </div>

          {/* Miktar Girişi (Sadece Toplayıcı Sekmesinde) */}
          {activeTab === 'collector' && selectedItem.status !== 'collected' && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <p className="text-[10px] font-bold text-emerald-600 uppercase mb-2">Adjust Amount ({selectedItem.unit || 'KG'})</p>
              <input 
                type="number" 
                className="input input-bordered w-full bg-white font-bold"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Buton Alanı */}
        {activeTab === 'collector' && selectedItem.status !== 'collected' ? (
          <button 
            onClick={handleCollectAction}
            className="btn btn-primary w-full h-14 bg-emerald-600 border-none hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg"
          >
            Confirm Collection
          </button>
        ) : (
          <button 
            onClick={() => setSelectedItem(null)}
            className="btn btn-ghost w-full h-14 text-slate-400 font-bold border border-slate-100 rounded-2xl hover:bg-slate-50"
          >
            Close Details
          </button>
        )}
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  )
}

export default Community