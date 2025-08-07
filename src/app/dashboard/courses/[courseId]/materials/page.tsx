'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BookOpen, 
  Upload, 
  Folder, 
  File, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive,
  Search,
  Download,
  Trash2,
  Edit,
  Plus,
  ArrowLeft
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import useCourseStore from '@/store/courseStore'
import FileUpload from '@/components/FileUpload'
import { toast } from 'sonner'

interface CourseMaterial {
  id: string
  name: string
  type: string
  file_url: string
  uploaded_by: string
  created_at: string
  folder?: string
  size?: number
}

export default function CourseMaterialsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const { fetchCourseMaterials, uploadMaterial, deleteMaterial } = useCourseStore()
  
  const courseId = params.courseId as string
  const [materials, setMaterials] = useState<CourseMaterial[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string>('all')
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => {
    if (courseId) {
      loadMaterials()
    }
  }, [courseId])

  const loadMaterials = async () => {
    setIsLoading(true)
    try {
      await fetchCourseMaterials(courseId)
      // Mock data for now - replace with actual data from store
      setMaterials([
        {
          id: '1',
          name: 'Course Syllabus.pdf',
          type: 'application/pdf',
          file_url: '/files/syllabus.pdf',
          uploaded_by: 'Dr. Sarah Johnson',
          created_at: '2024-01-15T10:00:00Z',
          folder: 'Syllabus',
          size: 1024000
        },
        {
          id: '2',
          name: 'Lecture 1 - Introduction.pptx',
          type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          file_url: '/files/lecture1.pptx',
          uploaded_by: 'Dr. Sarah Johnson',
          created_at: '2024-01-16T14:30:00Z',
          folder: 'Lectures',
          size: 2048000
        },
        {
          id: '3',
          name: 'Assignment 1.pdf',
          type: 'application/pdf',
          file_url: '/files/assignment1.pdf',
          uploaded_by: 'Dr. Sarah Johnson',
          created_at: '2024-01-17T09:15:00Z',
          folder: 'Assignments',
          size: 512000
        }
      ])
    } catch (error) {
      toast.error('Failed to load materials')
      console.error('Load materials error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (files: File[]) => {
    try {
      for (const file of files) {
        const result = await uploadMaterial({
          course_id: courseId,
          name: file.name,
          type: file.type,
          file_url: URL.createObjectURL(file), // In real app, upload to storage
          uploaded_by: user?.id || ''
        })

        if (!result.success) {
          toast.error(`Failed to upload ${file.name}`)
        }
      }

      toast.success('Materials uploaded successfully!')
      setShowUpload(false)
      loadMaterials()
    } catch (error) {
      toast.error('Failed to upload materials')
      console.error('Upload error:', error)
    }
  }

  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return

    try {
      const result = await deleteMaterial(materialId)
      if (result.success) {
        toast.success('Material deleted successfully!')
        loadMaterials()
      } else {
        toast.error(result.error || 'Failed to delete material')
      }
    } catch (error) {
      toast.error('Failed to delete material')
      console.error('Delete error:', error)
    }
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />
    if (type.startsWith('video/')) return <Video className="w-4 h-4" />
    if (type.startsWith('audio/')) return <Music className="w-4 h-4" />
    if (type.includes('pdf')) return <FileText className="w-4 h-4" />
    if (type.includes('zip') || type.includes('rar')) return <Archive className="w-4 h-4" />
    return <File className="w-4 h-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFolder = selectedFolder === 'all' || material.folder === selectedFolder
    return matchesSearch && matchesFolder
  })

  const folders = ['all', ...Array.from(new Set(materials.map(m => m.folder).filter(Boolean)))]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
                   <Button
           variant="ghost"
           size="sm"
           onClick={() => router.back()}
           className="p-2 active:scale-95 transition-all duration-150"
         >
           <ArrowLeft className="w-4 h-4" />
         </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Course Materials</h1>
            <p className="text-gray-600">Manage and organize course materials</p>
          </div>
        </div>
        
        {user?.role === 'professor' && (
          <Button
            onClick={() => setShowUpload(!showUpload)}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-95 transition-all duration-150"
          >
            <Upload className="w-4 h-4 mr-2" />
            {showUpload ? 'Hide Upload' : 'Upload Materials'}
          </Button>
        )}
      </motion.div>

      {/* Upload Section */}
      {showUpload && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Materials
              </CardTitle>
              <CardDescription>
                Upload files for your students to access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                onUpload={handleFileUpload}
                maxFiles={10}
                maxFileSize={50}
                acceptedTypes={[
                  'application/pdf',
                  'application/msword',
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  'application/vnd.ms-powerpoint',
                  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                  'application/vnd.ms-excel',
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  'image/*',
                  'video/*',
                  'audio/*',
                  'application/zip',
                  'application/x-rar-compressed'
                ]}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Materials Management */}
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <TabsList>
            {folders.map(folder => (
              <TabsTrigger 
                key={folder} 
                value={folder}
                onClick={() => setSelectedFolder(folder)}
              >
                {folder === 'all' ? 'All Materials' : folder}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <TabsContent value={selectedFolder} className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : filteredMaterials.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No materials found
                </h3>
                <p className="text-gray-600">
                  {searchTerm || selectedFolder !== 'all' 
                    ? 'Try adjusting your search or folder filter'
                    : 'No materials have been uploaded yet.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredMaterials.map((material) => (
                <motion.div
                  key={material.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {getFileIcon(material.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {material.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {material.folder || 'Uncategorized'}
                        </Badge>
                        {material.size && (
                          <span className="text-xs text-gray-500">
                            {formatFileSize(material.size)}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatDate(material.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Uploaded by {material.uploaded_by}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(material.file_url, '_blank')}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    
                    {user?.role === 'professor' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // TODO: Implement edit functionality
                            toast.info('Edit functionality coming soon')
                          }}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteMaterial(material.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 