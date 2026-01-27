import { redirect } from 'next/navigation'
import { validateToken } from '@/lib/auth'
import { InstructorProvider } from '@/components/instructor-provider'
import { ScheduleContent } from '@/components/schedule-content'

interface PageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function SchedulePage({ searchParams }: PageProps) {
  const params = await searchParams
  const token = params.token

  if (!token) {
    redirect('/invalid-token')
  }

  const instructor = await validateToken(token)

  if (!instructor) {
    redirect('/invalid-token')
  }

  return (
    <InstructorProvider instructor={instructor} token={token}>
      <ScheduleContent />
    </InstructorProvider>
  )
}
