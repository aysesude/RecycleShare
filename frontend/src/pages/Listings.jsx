import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { FiArrowLeft } from 'react-icons/fi'

const Listings = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [form, setForm] = useState({
    title: '',
    description: '',
    weight: '',
    type: '',
    image_url: '',
    latitude: '',
    longitude: '',
    address: ''
  })

  const [listings, setListings] = useState([])
  const [showListings, setShowListings] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const payload = {
        title: form.title,
        description: form.description,
        weight: parseFloat(form.weight) || 0,
        type: form.type,
        image_url: form.image_url,
        latitude: form.latitude || null,
        longitude: form.longitude || null,
        address: form.address || ''
      }

      const res = await api.post('/listings', payload)
      toast.success(res?.data?.message || 'Listing created')
      setForm({ title: '', description: '', weight: '', type: '', image_url: '', latitude: '', longitude: '', address: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create listing')
    } finally {
      setLoading(false)
    }
  }

  const handleShowListings = async () => {
    try {
      setLoading(true)
      const res = await api.get('/listings')
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
            <h2 className="text-lg font-semibold mb-4">Add New Listing</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Title</span>
                </label>
                <input name="title" value={form.title} onChange={handleChange} required className="input input-bordered w-full" />
              </div>

              <div>
                <label className="label"><span className="label-text">Description</span></label>
                <textarea name="description" value={form.description} onChange={handleChange} className="textarea textarea-bordered w-full" rows={3} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label"><span className="label-text">Weight (kg)</span></label>
                  <input name="weight" value={form.weight} onChange={handleChange} type="number" step="0.1" className="input input-bordered w-full" />
                </div>
                <div>
                  <label className="label"><span className="label-text">Type</span></label>
                  <input name="type" value={form.type} onChange={handleChange} placeholder="Plastic, Paper, Glass..." className="input input-bordered w-full" />
                </div>
              </div>

              <div>
                <label className="label"><span className="label-text">Image URL</span></label>
                <input name="image_url" value={form.image_url} onChange={handleChange} className="input input-bordered w-full" />
              </div>

              <div>
                <label className="label"><span className="label-text">Address (optional)</span></label>
                <input name="address" value={form.address} onChange={handleChange} className="input input-bordered w-full" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input name="latitude" value={form.latitude} onChange={handleChange} placeholder="Latitude" className="input input-bordered w-full" />
                <input name="longitude" value={form.longitude} onChange={handleChange} placeholder="Longitude" className="input input-bordered w-full" />
              </div>

              <div className="flex items-center gap-3">
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? 'Saving...' : 'Create Listing'}
                </button>
                <button type="button" onClick={() => setForm({ title: '', description: '', weight: '', type: '', image_url: '', latitude: '', longitude: '', address: '' })} className="btn btn-ghost">Clear</button>
              </div>
            </form>

            <div className="mt-4 text-sm text-gray-500">
              You are creating this listing as <strong>{user?.firstName} {user?.lastName}</strong>
            </div>
          </div>

          {/* Right: Listings Panel */}
          <div className="eco-card p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Listings</h2>
              <div className="flex items-center gap-2">
                <button onClick={handleShowListings} className="btn btn-outline">Show Listings</button>
                <button onClick={() => { setShowListings(false); setListings([]) }} className="btn btn-ghost">Hide</button>
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
                  <div className="text-sm text-gray-500">No listings found.</div>
                )}

                {listings.map((l) => (
                  <div key={l.listing_id || l.id} className="p-3 border rounded-lg flex gap-3 items-start">
                    {l.image_url ? (
                      <img src={l.image_url} alt={l.title} className="w-20 h-20 object-cover rounded-md" />
                    ) : (
                      <div className="w-20 h-20 bg-eco-100 rounded-md flex items-center justify-center text-gray-500">No Image</div>
                    )}
                    <div>
                      <h3 className="font-semibold">{l.title || l.name}</h3>
                      <p className="text-sm text-gray-600">{l.description}</p>
                      <div className="text-xs text-gray-500 mt-2">{l.type} • {l.weight} kg</div>
                      {l.address && <div className="text-xs text-gray-500">{l.address}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!showListings && (
              <div className="text-sm text-gray-500">Press "Show Listings" to load available listings.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Listings
