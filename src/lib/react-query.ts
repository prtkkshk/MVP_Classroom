import { QueryClient } from '@tanstack/react-query'

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global query options
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false
        }
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      // Global mutation options
      retry: 1,
      retryDelay: 1000,
    },
  },
})

// Query keys for consistent caching
export const queryKeys = {
  // User queries
  users: ['users'] as const,
  user: (id: string) => ['users', id] as const,
  userProfile: (id: string) => ['users', id, 'profile'] as const,
  
  // Course queries
  courses: ['courses'] as const,
  course: (id: string) => ['courses', id] as const,
  courseMaterials: (courseId: string) => ['courses', courseId, 'materials'] as const,
  courseEnrollments: (courseId: string) => ['courses', courseId, 'enrollments'] as const,
  courseAnnouncements: (courseId: string) => ['courses', courseId, 'announcements'] as const,
  
  // Live session queries
  liveSessions: ['liveSessions'] as const,
  liveSession: (id: string) => ['liveSessions', id] as const,
  sessionDoubts: (sessionId: string) => ['liveSessions', sessionId, 'doubts'] as const,
  
  // Assignment queries
  assignments: ['assignments'] as const,
  assignment: (id: string) => ['assignments', id] as const,
  courseAssignments: (courseId: string) => ['assignments', 'course', courseId] as const,
  
  // Calendar queries
  calendarEvents: ['calendarEvents'] as const,
  calendarEvent: (id: string) => ['calendarEvents', id] as const,
  userEvents: (userId: string) => ['calendarEvents', 'user', userId] as const,
  
  // Notification queries
  notifications: ['notifications'] as const,
  userNotifications: (userId: string) => ['notifications', 'user', userId] as const,
  unreadCount: (userId: string) => ['notifications', 'user', userId, 'unread'] as const,
  
  // Analytics queries
  analytics: ['analytics'] as const,
  userAnalytics: (userId: string) => ['analytics', 'user', userId] as const,
  courseAnalytics: (courseId: string) => ['analytics', 'course', courseId] as const,
  platformAnalytics: ['analytics', 'platform'] as const,
}

// Cache invalidation helpers
export const invalidateQueries = {
  // Invalidate all user-related queries
  users: () => queryClient.invalidateQueries({ queryKey: queryKeys.users }),
  
  // Invalidate specific user queries
  user: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.user(id) }),
  
  // Invalidate all course-related queries
  courses: () => queryClient.invalidateQueries({ queryKey: queryKeys.courses }),
  
  // Invalidate specific course queries
  course: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.course(id) }),
  
  // Invalidate course materials
  courseMaterials: (courseId: string) => 
    queryClient.invalidateQueries({ queryKey: queryKeys.courseMaterials(courseId) }),
  
  // Invalidate live session queries
  liveSessions: () => queryClient.invalidateQueries({ queryKey: queryKeys.liveSessions }),
  
  // Invalidate assignment queries
  assignments: () => queryClient.invalidateQueries({ queryKey: queryKeys.assignments }),
  
  // Invalidate calendar queries
  calendarEvents: () => queryClient.invalidateQueries({ queryKey: queryKeys.calendarEvents }),
  
  // Invalidate notification queries
  notifications: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
  
  // Invalidate analytics queries
  analytics: () => queryClient.invalidateQueries({ queryKey: queryKeys.analytics }),
}

// Prefetch helpers for better UX
export const prefetchQueries = {
  // Prefetch user data
  user: async (id: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.user(id),
      queryFn: () => fetch(`/api/users/${id}`).then(res => res.json()),
      staleTime: 5 * 60 * 1000,
    })
  },
  
  // Prefetch course data
  course: async (id: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.course(id),
      queryFn: () => fetch(`/api/courses/${id}`).then(res => res.json()),
      staleTime: 5 * 60 * 1000,
    })
  },
  
  // Prefetch course materials
  courseMaterials: async (courseId: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.courseMaterials(courseId),
      queryFn: () => fetch(`/api/courses/${courseId}/materials`).then(res => res.json()),
      staleTime: 5 * 60 * 1000,
    })
  },
}

// Optimistic update helpers
export const optimisticUpdates = {
  // Optimistically update course enrollment
  courseEnrollment: (courseId: string, userId: string, isEnrolled: boolean) => {
    queryClient.setQueryData(
      queryKeys.courseEnrollments(courseId),
      (old: any) => {
        if (!old) return old
        return old.map((enrollment: any) =>
          enrollment.user_id === userId
            ? { ...enrollment, is_enrolled: isEnrolled }
            : enrollment
        )
      }
    )
  },
  
  // Optimistically update notification read status
  notificationRead: (userId: string, notificationId: string) => {
    queryClient.setQueryData(
      queryKeys.userNotifications(userId),
      (old: any) => {
        if (!old) return old
        return old.map((notification: any) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      }
    )
  },
}
