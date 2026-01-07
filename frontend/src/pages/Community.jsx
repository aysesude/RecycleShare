import { useState, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { FiUsers, FiPackage, FiCheckCircle, FiTrash2, FiExternalLink, FiX, FiAward } from 'react-icons/fi'

const Community = () => {
  const [leaderboard, setLeaderboard] = useState([])
  const [myReservations, setMyReservations] = useState([])
  const [incomingRequests, setIncomingRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('my_reservations')
  
  // Modal State
  const [selectedWaste, setSelectedWaste] = useState(null)
  const [finalAmount, setFinalAmount] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // API dokümantasyonundaki /users/leaderboard ve /waste/my_reservations endpointleri
      const [lbRes, resvRes] = await Promise.all([
        api.get('/users/leaderboard'),
        api.get('/waste/my_reservations') 
      ])
      setLeaderboard(lbRes.data?.data || [])
      setMyReservations(resvRes.data?.data?.outgoing || [])
      setIncomingRequests(resvRes.data?.data?.incoming || [])
    } catch (err) {
      toast.error('Veriler senkronize edilemedi')
    } finally {
      setLoading(false)
    }
  }

  const handleCollect = async () => {
    if (!finalAmount || finalAmount <= 0) return toast.error('Geçerli bir miktar giriniz')
    
    try {
      // Dokümantasyondaki PUT /listings/complete/:id yapısı
      const res = await api.put(`/listings/complete/${selectedWaste.waste_id || selectedWaste.id}`, {
        actual_amount: parseFloat(finalAmount)
      })
      
      toast.success(
        <div className="flex flex-col items-center">
          <p className="font-bold">İşlem Başarılı!</p>
          <p className="text-xs">Kazandığınız Puan: {res.data?.points_earned || 'Hesaplanıyor...'}</p>
        </div>,
        { icon: <FiAward className="text-yellow-500" /> }
      )
      
      setSelectedWaste(null)
      fetchData() // Puanlar güncellendiği için leaderboard'u da tazeler
    } catch (err) {
      toast.error(err.response?.data?.message || 'Teslimat onaylanamadı')
    }
  }

  const cancelReservation = async (id) => {
    if(!window.confirm("Bu rezervasyonu iptal etmek istediğinize emin misiniz?")) return
    try {
      // Dokümantasyondaki DELETE /waste/reservations/:id yapısı
      await api.delete(`/waste/reservations/${id}`)
      toast.success('Rezervasyon iptal edildi')
      fetchData()
    } catch (err) {
      toast.error('İptal işlemi başarısız oldu')
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* REZERVASYONLAR (8 Sütun) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex bg-slate-50/50 p-1 border-b">
              <button 
                onClick={() => setActiveTab('my_reservations')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'my_reservations' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Toplayacaklarım
              </button>
              <button 
                onClick={() => setActiveTab('incoming')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'incoming' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Atıklarımı Alacaklar
              </button>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-emerald-500"></span></div>
              ) : (
                <div className="space-y-4">
                  {(activeTab === 'my_reservations' ? myReservations : incomingRequests).length === 0 && (
                    <div className="text-center py-12">
                      <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiPackage className="text-slate-400 text-2xl" />
                      </div>
                      <p className="text-slate-500 font-medium">Aktif rezervasyon bulunamadı.</p>
                    </div>
                  )}

                  {(activeTab === 'my_reservations' ? myReservations : incomingRequests).map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-100 rounded-2xl bg-white hover:shadow-md transition-shadow">
                      <div className="flex gap-4 items-start">
                        <div className="p-3 bg-emerald-100 rounded-xl text-emerald-700 font-bold text-xs">
                          {item.type_name?.substring(0,2).toUpperCase() || 'WT'}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 leading-tight">{item.waste_type_name || item.type}</h4>
                          <p className="text-sm text-slate-500 mt-1 line-clamp-1">{item.description}</p>
                          <div className="flex gap-2 mt-2">
                             <span className="badge badge-sm bg-emerald-50 border-none text-emerald-700 font-bold">{item.amount || item.weight} {item.official_unit || 'kg'}</span>
                             <span className="text-[11px] text-slate-400 self-center">👤 {item.owner_name || 'Kullanıcı'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-4 sm:mt-0">
                        {activeTab === 'my_reservations' && (
                          <button 
                            onClick={() => { setSelectedWaste(item); setFinalAmount(item.amount || item.weight); }}
                            className="btn btn-primary btn-sm rounded-lg capitalize border-none bg-emerald-600 hover:bg-emerald-700"
                          >
                            <FiCheckCircle className="mr-1" /> Teslim Al
                          </button>
                        )}
                        <button 
                          onClick={() => cancelReservation(item.id)}
                          className="btn btn-ghost btn-sm text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LIDERLIK TABLOSU (4 Sütun) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-emerald-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FiUsers /> Topluluk
                </h2>
                <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">Leaderboard</span>
              </div>
            </div>
            
            <div className="p-4 space-y-2">
              {leaderboard.map((user, index) => (
                <div key={user.user_id} className={`flex items-center justify-between p-3 rounded-xl ${index === 0 ? 'bg-yellow-50 border border-yellow-100' : 'hover:bg-slate-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-400 text-white' : 
                      index === 1 ? 'bg-slate-300 text-white' : 
                      index === 2 ? 'bg-orange-300 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{user.name || user.full_name}</p>
                      <p className="text-[10px] text-slate-400 font-medium tracking-tight uppercase">{user.district}, {user.city}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-emerald-600 leading-none">{user.total_points}</span>
                    <span className="text-[9px] block text-slate-400 font-bold uppercase">Puan</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* COLLECT MODAL */}
      {selectedWaste && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600"><FiPackage /></div>
                <button onClick={() => setSelectedWaste(null)} className="btn btn-ghost btn-sm btn-circle"><FiX /></button>
              </div>

              <h3 className="text-xl font-bold text-slate-800">Miktarı Onayla</h3>
              <p className="text-sm text-slate-500 mt-1">Teslim alınan gerçek miktar nedir?</p>

              <div className="mt-6">
                <div className="relative">
                  <input 
                    type="number" 
                    value={finalAmount}
                    onChange={(e) => setFinalAmount(e.target.value)}
                    className="input input-bordered w-full h-16 text-2xl font-bold pl-6 focus:ring-2 focus:ring-emerald-500 border-slate-200" 
                    placeholder="0.0"
                  />
                  <span className="absolute right-6 top-5 font-bold text-slate-400 uppercase">{selectedWaste.official_unit || 'kg'}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-8">
                <button onClick={handleCollect} className="btn btn-primary h-14 bg-emerald-600 border-none hover:bg-emerald-700 text-white rounded-2xl font-bold">
                  Onayla ve Puan Kazan
                </button>
                <button onClick={() => setSelectedWaste(null)} className="btn btn-ghost text-slate-400 font-bold">Vazgeç</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Community