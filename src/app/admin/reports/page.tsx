'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import MainLayout from '@/components/layout/MainLayout'
import useAuthStore from '@/store/authStore'
import { 
  FileText, 
  Download, 
  Calendar, 
  BarChart3, 
  Users, 
  BookOpen,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Shield,
  Mail,
  Eye,
  Plus,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react'

interface Report {
  id: string
  name: string
  type: 'user' | 'course' | 'analytics' | 'system' | 'custom'
  status: 'completed' | 'processing' | 'failed' | 'scheduled'
  createdAt: Date
  scheduledFor?: Date
  fileSize?: string
  downloadUrl?: string
  description: string
}

interface ReportTemplate {
  id: string
  name: string
  description: string
  type: string
  parameters: string[]
  lastUsed?: Date
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([
    {
      id: '1',
      name: 'User Growth Report - January 2024',
      type: 'user',
      status: 'completed',
      createdAt: new Date('2024-01-20T10:00:00'),
      fileSize: '2.4 MB',
      downloadUrl: '#',
      description: 'Comprehensive user growth and engagement analysis'
    },
    {
      id: '2',
      name: 'Course Performance Analytics',
      type: 'course',
      status: 'completed',
      createdAt: new Date('2024-01-19T15:30:00'),
      fileSize: '1.8 MB',
      downloadUrl: '#',
      description: 'Course completion rates and student satisfaction metrics'
    },
    {
      id: '3',
      name: 'System Health Report',
      type: 'system',
      status: 'processing',
      createdAt: new Date('2024-01-20T11:00:00'),
      description: 'System performance and infrastructure health analysis'
    },
    {
      id: '4',
      name: 'Weekly Analytics Summary',
      type: 'analytics',
      status: 'scheduled',
      createdAt: new Date('2024-01-20T09:00:00'),
      scheduledFor: new Date('2024-01-21T08:00:00'),
      description: 'Weekly platform usage and performance summary'
    }
  ])

  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([
    {
      id: '1',
      name: 'User Growth Report',
      description: 'Monthly user growth and engagement analysis',
      type: 'user',
      parameters: ['date_range', 'user_type', 'growth_metrics'],
      lastUsed: new Date('2024-01-20T10:00:00')
    },
    {
      id: '2',
      name: 'Course Performance Report',
      description: 'Course completion rates and student satisfaction',
      type: 'course',
      parameters: ['course_id', 'time_period', 'metrics'],
      lastUsed: new Date('2024-01-19T15:30:00')
    },
    {
      id: '3',
      name: 'System Health Report',
      description: 'System performance and infrastructure analysis',
      type: 'system',
      parameters: ['system_metrics', 'performance_data', 'alerts'],
      lastUsed: new Date('2024-01-18T14:00:00')
    },
    {
      id: '4',
      name: 'Custom Analytics Report',
      description: 'Customizable analytics and insights report',
      type: 'custom',
      parameters: ['custom_metrics', 'date_range', 'filters']
    }
  ])

  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [reportParameters, setReportParameters] = useState({
    dateRange: '30d',
    userType: 'all',
    metrics: ['growth', 'engagement', 'retention'],
    format: 'pdf'
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('reports')
  
  const { user: currentUser } = useAuthStore()

  const handleGenerateReport = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a report template')
      return
    }

    setIsGenerating(true)
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newReport: Report = {
        id: Date.now().toString(),
        name: `Generated Report - ${new Date().toLocaleDateString()}`,
        type: 'custom',
        status: 'processing',
        createdAt: new Date(),
        description: 'Custom generated report'
      }
      
      setReports(prev => [newReport, ...prev])
      toast.success('Report generation started!')
    } catch (error) {
      toast.error('Failed to generate report')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadReport = (report: Report) => {
    if (report.status === 'completed' && report.downloadUrl) {
      toast.success('Download started')
      // In real app, this would trigger actual download
    } else {
      toast.error('Report not ready for download')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      case 'scheduled':
        return <Badge className="bg-yellow-100 text-yellow-800">Scheduled</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users className="w-4 h-4" />
      case 'course':
        return <BookOpen className="w-4 h-4" />
      case 'analytics':
        return <BarChart3 className="w-4 h-4" />
      case 'system':
        return <Shield className="w-4 h-4" />
      case 'custom':
        return <FileText className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  if (!currentUser || currentUser.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <MainLayout
      title="Reports"
      description="Generate and manage platform reports"
    >
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
              <p className="text-gray-600 mt-2">Generate and manage platform reports and analytics</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Report
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Reports</p>
                  <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reports.filter(r => r.status === 'completed').length}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Processing</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reports.filter(r => r.status === 'processing').length}
                  </p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Templates</p>
                  <p className="text-2xl font-bold text-gray-900">{reportTemplates.length}</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Reports Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="reports">Generated Reports</TabsTrigger>
              <TabsTrigger value="templates">Report Templates</TabsTrigger>
              <TabsTrigger value="generate">Generate Report</TabsTrigger>
            </TabsList>

            {/* Generated Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generated Reports</CardTitle>
                  <CardDescription>View and download previously generated reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {getTypeIcon(report.type)}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{report.name}</h4>
                            <p className="text-sm text-gray-600">{report.description}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-xs text-gray-500">
                                Created: {report.createdAt.toLocaleDateString()}
                              </span>
                              {report.scheduledFor && (
                                <span className="text-xs text-gray-500">
                                  Scheduled: {report.scheduledFor.toLocaleDateString()}
                                </span>
                              )}
                              {report.fileSize && (
                                <span className="text-xs text-gray-500">
                                  Size: {report.fileSize}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(report.status)}
                          {report.status === 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadReport(report)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Report Templates Tab */}
            <TabsContent value="templates" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Report Templates</CardTitle>
                  <CardDescription>Pre-configured report templates for quick generation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reportTemplates.map((template) => (
                      <div key={template.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{template.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {template.parameters.map((param, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {param}
                                </Badge>
                              ))}
                            </div>
                            {template.lastUsed && (
                              <p className="text-xs text-gray-500 mt-2">
                                Last used: {template.lastUsed.toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTemplate(template.id)
                              setActiveTab('generate')
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Use Template
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Generate Report Tab */}
            <TabsContent value="generate" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generate New Report</CardTitle>
                  <CardDescription>Create custom reports with specific parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Template Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="template">Report Template</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a report template" />
                      </SelectTrigger>
                      <SelectContent>
                        {reportTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedTemplate && (
                    <>
                      {/* Date Range */}
                      <div className="space-y-2">
                        <Label htmlFor="dateRange">Date Range</Label>
                        <Select value={reportParameters.dateRange} onValueChange={(value) => setReportParameters(prev => ({ ...prev, dateRange: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7d">Last 7 days</SelectItem>
                            <SelectItem value="30d">Last 30 days</SelectItem>
                            <SelectItem value="90d">Last 90 days</SelectItem>
                            <SelectItem value="1y">Last year</SelectItem>
                            <SelectItem value="custom">Custom range</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* User Type */}
                      <div className="space-y-2">
                        <Label htmlFor="userType">User Type</Label>
                        <Select value={reportParameters.userType} onValueChange={(value) => setReportParameters(prev => ({ ...prev, userType: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Users</SelectItem>
                            <SelectItem value="students">Students Only</SelectItem>
                            <SelectItem value="professors">Professors Only</SelectItem>
                            <SelectItem value="admins">Admins Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Metrics Selection */}
                      <div className="space-y-2">
                        <Label>Include Metrics</Label>
                        <div className="space-y-2">
                          {['growth', 'engagement', 'retention', 'performance', 'satisfaction'].map((metric) => (
                            <div key={metric} className="flex items-center space-x-2">
                              <Checkbox
                                id={metric}
                                checked={reportParameters.metrics.includes(metric)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setReportParameters(prev => ({
                                      ...prev,
                                      metrics: [...prev.metrics, metric]
                                    }))
                                  } else {
                                    setReportParameters(prev => ({
                                      ...prev,
                                      metrics: prev.metrics.filter(m => m !== metric)
                                    }))
                                  }
                                }}
                              />
                              <Label htmlFor={metric} className="text-sm capitalize">
                                {metric}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Output Format */}
                      <div className="space-y-2">
                        <Label htmlFor="format">Output Format</Label>
                        <Select value={reportParameters.format} onValueChange={(value) => setReportParameters(prev => ({ ...prev, format: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="excel">Excel</SelectItem>
                            <SelectItem value="csv">CSV</SelectItem>
                            <SelectItem value="json">JSON</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Generate Button */}
                      <div className="pt-4">
                        <Button
                          onClick={handleGenerateReport}
                          disabled={isGenerating}
                          className="w-full"
                        >
                          {isGenerating ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <FileText className="w-4 h-4 mr-2" />
                          )}
                          {isGenerating ? 'Generating Report...' : 'Generate Report'}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Report Preview */}
              {selectedTemplate && (
                <Card>
                  <CardHeader>
                    <CardTitle>Report Preview</CardTitle>
                    <CardDescription>Preview of the selected report template</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Report Type</span>
                        <span className="text-sm text-gray-600">
                          {reportTemplates.find(t => t.id === selectedTemplate)?.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Date Range</span>
                        <span className="text-sm text-gray-600">
                          {reportParameters.dateRange === '7d' && 'Last 7 days'}
                          {reportParameters.dateRange === '30d' && 'Last 30 days'}
                          {reportParameters.dateRange === '90d' && 'Last 90 days'}
                          {reportParameters.dateRange === '1y' && 'Last year'}
                          {reportParameters.dateRange === 'custom' && 'Custom range'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">User Type</span>
                        <span className="text-sm text-gray-600 capitalize">
                          {reportParameters.userType}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Output Format</span>
                        <span className="text-sm text-gray-600 uppercase">
                          {reportParameters.format}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Estimated Size</span>
                        <span className="text-sm text-gray-600">~2-5 MB</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </MainLayout>
  )
} 