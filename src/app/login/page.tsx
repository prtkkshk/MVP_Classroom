'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import useAuthStore from '@/store/authStore'
import { useUsernameAvailability } from '@/hooks/use-username-availability'
import { GraduationCap, Loader2, Eye, EyeOff, UserPlus, Mail, User, Lock, LogIn, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    name: '',
    remember: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [csrfToken] = useState('valid-csrf-token') // In real app, generate this
  
  const router = useRouter()
  const signIn = useAuthStore(state => state.signIn)
  const signUp = useAuthStore(state => state.signUp)
  const signOut = useAuthStore(state => state.signOut)
  
  // Use the proper username availability hook
  const usernameAvailability = useUsernameAvailability(formData.username, 3)

  // Load saved credentials on component mount
  useEffect(() => {
    const savedUsername = localStorage.getItem('infralearn_saved_username')
    const savedRemember = localStorage.getItem('infralearn_remember') === 'true'
    
    if (savedUsername && savedRemember) {
      setFormData(prev => ({
        ...prev,
        username: savedUsername,
        remember: true
      }))
    }
  }, [])

  // Clear username when switching to create account form
  useEffect(() => {
    if (isSignUp) {
      setFormData(prev => ({
        ...prev,
        username: ''
      }))
      setErrors({})
    }
  }, [isSignUp])

  // Validate form fields
  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (isSignUp) {
      if (!formData.name.trim()) {
        newErrors.name = 'Full name is required'
      }
      
      if (!formData.username.trim()) {
        newErrors.username = 'Username is required'
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters'
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        newErrors.username = 'Username can only contain letters, numbers, and underscores'
      }
      
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address'
      } else if (isSignUp && !formData.email.endsWith('@institute.edu')) {
        newErrors.email = 'Must use institutional email'
      }
      
      if (!formData.password) {
        newErrors.password = 'Password is required'
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters'
      }
    } else {
      if (!formData.username.trim()) {
        newErrors.username = 'Username is required'
      }
      
      if (!formData.password) {
        newErrors.password = 'Password is required'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    if (isLocked) {
      toast.error('Account temporarily locked due to too many failed attempts')
      return
    }
    
    setIsLoading(true)

    try {
      if (isSignUp) {
        // Check if username is taken before proceeding
        if (usernameAvailability.isAvailable === false) {
          toast.error('Please choose a different username')
          setIsLoading(false)
          return
        }
        
        // Handle signup
        const result = await signUp(formData.email, formData.password, formData.username, formData.name, 'student')
        
        if (result.success) {
          toast.success('Account created successfully! Please sign in.')
          setIsSignUp(false)
          setFormData(prev => ({
            ...prev,
            password: '',
            username: '',
            name: ''
          }))
        } else {
          toast.error(result.error || 'Failed to create account')
        }
      } else {
        // Handle signin
        const result = await signIn(formData.username, formData.password, csrfToken)
        
        if (result.success) {
          // Reset login attempts on success
          setLoginAttempts(0)
          setIsLocked(false)
          
          // Handle remember me functionality
          if (formData.remember) {
            localStorage.setItem('infralearn_saved_username', formData.username)
            localStorage.setItem('infralearn_remember', 'true')
          } else {
            localStorage.removeItem('infralearn_saved_username')
            localStorage.removeItem('infralearn_remember')
          }

          toast.success('Welcome to InfraLearn!')
          // Get user role and redirect accordingly
          const user = useAuthStore.getState().user
          
          switch (user?.role) {
            case 'super_admin':
              router.push('/admin')
              break
            case 'professor':
              router.push('/dashboard')
              break
            case 'student':
              router.push('/dashboard')
              break
            default:
              router.push('/dashboard')
          }
        } else {
          // Handle failed login attempts
          const newAttempts = loginAttempts + 1
          setLoginAttempts(newAttempts)
          
          if (newAttempts >= 5) {
            setIsLocked(true)
            toast.error('Too many failed attempts. Account temporarily locked.')
          } else {
            toast.error(result.error || 'Invalid username or password')
          }
        }
      }
    } catch (error: any) {
      if (error.message?.includes('Network')) {
        toast.error('Network error. Please check your connection.')
      } else if (error.message?.includes('Database')) {
        toast.error('Database connection failed. Please try again later.')
      } else if (error.message?.includes('Rate limit')) {
        toast.error('Rate limit exceeded. Please try again later.')
      } else {
        toast.error(isSignUp ? 'Signup failed. Please try again.' : 'Login failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    // Real-time validation for specific fields
    if (field === 'username' && typeof value === 'string') {
      if (value.length > 0 && value.length < 3) {
        setErrors(prev => ({ ...prev, username: 'Username must be at least 3 characters' }))
      } else if (value.length >= 3 && !/^[a-zA-Z0-9_]+$/.test(value)) {
        setErrors(prev => ({ ...prev, username: 'Username can only contain letters, numbers, and underscores' }))
      }
    }
    
    if (field === 'password' && typeof value === 'string') {
      if (value.length > 0 && value.length < 8) {
        setErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters' }))
      }
    }
    
    if (field === 'email' && typeof value === 'string') {
      if (value.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }))
      } else if (value.length > 0 && isSignUp && !value.endsWith('@institute.edu')) {
        setErrors(prev => ({ ...prev, email: 'Must use institutional email' }))
      }
    }
  }

  // Handle logout (for testing purposes)
  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Logged out successfully')
    } catch (error) {
      toast.error('Logout failed')
    }
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Side - Branding */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/10" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">InfraLearn</h1>
                <p className="text-blue-100 text-sm">Digital Classroom Infrastructure</p>
              </div>
            </div>
            
            <h2 className="text-4xl font-bold mb-4 leading-tight text-white">
              Transform Your<br />
              Learning Experience
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Connect students and professors in an interactive digital environment designed for higher education.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full" />
                <span className="text-blue-100">Real-time doubt resolution</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full" />
                <span className="text-blue-100">Interactive course materials</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full" />
                <span className="text-blue-100">Comprehensive course management</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl" />
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
      </motion.div>

      {/* Right Side - Login Form */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex-1 flex items-center justify-center p-4 bg-gray-50"
      >
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center lg:hidden mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <GraduationCap className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold">InfraLearn</h1>
            </div>
            <p className="text-gray-600 text-sm">Digital Classroom Infrastructure</p>
          </div>

          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm rounded-xl overflow-hidden">
            <CardHeader className="space-y-1 pb-2 px-4 pt-4">
              <CardTitle className="text-2xl font-extrabold text-center text-black tracking-tight">Welcome to InfraLearn</CardTitle>
            </CardHeader>
             
             <CardContent className="px-4 pb-4">
               <Tabs value={isSignUp ? "signup" : "signin"} onValueChange={(value) => setIsSignUp(value === "signup")} className="w-full">
                 <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-50 p-1 rounded-lg border border-gray-200 h-12">
                   <TabsTrigger 
                     value="signin" 
                     className="text-sm font-medium px-3 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:!text-white data-[state=active]:shadow-md text-gray-600 rounded-md transition-all duration-200 hover:text-gray-900"
                   >
                     <LogIn className="w-4 h-4 mr-2" />
                     Sign In
                   </TabsTrigger>
                   <TabsTrigger 
                     value="signup" 
                     className="text-sm font-medium px-3 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:!text-white data-[state=active]:shadow-md text-gray-600 rounded-md transition-all duration-200 hover:text-gray-900"
                   >
                     <UserPlus className="w-4 h-4 mr-2" />
                     Create Account
                   </TabsTrigger>
                 </TabsList>
                 
                 <TabsContent value="signin" className="space-y-4">
                   <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="space-y-2">
                       <Label htmlFor="username" className="text-gray-700 font-semibold text-sm">Username</Label>
                       <div className="relative">
                         <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                         <Input
                           id="username"
                           type="text"
                           placeholder="Enter your username"
                           value={formData.username}
                           onChange={(e) => handleChange('username', e.target.value)}
                           disabled={isLoading || isLocked}
                           required
                           className={`h-9 pl-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:bg-white rounded-lg transition-all duration-200 text-sm ${
                             errors.username ? 'border-red-500 focus:border-red-500' : ''
                           }`}
                         />
                       </div>
                       {errors.username && (
                         <div className="flex items-center gap-1 text-red-600 text-xs">
                           <AlertCircle className="w-3 h-3" />
                           {errors.username}
                         </div>
                       )}
                     </div>
                      
                     <div className="space-y-2">
                       <Label htmlFor="password" className="text-gray-700 font-semibold text-sm">Password</Label>
                       <div className="relative">
                         <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                         <Input
                           id="password"
                           type={showPassword ? "text" : "password"}
                           placeholder="Enter your password"
                           value={formData.password}
                           onChange={(e) => handleChange('password', e.target.value)}
                           disabled={isLoading || isLocked}
                           required
                           className={`h-9 pl-10 pr-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:bg-white rounded-lg transition-all duration-200 text-sm ${
                             errors.password ? 'border-red-500 focus:border-red-500' : ''
                           }`}
                         />
                         <button
                           type="button"
                           onClick={() => setShowPassword(!showPassword)}
                           className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-md hover:bg-gray-100"
                           disabled={isLoading || isLocked}
                         >
                           {showPassword ? (
                             <EyeOff className="h-3 w-3" />
                           ) : (
                             <Eye className="h-3 w-3" />
                           )}
                         </button>
                       </div>
                       {errors.password && (
                         <div className="flex items-center gap-1 text-red-600 text-xs">
                           <AlertCircle className="w-3 h-3" />
                           {errors.password}
                         </div>
                       )}
                     </div>

                     <div className="flex items-center space-x-2">
                       <Checkbox
                         id="remember"
                         checked={formData.remember}
                         onCheckedChange={(checked) => handleChange('remember', checked as boolean)}
                         disabled={isLoading || isLocked}
                         className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-md"
                       />
                       <Label htmlFor="remember" className="text-xs font-medium text-gray-700 cursor-pointer">
                         Remember me
                       </Label>
                     </div>

                     <Button
                       type="submit"
                       className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-md shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02]"
                       disabled={isLoading || isLocked}
                     >
                       {isLoading ? (
                         <>
                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                           Signing in...
                         </>
                       ) : (
                         <>
                           <LogIn className="mr-2 h-4 w-4" />
                           Sign in to your account
                         </>
                       )}
                     </Button>

                     {/* Logout button for testing purposes */}
                     <Button
                       type="button"
                       onClick={handleLogout}
                       variant="outline"
                       className="w-full h-10 text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
                     >
                       Logout
                     </Button>
                   </form>
                 </TabsContent>
                 
                 <TabsContent value="signup" className="space-y-4">
                   <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="space-y-2">
                       <Label htmlFor="signup-name" className="text-gray-700 font-semibold text-sm">Full Name</Label>
                       <div className="relative">
                         <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                         <Input
                           id="signup-name"
                           type="text"
                           placeholder="Enter your full name"
                           value={formData.name}
                           onChange={(e) => handleChange('name', e.target.value)}
                           disabled={isLoading}
                           required
                           className={`h-9 pl-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:bg-white rounded-lg transition-all duration-200 text-sm ${
                             errors.name ? 'border-red-500 focus:border-red-500' : ''
                           }`}
                         />
                       </div>
                       {errors.name && (
                         <div className="flex items-center gap-1 text-red-600 text-xs">
                           <AlertCircle className="w-3 h-3" />
                           {errors.name}
                         </div>
                       )}
                     </div>
                      
                     <div className="space-y-2">
                       <Label htmlFor="signup-username" className="text-gray-700 font-semibold text-sm">Username</Label>
                       <div className="relative">
                         <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                         <Input
                           id="signup-username"
                           type="text"
                           placeholder="Choose a username"
                           value={formData.username}
                           onChange={(e) => handleChange('username', e.target.value)}
                           disabled={isLoading}
                           required
                           className={`h-9 pl-10 pr-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:bg-white rounded-lg transition-all duration-200 text-sm ${
                             usernameAvailability.isAvailable === true ? 'border-green-500 focus:border-green-500' :
                             usernameAvailability.isAvailable === false ? 'border-red-500 focus:border-red-500' : 
                             errors.username ? 'border-red-500 focus:border-red-500' : ''
                           }`}
                         />
                         {/* Username status indicator - Priority: Checking > Available/Taken */}
                         <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                           {usernameAvailability.isChecking && (
                             <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                           )}
                           {!usernameAvailability.isChecking && usernameAvailability.isAvailable === true && (
                             <CheckCircle className="h-4 w-4 text-green-500" />
                           )}
                           {!usernameAvailability.isChecking && usernameAvailability.isAvailable === false && (
                             <XCircle className="h-4 w-4 text-red-500" />
                           )}
                         </div>
                       </div>
                       {/* Username status message - Priority: Error > Checking > Available/Taken */}
                       {errors.username && (
                         <div className="flex items-center gap-1 text-red-600 text-xs">
                           <AlertCircle className="w-3 h-3" />
                           {errors.username}
                         </div>
                       )}
                       {!errors.username && usernameAvailability.error && (
                         <p className="text-xs text-red-600 mt-1">{usernameAvailability.error}</p>
                       )}
                       {!errors.username && !usernameAvailability.error && usernameAvailability.isChecking && (
                         <p className="text-xs text-blue-600 mt-1">Checking username availability...</p>
                       )}
                       {!errors.username && !usernameAvailability.error && !usernameAvailability.isChecking && usernameAvailability.isAvailable === true && (
                         <p className="text-xs text-green-600 mt-1">✓ Username is available</p>
                       )}
                       {!errors.username && !usernameAvailability.error && !usernameAvailability.isChecking && usernameAvailability.isAvailable === false && (
                         <p className="text-xs text-red-600 mt-1">✗ Username is already taken</p>
                       )}
                     </div>
                      
                     <div className="space-y-2">
                       <Label htmlFor="signup-email" className="text-gray-700 font-semibold text-sm">Institutional Email</Label>
                       <div className="relative">
                         <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                         <Input
                           id="signup-email"
                           type="email"
                           placeholder="your.email@institute.edu"
                           value={formData.email}
                           onChange={(e) => handleChange('email', e.target.value)}
                           disabled={isLoading}
                           required
                           className={`h-9 pl-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:bg-white rounded-lg transition-all duration-200 text-sm ${
                             errors.email ? 'border-red-500 focus:border-red-500' : ''
                           }`}
                         />
                       </div>
                       {errors.email && (
                         <div className="flex items-center gap-1 text-red-600 text-xs">
                           <AlertCircle className="w-3 h-3" />
                           {errors.email}
                         </div>
                       )}
                       <p className="text-xs text-gray-500 mt-1">Only institutional email addresses are allowed for students</p>
                     </div>
                     
                     <div className="space-y-2">
                       <Label htmlFor="signup-password" className="text-gray-700 font-semibold text-sm">Password</Label>
                       <div className="relative">
                         <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                         <Input
                           id="signup-password"
                           type={showPassword ? "text" : "password"}
                           placeholder="Create a password"
                           value={formData.password}
                           onChange={(e) => handleChange('password', e.target.value)}
                           disabled={isLoading}
                           required
                           className={`h-9 pl-10 pr-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:bg-white rounded-lg transition-all duration-200 text-sm ${
                             errors.password ? 'border-red-500 focus:border-red-500' : ''
                           }`}
                         />
                         <button
                           type="button"
                           onClick={() => setShowPassword(!showPassword)}
                           className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-md hover:bg-gray-100"
                           disabled={isLoading}
                         >
                           {showPassword ? (
                             <EyeOff className="h-3 w-3" />
                           ) : (
                             <Eye className="h-3 w-3" />
                           )}
                         </button>
                       </div>
                       {errors.password && (
                         <div className="flex items-center gap-1 text-red-600 text-xs">
                           <AlertCircle className="w-3 h-3" />
                           {errors.password}
                         </div>
                       )}
                     </div>
                     
                     <Button
                       type="submit"
                       className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-md shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02]"
                       disabled={isLoading}
                     >
                       {isLoading ? (
                         <>
                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                           Creating account...
                         </>
                       ) : (
                         <>
                           <UserPlus className="mr-2 h-4 w-4" />
                           Create Student Account
                         </>
                       )}
                     </Button>
                   </form>
                 </TabsContent>
               </Tabs>
             </CardContent>
           </Card>
        </div>
      </motion.div>
    </div>
  )
} 