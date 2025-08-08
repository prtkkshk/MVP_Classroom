'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { 
  FileText, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  File,
  FileImage,
  FileVideo,
  FileAudio,
  Archive,
  Calendar,
  User
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import useCourseStore from '@/store/courseStore'
import useAuthStore from '@/store/authStore'
import { Database } from '@/lib/supabase'

type CourseMaterial = Database['public']['Tables']['course_materials']['Row'] & {
  users?: {
    name: string
    username: string
  }
}

interface CourseMaterialsProps {
  courseId: string
  isProfessor: boolean
}

export default function CourseMaterials({ courseId, isProfessor }: CourseMaterialsProps) {
  const { user } = useAuthStore()
  const { materials, fetchMaterials, uploadMaterial, deleteMaterial, isLoading } = useCourseStore()
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [materialName, setMaterialName] = useState('')
  const [materialDescription, setMaterialDescription] = useState('')
  const [materialType, setMaterialType] = useState('document')

  useEffect(() => {
    fetchMaterials(courseId)
  }, [courseId, fetchMaterials])

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return <FileImage className="h-8 w-8 text-blue-500" />
    if (fileType.includes('video')) return <FileVideo className="h-8 w-8 text-red-500" />
    if (fileType.includes('audio')) return <FileAudio className="h-8 w-8 text-green-500" />
    if (fileType.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />
    if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="h-8 w-8 text-orange-500" />
    return <File className="h-8 w-8 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!materialName) {
        setMaterialName(file.name)
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !materialName || !user) return

    setUploading(true)
    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${courseId}/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(filePath, selectedFile)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('course-materials')
        .getPublicUrl(filePath)

      // Create material record in database
      const materialData = {
        course_id: courseId,
        name: materialName,
        description: materialDescription,
        type: materialType,
        file_url: urlData.publicUrl,
        file_size: selectedFile.size,
        file_type: selectedFile.type,
        uploaded_by: user.id,
        is_public: true
      }

      const result = await uploadMaterial(materialData)
      if (result.success) {
        setIsUploadDialogOpen(false)
        setSelectedFile(null)
        setMaterialName('')
        setMaterialDescription('')
        setMaterialType('document')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload material')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (materialId: string) => {
    if (confirm('Are you sure you want to delete this material?')) {
      const result = await deleteMaterial(materialId)
      if (!result.success) {
        alert('Failed to delete material')
      }
    }
  }

  const handleDownload = (material: CourseMaterial) => {
    const link = document.createElement('a')
    link.href = material.file_url
    link.download = material.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Course Materials</h2>
          <p className="text-muted-foreground">
            Access and manage course materials, documents, and resources
          </p>
        </div>
        
        {isProfessor && (
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload Material
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Upload Course Material</DialogTitle>
                <DialogDescription>
                  Upload a new file to share with your students
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file">File</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileSelect}
                    accept="*/*"
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="name">Material Name</Label>
                  <Input
                    id="name"
                    value={materialName}
                    onChange={(e) => setMaterialName(e.target.value)}
                    placeholder="Enter material name"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={materialDescription}
                    onChange={(e) => setMaterialDescription(e.target.value)}
                    placeholder="Enter material description"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="type">Material Type</Label>
                  <Select value={materialType} onValueChange={setMaterialType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select material type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="presentation">Presentation</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="assignment">Assignment</SelectItem>
                      <SelectItem value="syllabus">Syllabus</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsUploadDialogOpen(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || !materialName || uploading}
                >
                  {uploading ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Materials Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading materials...</p>
          </div>
        </div>
      ) : materials.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No materials yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              {isProfessor 
                ? "Upload your first course material to get started"
                : "No materials have been uploaded for this course yet"
              }
            </p>
            {isProfessor && (
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Upload Material
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((material) => (
            <Card key={material.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getFileIcon(material.file_type || '')}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-medium truncate">
                        {material.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {material.file_type && formatFileSize(material.file_size || 0)}
                      </CardDescription>
                    </div>
                  </div>
                  {isProfessor && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(material.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {material.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {material.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {material.type}
                    </Badge>
                    {material.users && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {material.users.name}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(material)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(material.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 