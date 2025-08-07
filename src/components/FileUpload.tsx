'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive, 
  X, 
  CheckCircle, 
  AlertCircle,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'

interface FileUploadProps {
  onUpload: (files: File[]) => Promise<void>
  maxFiles?: number
  maxFileSize?: number // in MB
  acceptedTypes?: string[]
  className?: string
}

interface FileWithPreview extends File {
  id: string
  preview?: string
  uploadProgress?: number
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

const getFileIcon = (file: File) => {
  const type = file.type.split('/')[0]
  switch (type) {
    case 'image':
      return <Image className="w-4 h-4" />
    case 'video':
      return <Video className="w-4 h-4" />
    case 'audio':
      return <Music className="w-4 h-4" />
    default:
      if (file.type.includes('pdf') || file.type.includes('document')) {
        return <FileText className="w-4 h-4" />
      }
      if (file.type.includes('zip') || file.type.includes('rar')) {
        return <Archive className="w-4 h-4" />
      }
      return <File className="w-4 h-4" />
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function FileUpload({
  onUpload,
  maxFiles = 10,
  maxFileSize = 50, // 50MB default
  acceptedTypes = ['*'],
  className = ''
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`
    }

    // Check file type
    if (acceptedTypes[0] !== '*' && !acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1))
      }
      return file.type === type
    })) {
      return `File type not allowed. Accepted types: ${acceptedTypes.join(', ')}`
    }

    return null
  }

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)
    const validFiles: FileWithPreview[] = []
    const errors: string[] = []

    fileArray.forEach(file => {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        const fileWithPreview: FileWithPreview = {
          ...file,
          id: Math.random().toString(36).substr(2, 9),
          uploadStatus: 'pending'
        }

        // Create preview for images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = (e) => {
            setFiles(prev => prev.map(f => 
              f.id === fileWithPreview.id 
                ? { ...f, preview: e.target?.result as string }
                : f
            ))
          }
          reader.readAsDataURL(file)
        }

        validFiles.push(fileWithPreview)
      }
    })

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error))
    }

    if (validFiles.length > 0) {
      setFiles(prev => {
        const combined = [...prev, ...validFiles]
        return combined.slice(0, maxFiles)
      })
    }
  }, [maxFiles, maxFileSize, acceptedTypes])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    addFiles(e.dataTransfer.files)
  }, [addFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files)
    }
  }, [addFiles])

  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }, [])

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('No files to upload')
      return
    }

    setIsUploading(true)

    try {
      // Update files to uploading status
      setFiles(prev => prev.map(f => ({ ...f, uploadStatus: 'uploading' as const })))

      // Simulate upload progress
      const uploadPromises = files.map(async (file) => {
        // Simulate progress updates
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 100))
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, uploadProgress: i }
              : f
          ))
        }

        // Simulate upload completion
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, uploadStatus: 'success' as const, uploadProgress: 100 }
            : f
        ))
      })

      await Promise.all(uploadPromises)

      // Call the actual upload function
      await onUpload(files)

      toast.success('Files uploaded successfully!')
      setFiles([])
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload files')
      
      // Mark files as error
      setFiles(prev => prev.map(f => ({ 
        ...f, 
        uploadStatus: 'error' as const,
        error: 'Upload failed'
      })))
    } finally {
      setIsUploading(false)
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card className={`border-2 border-dashed transition-colors ${
        isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}>
        <CardContent className="p-6">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className="text-center space-y-4"
          >
            <div className="flex justify-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Drop files here or click to upload
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Maximum {maxFiles} files, {maxFileSize}MB each
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button
                  onClick={openFileDialog}
                  disabled={isUploading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Files
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={files.length === 0 || isUploading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isUploading ? 'Uploading...' : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptedTypes.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <h4 className="font-medium text-gray-900">Selected Files ({files.length})</h4>
            
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {file.preview ? (
                      <img 
                        src={file.preview} 
                        alt={file.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                        {getFileIcon(file)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Upload Progress */}
                  {file.uploadStatus === 'uploading' && (
                    <div className="w-20">
                      <Progress value={file.uploadProgress || 0} className="h-2" />
                    </div>
                  )}

                  {/* Status Icons */}
                  {file.uploadStatus === 'success' && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  {file.uploadStatus === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}

                  {/* Remove Button */}
                  {file.uploadStatus !== 'uploading' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="p-1 h-auto"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 