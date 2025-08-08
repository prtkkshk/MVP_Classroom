'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Activity, 
  Server, 
  Database, 
  Cpu, 
  HardDrive, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  Settings,
  Bell,
  Shield,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'
import useAuthStore from '@/store/authStore'

interface SystemMetrics {
  cpu: {
    usage: number
    cores: number
    temperature: number
    load: number[]
  }
  memory: {
    total: number
    used: number
    available: number
    percentage: number
  }
  disk: {
    total: number
    used: number
    available: number
    percentage: number
    iops: number
  }
  network: {
    bytesIn: number
    bytesOut: number
    connections: number
    latency: number
  }
  database: {
    connections: number
    queries: number
    slowQueries: number
    cacheHitRate: number
  }
  uptime: {
    system: string
    database: string
    application: string
  }
}

interface SystemAlert {
  id: string
  type: 'error' | 'warning' | 'info' | 'success'
  title: string
  message: string
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
  resolved: boolean
}

interface ServiceStatus {
  name: string
  status: 'running' | 'stopped' | 'error' | 'warning'
  uptime: string
  lastCheck: Date
  responseTime: number
  endpoint: string
}

export default function SystemMonitoringPage() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu: {
      usage: 45,
      cores: 8,
      temperature: 65,
      load: [0.8, 1.2, 0.9, 1.1, 0.7, 1.0, 0.6, 0.8]
    },
    memory: {
      total: 16384,
      used: 8192,
      available: 8192,
      percentage: 50
    },
    disk: {
      total: 512000,
      used: 256000,
      available: 256000,
      percentage: 50,
      iops: 1250
    },
    network: {
      bytesIn: 1024000,
      bytesOut: 512000,
      connections: 150,
      latency: 25
    },
    database: {
      connections: 12,
      queries: 1250,
      slowQueries: 3,
      cacheHitRate: 94.2
    },
    uptime: {
      system: '15 days, 7 hours, 32 minutes',
      database: '15 days, 7 hours, 30 minutes',
      application: '15 days, 7 hours, 28 minutes'
    }
  })

  const [alerts, setAlerts] = useState<SystemAlert[]>([
    {
      id: '1',
      type: 'warning',
      title: 'High CPU Usage',
      message: 'CPU usage has exceeded 80% for the last 5 minutes',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      severity: 'medium',
      resolved: false
    },
    {
      id: '2',
      type: 'info',
      title: 'Database Backup Completed',
      message: 'Daily database backup completed successfully',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      severity: 'low',
      resolved: true
    },
    {
      id: '3',
      type: 'error',
      title: 'Slow Query Detected',
      message: 'Query execution time exceeded 2 seconds',
      timestamp: new Date(Date.now() - 1000 * 60 * 2),
      severity: 'high',
      resolved: false
    }
  ])

  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'Web Server',
      status: 'running',
      uptime: '15 days, 7 hours',
      lastCheck: new Date(),
      responseTime: 45,
      endpoint: 'https://api.infralearn.com/health'
    },
    {
      name: 'Database',
      status: 'running',
      uptime: '15 days, 7 hours',
      lastCheck: new Date(),
      responseTime: 12,
      endpoint: 'postgresql://localhost:5432'
    },
    {
      name: 'Redis Cache',
      status: 'running',
      uptime: '15 days, 6 hours',
      lastCheck: new Date(),
      responseTime: 5,
      endpoint: 'redis://localhost:6379'
    },
    {
      name: 'File Storage',
      status: 'running',
      uptime: '15 days, 7 hours',
      lastCheck: new Date(),
      responseTime: 78,
      endpoint: 'https://storage.infralearn.com'
    }
  ])

  const [isMonitoringActive, setIsMonitoringActive] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30)
  const [activeTab, setActiveTab] = useState('overview')
  
  const { user: currentUser } = useAuthStore()

  // Simulate real-time updates
  useEffect(() => {
    if (!isMonitoringActive) return

    const interval = setInterval(() => {
      // Update CPU usage with realistic fluctuations
      setSystemMetrics(prev => ({
        ...prev,
        cpu: {
          ...prev.cpu,
          usage: Math.max(10, Math.min(90, prev.cpu.usage + (Math.random() - 0.5) * 10)),
          temperature: Math.max(40, Math.min(85, prev.cpu.temperature + (Math.random() - 0.5) * 5))
        },
        memory: {
          ...prev.memory,
          percentage: Math.max(30, Math.min(85, prev.memory.percentage + (Math.random() - 0.5) * 5))
        },
        network: {
          ...prev.network,
          connections: Math.max(100, Math.min(200, prev.network.connections + Math.floor((Math.random() - 0.5) * 20)))
        }
      }))
    }, refreshInterval * 1000)

    return () => clearInterval(interval)
  }, [isMonitoringActive, refreshInterval])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'error':
        return 'text-red-600'
      case 'stopped':
        return 'text-gray-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'stopped':
        return <Pause className="w-4 h-4 text-gray-600" />
      default:
        return <Minus className="w-4 h-4 text-gray-600" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleRefreshMetrics = () => {
    toast.success('System metrics refreshed')
  }

  const handleToggleMonitoring = () => {
    setIsMonitoringActive(!isMonitoringActive)
    toast.success(`Monitoring ${!isMonitoringActive ? 'started' : 'stopped'}`)
  }

  const handleResolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ))
    toast.success('Alert marked as resolved')
  }

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
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
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
            <p className="text-gray-600 mt-2">Real-time system performance and health monitoring</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Refresh:</span>
              <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10s</SelectItem>
                  <SelectItem value="30">30s</SelectItem>
                  <SelectItem value="60">1m</SelectItem>
                  <SelectItem value="300">5m</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Monitoring:</span>
              <Switch checked={isMonitoringActive} onCheckedChange={handleToggleMonitoring} />
            </div>
            <Button variant="outline" onClick={handleRefreshMetrics}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* System Health Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">CPU Usage</p>
                    <p className="text-2xl font-bold text-gray-900">{systemMetrics.cpu.usage}%</p>
                    <p className="text-xs text-gray-500">{systemMetrics.cpu.cores} cores</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Cpu className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <Progress value={systemMetrics.cpu.usage} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Memory Usage</p>
                    <p className="text-2xl font-bold text-gray-900">{systemMetrics.memory.percentage}%</p>
                    <p className="text-xs text-gray-500">{formatBytes(systemMetrics.memory.used)} / {formatBytes(systemMetrics.memory.total)}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <HardDrive className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <Progress value={systemMetrics.memory.percentage} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Disk Usage</p>
                    <p className="text-2xl font-bold text-gray-900">{systemMetrics.disk.percentage}%</p>
                    <p className="text-xs text-gray-500">{formatBytes(systemMetrics.disk.used)} / {formatBytes(systemMetrics.disk.total)}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Database className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <Progress value={systemMetrics.disk.percentage} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Network</p>
                    <p className="text-2xl font-bold text-gray-900">{systemMetrics.network.connections}</p>
                    <p className="text-xs text-gray-500">{systemMetrics.network.latency}ms latency</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Wifi className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-xs text-gray-500">
                    In: {formatBytes(systemMetrics.network.bytesIn)}/s
                  </div>
                  <div className="text-xs text-gray-500">
                    Out: {formatBytes(systemMetrics.network.bytesOut)}/s
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* System Status and Uptime */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  System Uptime
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">System</span>
                  <span className="font-medium">{systemMetrics.uptime.system}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <span className="font-medium">{systemMetrics.uptime.database}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Application</span>
                  <span className="font-medium">{systemMetrics.uptime.application}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Database Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Connections</span>
                  <span className="font-medium">{systemMetrics.database.connections}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Queries/sec</span>
                  <span className="font-medium">{systemMetrics.database.queries}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Slow Queries</span>
                  <span className="font-medium text-red-600">{systemMetrics.database.slowQueries}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Cache Hit Rate</span>
                  <span className="font-medium">{systemMetrics.database.cacheHitRate}%</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Recent Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.slice(0, 3).map((alert) => (
                    <Alert key={alert.id} className={alert.resolved ? 'opacity-60' : ''}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <span>{alert.title}</span>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </AlertTitle>
                      <AlertDescription>
                        {alert.message}
                        <div className="text-xs text-gray-500 mt-1">
                          {alert.timestamp.toLocaleString()}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Monitor and manage system alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {alert.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                          {alert.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                          {alert.type === 'info' && <CheckCircle className="w-4 h-4 text-blue-600" />}
                          {alert.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                          <span className="capitalize">{alert.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{alert.title}</div>
                          <div className="text-sm text-gray-500">{alert.message}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={alert.resolved ? "outline" : "default"}>
                          {alert.resolved ? "Resolved" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {alert.timestamp.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {!alert.resolved && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResolveAlert(alert.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Resolve
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Status</CardTitle>
              <CardDescription>Monitor the health and performance of system services</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Last Check</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.name}>
                      <TableCell>
                        <div className="font-medium">{service.name}</div>
                        <div className="text-sm text-gray-500">{service.endpoint}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(service.status)}
                          <span className={`capitalize ${getStatusColor(service.status)}`}>
                            {service.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">{service.uptime}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">{service.responseTime}ms</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {service.lastCheck.toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>CPU Load Average</CardTitle>
                <CardDescription>System load across CPU cores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemMetrics.cpu.load.map((load, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Core {index + 1}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={load * 100} className="w-20 h-2" />
                        <span className="text-sm font-medium">{load.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Temperature Monitoring</CardTitle>
                <CardDescription>System temperature readings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">CPU Temperature</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${
                        systemMetrics.cpu.temperature > 80 ? 'text-red-600' :
                        systemMetrics.cpu.temperature > 70 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {systemMetrics.cpu.temperature}°C
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        systemMetrics.cpu.temperature > 80 ? 'bg-red-500' :
                        systemMetrics.cpu.temperature > 70 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${(systemMetrics.cpu.temperature / 100) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 