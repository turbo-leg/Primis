// Complete Navigation Component with Calendar Link
// Copy this and replace your existing navigation section

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'

export function StudentNavigation() {
  const pathname = usePathname()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Courses', href: '/courses', icon: AcademicCapIcon },
    { name: 'Calendar', href: '/calendar', icon: CalendarDaysIcon },
    { name: 'Chat', href: '/chat', icon: ChatBubbleLeftRightIcon },
  ]

  return (
    <nav className="mt-5 px-2">
      {navigation.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
              isActive
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <Icon className="mr-4 h-6 w-6" />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}

// Alternative: If you need to update existing navigation directly
// Add this between your Courses and Chat links:

/*
<Link
  href="/calendar"
  className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
    pathname === '/calendar'
      ? 'bg-gray-900 text-white'
      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
  }`}
>
  <CalendarDaysIcon className="mr-4 h-6 w-6" />
  Calendar
</Link>
*/