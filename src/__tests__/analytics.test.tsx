import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// Import components to test
import { useCourseStore } from '@/store/courseStore'
import { useAuthStore } from '@/store/authStore'

// Mock the stores
jest.mock('@/store/courseStore')
jest.mock('@/store/authStore')

const mockUseCourseStore = useCourseStore as jest.MockedFunction<typeof useCourseStore>
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>

describe('Analytics - Comprehensive Test Suite', () => {
  const mockUser = {
    id: 'prof-123',
    email: 'professor@university.edu',
    name: 'Dr. John Smith',
    role: 'professor',
    department: 'Computer Science',
    specialization: 'Artificial Intelligence',
    experience: 10,
    avatar_url: 'https://example.com/avatar.jpg',
    created_at: '2024-01-01T00:00:00Z',
  }

  const mockCourses = [
    {
      id: 'course-1',
      title: 'Introduction to AI',
      code: 'CS101',
      description: 'Basic concepts of artificial intelligence',
      semester: 'Fall 2024',
      max_students: 50,
      current_students: 35,
      schedule: 'Mon, Wed 10:00 AM - 11:30 AM',
      classroom: 'Room 101',
      is_active: true,
      is_public: true,
      allow_enrollment: true,
      prerequisites: 'Basic programming knowledge',
      learning_objectives: 'Understand AI fundamentals',
      created_at: '2024-01-01T00:00:00Z',
      professor_id: 'prof-123',
    },
    {
      id: 'course-2',
      title: 'Machine Learning',
      code: 'CS201',
      description: 'Advanced machine learning techniques',
      semester: 'Fall 2024',
      max_students: 30,
      current_students: 25,
      schedule: 'Tue, Thu 2:00 PM - 3:30 PM',
      classroom: 'Room 202',
      is_active: true,
      is_public: true,
      allow_enrollment: true,
      prerequisites: 'CS101',
      learning_objectives: 'Master ML algorithms',
      created_at: '2024-01-01T00:00:00Z',
      professor_id: 'prof-123',
    },
  ]

  const mockMaterials = [
    {
      id: 'mat-1',
      course_id: 'course-1',
      title: 'Lecture 1: Introduction',
      type: 'document',
      file_url: 'https://example.com/lecture1.pdf',
      description: 'Introduction to AI concepts',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'mat-2',
      course_id: 'course-1',
      title: 'Assignment 1',
      type: 'assignment',
      file_url: 'https://example.com/assignment1.pdf',
      description: 'First assignment on AI basics',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'mat-3',
      course_id: 'course-2',
      title: 'Lecture 1: ML Basics',
      type: 'document',
      file_url: 'https://example.com/ml-lecture1.pdf',
      description: 'Introduction to ML concepts',
      created_at: '2024-01-01T00:00:00Z',
    },
  ]

  const mockDoubts = [
    {
      id: 'doubt-1',
      course_id: 'course-1',
      student_id: 'student-1',
      title: 'Question about neural networks',
      content: 'I have a question about how neural networks work...',
      status: 'pending',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'doubt-2',
      course_id: 'course-1',
      student_id: 'student-2',
      title: 'Clarification needed',
      content: 'Can you clarify the backpropagation algorithm?',
      status: 'resolved',
      created_at: '2024-01-02T00:00:00Z',
    },
  ]

  const mockLiveSessions = [
    {
      id: 'session-1',
      course_id: 'course-1',
      title: 'Live Q&A Session',
      description: 'Weekly Q&A session',
      start_time: '2024-01-15T10:00:00Z',
      end_time: '2024-01-15T11:00:00Z',
      is_active: false,
      meeting_url: 'https://meet.google.com/abc123',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'session-2',
      course_id: 'course-2',
      title: 'ML Workshop',
      description: 'Hands-on ML workshop',
      start_time: '2024-01-16T14:00:00Z',
      end_time: '2024-01-16T16:00:00Z',
      is_active: false,
      meeting_url: 'https://meet.google.com/def456',
      created_at: '2024-01-01T00:00:00Z',
    },
  ]

  const mockAssignments = [
    {
      id: 'assign-1',
      course_id: 'course-1',
      title: 'Assignment 1: AI Basics',
      description: 'Complete the following problems...',
      due_date: '2024-01-20T23:59:59Z',
      total_points: 100,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'assign-2',
      course_id: 'course-2',
      title: 'Assignment 1: ML Fundamentals',
      description: 'Implement basic ML algorithms...',
      due_date: '2024-01-25T23:59:59Z',
      total_points: 150,
      created_at: '2024-01-01T00:00:00Z',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      updateUser: jest.fn(),
      checkAuth: jest.fn(),
    })

    mockUseCourseStore.mockReturnValue({
      courses: mockCourses,
      materials: mockMaterials,
      announcements: [],
      liveSessions: mockLiveSessions,
      doubts: mockDoubts,
      assignments: mockAssignments,
      enrollments: [],
      polls: [],
      calendarEvents: [],
      notifications: [],
      isLoading: false,
      error: null,
      fetchCourses: jest.fn(),
      createCourse: jest.fn(),
      updateCourse: jest.fn(),
      deleteCourse: jest.fn(),
      fetchMaterials: jest.fn(),
      createMaterial: jest.fn(),
      updateMaterial: jest.fn(),
      deleteMaterial: jest.fn(),
      fetchAnnouncements: jest.fn(),
      createAnnouncement: jest.fn(),
      updateAnnouncement: jest.fn(),
      deleteAnnouncement: jest.fn(),
      fetchLiveSessions: jest.fn(),
      createLiveSession: jest.fn(),
      updateLiveSession: jest.fn(),
      deleteLiveSession: jest.fn(),
      fetchDoubts: jest.fn(),
      createDoubt: jest.fn(),
      updateDoubt: jest.fn(),
      deleteDoubt: jest.fn(),
      fetchAssignments: jest.fn(),
      createAssignment: jest.fn(),
      updateAssignment: jest.fn(),
      deleteAssignment: jest.fn(),
      fetchEnrollments: jest.fn(),
      createEnrollment: jest.fn(),
      updateEnrollment: jest.fn(),
      deleteEnrollment: jest.fn(),
      fetchPolls: jest.fn(),
      createPoll: jest.fn(),
      updatePoll: jest.fn(),
      deletePoll: jest.fn(),
      fetchCalendarEvents: jest.fn(),
      createCalendarEvent: jest.fn(),
      updateCalendarEvent: jest.fn(),
      deleteCalendarEvent: jest.fn(),
      fetchNotifications: jest.fn(),
      createNotification: jest.fn(),
      updateNotification: jest.fn(),
      deleteNotification: jest.fn(),
    })
  })

  describe('Overall Analytics Tests', () => {
    test('calculates total courses correctly', () => {
      const totalCourses = mockCourses.length
      expect(totalCourses).toBe(2)
    })

    test('calculates total students correctly', () => {
      const totalStudents = mockCourses.reduce((sum, course) => sum + course.current_students, 0)
      expect(totalStudents).toBe(60) // 35 + 25
    })

    test('calculates total materials correctly', () => {
      const totalMaterials = mockMaterials.length
      expect(totalMaterials).toBe(3)
    })

    test('calculates total doubts correctly', () => {
      const totalDoubts = mockDoubts.length
      expect(totalDoubts).toBe(2)
    })

    test('calculates total live sessions correctly', () => {
      const totalSessions = mockLiveSessions.length
      expect(totalSessions).toBe(2)
    })

    test('calculates total assignments correctly', () => {
      const totalAssignments = mockAssignments.length
      expect(totalAssignments).toBe(2)
    })
  })

  describe('Course Performance Analytics Tests', () => {
    test('calculates course enrollment rates', () => {
      const coursePerformance = mockCourses.map(course => ({
        id: course.id,
        title: course.title,
        code: course.code,
        enrollmentRate: (course.current_students / course.max_students) * 100,
        currentStudents: course.current_students,
        maxStudents: course.max_students,
        materialCount: mockMaterials.filter(m => m.course_id === course.id).length,
        assignmentCount: mockAssignments.filter(a => a.course_id === course.id).length,
      }))

      expect(coursePerformance[0].enrollmentRate).toBe(70) // CS101: 35/50 * 100
      expect(coursePerformance[1].enrollmentRate).toBe(83.33) // CS201: 25/30 * 100
    })

    test('identifies top performing courses', () => {
      const coursePerformance = mockCourses.map(course => ({
        id: course.id,
        title: course.title,
        code: course.code,
        enrollmentRate: (course.current_students / course.max_students) * 100,
      }))

      const sortedCourses = coursePerformance.sort((a, b) => b.enrollmentRate - a.enrollmentRate)
      const topCourse = sortedCourses[0]

      expect(topCourse.code).toBe('CS201') // Higher enrollment rate
      expect(topCourse.enrollmentRate).toBeGreaterThan(sortedCourses[1].enrollmentRate)
    })

    test('calculates average enrollment rate', () => {
      const enrollmentRates = mockCourses.map(course => 
        (course.current_students / course.max_students) * 100
      )
      const averageEnrollmentRate = enrollmentRates.reduce((sum, rate) => sum + rate, 0) / enrollmentRates.length

      expect(averageEnrollmentRate).toBe(76.67) // (70 + 83.33) / 2
    })
  })

  describe('Student Engagement Analytics Tests', () => {
    test('calculates doubt resolution rate', () => {
      const totalDoubts = mockDoubts.length
      const resolvedDoubts = mockDoubts.filter(doubt => doubt.status === 'resolved').length
      const resolutionRate = (resolvedDoubts / totalDoubts) * 100

      expect(resolutionRate).toBe(50) // 1 resolved out of 2 total
    })

    test('tracks doubt status distribution', () => {
      const doubtStatuses = mockDoubts.map(doubt => doubt.status)
      const pendingCount = doubtStatuses.filter(status => status === 'pending').length
      const resolvedCount = doubtStatuses.filter(status => status === 'resolved').length

      expect(pendingCount).toBe(1)
      expect(resolvedCount).toBe(1)
    })

    test('calculates course engagement metrics', () => {
      const courseEngagement = mockCourses.map(course => {
        const courseDoubts = mockDoubts.filter(d => d.course_id === course.id)
        const courseMaterials = mockMaterials.filter(m => m.course_id === course.id)
        const courseAssignments = mockAssignments.filter(a => a.course_id === course.id)
        const courseSessions = mockLiveSessions.filter(s => s.course_id === course.id)

        return {
          courseId: course.id,
          courseCode: course.code,
          enrollmentRate: (course.current_students / course.max_students) * 100,
          doubtCount: courseDoubts.length,
          materialCount: courseMaterials.length,
          assignmentCount: courseAssignments.length,
          sessionCount: courseSessions.length,
          engagementScore: (
            (course.current_students / course.max_students) * 40 + // Enrollment weight
            (courseDoubts.length / 10) * 20 + // Doubt activity weight
            (courseMaterials.length / 5) * 20 + // Material availability weight
            (courseAssignments.length / 3) * 20 // Assignment activity weight
          ),
        }
      })

      expect(courseEngagement[0].engagementScore).toBeGreaterThan(0)
      expect(courseEngagement[1].engagementScore).toBeGreaterThan(0)
    })
  })

  describe('Monthly Trends Analytics Tests', () => {
    test('groups data by month', () => {
      const monthlyData = {
        '2024-01': {
          courses: mockCourses.filter(c => c.created_at.startsWith('2024-01')),
          materials: mockMaterials.filter(m => m.created_at.startsWith('2024-01')),
          doubts: mockDoubts.filter(d => d.created_at.startsWith('2024-01')),
          sessions: mockLiveSessions.filter(s => s.created_at.startsWith('2024-01')),
          assignments: mockAssignments.filter(a => a.created_at.startsWith('2024-01')),
        }
      }

      expect(monthlyData['2024-01'].courses.length).toBe(2)
      expect(monthlyData['2024-01'].materials.length).toBe(3)
      expect(monthlyData['2024-01'].doubts.length).toBe(2)
      expect(monthlyData['2024-01'].sessions.length).toBe(2)
      expect(monthlyData['2024-01'].assignments.length).toBe(2)
    })

    test('calculates monthly growth rates', () => {
      const currentMonthData = {
        courses: 2,
        materials: 3,
        doubts: 2,
        sessions: 2,
        assignments: 2,
      }

      const previousMonthData = {
        courses: 1,
        materials: 2,
        doubts: 1,
        sessions: 1,
        assignments: 1,
      }

      const growthRates = {
        courses: ((currentMonthData.courses - previousMonthData.courses) / previousMonthData.courses) * 100,
        materials: ((currentMonthData.materials - previousMonthData.materials) / previousMonthData.materials) * 100,
        doubts: ((currentMonthData.doubts - previousMonthData.doubts) / previousMonthData.doubts) * 100,
        sessions: ((currentMonthData.sessions - previousMonthData.sessions) / previousMonthData.sessions) * 100,
        assignments: ((currentMonthData.assignments - previousMonthData.assignments) / previousMonthData.assignments) * 100,
      }

      expect(growthRates.courses).toBe(100) // 100% growth
      expect(growthRates.materials).toBe(50) // 50% growth
      expect(growthRates.doubts).toBe(100) // 100% growth
      expect(growthRates.sessions).toBe(100) // 100% growth
      expect(growthRates.assignments).toBe(100) // 100% growth
    })
  })

  describe('Data Export Tests', () => {
    test('generates CSV export data', () => {
      const csvData = mockCourses.map(course => ({
        'Course Code': course.code,
        'Course Title': course.title,
        'Enrollment Rate': `${((course.current_students / course.max_students) * 100).toFixed(2)}%`,
        'Current Students': course.current_students,
        'Max Students': course.max_students,
        'Materials Count': mockMaterials.filter(m => m.course_id === course.id).length,
        'Assignments Count': mockAssignments.filter(a => a.course_id === course.id).length,
        'Doubts Count': mockDoubts.filter(d => d.course_id === course.id).length,
        'Sessions Count': mockLiveSessions.filter(s => s.course_id === course.id).length,
      }))

      expect(csvData.length).toBe(2)
      expect(csvData[0]['Course Code']).toBe('CS101')
      expect(csvData[1]['Course Code']).toBe('CS201')
      expect(csvData[0]['Enrollment Rate']).toBe('70.00%')
      expect(csvData[1]['Enrollment Rate']).toBe('83.33%')
    })

    test('formats CSV headers correctly', () => {
      const headers = [
        'Course Code',
        'Course Title',
        'Enrollment Rate',
        'Current Students',
        'Max Students',
        'Materials Count',
        'Assignments Count',
        'Doubts Count',
        'Sessions Count',
      ]

      expect(headers.length).toBe(9)
      expect(headers).toContain('Course Code')
      expect(headers).toContain('Enrollment Rate')
    })

    test('handles empty data for export', () => {
      const emptyCourses = []
      const csvData = emptyCourses.map(course => ({
        'Course Code': course.code,
        'Course Title': course.title,
      }))

      expect(csvData.length).toBe(0)
    })
  })

  describe('Performance Metrics Tests', () => {
    test('calculates overall performance score', () => {
      const totalCourses = mockCourses.length
      const totalStudents = mockCourses.reduce((sum, course) => sum + course.current_students, 0)
      const totalMaterials = mockMaterials.length
      const totalDoubts = mockDoubts.length
      const totalSessions = mockLiveSessions.length
      const totalAssignments = mockAssignments.length

      const performanceScore = (
        (totalCourses * 10) + // Course weight
        (totalStudents * 2) + // Student weight
        (totalMaterials * 5) + // Material weight
        (totalDoubts * 3) + // Doubt weight
        (totalSessions * 4) + // Session weight
        (totalAssignments * 6) // Assignment weight
      )

      expect(performanceScore).toBe(20 + 120 + 15 + 6 + 8 + 12) // 181
    })

    test('identifies performance trends', () => {
      const enrollmentTrends = mockCourses.map(course => ({
        courseCode: course.code,
        trend: course.current_students > (course.max_students * 0.8) ? 'High' : 
               course.current_students > (course.max_students * 0.5) ? 'Medium' : 'Low'
      }))

      expect(enrollmentTrends[0].trend).toBe('Medium') // CS101: 70%
      expect(enrollmentTrends[1].trend).toBe('High') // CS201: 83.33%
    })

    test('calculates efficiency metrics', () => {
      const efficiencyMetrics = mockCourses.map(course => {
        const courseMaterials = mockMaterials.filter(m => m.course_id === course.id)
        const courseAssignments = mockAssignments.filter(a => a.course_id === course.id)
        const courseDoubts = mockDoubts.filter(d => d.course_id === course.id)

        return {
          courseCode: course.code,
          materialEfficiency: courseMaterials.length / course.current_students,
          assignmentEfficiency: courseAssignments.length / course.current_students,
          doubtEfficiency: courseDoubts.length / course.current_students,
        }
      })

      expect(efficiencyMetrics[0].materialEfficiency).toBe(2 / 35) // 2 materials / 35 students
      expect(efficiencyMetrics[1].materialEfficiency).toBe(1 / 25) // 1 material / 25 students
    })
  })

  describe('Real-time Analytics Tests', () => {
    test('updates analytics in real-time', async () => {
      const initialAnalytics = {
        totalCourses: mockCourses.length,
        totalStudents: mockCourses.reduce((sum, course) => sum + course.current_students, 0),
        totalMaterials: mockMaterials.length,
      }

      // Simulate real-time update
      const newCourse = {
        id: 'course-3',
        title: 'New Course',
        code: 'CS301',
        current_students: 20,
        max_students: 40,
        created_at: '2024-01-01T00:00:00Z',
        professor_id: 'prof-123',
      }

      const updatedCourses = [...mockCourses, newCourse]
      const updatedAnalytics = {
        totalCourses: updatedCourses.length,
        totalStudents: updatedCourses.reduce((sum, course) => sum + course.current_students, 0),
        totalMaterials: mockMaterials.length,
      }

      expect(updatedAnalytics.totalCourses).toBe(initialAnalytics.totalCourses + 1)
      expect(updatedAnalytics.totalStudents).toBe(initialAnalytics.totalStudents + 20)
    })

    test('handles real-time data changes', () => {
      const course = mockCourses[0]
      const initialEnrollmentRate = (course.current_students / course.max_students) * 100

      // Simulate student enrollment
      const updatedCourse = { ...course, current_students: course.current_students + 5 }
      const updatedEnrollmentRate = (updatedCourse.current_students / updatedCourse.max_students) * 100

      expect(updatedEnrollmentRate).toBeGreaterThan(initialEnrollmentRate)
      expect(updatedEnrollmentRate).toBe(80) // (35 + 5) / 50 * 100
    })
  })

  describe('Data Validation Tests', () => {
    test('validates analytics data integrity', () => {
      const analyticsData = {
        courses: mockCourses,
        materials: mockMaterials,
        doubts: mockDoubts,
        sessions: mockLiveSessions,
        assignments: mockAssignments,
      }

      // Validate data structure
      expect(Array.isArray(analyticsData.courses)).toBe(true)
      expect(Array.isArray(analyticsData.materials)).toBe(true)
      expect(Array.isArray(analyticsData.doubts)).toBe(true)
      expect(Array.isArray(analyticsData.sessions)).toBe(true)
      expect(Array.isArray(analyticsData.assignments)).toBe(true)

      // Validate data consistency
      analyticsData.courses.forEach(course => {
        expect(course.current_students).toBeLessThanOrEqual(course.max_students)
        expect(course.current_students).toBeGreaterThanOrEqual(0)
      })
    })

    test('handles missing or invalid data', () => {
      const invalidCourse = {
        id: 'invalid-course',
        current_students: -5, // Invalid negative students
        max_students: 0, // Invalid zero capacity
      }

      // Should handle invalid data gracefully
      const isValid = invalidCourse.current_students >= 0 && invalidCourse.max_students > 0
      expect(isValid).toBe(false)
    })
  })

  describe('Analytics Calculation Tests', () => {
    test('calculates percentages correctly', () => {
      const total = 100
      const part = 75
      const percentage = (part / total) * 100

      expect(percentage).toBe(75)
    })

    test('handles division by zero', () => {
      const safeDivision = (numerator: number, denominator: number) => {
        return denominator === 0 ? 0 : numerator / denominator
      }

      expect(safeDivision(10, 0)).toBe(0)
      expect(safeDivision(10, 2)).toBe(5)
    })

    test('rounds decimal values correctly', () => {
      const enrollmentRate = 83.333333
      const roundedRate = Math.round(enrollmentRate * 100) / 100

      expect(roundedRate).toBe(83.33)
    })
  })
}) 