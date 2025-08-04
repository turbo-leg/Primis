// Calendar Navigation Update
// This file contains the updated navigation structure with Calendar link for students

export const StudentNavigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: 'HomeIcon'
  },
  {
    name: 'Courses',
    href: '/courses',
    icon: 'AcademicCapIcon'
  },
  {
    name: 'Schedule',
    href: '/schedule',
    icon: 'CalendarIcon'
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: 'CalendarDaysIcon'
  },
  {
    name: 'Assignments',
    href: '/assignments',
    icon: 'DocumentTextIcon'
  },
  {
    name: 'Notifications',
    href: '/notifications',
    icon: 'BellIcon'
  }
]

// Navigation component should include:
// - Calendar link for students between Schedule and Assignments
// - Proper active state styling
// - Responsive design for mobile
// - Role-based access control