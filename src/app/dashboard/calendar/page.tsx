'use client'

import MainLayout from '@/components/layout/MainLayout'
import CalendarSystem from '@/components/calendar/CalendarSystem'

export default function CalendarPage() {
  return (
    <MainLayout 
      title="Calendar" 
      description="View your course events, deadlines, and schedules"
    >
      <CalendarSystem />
    </MainLayout>
  )
} 