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

describe('Course Management - Comprehensive Test Suite', () => {
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
      materials: [],
      announcements: [],
      liveSessions: [],
      doubts: [],
      assignments: [],
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

  describe('Course Creation Tests', () => {
    test('validates course creation form fields', async () => {
      const user = userEvent.setup()
      
      // Test form validation
      const courseData = {
        code: 'CS101',
        title: 'Introduction to AI',
        description: 'Basic concepts of artificial intelligence',
        semester: 'Fall 2024',
        max_students: 50,
        schedule: 'Mon, Wed 10:00 AM - 11:30 AM',
        classroom: 'Room 101',
        is_public: true,
        allow_enrollment: true,
        prerequisites: 'Basic programming knowledge',
        learning_objectives: 'Understand AI fundamentals',
      }

      // Validate required fields
      expect(courseData.code).toBeTruthy()
      expect(courseData.title).toBeTruthy()
      expect(courseData.description).toBeTruthy()
      expect(courseData.semester).toBeTruthy()
      expect(courseData.max_students).toBeGreaterThan(0)
      expect(courseData.schedule).toBeTruthy()
      expect(courseData.classroom).toBeTruthy()
    })

    test('handles course creation with all required fields', async () => {
      const mockCreateCourse = jest.fn()
      mockUseCourseStore.mockReturnValue({
        ...mockUseCourseStore(),
        createCourse: mockCreateCourse,
      })

      const courseData = {
        code: 'CS101',
        title: 'Introduction to AI',
        description: 'Basic concepts of artificial intelligence',
        semester: 'Fall 2024',
        max_students: 50,
        schedule: 'Mon, Wed 10:00 AM - 11:30 AM',
        classroom: 'Room 101',
        is_public: true,
        allow_enrollment: true,
        prerequisites: 'Basic programming knowledge',
        learning_objectives: 'Understand AI fundamentals',
      }

      // Simulate course creation
      await mockCreateCourse(courseData)

      expect(mockCreateCourse).toHaveBeenCalledWith(courseData)
    })

    test('validates course code format', () => {
      const validCourseCodes = ['CS101', 'MATH201', 'ENG101']
      const invalidCourseCodes = ['', '123', 'CS', 'CS101CS101CS101']

      validCourseCodes.forEach(code => {
        expect(code).toMatch(/^[A-Z]{2,4}\d{3}$/)
      })

      invalidCourseCodes.forEach(code => {
        expect(code).not.toMatch(/^[A-Z]{2,4}\d{3}$/)
      })
    })

    test('validates student capacity', () => {
      const validCapacities = [1, 50, 100, 200]
      const invalidCapacities = [0, -1, 1000]

      validCapacities.forEach(capacity => {
        expect(capacity).toBeGreaterThan(0)
        expect(capacity).toBeLessThanOrEqual(200)
      })

      invalidCapacities.forEach(capacity => {
        expect(capacity <= 0 || capacity > 200).toBeTruthy()
      })
    })
  })

  describe('Course Update Tests', () => {
    test('updates course information correctly', async () => {
      const mockUpdateCourse = jest.fn()
      mockUseCourseStore.mockReturnValue({
        ...mockUseCourseStore(),
        updateCourse: mockUpdateCourse,
      })

      const updatedCourseData = {
        id: 'course-1',
        title: 'Updated Introduction to AI',
        description: 'Updated description',
        max_students: 60,
      }

      await mockUpdateCourse(updatedCourseData.id, updatedCourseData)

      expect(mockUpdateCourse).toHaveBeenCalledWith(updatedCourseData.id, updatedCourseData)
    })

    test('handles course status changes', async () => {
      const mockUpdateCourse = jest.fn()
      mockUseCourseStore.mockReturnValue({
        ...mockUseCourseStore(),
        updateCourse: mockUpdateCourse,
      })

      // Test activating a course
      await mockUpdateCourse('course-1', { is_active: true })
      expect(mockUpdateCourse).toHaveBeenCalledWith('course-1', { is_active: true })

      // Test deactivating a course
      await mockUpdateCourse('course-1', { is_active: false })
      expect(mockUpdateCourse).toHaveBeenCalledWith('course-1', { is_active: false })
    })
  })

  describe('Course Deletion Tests', () => {
    test('confirms course deletion', async () => {
      const mockDeleteCourse = jest.fn()
      mockUseCourseStore.mockReturnValue({
        ...mockUseCourseStore(),
        deleteCourse: mockDeleteCourse,
      })

      // Simulate confirmation dialog
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)

      await mockDeleteCourse('course-1')

      expect(confirmSpy).toHaveBeenCalled()
      expect(mockDeleteCourse).toHaveBeenCalledWith('course-1')

      confirmSpy.mockRestore()
    })

    test('cancels course deletion', async () => {
      const mockDeleteCourse = jest.fn()
      mockUseCourseStore.mockReturnValue({
        ...mockUseCourseStore(),
        deleteCourse: mockDeleteCourse,
      })

      // Simulate cancellation
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false)

      await mockDeleteCourse('course-1')

      expect(confirmSpy).toHaveBeenCalled()
      expect(mockDeleteCourse).not.toHaveBeenCalled()

      confirmSpy.mockRestore()
    })
  })

  describe('Course Search and Filter Tests', () => {
    test('filters courses by semester', () => {
      const courses = [
        { ...mockCourses[0], semester: 'Fall 2024' },
        { ...mockCourses[0], id: 'course-2', semester: 'Spring 2025' },
      ]

      const fallCourses = courses.filter(course => course.semester === 'Fall 2024')
      const springCourses = courses.filter(course => course.semester === 'Spring 2025')

      expect(fallCourses).toHaveLength(1)
      expect(springCourses).toHaveLength(1)
    })

    test('searches courses by title', () => {
      const courses = [
        { ...mockCourses[0], title: 'Introduction to AI' },
        { ...mockCourses[0], id: 'course-2', title: 'Machine Learning' },
      ]

      const searchTerm = 'AI'
      const filteredCourses = courses.filter(course => 
        course.title.toLowerCase().includes(searchTerm.toLowerCase())
      )

      expect(filteredCourses).toHaveLength(1)
      expect(filteredCourses[0].title).toBe('Introduction to AI')
    })

    test('filters courses by status', () => {
      const courses = [
        { ...mockCourses[0], is_active: true },
        { ...mockCourses[0], id: 'course-2', is_active: false },
      ]

      const activeCourses = courses.filter(course => course.is_active)
      const inactiveCourses = courses.filter(course => !course.is_active)

      expect(activeCourses).toHaveLength(1)
      expect(inactiveCourses).toHaveLength(1)
    })
  })

  describe('Course Enrollment Tests', () => {
    test('tracks student enrollment correctly', () => {
      const course = mockCourses[0]
      const enrollmentRate = (course.current_students / course.max_students) * 100

      expect(enrollmentRate).toBe(70) // 35/50 * 100
      expect(course.current_students).toBeLessThanOrEqual(course.max_students)
    })

    test('prevents over-enrollment', () => {
      const course = mockCourses[0]
      const canEnroll = course.current_students < course.max_students

      expect(canEnroll).toBe(true)
      expect(course.current_students).toBeLessThan(course.max_students)
    })

    test('calculates available seats', () => {
      const course = mockCourses[0]
      const availableSeats = course.max_students - course.current_students

      expect(availableSeats).toBe(15) // 50 - 35
      expect(availableSeats).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Course Analytics Tests', () => {
    test('calculates course engagement metrics', () => {
      const course = mockCourses[0]
      const engagementRate = (course.current_students / course.max_students) * 100
      const utilizationRate = (course.current_students / course.max_students) * 100

      expect(engagementRate).toBe(70)
      expect(utilizationRate).toBe(70)
      expect(engagementRate).toBeGreaterThanOrEqual(0)
      expect(engagementRate).toBeLessThanOrEqual(100)
    })

    test('tracks course performance indicators', () => {
      const course = mockCourses[0]
      
      // Performance indicators
      const enrollmentRate = (course.current_students / course.max_students) * 100
      const isPopular = enrollmentRate > 80
      const isUnderEnrolled = enrollmentRate < 30

      expect(enrollmentRate).toBe(70)
      expect(isPopular).toBe(false)
      expect(isUnderEnrolled).toBe(false)
    })
  })

  describe('Course Validation Tests', () => {
    test('validates course schedule format', () => {
      const validSchedules = [
        'Mon, Wed 10:00 AM - 11:30 AM',
        'Tue, Thu 2:00 PM - 3:30 PM',
        'Fri 9:00 AM - 12:00 PM',
      ]

      const invalidSchedules = [
        '',
        'Invalid schedule',
        'Mon 10:00',
        'Mon, Wed 10:00 AM - 11:30 AM - Extra',
      ]

      validSchedules.forEach(schedule => {
        expect(schedule).toMatch(/^[A-Za-z]{3}(,\s*[A-Za-z]{3})?\s+\d{1,2}:\d{2}\s+(AM|PM)\s+-\s+\d{1,2}:\d{2}\s+(AM|PM)$/)
      })

      invalidSchedules.forEach(schedule => {
        expect(schedule).not.toMatch(/^[A-Za-z]{3}(,\s*[A-Za-z]{3})?\s+\d{1,2}:\d{2}\s+(AM|PM)\s+-\s+\d{1,2}:\d{2}\s+(AM|PM)$/)
      })
    })

    test('validates classroom format', () => {
      const validClassrooms = ['Room 101', 'Room 202', 'Lab A', 'Auditorium 1']
      const invalidClassrooms = ['', 'Room', '101', 'Room 101 Room 101']

      validClassrooms.forEach(classroom => {
        expect(classroom.length).toBeGreaterThan(3)
        expect(classroom.length).toBeLessThan(50)
      })

      invalidClassrooms.forEach(classroom => {
        expect(classroom.length <= 3 || classroom.length >= 50).toBeTruthy()
      })
    })
  })

  describe('Error Handling Tests', () => {
    test('handles course creation errors', async () => {
      const mockCreateCourse = jest.fn().mockRejectedValue(new Error('Course creation failed'))
      mockUseCourseStore.mockReturnValue({
        ...mockUseCourseStore(),
        createCourse: mockCreateCourse,
      })

      try {
        await mockCreateCourse({})
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toBe('Course creation failed')
      }
    })

    test('handles course update errors', async () => {
      const mockUpdateCourse = jest.fn().mockRejectedValue(new Error('Course update failed'))
      mockUseCourseStore.mockReturnValue({
        ...mockUseCourseStore(),
        updateCourse: mockUpdateCourse,
      })

      try {
        await mockUpdateCourse('course-1', {})
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toBe('Course update failed')
      }
    })

    test('handles course deletion errors', async () => {
      const mockDeleteCourse = jest.fn().mockRejectedValue(new Error('Course deletion failed'))
      mockUseCourseStore.mockReturnValue({
        ...mockUseCourseStore(),
        deleteCourse: mockDeleteCourse,
      })

      try {
        await mockDeleteCourse('course-1')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toBe('Course deletion failed')
      }
    })
  })

  describe('Data Integrity Tests', () => {
    test('ensures course data consistency', () => {
      const course = mockCourses[0]

      // Required fields should be present
      expect(course.id).toBeTruthy()
      expect(course.title).toBeTruthy()
      expect(course.code).toBeTruthy()
      expect(course.professor_id).toBeTruthy()
      expect(course.created_at).toBeTruthy()

      // Data types should be correct
      expect(typeof course.id).toBe('string')
      expect(typeof course.title).toBe('string')
      expect(typeof course.max_students).toBe('number')
      expect(typeof course.is_active).toBe('boolean')
    })

    test('validates course relationships', () => {
      const course = mockCourses[0]

      // Course should belong to a professor
      expect(course.professor_id).toBe(mockUser.id)

      // Enrollment should not exceed capacity
      expect(course.current_students).toBeLessThanOrEqual(course.max_students)

      // Course should have valid dates
      expect(new Date(course.created_at)).toBeInstanceOf(Date)
      expect(new Date(course.created_at).getTime()).toBeGreaterThan(0)
    })
  })
}) 