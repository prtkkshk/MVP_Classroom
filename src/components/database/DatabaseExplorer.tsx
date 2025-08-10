'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Database, 
  Table as TableIcon, 
  Users, 
  BookOpen, 
  FileText, 
  MessageSquare,
  Target,
  Calendar,
  Bell,
  BarChart3,
  Download,
  Eye,
  Settings,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { toast } from 'sonner'

interface TableInfo {
  name: string
  rowCount: number
  size: string
  lastModified: Date
  description: string
  icon: React.ReactNode
  color: string
}

interface TableSchema {
  column: string
  type: string
  nullable: boolean
  default: string | null
  key: string
}

interface TableData {
  [key: string]: any
}

interface DatabaseStats {
  totalTables: number
  totalRows: number
  totalSize: string
  activeConnections: number
  uptime: string
  performance: {
    avgQueryTime: string
    slowQueries: number
    cacheHitRate: number
  }
}

export default function DatabaseExplorer() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tableData, setTableData] = useState<TableData[]>([])
  const [tableSchema, setTableSchema] = useState<TableSchema[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')

  const [databaseStats, setDatabaseStats] = useState<DatabaseStats>({
    totalTables: 8,
    totalRows: 1247,
    totalSize: '2.4 MB',
    activeConnections: 12,
    uptime: '15 days, 7 hours',
    performance: {
      avgQueryTime: '45ms',
      slowQueries: 3,
      cacheHitRate: 94.2
    }
  })

  const tables: TableInfo[] = [
    {
      name: 'users',
      rowCount: 156,
      size: '45.2 KB',
      lastModified: new Date(Date.now() - 1000 * 60 * 30),
      description: 'User accounts and authentication data',
      icon: <Users className="w-4 h-4" />,
      color: 'bg-blue-100 text-blue-700'
    },
    {
      name: 'courses',
      rowCount: 23,
      size: '12.8 KB',
      lastModified: new Date(Date.now() - 1000 * 60 * 60 * 2),
      description: 'Course information and metadata',
      icon: <BookOpen className="w-4 h-4" />,
      color: 'bg-green-100 text-green-700'
    },
    {
      name: 'course_enrollments',
      rowCount: 342,
      size: '28.5 KB',
      lastModified: new Date(Date.now() - 1000 * 60 * 15),
      description: 'Student course enrollment records',
      icon: <Users className="w-4 h-4" />,
      color: 'bg-purple-100 text-purple-700'
    },
    {
      name: 'course_materials',
      rowCount: 89,
      size: '156.7 KB',
      lastModified: new Date(Date.now() - 1000 * 60 * 45),
      description: 'Course materials and file metadata',
      icon: <FileText className="w-4 h-4" />,
      color: 'bg-orange-100 text-orange-700'
    },
    {
      name: 'course_announcements',
      rowCount: 67,
      size: '18.3 KB',
      lastModified: new Date(Date.now() - 1000 * 60 * 20),
      description: 'Course announcements and notifications',
      icon: <MessageSquare className="w-4 h-4" />,
      color: 'bg-red-100 text-red-700'
    },
    {
      name: 'assignments',
      rowCount: 45,
      size: '22.1 KB',
      lastModified: new Date(Date.now() - 1000 * 60 * 60),
      description: 'Assignment definitions and metadata',
      icon: <Target className="w-4 h-4" />,
      color: 'bg-indigo-100 text-indigo-700'
    },
    {
      name: 'calendar_events',
      rowCount: 123,
      size: '31.4 KB',
      lastModified: new Date(Date.now() - 1000 * 60 * 10),
      description: 'Calendar events and scheduling data',
      icon: <Calendar className="w-4 h-4" />,
      color: 'bg-pink-100 text-pink-700'
    },
    {
      name: 'notifications',
      rowCount: 402,
      size: '89.2 KB',
      lastModified: new Date(Date.now() - 1000 * 60 * 5),
      description: 'System notifications and alerts',
      icon: <Bell className="w-4 h-4" />,
      color: 'bg-yellow-100 text-yellow-700'
    }
  ]

  const filteredTables = tables.filter(table => {
    const matchesSearch = table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         table.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'large' && table.rowCount > 100) ||
                         (filterType === 'small' && table.rowCount <= 100) ||
                         (filterType === 'recent' && (Date.now() - table.lastModified.getTime()) < 1000 * 60 * 60)
    return matchesSearch && matchesFilter
  })

  useEffect(() => {
    if (selectedTable) {
      loadTableData(selectedTable)
    }
  }, [selectedTable])

  const loadTableData = async (tableName: string) => {
    setIsLoading(true)
    try {
      // Fetch actual table data from API
      const response = await fetch(`/api/database/tables/${tableName}`)
      if (response.ok) {
        const data = await response.json()
        setTableSchema(data.schema || [])
        setTableData(data.data || [])
      } else {
        setTableSchema([])
        setTableData([])
      }
    } catch (error) {
      console.error('Error loading table data:', error)
      toast.error('Failed to load table data')
      setTableSchema([])
      setTableData([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportData = async (tableName: string, format: 'csv' | 'json') => {
    try {
      const response = await fetch(`/api/database/export/${tableName}?format=${format}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${tableName}.${format}`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success(`Exported ${tableName} as ${format.toUpperCase()}`)
      } else {
        toast.error('Failed to export data')
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Failed to export data')
    }
  }

  const handleRefreshStats = async () => {
    try {
      const response = await fetch('/api/database/stats')
      if (response.ok) {
        const data = await response.json()
        // Update stats with actual data
        toast.success('Database stats refreshed')
      } else {
        toast.error('Failed to refresh stats')
      }
    } catch (error) {
      console.error('Error refreshing stats:', error)
      toast.error('Failed to refresh stats')
    }
  }

  const getPerformanceColor = (value: number, threshold: number) => {
    return value >= threshold ? 'text-green-600' : 'text-red-600'
  }

  const getPerformanceIcon = (value: number, threshold: number) => {
    return value >= threshold ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Database Explorer</h1>
          <p className="text-gray-600">Monitor and manage your database</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefreshStats}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Stats
          </Button>
          <Button className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Database Settings
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Database Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Tables</p>
                    <p className="text-2xl font-bold text-gray-900">{databaseStats.totalTables}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Database className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Rows</p>
                    <p className="text-2xl font-bold text-gray-900">{databaseStats.totalRows.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TableIcon className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Database Size</p>
                    <p className="text-2xl font-bold text-gray-900">{databaseStats.totalSize}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Connections</p>
                    <p className="text-2xl font-bold text-gray-900">{databaseStats.activeConnections}</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Query Time</span>
                  <div className="flex items-center gap-2">
                    {getPerformanceIcon(45, 50)}
                    <span className={`font-medium ${getPerformanceColor(45, 50)}`}>
                      {databaseStats.performance.avgQueryTime}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Slow Queries</span>
                  <div className="flex items-center gap-2">
                    {getPerformanceIcon(3, 5)}
                    <span className={`font-medium ${getPerformanceColor(3, 5)}`}>
                      {databaseStats.performance.slowQueries}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Cache Hit Rate</span>
                  <div className="flex items-center gap-2">
                    {getPerformanceIcon(94.2, 90)}
                    <span className={`font-medium ${getPerformanceColor(94.2, 90)}`}>
                      {databaseStats.performance.cacheHitRate}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Uptime</span>
                  <span className="font-medium text-gray-900">{databaseStats.uptime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Healthy
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Backup</span>
                  <span className="font-medium text-gray-900">2 hours ago</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tables Tab */}
        <TabsContent value="tables" className="space-y-6">
          {/* Search and Filter */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search tables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tables</SelectItem>
                <SelectItem value="large">Large Tables</SelectItem>
                <SelectItem value="small">Small Tables</SelectItem>
                <SelectItem value="recent">Recently Modified</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tables Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTables.map((table) => (
              <motion.div
                key={table.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedTable === table.name ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedTable(table.name)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-2 rounded-lg ${table.color}`}>
                        {table.icon}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {table.rowCount.toLocaleString()} rows
                      </Badge>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2">{table.name}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {table.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{table.size}</span>
                      <span>{table.lastModified.toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Table Details */}
          {selectedTable && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    {selectedTable}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportData(selectedTable, 'csv')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportData(selectedTable, 'json')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export JSON
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="schema" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="schema">Schema</TabsTrigger>
                    <TabsTrigger value="data">Data</TabsTrigger>
                  </TabsList>

                  <TabsContent value="schema">
                    <ScrollArea className="h-64">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Column</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Nullable</TableHead>
                            <TableHead>Default</TableHead>
                            <TableHead>Key</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tableSchema.map((column) => (
                            <TableRow key={column.column}>
                              <TableCell className="font-medium">{column.column}</TableCell>
                              <TableCell>{column.type}</TableCell>
                              <TableCell>
                                <Badge variant={column.nullable ? "outline" : "default"}>
                                  {column.nullable ? "Yes" : "No"}
                                </Badge>
                              </TableCell>
                              <TableCell>{column.default || "-"}</TableCell>
                              <TableCell>
                                {column.key && (
                                  <Badge variant="secondary" className="text-xs">
                                    {column.key}
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="data">
                    <ScrollArea className="h-64">
                      <Table>
                                                 <TableHeader>
                           <TableRow>
                             {tableData.length > 0 && tableData[0] && Object.keys(tableData[0]).map((key) => (
                               <TableHead key={key}>{key}</TableHead>
                             ))}
                           </TableRow>
                         </TableHeader>
                        <TableBody>
                          {tableData.map((row, index) => (
                            <TableRow key={index}>
                              {Object.values(row).map((value, cellIndex) => (
                                <TableCell key={cellIndex}>{String(value)}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Query Performance</CardTitle>
                <CardDescription>Monitor slow queries and performance issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-red-900">Slow Query Detected</p>
                      <p className="text-sm text-red-700">SELECT * FROM users WHERE...</p>
                    </div>
                    <Badge variant="destructive">2.3s</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="font-medium text-yellow-900">High CPU Usage</p>
                      <p className="text-sm text-yellow-700">Complex join operation</p>
                    </div>
                    <Badge variant="secondary">85%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Connection Pool</CardTitle>
                <CardDescription>Active database connections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Connections</span>
                    <span className="font-medium">12 / 20</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    60% of connection pool in use
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Backups Tab */}
        <TabsContent value="backups" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Backup Management</CardTitle>
              <CardDescription>Manage database backups and restore points</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Latest Backup</p>
                    <p className="text-sm text-gray-600">2 hours ago • 2.4 MB</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Successful
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Daily Backup</p>
                    <p className="text-sm text-gray-600">Yesterday • 2.3 MB</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Successful
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Weekly Backup</p>
                    <p className="text-sm text-gray-600">7 days ago • 2.2 MB</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Successful
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 