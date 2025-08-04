'use client'

import { useSession } from 'next-auth/react'

export default function SessionDebug() {
  const { data: session, status } = useSession()

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-sm max-w-sm z-50">
      <h4 className="font-bold mb-2">Session Debug</h4>
      <div>Status: {status}</div>
      <div>Role: {session?.user?.role || 'None'}</div>
      <div>Email: {session?.user?.email || 'None'}</div>
      <div>Name: {session?.user?.name || 'None'}</div>
      <div>ID: {session?.user?.id || 'None'}</div>
    </div>
  )
}