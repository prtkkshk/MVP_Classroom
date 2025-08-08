'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Shield, Save, User } from 'lucide-react'
import useAuthStore from '@/store/authStore'

export default function AdminProfilePage() {
  const { user, updateProfile } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    username: user?.username || ''
  })

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        username: user.username || ''
      })
    }
  }, [user])

  const handleProfileUpdate = async () => {
    setIsLoading(true)
    try {
      if (!profileForm.name.trim()) {
        toast.error('Name is required')
        return
      }

      const result = await updateProfile({
        name: profileForm.name,
        email: profileForm.email,
        username: profileForm.username
      })
      
      if (result.success) {
        toast.success('Profile updated successfully')
      } else {
        toast.error(result.error || 'Failed to update profile')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user || user.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You don't have permission to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-blue-100 rounded-xl">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Profile</h1>
          <p className="text-gray-600">Manage your administrator account</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={profileForm.username}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Badge variant="default">{user.role}</Badge>
              </div>
            </div>
            <Button 
              onClick={handleProfileUpdate}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Profile
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Your current profile picture</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {user.name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 