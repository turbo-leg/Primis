import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import NotificationsPage from '@/components/notifications/notifications-page'

export const metadata: Metadata = {
  title: 'Notifications | Primis EduCare',
  description: 'View and manage your notifications',
}

export default async function Notifications() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return <NotificationsPage />
}
