import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import toast from 'react-hot-toast'
import { FcGoogle } from 'react-icons/fc'
import AuthLayout from '../components/AuthLayout'
import { 
  TextInput, 
  PasswordInput, 
  PhoneInput,
  LoadingButton, 
  Divider,
  FiMail,
  FiUser
} from '../components/FormElements'
import { useAuth } from '../context/AuthContext'

const Register = () => {
  const navigate = useNavigate()
  const { register, googleAuth } = useAuth()
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [countryCode, setCountryCode] = useState('+90')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters'
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^[\d\s\-()]{7,15}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must include uppercase, lowercase, and number'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    try {
      const fullPhone = `${countryCode}${formData.phone.replace(/\D/g, '')}`
      
      const response = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: fullPhone,
        password: formData.password
      })
      
      if (response.success) {
        toast.success('Account created! Check your email for verification code.')
        navigate('/verify-otp', { 
          state: { email: formData.email } 
        })
      }
    } catch (error) {
      const errorData = error.response?.data
      
      if (errorData?.errors) {
        // Validation errors from backend
        const backendErrors = {}
        errorData.errors.forEach(err => {
          backendErrors[err.field] = err.message
        })
        setErrors(backendErrors)
      } else {
        toast.error(errorData?.message || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Google OAuth Handler
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true)
      try {
        const response = await googleAuth(tokenResponse.access_token)
        
        if (response.success) {
          if (response.data.requiresPhone) {
            navigate('/google-phone-setup', {
              state: {
                googleId: response.data.googleId,
                email: response.data.email,
                firstName: response.data.firstName,
                lastName: response.data.lastName,
                profilePicture: response.data.profilePicture
              }
            })
          } else {
            toast.success('Welcome to RecycleShare! 🌿')
            navigate('/dashboard')
          }
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Google sign up failed')
      } finally {
        setGoogleLoading(false)
      }
    },
    onError: () => {
      toast.error('Google sign up failed. Please try again.')
    }
  })

  return (
    <AuthLayout 
      title="Create Account" 
      subtitle="Join the eco-friendly community"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Fields - Side by Side */}
        <div className="grid grid-cols-2 gap-4">
          <TextInput
            label="First Name"
            icon={FiUser}
            type="text"
            name="firstName"
            placeholder="John"
            value={formData.firstName}
            onChange={handleChange}
            error={errors.firstName}
            autoComplete="given-name"
          />
          <TextInput
            label="Last Name"
            type="text"
            name="lastName"
            placeholder="Doe"
            value={formData.lastName}
            onChange={handleChange}
            error={errors.lastName}
            autoComplete="family-name"
          />
        </div>

        <TextInput
          label="Email Address"
          icon={FiMail}
          type="email"
          name="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          autoComplete="email"
        />

        <PhoneInput
          label="Phone Number"
          name="phone"
          placeholder="555 123 4567"
          value={formData.phone}
          onChange={handleChange}
          countryCode={countryCode}
          onCountryCodeChange={setCountryCode}
          error={errors.phone}
          autoComplete="tel"
        />

        <PasswordInput
          label="Password"
          name="password"
          placeholder="Min. 8 characters"
          value={formData.password}
          onChange={handleChange}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          error={errors.password}
          autoComplete="new-password"
        />

        <PasswordInput
          label="Confirm Password"
          name="confirmPassword"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleChange}
          showPassword={showConfirmPassword}
          onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        {/* Password requirements hint */}
        <div className="text-xs text-gray-500 bg-eco-50 p-3 rounded-lg">
          <p className="font-medium text-gray-600 mb-1">Password must contain:</p>
          <ul className="space-y-1">
            <li className={`flex items-center gap-2 ${formData.password.length >= 8 ? 'text-emerald-600' : ''}`}>
              <span>{formData.password.length >= 8 ? '✓' : '○'}</span> At least 8 characters
            </li>
            <li className={`flex items-center gap-2 ${/[A-Z]/.test(formData.password) ? 'text-emerald-600' : ''}`}>
              <span>{/[A-Z]/.test(formData.password) ? '✓' : '○'}</span> One uppercase letter
            </li>
            <li className={`flex items-center gap-2 ${/[a-z]/.test(formData.password) ? 'text-emerald-600' : ''}`}>
              <span>{/[a-z]/.test(formData.password) ? '✓' : '○'}</span> One lowercase letter
            </li>
            <li className={`flex items-center gap-2 ${/\d/.test(formData.password) ? 'text-emerald-600' : ''}`}>
              <span>{/\d/.test(formData.password) ? '✓' : '○'}</span> One number
            </li>
          </ul>
        </div>

        <LoadingButton
          type="submit"
          loading={loading}
          className="w-full mt-6"
        >
          Create Account
        </LoadingButton>
      </form>

      <Divider text="or sign up with" />

      {/* Google Sign Up Button */}
      <button
        onClick={() => handleGoogleLogin()}
        disabled={googleLoading}
        className="btn btn-outline w-full rounded-xl border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 font-semibold"
      >
        {googleLoading ? (
          <span className="loading loading-spinner loading-sm"></span>
        ) : (
          <>
            <FcGoogle className="w-5 h-5 mr-2" />
            Continue with Google
          </>
        )}
      </button>

      {/* Sign In Link */}
      <p className="text-center mt-6 text-gray-600">
        Already have an account?{' '}
        <Link 
          to="/login" 
          className="text-emerald-600 font-semibold hover:text-emerald-700 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}

export default Register
