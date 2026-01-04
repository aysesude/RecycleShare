import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { FiArrowLeft, FiTrash } from 'react-icons/fi'

const Listings = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [form, setForm] = useState({
    description: '',
    weight: '',
    type_id: ''
  })

  const [addressFields, setAddressFields] = useState({
    city: '',
    district: '',
    neighborhood: '',
    street: '',
    address_details: ''
  })
  const [editingAddress, setEditingAddress] = useState(false)

  const [wasteTypes, setWasteTypes] = useState([])
  const [listings, setListings] = useState([])
  const [showListings, setShowListings] = useState(false)
  const [loading, setLoading] = useState(false)
  const [idToDelete, setIdToDelete] = useState(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  // Fetch waste types on mount
  useEffect(() => {
    const fetchWasteTypes = async () => {
      try {
        const res = await api.get('/waste/types')
        setWasteTypes(res.data?.data || [])
      } catch (err) {
        toast.error('Failed to load waste types')
      }
    }
    
    // Set user address fields from logged-in user
    if (user) {
      setAddressFields({
        city: user.city || '',
        district: user.district || '',
        neighborhood: user.neighborhood || '',
        street: user.street || '',
        address_details: user.address_details || ''
      })
    }
    
    fetchWasteTypes()
  }, [user])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleAddressChange = (e) => {
    setAddressFields({ ...addressFields, [e.target.name]: e.target.value })
  }

  const selectedType = wasteTypes.find((wt) => String(wt.type_id) === String(form.type_id))
  const weightUnit = selectedType?.official_unit || 'kg'

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const payload = {
        description: form.description,
        amount: parseFloat(form.weight) || 0,
        type_id: parseInt(form.type_id),
      }

      // include composed address from user address fields if present
      const composedAddress = [addressFields.street, addressFields.neighborhood, addressFields.district, addressFields.city].filter(Boolean).join(', ')
      if (composedAddress) payload.address = composedAddress

      const res = await api.post('/waste', payload)
      toast.success(res?.data?.message || 'Waste item created')
      setForm({ description: '', weight: '', type_id: '', latitude: '', longitude: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create listing')
    } finally {
      setLoading(false)
    }
  }

  const handleShowListings = async () => {
    try {
      setLoading(true)
      const res = await api.get('/waste/my')
      setListings(res.data?.data || res.data || [])
      setShowListings(true)
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to fetch listings')
    } finally {
      setLoading(false)
    }
  }

  // Open confirmation modal
  const handleDelete = (id) => {
    setIdToDelete(id)
    setConfirmDeleteOpen(true)
  }

  // Confirmed delete
  const handleConfirmDelete = async () => {
    if (!idToDelete) return
    try {
      setLoading(true)
      const res = await api.delete(`/waste/${idToDelete}`)
      toast.success(res.data?.message || 'Item deleted')
      setListings((prev) => prev.filter((it) => (it.waste_id || it.id) !== idToDelete))
      setIdToDelete(null)
      setConfirmDeleteOpen(false)
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Delete failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-eco-50 via-white to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/dashboard')} className="btn btn-ghost p-2">
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Start Recycling — Create & Browse Listings</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Create Listing Form */}
          <div className="eco-card p-6">
            <h2 className="text-lg font-semibold mb-4">Add New Waste Item</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea name="description" value={form.description} onChange={handleChange} className="textarea textarea-bordered w-full" rows={3} placeholder="Describe the waste item..." />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label"><span className="label-text">Weight ({weightUnit})</span></label>
                  <input name="weight" value={form.weight} onChange={handleChange} type="number" step={weightUnit === 'adet' ? '1' : '0.1'} placeholder={`Enter amount (${weightUnit})`} className="input input-bordered w-full" required />
                </div>
                <div>
                  <label className="label"><span className="label-text">Waste Type</span></label>
                  <select name="type_id" value={form.type_id} onChange={handleChange} required className="select select-bordered w-full">
                    <option value="">Select Type</option>
                    {wasteTypes.map((wt) => (
                      <option key={wt.type_id} value={wt.type_id}>{wt.type_name}</option>
                    ))}
                  </select>
                </div>
              </div>


              <div className="flex items-center gap-3">
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? 'Saving...' : 'Add Item'}
                </button>
                <button type="button" onClick={() => setForm({ description: '', weight: '', type_id: '' })} className="btn btn-ghost">Clear</button>
              </div>
            </form>

            <div className="mt-4 text-sm text-gray-500">
              Location: <strong>{[addressFields.street, addressFields.neighborhood, addressFields.district, addressFields.city].filter(Boolean).join(', ') || 'Not set'}</strong>
            </div>
          </div>

          {/* Right: Address & Listings Panel */}
          <div className="space-y-6">
            {/* Address Section */}
            <div className="eco-card p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Your Address</h2>
                  <button onClick={() => setEditingAddress(!editingAddress)} className="btn btn-ghost btn-sm">
                    {editingAddress ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                {editingAddress ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <input name="city" value={addressFields.city} onChange={handleAddressChange} placeholder="City" className="input input-bordered w-full" />
                      <input name="district" value={addressFields.district} onChange={handleAddressChange} placeholder="District" className="input input-bordered w-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input name="neighborhood" value={addressFields.neighborhood} onChange={handleAddressChange} placeholder="Neighborhood" className="input input-bordered w-full" />
                      <input name="street" value={addressFields.street} onChange={handleAddressChange} placeholder="Street" className="input input-bordered w-full" />
                    </div>
                    <div>
                      <input name="address_details" value={addressFields.address_details} onChange={handleAddressChange} placeholder="Address details (apt, floor, notes)" className="input input-bordered w-full" />
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={async () => {
                        try {
                          setEditingAddress(false);
                          const res = await api.put('/auth/me', addressFields);
                          // update localStorage user object if present
                          try {
                            const stored = JSON.parse(localStorage.getItem('user') || '{}')
                            const updated = { ...stored, city: res.data?.data?.user?.city || addressFields.city, district: res.data?.data?.user?.district || addressFields.district, neighborhood: res.data?.data?.user?.neighborhood || addressFields.neighborhood, street: res.data?.data?.user?.street || addressFields.street, address_details: res.data?.data?.user?.address_details || addressFields.address_details }
                            localStorage.setItem('user', JSON.stringify(updated))
                          } catch (e) {}
                          toast.success(res.data?.message || 'Address saved')
                        } catch (err) {
                          toast.error(err.response?.data?.message || err.message || 'Failed to save address')
                        }
                      }} className="btn btn-sm btn-primary">Save Address</button>
                      <button onClick={() => { setEditingAddress(false); setAddressFields({ city: user?.city||'', district: user?.district||'', neighborhood: user?.neighborhood||'', street: user?.street||'', address_details: user?.address_details||'' }) }} className="btn btn-sm btn-ghost">Reset</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-700">{[addressFields.street, addressFields.neighborhood, addressFields.district, addressFields.city].filter(Boolean).join(', ') || 'No address set.'}</p>
                    {addressFields.address_details && <p className="text-sm text-gray-500 mt-2">{addressFields.address_details}</p>}
                  </div>
                )}
            </div>

            {/* Listings Section */}
            <div className="eco-card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">My Waste Items</h2>
                <div className="flex items-center gap-2">
                  <button onClick={handleShowListings} className="btn btn-outline btn-sm">Refresh</button>
                  <button onClick={() => { setShowListings(false); setListings([]) }} className="btn btn-ghost btn-sm">Hide</button>
                </div>
              </div>

              {loading && !showListings && (
                <div className="flex items-center justify-center py-8">
                  <span className="loading loading-spinner loading-lg text-emerald-500"></span>
                </div>
              )}

              {showListings && (
                <div className="space-y-3">
                  {listings.length === 0 && (
                    <div className="text-sm text-gray-500">No waste items yet. Add one above!</div>
                  )}

                  {listings.map((l) => (
                    <div key={l.waste_id || l.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{l.waste_type_name || l.type}</h3>
                              <p className="text-sm text-gray-600">{l.description}</p>
                              <div className="text-xs text-gray-500 mt-2 space-y-1">
                                <div>Amount: {l.amount || l.weight} {l.official_unit || 'kg'}</div>
                                <div>Status: <span className="badge badge-sm badge-success">{l.status || 'waiting'}</span></div>
                                {l.record_date && <div>Added: {new Date(l.record_date).toLocaleDateString()}</div>}
                              </div>
                            </div>
                            <div className="ml-4">
                              <button onClick={() => handleDelete(l.waste_id || l.id)} className="btn btn-sm btn-error flex items-center gap-2">
                                <FiTrash className="w-3 h-3" />
                                Delete
                              </button>
                            </div>
                          </div>
                    </div>
                  ))}
                </div>
              )}

              {!showListings && (
                <div className="text-sm text-gray-500">Press "Refresh" to load your waste items.</div>
              )}
            </div>
          </div>
        </div>
        {confirmDeleteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-sm p-6">
              <h3 className="text-lg font-semibold mb-2">Confirm Delete</h3>
              <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete this waste item? This action cannot be undone.</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => { setConfirmDeleteOpen(false); setIdToDelete(null) }} className="btn btn-ghost">Cancel</button>
                <button onClick={handleConfirmDelete} className="btn btn-error">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Listings
