import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { FiArrowLeft } from 'react-icons/fi'

const Listings = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [form, setForm] = useState({
    description: '',
    weight: '',
    type_id: '',
    latitude: '',
    longitude: ''
  })

  const [userAddress, setUserAddress] = useState('')
  const [editingAddress, setEditingAddress] = useState(false)

  const [wasteTypes, setWasteTypes] = useState([])
  const [listings, setListings] = useState([])
  const [showListings, setShowListings] = useState(false)
  const [loading, setLoading] = useState(false)

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
    
    // Set user address from logged-in user
    if (user?.address) {
      setUserAddress(user.address)
    }
    
    fetchWasteTypes()
  }, [user])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const payload = {
        description: form.description,
        amount: parseFloat(form.weight) || 0,
        type_id: parseInt(form.type_id),
        latitude: form.latitude || null,
        longitude: form.longitude || null
      }

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
                  <label className="label"><span className="label-text">Weight (kg)</span></label>
                  <input name="weight" value={form.weight} onChange={handleChange} type="number" step="0.1" className="input input-bordered w-full" required />
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

              <div className="grid grid-cols-2 gap-2">
                <input name="latitude" value={form.latitude} onChange={handleChange} placeholder="Latitude (optional)" type="number" step="0.0001" className="input input-bordered w-full" />
                <input name="longitude" value={form.longitude} onChange={handleChange} placeholder="Longitude (optional)" type="number" step="0.0001" className="input input-bordered w-full" />
              </div>

              <div className="flex items-center gap-3">
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? 'Saving...' : 'Add Item'}
                </button>
                <button type="button" onClick={() => setForm({ description: '', weight: '', type_id: '', latitude: '', longitude: '' })} className="btn btn-ghost">Clear</button>
              </div>
            </form>

            <div className="mt-4 text-sm text-gray-500">
              Location: <strong>{userAddress || 'Not set'}</strong>
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
                  <input 
                    type="text" 
                    value={userAddress} 
                    onChange={(e) => setUserAddress(e.target.value)} 
                    placeholder="Enter your address" 
                    className="input input-bordered w-full" 
                  />
                  <button onClick={() => { setEditingAddress(false); toast.success('Address saved') }} className="btn btn-sm btn-primary">Save Address</button>
                </div>
              ) : (
                <p className="text-gray-700">{userAddress || 'No address set. Edit to add your location.'}</p>
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
                            <div>Amount: {l.amount || l.weight} kg</div>
                            <div>Status: <span className="badge badge-sm badge-success">{l.status || 'waiting'}</span></div>
                            {l.record_date && <div>Added: {new Date(l.record_date).toLocaleDateString()}</div>}
                          </div>
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
      </div>
    </div>
  )
}

export default Listings
