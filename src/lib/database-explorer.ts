import { supabase } from './supabase'

// Enhanced interfaces for better type safety and comprehensive data
export interface TableInfo {
  table_name: string
  table_type: string
  table_schema: string
  row_count?: number
  columns: ColumnInfo[]
  policies: PolicyInfo[]
  indexes: IndexInfo[]
  foreign_keys: ForeignKeyInfo[]
  description?: string
  last_updated?: string
}

export interface ColumnInfo {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  character_maximum_length?: number
  is_primary_key?: boolean
  is_foreign_key?: boolean
  description?: string
  constraints?: string[]
}

export interface PolicyInfo {
  schemaname: string
  tablename: string
  policyname: string
  permissive: string
  roles: string[]
  cmd: string
  qual: string
  with_check: string
  description?: string
}

export interface IndexInfo {
  indexname: string
  tablename: string
  indexdef: string
  is_unique: boolean
  columns?: string[]
  description?: string
}

export interface ForeignKeyInfo {
  constraint_name: string
  table_name: string
  column_name: string
  foreign_table_name: string
  foreign_column_name: string
  on_delete?: string
  on_update?: string
}

export interface DatabaseStats {
  total_tables: number
  total_policies: number
  total_indexes: number
  total_foreign_keys: number
  total_rows: number
  table_sizes: { [tableName: string]: number }
  largest_table?: string
  most_active_table?: string
  last_updated?: string
}

export interface DatabaseReport {
  metadata: {
    generated_at: string
    version: string
    database_name: string
    total_tables: number
    total_rows: number
  }
  statistics: DatabaseStats
  tables: TableInfo[]
  relationships: {
    foreign_keys: ForeignKeyInfo[]
    dependencies: { [tableName: string]: string[] }
  }
  security: {
    policies: PolicyInfo[]
    rls_enabled_tables: string[]
  }
  recommendations: string[]
}

export class DatabaseExplorer {
  private supabase = supabase

  /**
   * Get comprehensive information about all tables in the database
   */
  async getAllTablesInfo(): Promise<TableInfo[]> {
    try {
      // Manually query known tables from our schema
      const knownTables = ['users', 'courses', 'course_enrollments', 'course_materials', 'doubts', 'doubt_upvotes']
      const tablesInfo: TableInfo[] = []

      for (const tableName of knownTables) {
        const tableInfo = await this.getTableInfo(tableName)
        if (tableInfo) {
          tablesInfo.push(tableInfo)
        }
      }

      return tablesInfo
    } catch (error) {
      console.error('Error getting all tables info:', error)
      throw error
    }
  }

  /**
   * Get detailed information about a specific table
   */
  async getTableInfo(tableName: string): Promise<TableInfo | null> {
    try {
      // Try to get basic info from the table itself
      const { data: sampleData, error: sampleError } = await this.supabase
        .from(tableName)
        .select('*')
        .limit(1)

      if (sampleError) {
        console.error(`Table ${tableName} not accessible:`, sampleError)
        return null
      }

      // Enhanced column info with better type detection
      const columnInfos: ColumnInfo[] = sampleData && sampleData.length > 0 
        ? Object.keys(sampleData[0]).map(key => {
            const value = sampleData[0][key]
            const dataType = this.inferDataType(value)
            const constraints: string[] = []
            
            // Add constraints based on column name patterns
            if (key === 'id') constraints.push('PRIMARY KEY')
            if (key.includes('_id')) constraints.push('FOREIGN KEY')
            if (key.includes('created_at') || key.includes('updated_at')) constraints.push('TIMESTAMP')
            if (key === 'email') constraints.push('UNIQUE')
            
            return {
              column_name: key,
              data_type: dataType,
              is_nullable: value === null ? 'YES' : 'NO',
              column_default: null,
              is_primary_key: key === 'id',
              is_foreign_key: key.includes('_id') && key !== 'id',
              constraints
            }
          })
        : []

      // Get row count
      const { count: rowCount } = await this.supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      // Get policies
      const policies = await this.getTablePolicies(tableName)

      // Get indexes
      const indexes = await this.getTableIndexes(tableName)

      // Get foreign keys
      const foreignKeys = await this.getTableForeignKeys(tableName)

      // Get primary keys
      const primaryKeys = await this.getTablePrimaryKeys(tableName)

      // Update column info with primary/foreign key status
      const updatedColumnInfos = columnInfos.map(col => ({
        ...col,
        is_primary_key: primaryKeys.includes(col.column_name),
        is_foreign_key: foreignKeys.some(fk => fk.column_name === col.column_name)
      }))

      return {
        table_name: tableName,
        table_type: 'BASE TABLE',
        table_schema: 'public',
        row_count: rowCount || 0,
        columns: updatedColumnInfos,
        policies,
        indexes,
        foreign_keys: foreignKeys,
        description: this.getTableDescription(tableName),
        last_updated: new Date().toISOString()
      }
    } catch (error) {
      console.error(`Error getting table info for ${tableName}:`, error)
      return null
    }
  }

