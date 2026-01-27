'use client'

import { createContext, useContext, ReactNode } from 'react'
import type { Instructor } from '@/lib/types'

interface InstructorContextType {
  instructor: Instructor
  token: string
}

const InstructorContext = createContext<InstructorContextType | null>(null)

export function InstructorProvider({
  children,
  instructor,
  token,
}: {
  children: ReactNode
  instructor: Instructor
  token: string
}) {
  return (
    <InstructorContext.Provider value={{ instructor, token }}>
      {children}
    </InstructorContext.Provider>
  )
}

export function useInstructor() {
  const context = useContext(InstructorContext)
  if (!context) {
    throw new Error('useInstructor must be used within InstructorProvider')
  }
  return context
}
