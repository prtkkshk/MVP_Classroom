import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockSupabaseClient } from './__mocks__/supabase'

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useParams: () => ({ courseId: 'test-course-id' }),
}))

// Mock file upload
const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })

describe('Material Management Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('1. File Upload Tests', () => {
    test('should upload valid PDF file successfully', async () => {
      const user = userEvent.setup()
      
      // Mock file upload
      mockSupabaseClient.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'materials/test.pdf' },
          error: null
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/materials/test.pdf' }
        })
      })

      // Mock material record creation
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: {
            id: 'material-1',
            title: 'test.pdf',
            file_path: 'materials/test.pdf',
            file_type: 'pdf',
            file_size: 1024,
            course_id: 'course-1'
          },
          error: null
        })
      })

      const fileInput = screen.getByLabelText(/upload file/i)
      const uploadButton = screen.getByRole('button', { name: /upload/i })

      await user.upload(fileInput, mockFile)
      await user.click(uploadButton)

      await waitFor(() => {
        expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('materials')
        expect(screen.getByText(/file uploaded successfully/i)).toBeInTheDocument()
      })
    })

    test('should upload valid image file successfully', async () => {
      const user = userEvent.setup()
      
      const imageFile = new File(['image content'], 'image.jpg', { type: 'image/jpeg' })

      mockSupabaseClient.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'materials/image.jpg' },
          error: null
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/materials/image.jpg' }
        })
      })

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: {
            id: 'material-2',
            title: 'image.jpg',
            file_path: 'materials/image.jpg',
            file_type: 'image',
            file_size: 2048,
            course_id: 'course-1'
          },
          error: null
        })
      })

      const fileInput = screen.getByLabelText(/upload file/i)
      const uploadButton = screen.getByRole('button', { name: /upload/i })

      await user.upload(fileInput, imageFile)
      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByText(/file uploaded successfully/i)).toBeInTheDocument()
      })
    })

    test('should reject invalid file types', async () => {
      const user = userEvent.setup()
      
      const invalidFile = new File(['content'], 'script.exe', { type: 'application/x-executable' })

      const fileInput = screen.getByLabelText(/upload file/i)
      const uploadButton = screen.getByRole('button', { name: /upload/i })

      await user.upload(fileInput, invalidFile)
      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByText(/file type not allowed/i)).toBeInTheDocument()
      })
    })

    test('should reject files larger than 50MB', async () => {
      const user = userEvent.setup()
      
      // Create a large file mock
      const largeFile = new File(['x'.repeat(60 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' })

      const fileInput = screen.getByLabelText(/upload file/i)
      const uploadButton = screen.getByRole('button', { name: /upload/i })

      await user.upload(fileInput, largeFile)
      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByText(/file size exceeds 50MB limit/i)).toBeInTheDocument()
      })
    })

    test('should handle upload errors', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Upload failed' }
        })
      })

      const fileInput = screen.getByLabelText(/upload file/i)
      const uploadButton = screen.getByRole('button', { name: /upload/i })

      await user.upload(fileInput, mockFile)
      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByText(/upload failed/i)).toBeInTheDocument()
      })
    })

    test('should show upload progress', async () => {
      const user = userEvent.setup()
      
      // Mock progress tracking
      const mockUpload = jest.fn().mockImplementation((path, file, options) => {
        if (options.onProgress) {
          options.onProgress(50) // 50% progress
        }
        return Promise.resolve({
          data: { path: 'materials/test.pdf' },
          error: null
        })
      })

      mockSupabaseClient.storage.from.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/materials/test.pdf' }
        })
      })

      const fileInput = screen.getByLabelText(/upload file/i)
      const uploadButton = screen.getByRole('button', { name: /upload/i })

      await user.upload(fileInput, mockFile)
      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByText(/50%/i)).toBeInTheDocument()
      })
    })
  })

  describe('2. File Categorization Tests', () => {
    test('should automatically categorize PDF files', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'materials/document.pdf' },
          error: null
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/materials/document.pdf' }
        })
      })

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: {
            id: 'material-1',
            title: 'document.pdf',
            file_path: 'materials/document.pdf',
            file_type: 'pdf',
            category: 'document',
            course_id: 'course-1'
          },
          error: null
        })
      })

      const fileInput = screen.getByLabelText(/upload file/i)
      const uploadButton = screen.getByRole('button', { name: /upload/i })

      await user.upload(fileInput, mockFile)
      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByText(/document/i)).toBeInTheDocument()
      })
    })

    test('should automatically categorize image files', async () => {
      const user = userEvent.setup()
      
      const imageFile = new File(['image content'], 'screenshot.png', { type: 'image/png' })

      mockSupabaseClient.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'materials/screenshot.png' },
          error: null
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/materials/screenshot.png' }
        })
      })

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: {
            id: 'material-2',
            title: 'screenshot.png',
            file_path: 'materials/screenshot.png',
            file_type: 'image',
            category: 'image',
            course_id: 'course-1'
          },
          error: null
        })
      })

      const fileInput = screen.getByLabelText(/upload file/i)
      const uploadButton = screen.getByRole('button', { name: /upload/i })

      await user.upload(fileInput, imageFile)
      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByText(/image/i)).toBeInTheDocument()
      })
    })

    test('should allow manual category selection', async () => {
      const user = userEvent.setup()
      
      const fileInput = screen.getByLabelText(/upload file/i)
      const categorySelect = screen.getByLabelText(/category/i)
      const uploadButton = screen.getByRole('button', { name: /upload/i })

      await user.upload(fileInput, mockFile)
      await user.selectOptions(categorySelect, 'assignment')
      await user.click(uploadButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'assignment'
          })
        )
      })
    })
  })

  describe('3. Material Search and Filter Tests', () => {
    test('should search materials by title', async () => {
      const user = userEvent.setup()
      
      const searchInput = screen.getByPlaceholderText(/search materials/i)
      await user.type(searchInput, 'lecture notes')

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('materials')
        expect(mockSupabaseClient.from().ilike).toHaveBeenCalledWith('title', '%lecture notes%')
      })
    })

    test('should filter materials by category', async () => {
      const user = userEvent.setup()
      
      const categoryFilter = screen.getByLabelText(/filter by category/i)
      await user.selectOptions(categoryFilter, 'document')

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('materials')
        expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('category', 'document')
      })
    })

    test('should filter materials by file type', async () => {
      const user = userEvent.setup()
      
      const typeFilter = screen.getByLabelText(/filter by file type/i)
      await user.selectOptions(typeFilter, 'pdf')

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('materials')
        expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('file_type', 'pdf')
      })
    })

    test('should sort materials by upload date', async () => {
      const user = userEvent.setup()
      
      const sortSelect = screen.getByLabelText(/sort by/i)
      await user.selectOptions(sortSelect, 'upload_date_desc')

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('materials')
        expect(mockSupabaseClient.from().order).toHaveBeenCalledWith('created_at', { ascending: false })
      })
    })

    test('should combine search and filters', async () => {
      const user = userEvent.setup()
      
      const searchInput = screen.getByPlaceholderText(/search materials/i)
      const categoryFilter = screen.getByLabelText(/filter by category/i)

      await user.type(searchInput, 'assignment')
      await user.selectOptions(categoryFilter, 'assignment')

      await waitFor(() => {
        expect(mockSupabaseClient.from().ilike).toHaveBeenCalledWith('title', '%assignment%')
        expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('category', 'assignment')
      })
    })
  })

  describe('4. Material Download Tests', () => {
    test('should download material successfully', async () => {
      const user = userEvent.setup()
      
      // Mock material data
      const materialData = {
        id: 'material-1',
        title: 'lecture.pdf',
        file_path: 'materials/lecture.pdf',
        file_type: 'pdf',
        file_size: 1024
      }

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: materialData,
          error: null
        })
      })

      mockSupabaseClient.storage.from.mockReturnValue({
        download: jest.fn().mockResolvedValue({
          data: new Blob(['file content']),
          error: null
        })
      })

      const downloadButton = screen.getByRole('button', { name: /download/i })
      await user.click(downloadButton)

      await waitFor(() => {
        expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('materials')
        expect(mockSupabaseClient.storage.from().download).toHaveBeenCalledWith('materials/lecture.pdf')
      })
    })

    test('should prevent unauthorized download', async () => {
      const user = userEvent.setup()
      
      // Mock unauthorized access
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Access denied' }
        })
      })

      const downloadButton = screen.getByRole('button', { name: /download/i })
      await user.click(downloadButton)

      await waitFor(() => {
        expect(screen.getByText(/access denied/i)).toBeInTheDocument()
      })
    })

    test('should handle download errors', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.storage.from.mockReturnValue({
        download: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Download failed' }
        })
      })

      const downloadButton = screen.getByRole('button', { name: /download/i })
      await user.click(downloadButton)

      await waitFor(() => {
        expect(screen.getByText(/download failed/i)).toBeInTheDocument()
      })
    })
  })

  describe('5. Material Metadata Tests', () => {
    test('should display file metadata correctly', async () => {
      const materialData = [
        {
          id: 'material-1',
          title: 'lecture.pdf',
          file_type: 'pdf',
          file_size: 1024,
          category: 'document',
          uploaded_by: 'Dr. Smith',
          created_at: '2024-01-01T00:00:00Z',
          download_count: 25
        }
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: materialData,
          error: null
        })
      })

      window.history.pushState({}, '', '/dashboard/courses/course-1/materials')

      await waitFor(() => {
        expect(screen.getByText('lecture.pdf')).toBeInTheDocument()
        expect(screen.getByText('PDF')).toBeInTheDocument()
        expect(screen.getByText('1 KB')).toBeInTheDocument()
        expect(screen.getByText('document')).toBeInTheDocument()
        expect(screen.getByText('Dr. Smith')).toBeInTheDocument()
        expect(screen.getByText('25 downloads')).toBeInTheDocument()
      })
    })

    test('should update download count on download', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })

      const downloadButton = screen.getByRole('button', { name: /download/i })
      await user.click(downloadButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
          download_count: expect.any(Number)
        })
      })
    })
  })

  describe('6. Material Deletion Tests', () => {
    test('should delete material successfully', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.storage.from.mockReturnValue({
        remove: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })

      mockSupabaseClient.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm delete/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockSupabaseClient.storage.from().remove).toHaveBeenCalled()
        expect(mockSupabaseClient.from().delete).toHaveBeenCalled()
        expect(screen.getByText(/material deleted successfully/i)).toBeInTheDocument()
      })
    })

    test('should handle deletion errors', async () => {
      const user = userEvent.setup()
      
      mockSupabaseClient.storage.from.mockReturnValue({
        remove: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Delete failed' }
        })
      })

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      const confirmButton = screen.getByRole('button', { name: /confirm delete/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(screen.getByText(/delete failed/i)).toBeInTheDocument()
      })
    })
  })

  describe('7. Access Control Tests', () => {
    test('should allow professor to manage their course materials', async () => {
      // Mock professor user
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'prof-1',
              user_metadata: { role: 'professor' }
            }
          }
        },
        error: null
      })

      // Mock professor's course materials
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [
            { 
              id: 'material-1',
              title: 'My Material',
              course: { professor_id: 'prof-1' }
            }
          ],
          error: null
        })
      })

      window.history.pushState({}, '', '/dashboard/courses/course-1/materials')

      await waitFor(() => {
        expect(screen.getByText('My Material')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
      })
    })

    test('should prevent students from deleting materials', async () => {
      // Mock student user
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'student-1',
              user_metadata: { role: 'student' }
            }
          }
        },
        error: null
      })

      window.history.pushState({}, '', '/dashboard/courses/course-1/materials')

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
      })
    })
  })
})
