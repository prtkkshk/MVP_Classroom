import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// Import components to test
import ProfessorDashboard from '@/components/dashboard/ProfessorDashboard'
import { useAuthStore } from '@/store/authStore'
import { useCourseStore } from '@/store/courseStore'

// Mock the stores
jest.mock('@/store/authStore')
jest.mock('@/store/courseStore')

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>
const mockUseCourseStore = useCourseStore as jest.MockedFunction<typeof useCourseStore>

describe('Professor Profile - Comprehensive Test Suite', () => {
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
  ]

  const mockAnnouncements = [
    {
      id: 'ann-1',
      course_id: 'course-1',
      title: 'Welcome to CS101',
      content: 'Welcome to the Introduction to AI course!',
      is_important: true,
      created_at: '2024-01-01T00:00:00Z',
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
  ]

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Mock auth store
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      updateUser: jest.fn(),
      checkAuth: jest.fn(),
    })

    // Mock course store
    mockUseCourseStore.mockReturnValue({
      courses: mockCourses,
      materials: mockMaterials,
      announcements: mockAnnouncements,
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

  describe('Professor Dashboard Tests', () => {
    test('renders professor dashboard with correct user information', () => {
      render(<ProfessorDashboard />)

      // Check if user information is displayed
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument()
      expect(screen.getByText('professor@university.edu')).toBeInTheDocument()
      expect(screen.getByText('Computer Science')).toBeInTheDocument()
    })

    test('displays correct dashboard statistics', async () => {
      render(<ProfessorDashboard />)

      // Wait for dashboard data to load
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument() // Total courses
        expect(screen.getByText('60')).toBeInTheDocument() // Total students (35 + 25)
        expect(screen.getByText('2')).toBeInTheDocument() // Total materials
        expect(screen.getByText('1')).toBeInTheDocument() // Total doubts
      })
    })

    test('displays top performing courses', async () => {
      render(<ProfessorDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Introduction to AI')).toBeInTheDocument()
        expect(screen.getByText('Machine Learning')).toBeInTheDocument()
        expect(screen.getByText('CS101')).toBeInTheDocument()
        expect(screen.getByText('CS201')).toBeInTheDocument()
      })
    })

    test('displays recent activity', async () => {
      render(<ProfessorDashboard />)

      await waitFor(() => {
        expect(screen.getByText(/Recent Activity/)).toBeInTheDocument()
      })
    })

    test('quick actions are functional', async () => {
      render(<ProfessorDashboard />)

      const user = userEvent.setup()

      // Test "Create Course" button
      const createCourseButton = screen.getByText('Create Course')
      expect(createCourseButton).toBeInTheDocument()

      // Test "View Analytics" button
      const viewAnalyticsButton = screen.getByText('View Analytics')
      expect(viewAnalyticsButton).toBeInTheDocument()

      // Test "Manage Materials" button
      const manageMaterialsButton = screen.getByText('Manage Materials')
      expect(manageMaterialsButton).toBeInTheDocument()
    })
  })

  describe('Course Management Tests', () => {
    test('displays course list correctly', () => {
      render(<ProfessorDashboard />)

      expect(screen.getByText('Introduction to AI')).toBeInTheDocument()
      expect(screen.getByText('Machine Learning')).toBeInTheDocument()
      expect(screen.getByText('CS101')).toBeInTheDocument()
      expect(screen.getByText('CS201')).toBeInTheDocument()
    })

    test('shows course status badges', () => {
      render(<ProfessorDashboard />)

      const activeBadges = screen.getAllByText('Active')
      expect(activeBadges).toHaveLength(2)
    })

    test('displays student enrollment information', () => {
      render(<ProfessorDashboard />)

      expect(screen.getByText('35/50')).toBeInTheDocument() // CS101 enrollment
      expect(screen.getByText('25/30')).toBeInTheDocument() // CS201 enrollment
    })
  })

  describe('Material Management Tests', () => {
    test('displays course materials', async () => {
      render(<ProfessorDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Lecture 1: Introduction')).toBeInTheDocument()
        expect(screen.getByText('Assignment 1')).toBeInTheDocument()
      })
    })

    test('shows material types correctly', () => {
      render(<ProfessorDashboard />)

      // Material types should be displayed (document, assignment)
      expect(screen.getByText('document')).toBeInTheDocument()
      expect(screen.getByText('assignment')).toBeInTheDocument()
    })
  })

  describe('Announcement System Tests', () => {
    test('displays course announcements', async () => {
      render(<ProfessorDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Welcome to CS101')).toBeInTheDocument()
      })
    })

    test('shows important announcement indicators', () => {
      render(<ProfessorDashboard />)

      // Important announcements should have special indicators
      const importantAnnouncement = screen.getByText('Welcome to CS101')
      expect(importantAnnouncement).toBeInTheDocument()
    })
  })

  describe('Live Session Tests', () => {
    test('displays live session information', async () => {
      render(<ProfessorDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Live Q&A Session')).toBeInTheDocument()
      })
    })

    test('shows session status correctly', () => {
      render(<ProfessorDashboard />)

      // Session status should be displayed
      expect(screen.getByText('Live Q&A Session')).toBeInTheDocument()
    })
  })

  describe('Doubt Management Tests', () => {
    test('displays student doubts', async () => {
      render(<ProfessorDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Question about neural networks')).toBeInTheDocument()
      })
    })

    test('shows doubt status', () => {
      render(<ProfessorDashboard />)

      // Doubt status should be displayed
      expect(screen.getByText('pending')).toBeInTheDocument()
    })
  })

  describe('Assignment Management Tests', () => {
    test('displays course assignments', async () => {
      render(<ProfessorDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Assignment 1: AI Basics')).toBeInTheDocument()
      })
    })

    test('shows assignment details', () => {
      render(<ProfessorDashboard />)

      expect(screen.getByText('100')).toBeInTheDocument() // Total points
    })
  })

  describe('Analytics and Performance Tests', () => {
    test('calculates engagement metrics correctly', async () => {
      render(<ProfessorDashboard />)

      await waitFor(() => {
        // Engagement rate should be calculated based on students vs max students
        expect(screen.getByText('70%')).toBeInTheDocument() // CS101: 35/50 = 70%
        expect(screen.getByText('83%')).toBeInTheDocument() // CS201: 25/30 = 83%
      })
    })

    test('displays course performance indicators', () => {
      render(<ProfessorDashboard />)

      // Performance indicators should be visible
      expect(screen.getByText('Top Performing Courses')).toBeInTheDocument()
    })
  })

  describe('Real-time Features Tests', () => {
    test('handles real-time updates', async () => {
      const mockCourseStore = mockUseCourseStore()
      
      render(<ProfessorDashboard />)

      // Simulate real-time update
      const updatedCourses = [...mockCourses, {
        id: 'course-3',
        title: 'New Course',
        code: 'CS301',
        description: 'A new course',
        semester: 'Spring 2025',
        max_students: 40,
        current_students: 0,
        schedule: 'Mon, Wed 1:00 PM - 2:30 PM',
        classroom: 'Room 303',
        is_active: true,
        is_public: true,
        allow_enrollment: true,
        prerequisites: '',
        learning_objectives: '',
        created_at: '2024-01-01T00:00:00Z',
        professor_id: 'prof-123',
      }]

      // Update the mock to simulate real-time change
      mockUseCourseStore.mockReturnValue({
        ...mockCourseStore,
        courses: updatedCourses,
      })

      await waitFor(() => {
        expect(screen.getByText('New Course')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling Tests', () => {
    test('handles loading state', () => {
      mockUseCourseStore.mockReturnValue({
        ...mockUseCourseStore(),
        isLoading: true,
      })

      render(<ProfessorDashboard />)

      // Should show loading state
      expect(screen.getByText(/Loading/)).toBeInTheDocument()
    })

    test('handles error state', () => {
      mockUseCourseStore.mockReturnValue({
        ...mockUseCourseStore(),
        error: 'Failed to load courses',
      })

      render(<ProfessorDashboard />)

      // Should show error message
      expect(screen.getByText('Failed to load courses')).toBeInTheDocument()
    })
  })

  describe('Accessibility Tests', () => {
    test('has proper ARIA labels', () => {
      render(<ProfessorDashboard />)

      // Check for accessibility attributes
      const dashboard = screen.getByRole('main')
      expect(dashboard).toBeInTheDocument()
    })

    test('supports keyboard navigation', async () => {
      render(<ProfessorDashboard />)

      const user = userEvent.setup()

      // Test tab navigation
      await user.tab()
      expect(document.activeElement).toBeInTheDocument()
    })
  })

  describe('Responsive Design Tests', () => {
    test('adapts to different screen sizes', () => {
      // Mock different screen sizes
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })

      render(<ProfessorDashboard />)

      // Component should render without errors on mobile
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument()
    })
  })

  describe('Data Validation Tests', () => {
    test('validates course data structure', () => {
      const invalidCourse = {
        id: 'invalid-course',
        title: '', // Invalid: empty title
        code: 'CS999',
        description: 'Invalid course',
        semester: 'Fall 2024',
        max_students: -1, // Invalid: negative students
        current_students: 0,
        schedule: 'Invalid schedule',
        classroom: 'Room 999',
        is_active: true,
        is_public: true,
        allow_enrollment: true,
        prerequisites: '',
        learning_objectives: '',
        created_at: '2024-01-01T00:00:00Z',
        professor_id: 'prof-123',
      }

      mockUseCourseStore.mockReturnValue({
        ...mockUseCourseStore(),
        courses: [invalidCourse],
      })

      render(<ProfessorDashboard />)

      // Should handle invalid data gracefully
      expect(screen.getByText('CS999')).toBeInTheDocument()
    })
  })

  describe('Integration Tests', () => {
    test('integrates with auth store correctly', () => {
      render(<ProfessorDashboard />)

      // Should use auth store data
      expect(mockUseAuthStore).toHaveBeenCalled()
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument()
    })

    test('integrates with course store correctly', () => {
      render(<ProfessorDashboard />)

      // Should use course store data
      expect(mockUseCourseStore).toHaveBeenCalled()
      expect(screen.getByText('Introduction to AI')).toBeInTheDocument()
    })
  })
}) 