'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  Mail,
  Calendar
} from 'lucide-react'
import useCourseStore from '@/store/courseStore'
import { Database } from '@/lib/supabase'

type CourseEnrollment = Database['public']['Tables']['course_enrollments']['Row'] & {
  users?: {
    name: string
    username: string
    email: string
  }
}

interface CourseEnrollmentsProps {
  courseId: string
}

export default function CourseEnrollments({ courseId }: CourseEnrollmentsProps) {
  const { 
    enrollments, 
    fetchEnrollments, 
    updateEnrollmentStatus,
    isLoading 
  } = useCourseStore()

  useEffect(() => {
    fetchEnrollments(courseId)
  }, [courseId, fetchEnrollments])

  const handleApprove = async (enrollmentId: string) => {
    const result = await updateEnrollmentStatus(enrollmentId, 'approved')
    if (!result.success) {
      alert('Failed to approve enrollment')
    }
  }

  const handleReject = async (enrollmentId: string) => {
    const result = await updateEnrollmentStatus(enrollmentId, 'rejected')
    if (!result.success) {
      alert('Failed to reject enrollment')
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default'
      case 'rejected':
        return 'destructive'
      case 'pending':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const pendingEnrollments = enrollments.filter(e => e.status === 'pending')
  const approvedEnrollments = enrollments.filter(e => e.status === 'approved')
  const rejectedEnrollments = enrollments.filter(e => e.status === 'rejected')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Course Enrollments</h2>
        <p className="text-muted-foreground">
          Manage student enrollments and course access
        </p>
      </div>

      {/* Enrollment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Enrollments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{enrollments.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{approvedEnrollments.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold">{pendingEnrollments.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Enrollments */}
      {pendingEnrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Approvals ({pendingEnrollments.length})
            </CardTitle>
            <CardDescription>
              Review and approve student enrollment requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(enrollment.status)}
                      <Badge variant={getStatusBadgeVariant(enrollment.status)}>
                        {enrollment.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{enrollment.users?.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{enrollment.users?.email}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {new Date(enrollment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(enrollment.id)}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(enrollment.id)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Enrollments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Enrollments
          </CardTitle>
          <CardDescription>
            Complete list of course enrollments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading enrollments...</p>
              </div>
            </div>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No enrollments yet</h3>
              <p className="text-muted-foreground">
                Students will appear here once they request to enroll in this course
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(enrollment.status)}
                      <Badge variant={getStatusBadgeVariant(enrollment.status)}>
                        {enrollment.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{enrollment.users?.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{enrollment.users?.email}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {new Date(enrollment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {enrollment.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(enrollment.id)}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(enrollment.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 