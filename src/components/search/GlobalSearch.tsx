'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Search, 
  BookOpen, 
  FileText, 
  MessageSquare, 
  Calendar, 
  Target,
  Clock,
  ArrowRight,
  X,
  Loader2
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import useCourseStore from '@/store/courseStore'

interface SearchResult {
  id: string
  type: 'course' | 'material' | 'announcement' | 'doubt' | 'assignment' | 'calendar'
  title: string
  description?: string
  courseName?: string
  timestamp?: Date
  url: string
  relevance: number
}

interface SearchSuggestion {
  id: string
  text: string
  type: string
}

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  
  const router = useRouter()
  const { user } = useAuthStore()
  const { courses, materials, announcements, doubts, assignments, calendarEvents } = useCourseStore()
  const searchRef = useRef<HTMLDivElement>(null)

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      switch (event.key) {
        case 'Escape':
          setIsOpen(false)
          break
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
          break
        case 'Enter':
          event.preventDefault()
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleResultClick(results[selectedIndex])
          } else if (query.trim()) {
            performSearch(query)
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex, query])

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('infralearn_search_history')
    if (history) {
      setSearchHistory(JSON.parse(history))
    }
  }, [])

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setQuery(searchQuery)

    try {
      // Simulate search delay
      await new Promise(resolve => setTimeout(resolve, 300))

      const searchResults: SearchResult[] = []

      // Search in courses
      courses.forEach(course => {
        if (course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.code.toLowerCase().includes(searchQuery.toLowerCase())) {
          searchResults.push({
            id: course.id,
            type: 'course',
            title: course.title,
            description: course.description,
            url: `/dashboard/courses/${course.id}`,
            relevance: calculateRelevance(course.title, searchQuery)
          })
        }
      })

      // Search in materials
      materials.forEach(material => {
        if (material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (material.description && material.description.toLowerCase().includes(searchQuery.toLowerCase()))) {
          searchResults.push({
            id: material.id,
            type: 'material',
            title: material.name,
            description: material.description,
            courseName: courses.find(c => c.id === material.course_id)?.title,
            url: `/dashboard/courses/${material.course_id}?tab=materials`,
            relevance: calculateRelevance(material.name, searchQuery)
          })
        }
      })

      // Search in announcements
      announcements.forEach(announcement => {
        if (announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            announcement.content.toLowerCase().includes(searchQuery.toLowerCase())) {
          searchResults.push({
            id: announcement.id,
            type: 'announcement',
            title: announcement.title,
            description: announcement.content.substring(0, 100) + '...',
            courseName: courses.find(c => c.id === announcement.course_id)?.title,
            url: `/dashboard/courses/${announcement.course_id}?tab=announcements`,
            relevance: calculateRelevance(announcement.title, searchQuery)
          })
        }
      })

      // Search in doubts
      doubts.forEach(doubt => {
        if (doubt.content.toLowerCase().includes(searchQuery.toLowerCase())) {
          searchResults.push({
            id: doubt.id,
            type: 'doubt',
            title: doubt.content.substring(0, 50) + '...',
            description: `Asked by ${doubt.student_name}`,
            courseName: courses.find(c => c.id === doubt.course_id)?.title,
            url: `/dashboard/courses/${doubt.course_id}?tab=doubts`,
            relevance: calculateRelevance(doubt.content, searchQuery)
          })
        }
      })

      // Search in assignments
      assignments.forEach(assignment => {
        if (assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            assignment.description.toLowerCase().includes(searchQuery.toLowerCase())) {
          searchResults.push({
            id: assignment.id,
            type: 'assignment',
            title: assignment.title,
            description: assignment.description.substring(0, 100) + '...',
            courseName: courses.find(c => c.id === assignment.course_id)?.title,
            url: `/dashboard/courses/${assignment.course_id}?tab=assignments`,
            relevance: calculateRelevance(assignment.title, searchQuery)
          })
        }
      })

      // Search in calendar events
      calendarEvents.forEach(event => {
        if (event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.description.toLowerCase().includes(searchQuery.toLowerCase())) {
          searchResults.push({
            id: event.id,
            type: 'calendar',
            title: event.title,
            description: event.description.substring(0, 100) + '...',
            courseName: courses.find(c => c.id === event.course_id)?.title,
            url: `/dashboard/courses/${event.course_id}?tab=calendar`,
            relevance: calculateRelevance(event.title, searchQuery)
          })
        }
      })

      // Sort by relevance
      searchResults.sort((a, b) => b.relevance - a.relevance)
      setResults(searchResults)

      // Update search history
      const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10)
      setSearchHistory(newHistory)
      localStorage.setItem('infralearn_search_history', JSON.stringify(newHistory))

    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateRelevance = (text: string, query: string): number => {
    const textLower = text.toLowerCase()
    const queryLower = query.toLowerCase()
    
    if (textLower.startsWith(queryLower)) return 100
    if (textLower.includes(queryLower)) return 80
    if (textLower.split(' ').some(word => word.startsWith(queryLower))) return 60
    return 40
  }

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url)
    setIsOpen(false)
    setQuery('')
    setResults([])
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text)
    performSearch(suggestion.text)
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setSelectedIndex(-1)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOpen className="w-4 h-4" />
      case 'material':
        return <FileText className="w-4 h-4" />
      case 'announcement':
        return <MessageSquare className="w-4 h-4" />
      case 'doubt':
        return <MessageSquare className="w-4 h-4" />
      case 'assignment':
        return <Target className="w-4 h-4" />
      case 'calendar':
        return <Calendar className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'course':
        return 'bg-blue-100 text-blue-700'
      case 'material':
        return 'bg-green-100 text-green-700'
      case 'announcement':
        return 'bg-purple-100 text-purple-700'
      case 'doubt':
        return 'bg-orange-100 text-orange-700'
      case 'assignment':
        return 'bg-red-100 text-red-700'
      case 'calendar':
        return 'bg-indigo-100 text-indigo-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="relative" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search courses, materials, announcements..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (e.target.value.trim()) {
              performSearch(e.target.value)
            } else {
              setResults([])
            }
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10 w-80"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96"
          >
            <ScrollArea className="max-h-96">
              <div className="p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    <span className="text-gray-600">Searching...</span>
                  </div>
                ) : results.length > 0 ? (
                  <div className="space-y-2">
                    {results.map((result, index) => (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card 
                          className={`cursor-pointer transition-colors ${
                            selectedIndex === index ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleResultClick(result)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <div className={`p-1 rounded ${getTypeColor(result.type)}`}>
                                {getTypeIcon(result.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-sm truncate">{result.title}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {result.type}
                                  </Badge>
                                </div>
                                {result.description && (
                                  <p className="text-xs text-gray-600 mb-1 line-clamp-2">
                                    {result.description}
                                  </p>
                                )}
                                {result.courseName && (
                                  <p className="text-xs text-gray-500">
                                    Course: {result.courseName}
                                  </p>
                                )}
                              </div>
                              <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : query ? (
                  <div className="text-center py-8">
                    <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No results found for "{query}"</p>
                    <p className="text-sm text-gray-500">Try different keywords</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Search History */}
                    {searchHistory.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Searches</h3>
                        <div className="space-y-1">
                          {searchHistory.slice(0, 5).map((term, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestionClick({ id: index.toString(), text: term, type: 'history' })}
                              className="flex items-center gap-2 w-full p-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                            >
                              <Clock className="w-4 h-4" />
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Suggestions */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Search</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { text: 'Live Sessions', type: 'live' },
                          { text: 'Assignments', type: 'assignment' },
                          { text: 'Course Materials', type: 'material' },
                          { text: 'Announcements', type: 'announcement' }
                        ].map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick({ id: index.toString(), text: suggestion.text, type: suggestion.type })}
                            className="p-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors text-left"
                          >
                            {suggestion.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 