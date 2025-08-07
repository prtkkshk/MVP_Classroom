'use client'

import React, { useState, useEffect } from 'react'
import { databaseExplorer, TableInfo, DatabaseStats, PolicyInfo } from '@/lib/database-explorer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { Loader2, Database, Shield, Key, Users, FileText, Download } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function DatabaseExplorerComponent() {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [allPolicies, setAllPolicies] = useState<PolicyInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<string>('')
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    loadDatabaseInfo()
  }, [])

  const loadDatabaseInfo = async () => {
    try {
      setLoading(true)
      setError(null)

      const [tablesData, statsData, policiesData] = await Promise.all([
        databaseExplorer.getAllTablesInfo(),
        databaseExplorer.getDatabaseStats(),
        databaseExplorer.getAllPolicies()
      ])

      setTables(tablesData)
      setStats(statsData)
      setAllPolicies(policiesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load database information')
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    try {
      setIsGeneratingReport(true)
      setError(null)
      
      const reportText = await databaseExplorer.generateDatabaseReport()
      setReport(reportText)
      
      // Generate PDF from the report
      await generatePDFReport(reportText)
      
      // Show success feedback
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000) // Hide after 3 seconds
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const generatePDFReport = async (reportText: string) => {
    try {
      // Create a temporary div to render the markdown content
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '0'
      tempDiv.style.width = '800px'
      tempDiv.style.padding = '40px'
      tempDiv.style.fontFamily = 'Arial, sans-serif'
      tempDiv.style.fontSize = '12px'
      tempDiv.style.lineHeight = '1.6'
      tempDiv.style.backgroundColor = 'white'
      tempDiv.style.color = 'black'
      
      // Convert markdown to HTML (simple conversion)
      const htmlContent = convertMarkdownToHTML(reportText)
      tempDiv.innerHTML = htmlContent
      
      document.body.appendChild(tempDiv)
      
      // Generate PDF
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 295 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      
      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      
      // Download the PDF
      pdf.save('supabase-database-report.pdf')
      
      // Clean up
      document.body.removeChild(tempDiv)
    } catch (error) {
      console.error('Error generating PDF:', error)
      throw new Error('Failed to generate PDF report')
    }
  }

  const convertMarkdownToHTML = (markdown: string): string => {
    return markdown
      // Headers
      .replace(/^# (.*$)/gim, '<h1 style="color: #1f2937; font-size: 24px; font-weight: bold; margin: 20px 0 10px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 style="color: #374151; font-size: 20px; font-weight: bold; margin: 16px 0 8px 0;">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 style="color: #4b5563; font-size: 16px; font-weight: bold; margin: 12px 0 6px 0;">$1</h3>')
      .replace(/^#### (.*$)/gim, '<h4 style="color: #6b7280; font-size: 14px; font-weight: bold; margin: 10px 0 5px 0;">$1</h4>')
      
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: bold;">$1</strong>')
      
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre style="background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 10px; overflow-x: auto; margin: 10px 0;">$1</pre>')
      .replace(/`([^`]+)`/g, '<code style="background-color: #f3f4f6; padding: 2px 4px; border-radius: 2px; font-family: monospace; font-size: 10px;">$1</code>')
      
      // Lists
      .replace(/^\* (.*$)/gim, '<li style="margin: 4px 0;">$1</li>')
      .replace(/^- (.*$)/gim, '<li style="margin: 4px 0;">$1</li>')
      
      // Tables (basic support)
      .replace(/\| (.*?) \|/g, '<td style="border: 1px solid #d1d5db; padding: 6px; text-align: left;">$1</td>')
      .replace(/\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|/g, '<tr>$1$2$3$4$5</tr>')
      
      // Line breaks
      .replace(/\n\n/g, '</p><p style="margin: 8px 0;">')
      .replace(/\n/g, '<br>')
      
      // Wrap in paragraphs
      .replace(/^(?!<[h|p|u|o|t|d|s|b|i|u|a|i|m|v|f|n|r|w|e|q|k|u|s|t|r|o|n|g|e|m|i|n|g|>])(.*)$/gm, '<p style="margin: 8px 0;">$1</p>')
      
      // Clean up empty paragraphs
      .replace(/<p style="margin: 8px 0;"><\/p>/g, '')
      .replace(/<p style="margin: 8px 0;"><br><\/p>/g, '')
      
      // Add wrapper
      .replace(/^([\s\S]+)$/, '<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">$1</div>')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <div className="text-center">
            <h3 className="text-lg font-semibold">Loading Database Information</h3>
            <p className="text-muted-foreground">Please wait while we fetch your database structure...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-red-200">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-red-600 flex items-center justify-center gap-2">
              <Shield className="h-5 w-5" />
              Database Access Error
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-red-600">{error}</p>
            <Button onClick={loadDatabaseInfo} className="flex items-center gap-2">
              <Loader2 className="h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Database Explorer</h1>
          <p className="text-muted-foreground text-lg">
            Explore your Supabase database structure, policies, and permissions
          </p>
        </div>
        <Button 
          onClick={generateReport} 
          disabled={isGeneratingReport}
          className={`flex items-center space-x-2 w-full sm:w-auto transition-all duration-300 ${
            isGeneratingReport 
              ? 'opacity-75 cursor-not-allowed bg-gray-300 hover:bg-gray-300 text-gray-600' 
              : 'hover:scale-105 active:scale-95'
          }`}
        >
          {isGeneratingReport ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating...</span>
            </>
                     ) : (
             <>
               <Download className="h-4 w-4" />
               <span>Generate PDF Report</span>
             </>
           )}
        </Button>
      </div>

             {/* Success Notification */}
       {showSuccess && (
         <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
           <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2">
             <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
             <span className="font-medium">PDF report generated and downloaded successfully!</span>
           </div>
         </div>
       )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
              <Database className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_tables}</div>
              <p className="text-xs text-muted-foreground mt-1">Database tables</p>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
              <Shield className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_policies}</div>
              <p className="text-xs text-muted-foreground mt-1">RLS policies</p>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-medium">Total Indexes</CardTitle>
              <Key className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_indexes}</div>
              <p className="text-xs text-muted-foreground mt-1">Database indexes</p>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-medium">Foreign Keys</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_foreign_keys}</div>
              <p className="text-xs text-muted-foreground mt-1">Table relationships</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="tables" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="space-y-6">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {tables.map((table) => (
              <AccordionItem key={table.table_name} value={table.table_name} className="border rounded-lg">
                <AccordionTrigger className="text-left px-6 py-4 hover:bg-muted/50">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full">
                    <span className="font-semibold text-lg">{table.table_name}</span>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{table.row_count} rows</Badge>
                      <Badge variant="outline">{table.columns.length} columns</Badge>
                      <Badge variant="outline">{table.policies.length} policies</Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6 p-6">
                    {/* Columns */}
                    <div>
                      <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Columns
                      </h4>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Nullable</TableHead>
                            <TableHead>Default</TableHead>
                            <TableHead>Constraints</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {table.columns.map((column) => (
                            <TableRow key={column.column_name}>
                              <TableCell className="font-medium">{column.column_name}</TableCell>
                              <TableCell>{column.data_type}</TableCell>
                              <TableCell>
                                <Badge variant={column.is_nullable === 'YES' ? 'secondary' : 'destructive'}>
                                  {column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}
                                </Badge>
                              </TableCell>
                              <TableCell>{column.column_default || '-'}</TableCell>
                              <TableCell>
                                <div className="flex space-x-1">
                                  {column.is_primary_key && (
                                    <Badge variant="default">PK</Badge>
                                  )}
                                  {column.is_foreign_key && (
                                    <Badge variant="outline">FK</Badge>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                    <Separator />

                    {/* Foreign Keys */}
                    {table.foreign_keys.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Foreign Keys
                        </h4>
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Column</TableHead>
                              <TableHead>References</TableHead>
                              <TableHead>Constraint</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {table.foreign_keys.map((fk) => (
                              <TableRow key={fk.constraint_name}>
                                <TableCell className="font-medium">{fk.column_name}</TableCell>
                                <TableCell>
                                  {fk.foreign_table_name}.{fk.foreign_column_name}
                                </TableCell>
                                <TableCell>{fk.constraint_name}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    )}

                    {/* Policies */}
                    {table.policies.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          Policies
                        </h4>
                        <div className="space-y-4">
                          {table.policies.map((policy) => (
                            <Card key={policy.policyname} className="border-l-4 border-l-blue-500">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-base">{policy.policyname}</CardTitle>
                                <CardDescription>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline">{policy.cmd}</Badge>
                                    <span className="text-sm">Roles: {policy.roles.join(', ')}</span>
                                  </div>
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                {policy.qual && (
                                  <div>
                                    <span className="font-medium text-sm">Condition: </span>
                                    <code className="text-xs bg-muted px-2 py-1 rounded block mt-1">
                                      {policy.qual}
                                    </code>
                                  </div>
                                )}
                                {policy.with_check && (
                                  <div>
                                    <span className="font-medium text-sm">Check: </span>
                                    <code className="text-xs bg-muted px-2 py-1 rounded block mt-1">
                                      {policy.with_check}
                                    </code>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>

        <TabsContent value="policies" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                All Row Level Security Policies
              </CardTitle>
              <CardDescription>
                Complete list of RLS policies across all tables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table</TableHead>
                    <TableHead>Policy Name</TableHead>
                    <TableHead>Command</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Condition</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allPolicies.map((policy) => (
                    <TableRow key={`${policy.tablename}-${policy.policyname}`}>
                      <TableCell className="font-medium">{policy.tablename}</TableCell>
                      <TableCell>{policy.policyname}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{policy.cmd}</Badge>
                      </TableCell>
                      <TableCell>{policy.roles.join(', ')}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {policy.qual || '-'}
                        </code>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Database Report
              </CardTitle>
                           <CardDescription>
               Generated PDF report of your database structure
             </CardDescription>
            </CardHeader>
            <CardContent>
              {isGeneratingReport ? (
                <div className="text-center py-12">
                  <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">
                    Generating comprehensive database report...
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    This may take a few moments
                  </p>
                </div>
              ) : report ? (
                <div className="bg-muted p-6 rounded-lg border">
                  <pre className="text-sm whitespace-pre-wrap leading-relaxed">{report}</pre>
                </div>
              ) : (
                                 <div className="text-center py-12">
                   <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                   <p className="text-muted-foreground text-lg">
                     Click &quot;Generate PDF Report&quot; to create a comprehensive database report
                   </p>
                 </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 