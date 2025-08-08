'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Save, 
  Upload, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertCircle,
  Trash2,
  Download,
  Globe,
  Clock
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    username: user?.username || '',
    bio: '',
    department: '',
    specialization: '',
    experience: ''
  })

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    courseUpdates: true,
    liveSessionReminders: true,
    assignmentDeadlines: true,
    doubtResponses: true,
    enrollmentRequests: true,
    systemUpdates: true
  })

  // Theme preferences
  const [theme, setTheme] = useState('light')
  const [language, setLanguage] = useState('en')
  const [timezone, setTimezone] = useState('UTC')

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        username: user.username || '',
        bio: user.bio || '',
        department: user.department || '',
        specialization: user.specialization || '',
        experience: user.experience || ''
      })
    }
  }, [user])

  const handleProfileUpdate = async () => {
    setIsLoading(true)
    try {
      // Validate required fields
      if (!profileForm.name.trim()) {
        toast.error('Name is required')
        return
      }

      if (!profileForm.email.trim()) {
        toast.error('Email is required')
        return
      }

      // Here you would typically call an API to update the user profile
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update local state
      if (updateUser) {
        updateUser({
          ...user,
          ...profileForm
        })
      }
      
      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    if (!passwordForm.currentPassword) {
      toast.error('Current password is required')
      return
    }

    setIsLoading(true)
    try {
      // Here you would typically call an API to change the password
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      toast.success('Password changed successfully!')
    } catch (error) {
      toast.error('Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationToggle = (key: string) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }))
  }

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }

      // Here you would typically upload the file to your storage service
      toast.success('Avatar uploaded successfully!')
    }
  }

  const exportData = () => {
    // Create export data
    const exportData = {
      profile: profileForm,
      notifications: notifications,
      preferences: {
        theme,
        language,
        timezone
      },
      exportDate: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `settings-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast.success('Settings exported successfully!')
  }

  const deleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      toast.error('Account deletion not implemented in demo')
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and profile picture
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.avatar_url || ''} alt={user?.name} />
                  <AvatarFallback className="text-lg">
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Label htmlFor="avatar-upload">Profile Picture</Label>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <label htmlFor="avatar-upload">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Photo
                      </label>
                    </Button>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <p className="text-xs text-gray-500">Max 5MB, JPG/PNG</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Profile Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Enter your username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {user?.role?.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                {user?.role === 'professor' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={profileForm.department}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, department: e.target.value }))}
                        placeholder="e.g., Computer Science"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specialization">Specialization</Label>
                      <Input
                        id="specialization"
                        value={profileForm.specialization}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, specialization: e.target.value }))}
                        placeholder="e.g., Data Structures, Algorithms"
                      />
                    </div>
                  </>
                )}
              </div>

              {user?.role === 'professor' && (
                <div className="space-y-2">
                  <Label htmlFor="experience">Teaching Experience</Label>
                  <Textarea
                    id="experience"
                    value={profileForm.experience}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, experience: e.target.value }))}
                    placeholder="Describe your teaching experience and expertise..."
                    rows={3}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>

              <Button onClick={handleProfileUpdate} disabled={isLoading}>
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Update your password and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password *</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Enter your current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password *</Label>
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter your new password"
                  />
                  <p className="text-xs text-gray-500">Must be at least 8 characters long</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password *</Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm your new password"
                  />
                </div>

                <Button onClick={handlePasswordChange} disabled={isLoading}>
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Account Management
              </CardTitle>
              <CardDescription>
                Manage your account data and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Export Data</p>
                  <p className="text-sm text-gray-500">Download your account data</p>
                </div>
                <Button variant="outline" onClick={exportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-red-600">Delete Account</p>
                  <p className="text-sm text-gray-500">Permanently delete your account</p>
                </div>
                <Button variant="destructive" onClick={deleteAccount}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={() => handleNotificationToggle('emailNotifications')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-gray-500">Receive push notifications in the app</p>
                  </div>
                  <Switch
                    checked={notifications.pushNotifications}
                    onCheckedChange={() => handleNotificationToggle('pushNotifications')}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Course Updates</Label>
                    <p className="text-sm text-gray-500">Get notified about course announcements</p>
                  </div>
                  <Switch
                    checked={notifications.courseUpdates}
                    onCheckedChange={() => handleNotificationToggle('courseUpdates')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Live Session Reminders</Label>
                    <p className="text-sm text-gray-500">Reminders for upcoming live sessions</p>
                  </div>
                  <Switch
                    checked={notifications.liveSessionReminders}
                    onCheckedChange={() => handleNotificationToggle('liveSessionReminders')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Assignment Deadlines</Label>
                    <p className="text-sm text-gray-500">Notifications for assignment deadlines</p>
                  </div>
                  <Switch
                    checked={notifications.assignmentDeadlines}
                    onCheckedChange={() => handleNotificationToggle('assignmentDeadlines')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Doubt Responses</Label>
                    <p className="text-sm text-gray-500">Get notified when your doubts are answered</p>
                  </div>
                  <Switch
                    checked={notifications.doubtResponses}
                    onCheckedChange={() => handleNotificationToggle('doubtResponses')}
                  />
                </div>

                {user?.role === 'professor' && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enrollment Requests</Label>
                      <p className="text-sm text-gray-500">Get notified about new enrollment requests</p>
                    </div>
                    <Switch
                      checked={notifications.enrollmentRequests}
                      onCheckedChange={() => handleNotificationToggle('enrollmentRequests')}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Updates</Label>
                    <p className="text-sm text-gray-500">Receive system and maintenance notifications</p>
                  </div>
                  <Switch
                    checked={notifications.systemUpdates}
                    onCheckedChange={() => handleNotificationToggle('systemUpdates')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                App Preferences
              </CardTitle>
              <CardDescription>
                Customize your app experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">Eastern Time</SelectItem>
                      <SelectItem value="PST">Pacific Time</SelectItem>
                      <SelectItem value="GMT">GMT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 