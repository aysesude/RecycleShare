import { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthLayout from '../components/AuthLayout'
import { PhoneInput, LoadingButton } from '../components/FormElements'
import { useAuth } from '../context/AuthContext'

const GooglePhoneSetup = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { googleAuthComplete } = useAuth()
  
  const {
    googleId,
    email,
    firstName,
    lastName,
    profilePicture
  } = location.state || {}
  
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+90')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect if no Google data
  useEffect(() => {
    if (!googleId || !email) {
      navigate('/login')
    }
  }, [googleId, email, navigate])

  const validatePhone = () => {
    if (!phone) {
      setError('Phone number is required')
      return false
    }
    if (!/^[\d\s\-()]{7,15}$/.test(phone)) {
      setError('Please enter a valid phone number')
      return false
    }
    setError('')
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validatePhone()) return
    
    setLoading(true)
    try {
      const fullPhone = `${countryCode}${phone.replace(/\D/g, '')}`
      
      const response = await googleAuthComplete({
        googleId,
        email,
        firstName,
        lastName,
        profilePicture,
        phone: fullPhone
      })
      
      if (response.success) {
        toast.success('Welcome to RecycleShare! 🌿')
        navigate('/dashboard')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to complete registration'
      toast.error(errorMessage)
      
      if (errorMessage.includes('phone number is already')) {
        setError('This phone number is already registered')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout 
      title="Almost There!" 
      subtitle="Add your phone number to complete registration"
    >
      {/* User Info Card */}
      <div className="bg-eco-50 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-4">
          {profilePicture ? (
            <img 
              src={profilePicture} 
              alt={firstName}
              className="w-14 h-14 rounded-full border-2 border-emerald-200"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-eco-gradient flex items-center justify-center text-white text-xl font-bold">
              {firstName?.charAt(0)}{lastName?.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-800">{firstName} {lastName}</p>
            <p className="text-sm text-gray-500">{email}</p>
          </div>
        </div>
      </div>

      {/* Why Phone Number Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-blue-700">
          <span className="font-semibold">Why do we need this?</span>
          <br />
          Your phone number helps us verify your identity and enables important notifications about your recycling activities.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <PhoneInput
          label="Phone Number"
          name="phone"
          placeholder="555 123 4567"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value)
            if (error) setError('')
          }}
          countryCode={countryCode}
          onCountryCodeChange={setCountryCode}
          error={error}
          autoFocus
        />

        <LoadingButton
          type="submit"
          loading={loading}
          className="w-full mt-6"
        >
          Complete Registration
        </LoadingButton>
      </form>

      {/* Cancel Link */}
      <div className="text-center mt-6">
        <Link 
          to="/login"
          className="text-gray-600 hover:text-emerald-600 text-sm"
        >
          Cancel and go back
        </Link>
      </div>
    </AuthLayout>
  )
}

export default GooglePhoneSetup
