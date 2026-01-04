import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { FiArrowLeft } from 'react-icons/fi'

const BrowseListings = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [pageError, setPageError] = useState(null)

  const [wasteTypes, setWasteTypes] = useState([])
  const [filters, setFilters] = useState({ city: '', district: '', neighborhood: '', street: '', type_id: '' })
  const [pendingOnly, setPendingOnly] = useState(true)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(false)

  const [reserveModal, setReserveModal] = useState({ open: false, item: null, datetime: '' })
  const [reservations, setReservations] = useState([])

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchWasteTypes(),
          fetchListings(),
          fetchMyReservations()
        ])
      } catch (error) {
        console.error('Error loading page data:', error)
        setPageError('Failed to load page. Please check your connection and try again.')
      }
    }
    loadData()
  }, [])

  const fetchWasteTypes = async () => {
    try {
      const res = await api.get('/waste/types')
      console.log('Waste types response:', res.data)
      setWasteTypes(res.data?.data || res.data || [])
    } catch (err) {
      console.error('Error fetching waste types:', err)
      setWasteTypes([])
    }
  }

  const buildQuery = () => {
    const params = {}
    if (filters.city) params.city = filters.city
    if (filters.district) params.district = filters.district
    if (filters.neighborhood) params.neighborhood = filters.neighborhood
    if (filters.street) params.street = filters.street
    if (filters.type_id) params.type_id = filters.type_id
    if (pendingOnly) params.status = 'waiting'
    return params
  }

  const fetchListings = async () => {
    try {
      setLoading(true)
      const params = buildQuery()
      console.log('Fetching listings with params:', params)
      const res = await api.get('/waste', { params })
      console.log('Listings response:', res.data)
      setListings(res.data?.data || res.data || [])
    } catch (err) {
      console.error('Error fetching listings:', err)
      toast.error(err.response?.data?.message || err.message || 'Failed to load listings')
      setListings([])
    } finally {
      setLoading(false)
    }
  }

  const fetchMyReservations = async () => {
    try {
      const res = await api.get('/reservations/my/collector')
      console.log('Reservations response:', res.data)
      setReservations(res.data?.data || res.data || [])
    } catch (err) {
      console.error('Error fetching reservations:', err)
      setReservations([])
    }
  }

  const handleReserveClick = (item) => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(14, 0, 0, 0)
    const isoLocal = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0,16)
    setReserveModal({ open: true, item, datetime: isoLocal })
  }

  const submitReserve = async () => {
    const { item, datetime } = reserveModal
    if (!item) return
    if (!datetime) return toast.error('Please choose date & time')
    try {
      setLoading(true)
      const payload = { waste_id: item.waste_id || item.id || item.wasteId, pickup_datetime: new Date(datetime).toISOString() }
      const res = await api.post('/reservations', payload)
      toast.success(res.data?.message || 'Reserved')
      setListings((prev) => prev.filter((l) => (l.waste_id || l.id) !== (item.waste_id || item.id)))
      setReserveModal({ open: false, item: null, datetime: '' })
      fetchMyReservations()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Reservation failed')
    } finally {
      setLoading(false)
    }
  }

  if (pageError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-eco-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="eco-card p-8 max-w-md text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Error Loading Page</h2>
          <p className="text-gray-600 mb-4">{pageError}</p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-eco-50 via-white to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/dashboard')}
              className="btn btn-ghost btn-sm gap-2"
              title="Go back to dashboard"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back
            </button>
            <h1 className="text-2xl font-bold">Browse Listings & Reserve</h1>
          </div>
        </div>

        {/* Filters Section */}
        <div className="eco-card p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <select 
              value={filters.type_id} 
              onChange={(e) => setFilters({ ...filters, type_id: e.target.value })} 
              className="select select-bordered select-sm"
            >
              <option value="">All Types</option>
              {wasteTypes.map((wt) => (
                <option key={wt.type_id} value={wt.type_id}>{wt.type_name}</option>
              ))}
            </select>

            <input 
              placeholder="City" 
              value={filters.city} 
              onChange={(e) => setFilters({ ...filters, city: e.target.value })} 
              className="input input-bordered input-sm" 
            />

            <input 
              placeholder="District" 
              value={filters.district} 
              onChange={(e) => setFilters({ ...filters, district: e.target.value })} 
              className="input input-bordered input-sm" 
            />

            <input 
              placeholder="Neighborhood" 
              value={filters.neighborhood} 
              onChange={(e) => setFilters({ ...filters, neighborhood: e.target.value })} 
              className="input input-bordered input-sm" 
            />

            <input 
              placeholder="Street" 
              value={filters.street} 
              onChange={(e) => setFilters({ ...filters, street: e.target.value })} 
              className="input input-bordered input-sm" 
            />

            <label className="flex items-center gap-2 justify-center">
              <input 
                type="checkbox" 
                checked={pendingOnly} 
                onChange={(e) => setPendingOnly(e.target.checked)} 
                className="checkbox checkbox-sm" 
              />
              <span className="text-sm">Only Pending</span>
            </label>
          </div>

          {/* Action Buttons - 2x3 Matrix */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <button 
              onClick={fetchListings} 
              className="btn btn-primary btn-sm w-full"
            >
              Search
            </button>
            <button 
              onClick={() => { 
                setFilters({ city: '', district: '', neighborhood: '', street: '', type_id: '' }); 
                setPendingOnly(true); 
                fetchListings() 
              }} 
              className="btn btn-ghost btn-sm w-full"
            >
              Clear
            </button>
            <button 
              onClick={fetchMyReservations}
              className="btn btn-info btn-sm w-full"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Listings Column */}
          <div className="lg:col-span-2">
            <div className="eco-card p-4">
              <h2 className="text-lg font-semibold mb-4">Available Listings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {loading && listings.length === 0 ? (
                  <div className="col-span-full py-8 flex justify-center">
                    <span className="loading loading-spinner loading-lg text-emerald-500"></span>
                  </div>
                ) : listings.length === 0 ? (
                  <div className="col-span-full text-sm text-gray-500 p-6 text-center">No listings found.</div>
                ) : listings.map((l) => (
                  <div key={l.waste_id || l.id} className="p-3 border rounded-lg bg-white hover:shadow-md transition">
                    <div className="text-sm text-gray-700 font-semibold">{[l.city, l.neighborhood].filter(Boolean).join(', ') || l.city || 'Unknown'}</div>
                    <div className="text-sm text-gray-600">{l.amount} {l.official_unit || 'kg'} — {l.type_name || l.waste_type_name || l.type}</div>
                    <div className="text-xs text-gray-500 mt-2">{l.description ? l.description.slice(0,80) : ''}</div>
                    <div className="mt-3 flex justify-end">
                      <button 
                        onClick={() => handleReserveClick(l)} 
                        className="btn btn-sm btn-primary"
                      >
                        Reserve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* My Reservations Sidebar */}
          <div className="space-y-4">
            <div className="eco-card p-4">
              <h3 className="text-lg font-semibold mb-3">My Reservations</h3>

              <div className="space-y-3">
                {reservations.length === 0 ? (
                  <div className="text-sm text-gray-500 p-4 text-center bg-gray-50 rounded">No reservations yet.</div>
                ) : reservations.map((r) => (
                  <div key={r.reservation_id || r.id} className="p-3 border rounded-lg bg-white">
                    <div className="text-sm font-semibold">{r.type_name || r.type}</div>
                    <div className="text-xs text-gray-600">{r.waste_description || r.description}</div>
                    <div className="text-xs text-gray-500 mt-2">
                      Pickup: {r.pickup_datetime ? new Date(r.pickup_datetime).toLocaleString() : '-'}
                    </div>
                    <div className="text-xs text-gray-700 mt-2">
                      Address: {[r.city, r.district, r.neighborhood, r.street, r.address_details].filter(Boolean).join(', ')}
                    </div>
                    <div className="text-xs text-gray-700">
                      Phone: {r.owner_phone}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Status: <span className="badge badge-sm">{r.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="eco-card p-4">
              <h3 className="text-lg font-semibold mb-2">How It Works</h3>
              <ul className="text-sm text-gray-600 list-disc ml-5 space-y-1">
                <li>Click <strong>Reserve</strong> to schedule pickup</li>
                <li>Resident contact info appears here</li>
                <li>Combine filters with AND logic</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Reserve Modal */}
        {reserveModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-md p-6">
              <h3 className="text-lg font-semibold mb-2">Schedule Pickup</h3>
              <div className="text-sm text-gray-600 mb-3">
                {reserveModal.item?.type_name || reserveModal.item?.waste_type_name} — {reserveModal.item?.amount} {reserveModal.item?.official_unit || 'kg'}
              </div>
              <label className="label"><span className="label-text">When will you pick it up?</span></label>
              <input 
                type="datetime-local" 
                value={reserveModal.datetime} 
                onChange={(e) => setReserveModal({ ...reserveModal, datetime: e.target.value })} 
                className="input input-bordered w-full" 
              />
              <div className="flex justify-end gap-2 mt-4">
                <button 
                  onClick={() => setReserveModal({ open: false, item: null, datetime: '' })} 
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={submitReserve} 
                  className="btn btn-primary btn-sm"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default BrowseListings