  /**
   * Infer data type from sample value
   */
  private inferDataType(value: unknown): string {
    if (value === null) return 'unknown'
    if (typeof value === 'string') {
      if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) return 'timestamp'
      if (value.match(/^\d{4}-\d{2}-\d{2}$/)) return 'date'
      if (value.includes('@')) return 'email'
      if (value.length > 255) return 'text'
      return 'varchar'
    }
    if (typeof value === 'number') {
      if (Number.isInteger(value)) return 'integer'
      return 'numeric'
    }
    if (typeof value === 'boolean') return 'boolean'
    if (Array.isArray(value)) return 'array'
    if (typeof value === 'object') return 'json'
    return 'unknown'
  }

  /**
   * Get table description based on table name
   */
  private getTableDescription(tableName: string): string {
    const descriptions: { [key: string]: string } = {
      users: 'User accounts and authentication data',
      courses: 'Course information and metadata',
      course_enrollments: 'Student course enrollment records',
      course_materials: 'Course materials and file uploads',
      doubts: 'Student doubt submissions',
      doubt_upvotes: 'Doubt upvoting system'
    }
    return descriptions[tableName] || 'Database table'
  }

  /**
   * Get all policies for a specific table
   */
  async getTablePolicies(tableName: string): Promise<PolicyInfo[]> {
    try {
      // For now, return empty array since we can't easily query pg_policies
      // This would require custom SQL functions in Supabase
      return []
    } catch (error) {
      console.error(`Error getting policies for ${tableName}:`, error)
      return []
    }
  }

  /**
   * Get all indexes for a specific table
   */
  async getTableIndexes(tableName: string): Promise<IndexInfo[]> {
    try {
      // For now, return empty array since we can't easily query pg_indexes
      // This would require custom SQL functions in Supabase
      return []
    } catch (error) {
      console.error(`Error getting indexes for ${tableName}:`, error)
      return []
    }
  }

  /**
   * Get all foreign keys for a specific table
   */
  async getTableForeignKeys(tableName: string): Promise<ForeignKeyInfo[]> {
    try {
      // For now, return empty array since we can't easily query information_schema
      // This would require custom SQL functions in Supabase
      return []
    } catch (error) {
      console.error(`Error getting foreign keys for ${tableName}:`, error)
      return []
    }
  }

  /**
   * Get primary keys for a specific table
   */
  async getTablePrimaryKeys(tableName: string): Promise<string[]> {
    try {
      // For now, return empty array since we can't easily query information_schema
      // This would require custom SQL functions in Supabase
      return []
    } catch (error) {
      console.error(`Error getting primary keys for ${tableName}:`, error)
      return []
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<DatabaseStats> {
    try {
      const tables = await this.getAllTablesInfo()
      
      const totalRows = tables.reduce((sum, table) => sum + (table.row_count || 0), 0)
      const tableSizes = Object.fromEntries(
        tables.map(table => [table.table_name, table.row_count || 0])
      )
      
      // Find largest and most active tables
      const largestTable = Object.entries(tableSizes).reduce((a, b) => 
        tableSizes[a[0]] > tableSizes[b[0]] ? a : b
      )[0]
      
      const stats: DatabaseStats = {
        total_tables: tables.length,
        total_policies: tables.reduce((sum, table) => sum + table.policies.length, 0),
        total_indexes: tables.reduce((sum, table) => sum + table.indexes.length, 0),
        total_foreign_keys: tables.reduce((sum, table) => sum + table.foreign_keys.length, 0),
        total_rows: totalRows,
        table_sizes: tableSizes,
        largest_table: largestTable,
        last_updated: new Date().toISOString()
      }

      return stats
    } catch (error) {
      console.error('Error getting database stats:', error)
      throw error
    }
  }

  /**
   * Get all RLS (Row Level Security) policies
   */
  async getAllPolicies(): Promise<PolicyInfo[]> {
    try {
      // For now, return empty array since we can't easily query pg_policies
      // This would require custom SQL functions in Supabase
      return []
    } catch (error) {
      console.error('Error getting all policies:', error)
      throw error
    }
  }

  /**
   * Check if RLS is enabled on a table
   */
  async isRLSEnabled(tableName: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .rpc('is_rls_enabled', { table_name: tableName })

      if (error) {
        // Fallback: check if table has any policies
        const policies = await this.getTablePolicies(tableName)
        return policies.length > 0
      }

      return data || false
    } catch (error) {
      console.error(`Error checking RLS for ${tableName}:`, error)
      return false
    }
  }

  /**
   * Get user roles and permissions
   */
  async getUserRoles(): Promise<unknown[]> {
    try {
      // For now, return empty array since we can't easily query pg_roles
      // This would require custom SQL functions in Supabase
      return []
    } catch (error) {
      console.error('Error getting user roles:', error)
      throw error
    }
  }

  /**
   * Get database health check
   */
  async getDatabaseHealth(): Promise<{
    status: 'healthy' | 'warning' | 'error'
    issues: string[]
    recommendations: string[]
  }> {
    try {
      const tables = await this.getAllTablesInfo()
      const issues: string[] = []
      const recommendations: string[] = []

      // Check for tables without primary keys
      const tablesWithoutPK = tables.filter(t => 
        !t.columns.some(c => c.is_primary_key)
      )
      if (tablesWithoutPK.length > 0) {
        issues.push(`${tablesWithoutPK.length} tables without primary keys`)
        recommendations.push('Add primary keys to all tables for data integrity')
      }

      // Check for large tables without indexes
      const largeTables = tables.filter(t => (t.row_count || 0) > 1000)
      const largeTablesWithoutIndexes = largeTables.filter(t => t.indexes.length === 0)
      if (largeTablesWithoutIndexes.length > 0) {
        issues.push(`${largeTablesWithoutIndexes.length} large tables without indexes`)
        recommendations.push('Add indexes to large tables for better performance')
      }

      // Check for tables without RLS policies
      const tablesWithoutRLS = tables.filter(t => t.policies.length === 0)
      if (tablesWithoutRLS.length > 0) {
        issues.push(`${tablesWithoutRLS.length} tables without RLS policies`)
        recommendations.push('Implement RLS policies for data security')
      }

      let status: 'healthy' | 'warning' | 'error' = 'healthy'
      if (issues.length > 0) {
        status = issues.length > 2 ? 'error' : 'warning'
      }

      return { status, issues, recommendations }
    } catch (error) {
      console.error('Error checking database health:', error)
      return {
        status: 'error',
        issues: ['Unable to perform health check'],
        recommendations: ['Check database connectivity']
      }
    }
  }

  /**
   * Get table relationships visualization data
   */
  async getTableRelationships(): Promise<{
    nodes: Array<{ id: string; label: string; size: number }>
    edges: Array<{ source: string; target: string; label: string }>
  }> {
    try {
      const tables = await this.getAllTablesInfo()
      
      const nodes = tables.map(table => ({
        id: table.table_name,
        label: table.table_name,
        size: Math.max(1, Math.log10(table.row_count || 1) * 10)
      }))

      const edges = tables.flatMap(table =>
        table.foreign_keys.map(fk => ({
          source: table.table_name,
          target: fk.foreign_table_name,
          label: `${fk.column_name} → ${fk.foreign_column_name}`
        }))
      )

      return { nodes, edges }
    } catch (error) {
      console.error('Error getting table relationships:', error)
      return { nodes: [], edges: [] }
    }
  }

  /**
   * Export database schema as SQL
   */
  async exportSchemaAsSQL(): Promise<string> {
    try {
      const tables = await this.getAllTablesInfo()
      let sql = '-- InfraLearn Database Schema\n'
      sql += `-- Generated: ${new Date().toISOString()}\n\n`

      for (const table of tables) {
        sql += `-- Table: ${table.table_name}\n`
        sql += `CREATE TABLE ${table.table_name} (\n`
        
        const columns = table.columns.map(col => {
          let columnDef = `  ${col.column_name} ${col.data_type.toUpperCase()}`
          if (col.is_nullable === 'NO') columnDef += ' NOT NULL'
          if (col.column_default) columnDef += ` DEFAULT ${col.column_default}`
          if (col.is_primary_key) columnDef += ' PRIMARY KEY'
          return columnDef
        })

        sql += columns.join(',\n') + '\n);\n\n'

        // Add foreign key constraints
        for (const fk of table.foreign_keys) {
          sql += `ALTER TABLE ${table.table_name} ADD CONSTRAINT ${fk.constraint_name} ` +
                 `FOREIGN KEY (${fk.column_name}) REFERENCES ${fk.foreign_table_name}(${fk.foreign_column_name});\n`
        }
        sql += '\n'
      }

      return sql
    } catch (error) {
      console.error('Error exporting schema:', error)
      throw error
    }
  }

  /**
   * Generate a comprehensive database report
   */
  async generateDatabaseReport(): Promise<string> {
    try {
      const tables = await this.getAllTablesInfo()
      const stats = await this.getDatabaseStats()
      const allPolicies = await this.getAllPolicies()

      const report: DatabaseReport = {
        metadata: {
          generated_at: new Date().toISOString(),
          version: '1.0.0',
          database_name: 'InfraLearn Database',
          total_tables: stats.total_tables,
          total_rows: stats.total_rows
        },
        statistics: stats,
        tables,
        relationships: {
          foreign_keys: tables.flatMap(t => t.foreign_keys),
          dependencies: this.buildDependencyGraph(tables)
        },
        security: {
          policies: allPolicies,
          rls_enabled_tables: tables.filter(t => t.policies.length > 0).map(t => t.table_name)
        },
        recommendations: this.generateRecommendations(tables, stats)
      }

      return this.formatReportAsMarkdown(report)
    } catch (error) {
      console.error('Error generating database report:', error)
      throw error
    }
  }

  /**
   * Build dependency graph between tables
   */
  private buildDependencyGraph(tables: TableInfo[]): { [tableName: string]: string[] } {
    const dependencies: { [tableName: string]: string[] } = {}
    
    for (const table of tables) {
      dependencies[table.table_name] = table.foreign_keys.map(fk => fk.foreign_table_name)
    }
    
    return dependencies
  }

  /**
   * Generate recommendations based on database analysis
   */
  private generateRecommendations(tables: TableInfo[], stats: DatabaseStats): string[] {
    const recommendations: string[] = []

    // Check for tables without primary keys
    const tablesWithoutPK = tables.filter(t => 
      !t.columns.some(c => c.is_primary_key)
    )
    if (tablesWithoutPK.length > 0) {
      recommendations.push(`Consider adding primary keys to tables: ${tablesWithoutPK.map(t => t.table_name).join(', ')}`)
    }

    // Check for large tables without indexes
    const largeTables = tables.filter(t => (t.row_count || 0) > 1000)
    const largeTablesWithoutIndexes = largeTables.filter(t => t.indexes.length === 0)
    if (largeTablesWithoutIndexes.length > 0) {
      recommendations.push(`Consider adding indexes to large tables: ${largeTablesWithoutIndexes.map(t => t.table_name).join(', ')}`)
    }

    // Check for tables without RLS policies
    const tablesWithoutRLS = tables.filter(t => t.policies.length === 0)
    if (tablesWithoutRLS.length > 0) {
      recommendations.push(`Consider implementing RLS policies for tables: ${tablesWithoutRLS.map(t => t.table_name).join(', ')}`)
    }

    // Check for orphaned foreign keys
    const allTableNames = new Set(tables.map(t => t.table_name))
    const orphanedFKs = tables.flatMap(t => 
      t.foreign_keys.filter(fk => !allTableNames.has(fk.foreign_table_name))
    )
    if (orphanedFKs.length > 0) {
      recommendations.push(`Found ${orphanedFKs.length} foreign keys referencing non-existent tables`)
    }

    // Performance recommendations
    if (stats.total_rows > 10000) {
      recommendations.push('Consider implementing database partitioning for better performance')
    }

    if (stats.total_tables > 10) {
      recommendations.push('Consider implementing database archiving strategy for old data')
    }

    return recommendations
  }

  /**
   * Format the database report as markdown
   */
  private formatReportAsMarkdown(report: DatabaseReport): string {
    let markdown = ''

    // Header
    markdown += `# ${report.metadata.database_name} - Database Report\n\n`
    markdown += `**Generated:** ${new Date(report.metadata.generated_at).toLocaleString()}\n`
    markdown += `**Version:** ${report.metadata.version}\n\n`

    // Executive Summary
    markdown += '## 📊 Executive Summary\n\n'
    markdown += `- **Total Tables:** ${report.statistics.total_tables}\n`
    markdown += `- **Total Rows:** ${report.statistics.total_rows.toLocaleString()}\n`
    markdown += `- **Total Policies:** ${report.statistics.total_policies}\n`
    markdown += `- **Total Indexes:** ${report.statistics.total_indexes}\n`
    markdown += `- **Total Foreign Keys:** ${report.statistics.total_foreign_keys}\n`
    markdown += `- **Largest Table:** ${report.statistics.largest_table} (${report.statistics.table_sizes[report.statistics.largest_table || '']?.toLocaleString()} rows)\n\n`

    // Database Statistics
    markdown += '## 📈 Database Statistics\n\n'
    markdown += '### Table Sizes\n'
    Object.entries(report.statistics.table_sizes)
      .sort(([,a], [,b]) => b - a)
      .forEach(([table, count]) => {
        markdown += `- **${table}:** ${count.toLocaleString()} rows\n`
      })
    markdown += '\n'

    // Security Analysis
    markdown += '## 🔒 Security Analysis\n\n'
    markdown += `- **Tables with RLS:** ${report.security.rls_enabled_tables.length}/${report.statistics.total_tables}\n`
    markdown += `- **Total Policies:** ${report.security.policies.length}\n\n`

    if (report.security.rls_enabled_tables.length > 0) {
      markdown += '### Tables with Row Level Security\n'
      report.security.rls_enabled_tables.forEach(table => {
        markdown += `- ${table}\n`
      })
      markdown += '\n'
    }

    // Table Details
    markdown += '## 🗂️ Table Details\n\n'
    for (const table of report.tables) {
      markdown += `### 📋 ${table.table_name}\n\n`
      markdown += `**Description:** ${table.description || 'No description available'}\n\n`
      markdown += `**Statistics:**\n`
      markdown += `- Rows: ${table.row_count?.toLocaleString() || 0}\n`
      markdown += `- Columns: ${table.columns.length}\n`
      markdown += `- Policies: ${table.policies.length}\n`
      markdown += `- Indexes: ${table.indexes.length}\n`
      markdown += `- Foreign Keys: ${table.foreign_keys.length}\n\n`

      // Columns
      markdown += '#### Columns\n\n'
      markdown += '| Column | Type | Nullable | Primary Key | Foreign Key | Constraints |\n'
      markdown += '|--------|------|----------|-------------|-------------|-------------|\n'
      for (const column of table.columns) {
        const constraints = column.constraints?.join(', ') || ''
        markdown += `| ${column.column_name} | ${column.data_type} | ${column.is_nullable} | ${column.is_primary_key ? '✅' : '❌'} | ${column.is_foreign_key ? '✅' : '❌'} | ${constraints} |\n`
      }
      markdown += '\n'

      // Foreign Keys
      if (table.foreign_keys.length > 0) {
        markdown += '#### Foreign Key Relationships\n\n'
        markdown += '| Column | References | Constraint |\n'
        markdown += '|--------|------------|------------|\n'
        for (const fk of table.foreign_keys) {
          markdown += `| ${fk.column_name} | ${fk.foreign_table_name}.${fk.foreign_column_name} | ${fk.constraint_name} |\n`
        }
        markdown += '\n'
      }

      // Policies
      if (table.policies.length > 0) {
        markdown += '#### Row Level Security Policies\n\n'
        for (const policy of table.policies) {
          markdown += `**${policy.policyname}**\n`
          markdown += `- Command: ${policy.cmd}\n`
          markdown += `- Roles: ${policy.roles.join(', ')}\n`
          if (policy.qual) markdown += `- Condition: \`${policy.qual}\`\n`
          if (policy.with_check) markdown += `- Check: \`${policy.with_check}\`\n`
          markdown += '\n'
        }
      }

      markdown += '---\n\n'
    }

    // Relationships
    markdown += '## 🔗 Database Relationships\n\n'
    markdown += '### Foreign Key Dependencies\n\n'
    Object.entries(report.relationships.dependencies).forEach(([table, deps]) => {
      if (deps.length > 0) {
        markdown += `**${table}** depends on: ${deps.join(', ')}\n\n`
      }
    })

    // Recommendations
    if (report.recommendations.length > 0) {
      markdown += '## 💡 Recommendations\n\n'
      report.recommendations.forEach((rec, index) => {
        markdown += `${index + 1}. ${rec}\n`
      })
      markdown += '\n'
    }

    // Footer
    markdown += '---\n\n'
    markdown += '*This report was automatically generated by the InfraLearn Database Explorer.*\n'
    markdown += `*Last updated: ${new Date().toLocaleString()}*\n`

    return markdown
  }
}

// Export a singleton instance
export const databaseExplorer = new DatabaseExplorer() 