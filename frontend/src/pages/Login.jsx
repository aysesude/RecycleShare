import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import toast from 'react-hot-toast'
import AuthLayout from '../components/AuthLayout'
import { 
  TextInput, 
  PasswordInput, 
  LoadingButton, 
  Divider,
  FiMail 
} from '../components/FormElements'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const navigate = useNavigate()
  const { login, googleAuth } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    try {
      const response = await login(formData.email, formData.password)
      
      if (response.success) {
        toast.success('Welcome back! 🌿')
        navigate('/dashboard')
      }
    } catch (error) {
      const errorData = error.response?.data
      
      if (errorData?.data?.requiresVerification) {
        toast.error('Please verify your email first')
        navigate('/verify-otp', { 
          state: { email: errorData.data.email } 
        })
      } else {
        toast.error(errorData?.message || 'Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Google OAuth Success Handler
  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleLoading(true)
    try {
      const response = await googleAuth(credentialResponse.credential)
      
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
          toast.success('Welcome back! 🌿')
          navigate('/dashboard')
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Google login failed')
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleGoogleError = () => {
    toast.error('Google login failed. Please try again.')
  }

  return (
    <AuthLayout 
      title="Welcome Back" 
      subtitle="Sign in to continue your eco journey"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <PasswordInput
          label="Password"
          name="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          error={errors.password}
          autoComplete="current-password"
        />

        {/* Forgot Password Link */}
        <div className="text-right">
          <Link 
            to="/forgot-password" 
            className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <LoadingButton
          type="submit"
          loading={loading}
          className="w-full mt-6"
        >
          Sign In
        </LoadingButton>
      </form>

      <Divider text="or continue with" />

      {/* Google Login Button */}
      <div className="flex justify-center">
        {googleLoading ? (
          <div className="btn btn-outline w-full rounded-xl border-gray-200">
            <span className="loading loading-spinner loading-sm"></span>
          </div>
        ) : (
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            theme="outline"
            size="large"
            text="continue_with"
            shape="rectangular"
          />
        )}
      </div>

      {/* Sign Up Link */}
      <p className="text-center mt-6 text-gray-600">
        Don't have an account?{' '}
        <Link 
          to="/register" 
          className="text-emerald-600 font-semibold hover:text-emerald-700 hover:underline"
        >
          Sign up for free
        </Link>
      </p>
    </AuthLayout>
  )
}

export default Login
