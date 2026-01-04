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
      toast.error('Failed to load waste types')
      setWasteTypes([])
      throw err
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
    // open modal with default tomorrow 14:00
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
      // remove item from listings
      setListings((prev) => prev.filter((l) => (l.waste_id || l.id) !== (item.waste_id || item.id)))
      setReserveModal({ open: false, item: null, datetime: '' })
      // refresh my reservations (to show contact/address)
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
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn btn-ghost btn-sm gap-2"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-2xl font-bold">Browse Listings & Reserve Pickup</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filters + Listings matrix (main) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="eco-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <select value={filters.type_id} onChange={(e) => setFilters({ ...filters, type_id: e.target.value })} className="select select-bordered">
                  <option value="">All types</option>
                  {wasteTypes.map((wt) => (
                    <option key={wt.type_id} value={wt.type_id}>{wt.type_name}</option>
                  ))}
                </select>

                <input placeholder="City" value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} className="input input-bordered" />
                <input placeholder="District" value={filters.district} onChange={(e) => setFilters({ ...filters, district: e.target.value })} className="input input-bordered" />
                <input placeholder="Neighborhood" value={filters.neighborhood} onChange={(e) => setFilters({ ...filters, neighborhood: e.target.value })} className="input input-bordered" />
                <input placeholder="Street" value={filters.street} onChange={(e) => setFilters({ ...filters, street: e.target.value })} className="input input-bordered" />

                <label className="flex items-center gap-2 ml-2">
                  <input type="checkbox" checked={pendingOnly} onChange={(e) => setPendingOnly(e.target.checked)} className="checkbox" />
                  <span className="text-sm">Only Pending</span>
                </label>

                <button onClick={fetchListings} className="btn btn-primary ml-auto">Listele</button>
                <button onClick={() => { setFilters({ city: '', district: '', neighborhood: '', street: '', type_id: '' }); setPendingOnly(true); fetchListings() }} className="btn btn-ghost">Clear</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {loading && listings.length === 0 ? (
                  <div className="col-span-full py-8 flex justify-center"><span className="loading loading-spinner loading-lg text-emerald-500"></span></div>
                ) : listings.length === 0 ? (
                  <div className="col-span-full text-sm text-gray-500 p-6">No listings found.</div>
                ) : listings.map((l) => (
                  <div key={l.waste_id || l.id} className="p-3 border rounded-lg bg-white">
                    <div className="text-sm text-gray-700 font-semibold">{[l.city, l.neighborhood].filter(Boolean).join(', ') || l.city || 'Unknown'}</div>
                    <div className="text-sm text-gray-600">{l.amount} {l.official_unit || 'kg'} — {l.type_name || l.waste_type_name || l.type}</div>
                    <div className="text-xs text-gray-500 mt-2">{l.description ? l.description.slice(0,80) : ''}</div>
                    <div className="mt-3 flex justify-end">
                      <button onClick={() => handleReserveClick(l)} className="btn btn-sm btn-primary">Rezerve Et</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: My Reservations */}
          <div className="space-y-4">
            <div className="eco-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">My Reservations</h3>
                <button onClick={fetchMyReservations} className="btn btn-sm btn-ghost">Refresh</button>
              </div>

              <div className="space-y-3">
                {reservations.length === 0 ? (
                  <div className="text-sm text-gray-500">No reservations yet.</div>
                ) : reservations.map((r) => (
                  <div key={r.reservation_id || r.id} className="p-3 border rounded-lg bg-white">
                    <div className="text-sm font-semibold">{r.type_name || r.type}</div>
                    <div className="text-xs text-gray-600">{r.waste_description || r.description}</div>
                    <div className="text-xs text-gray-500 mt-2">Pickup: {r.pickup_datetime ? new Date(r.pickup_datetime).toLocaleString() : '-'}</div>
                    <div className="text-xs text-gray-700 mt-2">Address: {[r.city, r.district, r.neighborhood, r.street, r.address_details].filter(Boolean).join(', ')}</div>
                    <div className="text-xs text-gray-700">Phone: {r.owner_phone || r.owner_phone}</div>
                    <div className="text-xs text-gray-500 mt-1">Status: {r.status}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="eco-card p-4">
              <h3 className="font-semibold mb-2">Hints</h3>
              <ul className="text-sm text-gray-600 list-disc ml-5 space-y-1">
                <li>Click <strong>Rezerve Et</strong> to set pickup date/time.</li>
                <li>After reserving, resident phone & address appear in your reservations.</li>
                <li>Filters are combined using AND — leave fields empty to ignore them.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Reserve Modal */}
        {reserveModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-md p-6">
              <h3 className="text-lg font-semibold mb-2">Reserve Pickup</h3>
              <div className="text-sm text-gray-600 mb-3">{reserveModal.item?.type_name || reserveModal.item?.waste_type_name} — {reserveModal.item?.amount} {reserveModal.item?.official_unit || 'kg'}</div>
              <label className="label"><span className="label-text">Ne zaman gideceksiniz?</span></label>
              <input type="datetime-local" value={reserveModal.datetime} onChange={(e) => setReserveModal({ ...reserveModal, datetime: e.target.value })} className="input input-bordered w-full" />
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setReserveModal({ open: false, item: null, datetime: '' })} className="btn btn-ghost">Cancel</button>
                <button onClick={submitReserve} className="btn btn-primary">Confirm</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default BrowseListings
