'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Calendar, X } from 'lucide-react'

interface TimeSlot {
  day: string
  startTime: string
  endTime: string
}

interface WeekCalendarProps {
  selectedSlots: TimeSlot[]
  onSlotsChange: (slots: TimeSlot[]) => void
  className?: string
}

const DAYS = [
  { key: 'monday', label: 'Mon', full: 'Monday' },
  { key: 'tuesday', label: 'Tue', full: 'Tuesday' },
  { key: 'wednesday', label: 'Wed', full: 'Wednesday' },
  { key: 'thursday', label: 'Thu', full: 'Thursday' },
  { key: 'friday', label: 'Fri', full: 'Friday' },
  { key: 'saturday', label: 'Sat', full: 'Saturday' },
  { key: 'sunday', label: 'Sun', full: 'Sunday' }
]

const START_TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'
]

const END_TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00', '18:00'
]

export default function WeekCalendar({ selectedSlots, onSlotsChange, className = '' }: WeekCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<string>('')
  const [startTime, setStartTime] = useState<string>('')
  const [endTime, setEndTime] = useState<string>('')

  const addTimeSlot = () => {
    if (!selectedDay || !startTime || !endTime) return
    
    if (startTime >= endTime) {
      alert('End time must be after start time')
      return
    }

    const newSlot: TimeSlot = {
      day: selectedDay,
      startTime,
      endTime
    }

    // Check for conflicts
    const hasConflict = selectedSlots.some(slot => 
      slot.day === selectedDay && 
      ((startTime >= slot.startTime && startTime < slot.endTime) ||
       (endTime > slot.startTime && endTime <= slot.endTime) ||
       (startTime <= slot.startTime && endTime >= slot.endTime))
    )

    if (hasConflict) {
      alert('This time slot conflicts with an existing schedule')
      return
    }

    onSlotsChange([...selectedSlots, newSlot])
    setSelectedDay('')
    setStartTime('')
    setEndTime('')
  }

  const removeTimeSlot = (index: number) => {
    const newSlots = selectedSlots.filter((_, i) => i !== index)
    onSlotsChange(newSlots)
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getDayLabel = (dayKey: string) => {
    return DAYS.find(day => day.key === dayKey)?.full || dayKey
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Selected Time Slots */}
      {selectedSlots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5" />
              Selected Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedSlots.map((slot, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="min-w-[80px] text-center">
                      {getDayLabel(slot.day)}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                    </div>
                  </div>
                                     <Button
                     variant="ghost"
                     size="sm"
                     onClick={(e) => {
                       e.preventDefault()
                       e.stopPropagation()
                       removeTimeSlot(index)
                     }}
                     className="text-red-500 hover:text-red-700 hover:bg-red-50 active:scale-95 transition-all duration-150"
                     type="button"
                   >
                     <X className="w-4 h-4" />
                   </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Time Slot */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4" />
            Add Time Slot
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Day Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Day
              </label>
              <div className="grid grid-cols-7 gap-1">
                                 {DAYS.map((day) => (
                   <Button
                     key={day.key}
                     variant={selectedDay === day.key ? 'default' : 'outline'}
                     size="sm"
                     onClick={(e) => {
                       e.preventDefault()
                       e.stopPropagation()
                       setSelectedDay(day.key)
                     }}
                                           className={`text-xs h-8 active:scale-95 transition-all duration-150 ${
                        selectedDay === day.key 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                     type="button"
                   >
                     {day.label}
                   </Button>
                 ))}
              </div>
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                                                   <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive !bg-white"
                  >
                   <option value="">Select start time</option>
                   {START_TIME_SLOTS.map((time) => (
                     <option key={time} value={time}>
                       {formatTime(time)}
                     </option>
                   ))}
                 </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                                                   <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive !bg-white"
                  >
                   <option value="">Select end time</option>
                   {END_TIME_SLOTS.map((time) => (
                     <option key={time} value={time}>
                       {formatTime(time)}
                     </option>
                   ))}
                 </select>
              </div>
            </div>

            {/* Add Button */}
                         <Button
               onClick={(e) => {
                 e.preventDefault()
                 e.stopPropagation()
                 addTimeSlot()
               }}
               disabled={!selectedDay || !startTime || !endTime}
                               className="w-full h-9 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all duration-150"
               size="sm"
               type="button"
             >
               Add Time Slot
             </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 