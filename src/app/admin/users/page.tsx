'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import MainLayout from '@/components/layout/MainLayout'
import useAuthStore from '@/store/authStore'
import { useUsernameAvailability } from '@/hooks/use-username-availability'
import { supabase } from '@/lib/supabase'
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  UserPlus,
  GraduationCap,
  BookOpen,
  Mail,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Save,
  Loader2
} from 'lucide-react'

interface User {
  id: string
  name: string
  username: string
  email: string
  role: 'super_admin' | 'professor' | 'student'
  avatar_url: string | null
  created_at: string
  updated_at: string
  status?: 'active' | 'inactive'
  last_login?: string
  courses_count?: number
  enrolled_courses?: number
}

interface EditUserData {
  name: string
  username: string
  email: string
  password: string
  role: 'professor' | 'student'
}

interface MessageData {
  subject: string
  message: string
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Dialog states
  const [showUserDetails, setShowUserDetails] = useState<string | null>(null)
  const [showEditUser, setShowEditUser] = useState<string | null>(null)
  const [showSendMessage, setShowSendMessage] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showAddUser, setShowAddUser] = useState(false)
  
  // Form states
  const [editUserData, setEditUserData] = useState<EditUserData>({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'student'
  })
  const [messageData, setMessageData] = useState<MessageData>({
    subject: '',
    message: ''
  })
  
  // Loading states
  const [isEditing, setIsEditing] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Username availability checking
  const usernameAvailability = useUsernameAvailability(editUserData.username, 3)
  const [isAdding, setIsAdding] = useState(false)
  
  const { user: currentUser } = useAuthStore()

  // Test database connection
  const testDatabaseConnection = async () => {
    try {
      console.log('Testing database connection...')
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      
      // Test with a simple query - try to get just one record
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1)
      
      console.log('Database connection test result:', { data, error })
      
      if (error) {
        console.error('Database connection error:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return false
      }
      
      console.log('Database connection successful')
      return true
    } catch (error) {
      console.error('Database connection test failed:', error)
      return false
    }
  }

  // Fetch users from database
  const fetchUsers = async () => {
    try {
      console.log('Starting fetchUsers...')
      setIsRefreshing(true)
      
      // Show loading feedback
      const loadingToast = toast.loading('Loading users...')
      
      console.log('Fetching users from admin API...')
      
      // Use the admin API route to bypass RLS
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()
      
      if (!response.ok) {
        console.error('API Error:', result.error)
        toast.dismiss(loadingToast)
        toast.error(result.error || 'Failed to fetch users')
        setIsLoading(false)
        setIsRefreshing(false)
        return
      }

      const usersData = result.users
      console.log('API response:', { usersData })

      // Enhance users with additional data (simplified for now)
      const enhancedUsers = usersData?.map(user => ({
        ...user,
        status: user.status || 'active', // Use actual status from database, default to 'active' if not set
        courses_count: 0, // Simplified for now
        enrolled_courses: 0 // Simplified for now
      })) || []

      console.log('Enhanced users:', enhancedUsers)

      // Set users even if empty array
      setUsers(enhancedUsers)
      setFilteredUsers(enhancedUsers)
      
      // If no users found, show a message
      if (enhancedUsers.length === 0) {
        console.log('No users found in database')
      }
      
      // Success feedback
      toast.dismiss(loadingToast)
    } catch (error) {
      console.error('Error in fetchUsers:', error)
      toast.error(`Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      console.log('Setting loading states to false')
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    // Check if Supabase is properly configured
    console.log('Environment check:')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set')
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set')
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase environment variables are not configured')
      toast.error('Database configuration error. Please check environment variables.')
      setIsLoading(false)
      return
    }
    
    fetchUsers()
  }, [])

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, roleFilter, statusFilter])

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id))
    }
  }

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete' | 'remove') => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users to perform this action')
      return
    }

    try {
      if (action === 'delete') {
        // Set users as inactive instead of deleting
        const response = await fetch('/api/admin/users', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            userIds: selectedUsers,
            updates: { status: 'inactive', updated_at: new Date().toISOString() }
          })
        })

        const result = await response.json()
        
        if (!response.ok) {
          console.error('Error deactivating users:', result.error)
          toast.error(result.error || 'Failed to deactivate users')
          return
        }
      } else if (action === 'remove') {
        // Permanently delete inactive users
        const response = await fetch('/api/admin/users', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userIds: selectedUsers })
        })

        const result = await response.json()
        
        if (!response.ok) {
          console.error('Error removing users:', result.error)
          toast.error(result.error || 'Failed to remove users')
          return
        }
      } else {
        // Activate or deactivate users
        const status = action === 'activate' ? 'active' : 'inactive'
        
        console.log(`Attempting to ${action} users:`, selectedUsers, status)
        
        try {
          const response = await fetch('/api/admin/users', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              userIds: selectedUsers,
              updates: { status, updated_at: new Date().toISOString() }
            })
          })

          console.log('Response status:', response.status)
          
          if (!response.ok) {
            const result = await response.json()
            console.error(`Error ${action}ing users:`, result.error)
            toast.error(result.error || `Failed to ${action} users`)
            return
          }

          const result = await response.json()
          console.log('Success response:', result)
          
        } catch (fetchError) {
          console.error('Fetch error:', fetchError)
          toast.error(`Network error: ${fetchError.message}`)
          return
        }
      }

      const actionText = action === 'activate' ? 'activated' : 
                        action === 'deactivate' ? 'deactivated' : 
                        action === 'delete' ? 'deactivated' : 'removed'
      toast.success(`${selectedUsers.length} users ${actionText} successfully`)
      setSelectedUsers([])
      fetchUsers() // Refresh the list
    } catch (error) {
      console.error('Error in bulk action:', error)
      toast.error('Failed to perform bulk action')
    }
  }

  const handleEditUser = async (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    setEditUserData({
      name: user.name,
      username: user.username,
      email: user.email,
      password: '', // Password is not editable
      role: user.role === 'super_admin' ? 'professor' : user.role as 'professor' | 'student'
    })
    setShowEditUser(userId)
  }

  const handleSaveUser = async () => {
    if (!showEditUser) return

    try {
      setIsEditing(true)
      
      // Use admin API for updating user
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: showEditUser,
          updates: {
            name: editUserData.name,
            username: editUserData.username,
            email: editUserData.email,
            updated_at: new Date().toISOString()
          }
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        console.error('Error updating user:', result.error)
        toast.error(result.error || 'Failed to update user')
        return
      }

      toast.success('User updated successfully')
      setShowEditUser(null)
      fetchUsers() // Refresh the list
    } catch (error) {
      console.error('Error in handleSaveUser:', error)
      toast.error('Failed to update user')
    } finally {
      setIsEditing(false)
    }
  }

  const handleSendMessage = async () => {
    if (!showSendMessage) return

    try {
      setIsSending(true)
      
      // Create notification for the user
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: showSendMessage,
          title: messageData.subject,
          message: messageData.message,
          type: 'system',
          is_read: false
        })

      if (error) {
        console.error('Error sending message:', error)
        toast.error('Failed to send message')
        return
      }

      toast.success('Message sent successfully')
      setShowSendMessage(null)
      setMessageData({ subject: '', message: '' })
    } catch (error) {
      console.error('Error in handleSendMessage:', error)
      toast.error('Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!showDeleteConfirm) return

    const user = users.find(u => u.id === showDeleteConfirm)
    if (!user) return

    try {
      setIsDeleting(true)
      
      if (user.status === 'inactive') {
        // Permanently delete inactive user
        const response = await fetch('/api/admin/users', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userIds: [showDeleteConfirm] })
        })

        const result = await response.json()
        
        if (!response.ok) {
          console.error('Error removing user:', result.error)
          toast.error(result.error || 'Failed to remove user')
          return
        }

        toast.success('User removed permanently')
      } else {
        // Deactivate active/pending user
        const response = await fetch('/api/admin/users', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            userIds: [showDeleteConfirm],
            updates: { status: 'inactive', updated_at: new Date().toISOString() }
          })
        })

        const result = await response.json()
        
        if (!response.ok) {
          console.error('Error deactivating user:', result.error)
          toast.error(result.error || 'Failed to deactivate user')
          return
        }

        toast.success('User deactivated successfully')
      }

      setShowDeleteConfirm(null)
      fetchUsers() // Refresh the list
    } catch (error) {
      console.error('Error in handleDeleteUser:', error)
      toast.error('Failed to process user action')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleActivateUser = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userIds: [userId],
          updates: { status: 'active', updated_at: new Date().toISOString() }
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        console.error('Error activating user:', result.error)
        toast.error(result.error || 'Failed to activate user')
        return
      }

      toast.success('User activated successfully')
      fetchUsers() // Refresh the list
    } catch (error) {
      console.error('Error in handleActivateUser:', error)
      toast.error('Failed to activate user')
    }
  }

  const handleAddUser = async () => {
    // Prevent submission if form is invalid
    if (
      !editUserData.name.trim() || 
      !editUserData.username.trim() || 
      !editUserData.email.trim() ||
      !editUserData.password.trim() ||
      editUserData.name.length < 2 ||
      editUserData.username.length < 3 ||
      editUserData.password.length < 6 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editUserData.email) ||
      usernameAvailability.isAvailable === false ||
      usernameAvailability.isChecking ||
      isAdding
    ) {
      return
    }
    
        try {
      setIsAdding(true)
      
      // Enhanced validation
      const validationErrors = []
      
      if (!editUserData.name.trim()) {
        validationErrors.push('Full name is required')
      } else if (editUserData.name.trim().length < 2) {
        validationErrors.push('Full name must be at least 2 characters')
      }
      
      if (!editUserData.username.trim()) {
        validationErrors.push('Username is required')
      } else if (editUserData.username.trim().length < 3) {
        validationErrors.push('Username must be at least 3 characters')
      } else if (!/^[a-zA-Z0-9._-]+$/.test(editUserData.username.trim())) {
        validationErrors.push('Username can only contain letters, numbers, dots, underscores, and hyphens')
      } else if (usernameAvailability.isAvailable === false) {
        validationErrors.push('Username is already taken')
      } else if (usernameAvailability.isChecking) {
        validationErrors.push('Please wait while checking username availability')
      }
      
      if (!editUserData.email.trim()) {
        validationErrors.push('Email address is required')
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editUserData.email.trim())) {
        validationErrors.push('Please enter a valid email address')
      }
      
      if (!editUserData.password.trim()) {
        validationErrors.push('Password is required')
      } else if (editUserData.password.trim().length < 6) {
        validationErrors.push('Password must be at least 6 characters')
      }
      
      if (validationErrors.length > 0) {
        toast.error(`Validation errors: ${validationErrors.join(', ')}`)
        return
      }

      // Show immediate feedback
      const loadingToast = toast.loading(`Creating ${editUserData.role} account...`)

      // Create user using the API route
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editUserData.name.trim(),
          username: editUserData.username.trim(),
          email: editUserData.email.trim(),
          password: editUserData.password.trim(),
          role: editUserData.role
        })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Error creating user:', result.error)
        toast.error(result.error || 'Failed to create user')
        toast.dismiss(loadingToast)
        return
      }

      const createdUser = result.user

      // Success feedback
      toast.dismiss(loadingToast)
      toast.success(`${editUserData.role} account created successfully!`, {
        description: `${newUser.name} can now access the platform with their email and password.`
      })
      
      // Reset form and close dialog
      setShowAddUser(false)
      setEditUserData({ name: '', username: '', email: '', password: '', role: 'student' })
      
      // Optimize refresh - only fetch if we have users already loaded
      if (users.length > 0) {
        // Add the new user to the current list instead of full refresh
        const enhancedNewUser = {
          ...createdUser,
          courses_count: 0,
          enrolled_courses: 0
        }
        setUsers(prev => [enhancedNewUser, ...prev])
        setFilteredUsers(prev => [enhancedNewUser, ...prev])
      } else {
        // Only do full refresh if no users are loaded
        fetchUsers()
      }
    } catch (error) {
      console.error('Error in handleAddUser:', error)
      toast.error('Failed to create user account. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      default:
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
    }
  }

  const getRoleIcon = (role: string) => {
    return role === 'professor' ? <BookOpen className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />
  }

  if (!currentUser || currentUser.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <MainLayout
      title="User Management"
      description="Manage professors and students on the platform"
    >
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-2">Manage professors and students on the platform</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={fetchUsers}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                                 onClick={() => {
                   setEditUserData({ name: '', username: '', email: '', password: '', role: 'student' })
                   setShowAddUser(true)
                 }}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Professors</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter(u => u.role === 'professor').length}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <BookOpen className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Students</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter(u => u.role === 'student').length}
                  </p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter(u => u.status === 'active').length}
                  </p>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search users by name, username, or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="professor">Professors</SelectItem>
                    <SelectItem value="student">Students</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">
                      {selectedUsers.length} user(s) selected
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedUsers([])}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('activate')}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Activate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('deactivate')}
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Deactivate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('delete')}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Deactivate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('remove')}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Users ({filteredUsers.length})</CardTitle>
              <CardDescription>Manage platform users and their permissions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Courses</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-12">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={() => handleSelectUser(user.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-600">
                                    {user.name.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getRoleIcon(user.role)}
                              <span className="capitalize">{user.role.replace('_', ' ')}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(user.status || 'active')}
                          </TableCell>
                          <TableCell>
                            {user.role === 'professor' 
                              ? `${user.courses_count || 0} courses`
                              : `${user.enrolled_courses || 0} enrolled`
                            }
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">
                              {new Date(user.created_at).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>User Actions</DialogTitle>
                                  <DialogDescription>
                                    Manage user account and permissions
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-2">
                                  <Button 
                                    variant="outline" 
                                    className="w-full justify-start"
                                    onClick={() => setShowUserDetails(user.id)}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    className="w-full justify-start"
                                    onClick={() => handleEditUser(user.id)}
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit User
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    className="w-full justify-start"
                                    onClick={() => setShowSendMessage(user.id)}
                                  >
                                    <Mail className="w-4 h-4 mr-2" />
                                    Send Message
                                  </Button>
                                                                    {user.status === 'inactive' ? (
                                    <>
                                      <Button 
                                        variant="outline" 
                                        className="w-full justify-start text-blue-600"
                                        onClick={() => handleActivateUser(user.id)}
                                      >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Activate User
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        className="w-full justify-start text-red-600"
                                        onClick={() => setShowDeleteConfirm(user.id)}
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Remove User
                                      </Button>
                                    </>
                                  ) : (
                                    <Button 
                                      variant="outline" 
                                      className="w-full justify-start text-red-600"
                                      onClick={() => setShowDeleteConfirm(user.id)}
                                    >
                                      <AlertCircle className="w-4 h-4 mr-2" />
                                      Deactivate User
                                    </Button>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Edit User Dialog */}
        <Dialog open={!!showEditUser} onOpenChange={() => setShowEditUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and permissions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editUserData.name}
                  onChange={(e) => setEditUserData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={editUserData.username}
                  onChange={(e) => setEditUserData(prev => ({ ...prev, username: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editUserData.email}
                  onChange={(e) => setEditUserData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <div className="flex items-center px-3 py-2 border border-input bg-muted rounded-md text-sm">
                  <span className="capitalize">{editUserData.role.replace('_', ' ')}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowEditUser(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveUser}
                  disabled={isEditing}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isEditing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Send Message Dialog */}
        <Dialog open={!!showSendMessage} onOpenChange={() => setShowSendMessage(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send Message</DialogTitle>
              <DialogDescription>
                Send a system message to the user
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={messageData.subject}
                  onChange={(e) => setMessageData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Message subject"
                />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={messageData.message}
                  onChange={(e) => setMessageData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter your message..."
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowSendMessage(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendMessage}
                  disabled={isSending || !messageData.subject || !messageData.message}
                  className="flex-1"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send Message
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* User Details Dialog */}
        <Dialog open={!!showUserDetails} onOpenChange={() => setShowUserDetails(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                Comprehensive user information and activity
              </DialogDescription>
            </DialogHeader>
            {showUserDetails && (() => {
              const user = users.find(u => u.id === showUserDetails)
              if (!user) return null
              
              return (
                <div className="space-y-6">
                  {/* User Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Name:</span> {user.name}</div>
                        <div><span className="font-medium">Username:</span> {user.username}</div>
                        <div><span className="font-medium">Email:</span> {user.email}</div>
                        <div><span className="font-medium">Role:</span> {user.role.replace('_', ' ')}</div>
                        <div><span className="font-medium">Status:</span> {getStatusBadge(user.status || 'active')}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Account Details</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Created:</span> {new Date(user.created_at).toLocaleDateString()}</div>
                        <div><span className="font-medium">Last Updated:</span> {new Date(user.updated_at).toLocaleDateString()}</div>
                        <div><span className="font-medium">User ID:</span> {user.id}</div>
                        {user.role === 'professor' && (
                          <div><span className="font-medium">Courses:</span> {user.courses_count || 0} active courses</div>
                        )}
                        {user.role === 'student' && (
                          <div><span className="font-medium">Enrollments:</span> {user.enrolled_courses || 0} courses</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setShowUserDetails(null)
                          handleEditUser(user.id)
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit User
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setShowUserDetails(null)
                          setShowSendMessage(user.id)
                        }}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Send Message
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setShowUserDetails(null)
                          setShowDeleteConfirm(user.id)
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete User
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })()}
          </DialogContent>
        </Dialog>

                 {/* Add User Dialog */}
         <Dialog open={showAddUser} onOpenChange={() => {
           setShowAddUser(false)
           setEditUserData({ name: '', username: '', email: '', password: '', role: 'student' })
         }}>
           <DialogContent className="max-w-lg">
             <DialogHeader>
               <DialogTitle>Add New User</DialogTitle>
               <DialogDescription>
                 Create a new user account on the platform. The user will be able to immediately access the platform with their email and password.
               </DialogDescription>
             </DialogHeader>
             <div className="space-y-6">
               {/* Basic Information */}
               <div className="space-y-4">
                 <h4 className="font-medium text-gray-900">Basic Information</h4>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <Label htmlFor="add-name" className="flex items-center gap-1">
                       Full Name <span className="text-red-500">*</span>
                     </Label>
                     <Input
                       id="add-name"
                       value={editUserData.name}
                       onChange={(e) => setEditUserData(prev => ({ ...prev, name: e.target.value }))}
                       placeholder="e.g., Dr. John Smith"
                       className="mt-1"
                     />
                     {editUserData.name && editUserData.name.length < 2 && (
                       <p className="text-xs text-red-500 mt-1">Name must be at least 2 characters</p>
                     )}
                   </div>
                   
                   <div>
                     <Label htmlFor="add-role" className="flex items-center gap-1">
                       Role <span className="text-red-500">*</span>
                     </Label>
                     <Select 
                       value={editUserData.role} 
                       onValueChange={(value: 'professor' | 'student') => 
                         setEditUserData(prev => ({ ...prev, role: value }))
                       }
                     >
                       <SelectTrigger className="mt-1">
                         <SelectValue placeholder="Select role" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="student">
                           <div className="flex items-center gap-2">
                             <GraduationCap className="w-4 h-4" />
                             Student
                           </div>
                         </SelectItem>
                         <SelectItem value="professor">
                           <div className="flex items-center gap-2">
                             <BookOpen className="w-4 h-4" />
                             Professor
                           </div>
                         </SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                 </div>
               </div>

               {/* Account Information */}
               <div className="space-y-4">
                 <h4 className="font-medium text-gray-900">Account Information</h4>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <Label htmlFor="add-username" className="flex items-center gap-1">
                       Username <span className="text-red-500">*</span>
                     </Label>
                     <Input
                       id="add-username"
                       value={editUserData.username}
                       onChange={(e) => setEditUserData(prev => ({ ...prev, username: e.target.value.toLowerCase() }))}
                       placeholder="e.g., john.smith"
                       className="mt-1"
                     />
                     {editUserData.username && (
                       <div className="mt-1">
                         {usernameAvailability.isChecking ? (
                           <p className="text-xs text-blue-500 flex items-center gap-1">
                             <Loader2 className="w-3 h-3 animate-spin" />
                             Checking availability...
                           </p>
                         ) : editUserData.username.length < 3 ? (
                           <p className="text-xs text-red-500">Username must be at least 3 characters</p>
                         ) : usernameAvailability.error ? (
                           <p className="text-xs text-orange-500">{usernameAvailability.error}</p>
                         ) : usernameAvailability.isAvailable === true ? (
                           <p className="text-xs text-green-500 flex items-center gap-1">
                             ✓ Username is available
                           </p>
                         ) : usernameAvailability.isAvailable === false ? (
                           <p className="text-xs text-red-500 flex items-center gap-1">
                             ✗ Username is already taken
                           </p>
                         ) : (
                           <p className="text-xs text-gray-500">✓ Username format is valid</p>
                         )}
                       </div>
                     )}
                   </div>
                   
                   <div>
                     <Label htmlFor="add-email" className="flex items-center gap-1">
                       Email Address <span className="text-red-500">*</span>
                     </Label>
                     <Input
                       id="add-email"
                       type="email"
                       value={editUserData.email}
                       onChange={(e) => setEditUserData(prev => ({ ...prev, email: e.target.value.toLowerCase() }))}
                       placeholder="e.g., john.smith@university.edu"
                       className="mt-1"
                     />
                     {editUserData.email && (
                       <p className="text-xs text-gray-500 mt-1">
                         {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editUserData.email) ? (
                           <span className="text-green-500">✓ Valid email format</span>
                         ) : (
                           <span className="text-red-500">Please enter a valid email address</span>
                         )}
                       </p>
                     )}
                   </div>
                 </div>
                 
                 <div>
                   <Label htmlFor="add-password" className="flex items-center gap-1">
                     Password <span className="text-red-500">*</span>
                   </Label>
                   <Input
                     id="add-password"
                     type="password"
                     value={editUserData.password}
                     onChange={(e) => setEditUserData(prev => ({ ...prev, password: e.target.value }))}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter' && !e.shiftKey) {
                         e.preventDefault()
                         handleAddUser()
                       }
                     }}
                     placeholder="Enter password (min 6 characters)"
                     className="mt-1"
                   />
                   {editUserData.password && (
                     <p className="text-xs text-gray-500 mt-1">
                       {editUserData.password.length < 6 ? (
                         <span className="text-red-500">Password must be at least 6 characters</span>
                       ) : (
                         <span className="text-green-500">✓ Password meets requirements</span>
                       )}
                     </p>
                   )}
                 </div>
               </div>



               {/* Action Buttons */}
               <div className="flex gap-3 pt-4 border-t">
                 <Button 
                   variant="outline" 
                   onClick={() => {
                     setShowAddUser(false)
                     setEditUserData({ name: '', username: '', email: '', password: '', role: 'student' })
                   }}
                   className="flex-1"
                 >
                   Cancel
                 </Button>
                 <Button 
                   onClick={handleAddUser}
                   disabled={
                     isAdding || 
                     !editUserData.name.trim() || 
                     !editUserData.username.trim() || 
                     !editUserData.email.trim() ||
                     !editUserData.password.trim() ||
                     editUserData.name.length < 2 ||
                     editUserData.username.length < 3 ||
                     editUserData.password.length < 6 ||
                     !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editUserData.email) ||
                     usernameAvailability.isAvailable === false ||
                     usernameAvailability.isChecking
                   }
                   className="flex-1 bg-blue-600 hover:bg-blue-700"
                 >
                   {isAdding ? (
                     <>
                       <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                       Creating...
                     </>
                   ) : (
                     <>
                       <UserPlus className="w-4 h-4 mr-2" />
                       Create {editUserData.role}
                     </>
                   )}
                 </Button>
               </div>
             </div>
           </DialogContent>
         </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {users.find(u => u.id === showDeleteConfirm)?.status === 'inactive' 
                  ? 'Remove User' 
                  : 'Deactivate User'
                }
              </DialogTitle>
              <DialogDescription>
                {users.find(u => u.id === showDeleteConfirm)?.status === 'inactive' 
                  ? 'Are you sure you want to permanently remove this user? This action cannot be undone and will delete all user data.'
                  : 'Are you sure you want to deactivate this user? They will not be able to access the platform until reactivated.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1"
              >
                Cancel
              </Button>
                              <Button 
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  variant={users.find(u => u.id === showDeleteConfirm)?.status === 'inactive' ? 'destructive' : 'default'}
                  className={`flex-1 ${users.find(u => u.id === showDeleteConfirm)?.status === 'inactive' ? '' : 'bg-red-600 hover:bg-red-700'}`}
                >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : users.find(u => u.id === showDeleteConfirm)?.status === 'inactive' ? (
                  <Trash2 className="w-4 h-4 mr-2" />
                ) : (
                  <AlertCircle className="w-4 h-4 mr-2" />
                )}
                {users.find(u => u.id === showDeleteConfirm)?.status === 'inactive' ? 'Remove User' : 'Deactivate User'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
} 