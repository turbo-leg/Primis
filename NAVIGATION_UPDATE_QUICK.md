// Navigation Update: Add Calendar Link for Students
// 
// Current Navigation Structure:
// - Dashboard
// - Courses  
// - Chat
//
// Updated Navigation Structure:
// - Dashboard
// - Courses
// - Calendar  ← Add this
// - Chat

// Step 1: Add CalendarDaysIcon import
// Add this to your existing heroicons import:
// import { CalendarDaysIcon } from '@heroicons/react/24/outline'

// Step 2: Add Calendar navigation link
// Insert this between Courses and Chat:

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

// Step 3: For mobile navigation (if exists)
// Add the same link structure to mobile navigation menu

// Expected Result:
// Students will see:
// - Dashboard
// - Courses  
// - Calendar ← New addition
// - Chat

// The Calendar link will:
// - Navigate to /calendar page
// - Show active state when user is on calendar page
// - Use CalendarDaysIcon for visual consistency
// - Match existing navigation styling