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
import { GraduationCap, Loader2, Eye, EyeOff, UserPlus, Mail, User, Lock, LogIn, CheckCircle, XCircle } from 'lucide-react'

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
  
  const router = useRouter()
  const signIn = useAuthStore(state => state.signIn)
  const signUp = useAuthStore(state => state.signUp)
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
        const result = await signIn(formData.username, formData.password)
        
        if (result.success) {
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
          toast.error(result.error || 'Invalid email or password')
        }
      }
    } catch (error) {
      toast.error(isSignUp ? 'Signup failed. Please try again.' : 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/20" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-gray-800">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100/50 rounded-xl backdrop-blur-sm">
                <GraduationCap className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">InfraLearn</h1>
                <p className="text-gray-600 text-sm">Digital Classroom Infrastructure</p>
              </div>
            </div>
            
            <h2 className="text-4xl font-bold mb-4 leading-tight text-gray-900">
              Transform Your<br />
              Learning Experience
            </h2>
            <p className="text-xl text-gray-700 mb-8">
              Connect students and professors in an interactive digital environment designed for higher education.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-gray-700">Real-time doubt resolution</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-gray-700">Interactive course materials</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-gray-700">Comprehensive course management</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-blue-200/30 rounded-full blur-xl" />
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-indigo-200/20 rounded-full blur-2xl" />
      </motion.div>

      {/* Right Side - Login Form */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex-1 flex items-center justify-center p-8 bg-gray-50"
      >
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:hidden mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold">InfraLearn</h1>
            </div>
            <p className="text-gray-600">Digital Classroom Infrastructure</p>
          </div>

                                                                 <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader className="space-y-3 pb-8 px-8 pt-8">
                <CardTitle className="text-3xl font-bold text-center text-gray-900 tracking-tight">Welcome to InfraLearn</CardTitle>
                <CardDescription className="text-center text-gray-600 text-base">
                  Sign in to your account or create a new student account
                </CardDescription>
              </CardHeader>
             
             <CardContent>
                               <Tabs value={isSignUp ? "signup" : "signin"} onValueChange={(value) => setIsSignUp(value === "signup")} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-50 p-2 rounded-2xl border border-gray-200 h-14">
                    <TabsTrigger 
                      value="signin" 
                      className="text-sm font-medium px-4 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:!text-white data-[state=active]:shadow-lg text-gray-600 rounded-xl transition-all duration-200 hover:text-gray-900"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger 
                      value="signup" 
                      className="text-sm font-medium px-4 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:!text-white data-[state=active]:shadow-lg text-gray-600 rounded-xl transition-all duration-200 hover:text-gray-900"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create Account
                    </TabsTrigger>
                  </TabsList>
                 
                                   <TabsContent value="signin" className="space-y-6 px-8 pb-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="username" className="text-gray-700 font-semibold text-sm">Username</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            id="username"
                            type="text"
                            placeholder="Enter your username"
                            value={formData.username}
                            onChange={(e) => handleChange('username', e.target.value)}
                            disabled={isLoading}
                            required
                            className="h-12 pl-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:bg-white rounded-xl transition-all duration-200"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="password" className="text-gray-700 font-semibold text-sm">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            disabled={isLoading}
                            required
                            className="h-12 pl-10 pr-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:bg-white rounded-xl transition-all duration-200"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-md hover:bg-gray-100"
                            disabled={isLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="remember"
                          checked={formData.remember}
                          onCheckedChange={(checked) => handleChange('remember', checked as boolean)}
                          disabled={isLoading}
                          className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-md"
                        />
                        <Label htmlFor="remember" className="text-sm font-medium text-gray-700 cursor-pointer">
                          Remember me
                        </Label>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          <>
                            <LogIn className="mr-2 h-5 w-5" />
                            Sign in to your account
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                 
                                   <TabsContent value="signup" className="space-y-6 px-8 pb-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="signup-name" className="text-gray-700 font-semibold text-sm">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            id="signup-name"
                            type="text"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            disabled={isLoading}
                            required
                            className="h-12 pl-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:bg-white rounded-xl transition-all duration-200"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="signup-username" className="text-gray-700 font-semibold text-sm">Username</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            id="signup-username"
                            type="text"
                            placeholder="Choose a username"
                            value={formData.username}
                            onChange={(e) => handleChange('username', e.target.value)}
                            disabled={isLoading}
                            required
                            className={`h-12 pl-10 pr-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:bg-white rounded-xl transition-all duration-200 ${
                              usernameAvailability.isAvailable === true ? 'border-green-500 focus:border-green-500' :
                              usernameAvailability.isAvailable === false ? 'border-red-500 focus:border-red-500' : ''
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
                        {usernameAvailability.error && (
                          <p className="text-xs text-red-600 mt-1">{usernameAvailability.error}</p>
                        )}
                        {!usernameAvailability.error && usernameAvailability.isChecking && (
                          <p className="text-xs text-blue-600 mt-1">Checking username availability...</p>
                        )}
                        {!usernameAvailability.error && !usernameAvailability.isChecking && usernameAvailability.isAvailable === true && (
                          <p className="text-xs text-green-600 mt-1">✓ Username is available</p>
                        )}
                        {!usernameAvailability.error && !usernameAvailability.isChecking && usernameAvailability.isAvailable === false && (
                          <p className="text-xs text-red-600 mt-1">✗ Username is already taken</p>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="signup-email" className="text-gray-700 font-semibold text-sm">Institutional Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="your.email@kgpian.iitkgp.ac.in"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            disabled={isLoading}
                            required
                            className="h-12 pl-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:bg-white rounded-xl transition-all duration-200"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Only institutional email addresses are allowed for students</p>
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="signup-password" className="text-gray-700 font-semibold text-sm">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            disabled={isLoading}
                            required
                            className="h-12 pl-10 pr-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:bg-white rounded-xl transition-all duration-200"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-md hover:bg-gray-100"
                            disabled={isLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <Button
                        type="submit"
                        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          <>
                            <UserPlus className="mr-2 h-5 w-5" />
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