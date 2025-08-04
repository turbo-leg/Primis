# Navigation Update Instructions

## 🎯 **Add Calendar Link to Student Navigation**

### **Required Changes:**

1. **Main Navigation (Desktop)**
   - Location: Usually in `navbar.tsx` or `navigation.tsx`
   - Add Calendar link between Schedule and Assignments
   - Apply consistent styling and hover states

2. **Mobile Navigation**
   - Location: Mobile menu in same navigation component
   - Add Calendar link with same positioning
   - Ensure responsive design works properly

3. **Navigation Code Example:**

```tsx
{session?.user?.role === 'STUDENT' && (
  <>
    <Link href="/courses" className="nav-link-styles">
      Courses
    </Link>
    <Link href="/schedule" className="nav-link-styles">
      Schedule
    </Link>
    <Link href="/calendar" className="nav-link-styles">
      Calendar
    </Link>
    <Link href="/assignments" className="nav-link-styles">
      Assignments
    </Link>
  </>
)}
```

### **Files to Update:**

1. **`/src/components/ui/navbar.tsx`** - Main navigation bar
2. **`/src/components/ui/navigation.tsx`** - Alternative navigation component
3. **Any layout files** that contain navigation menus

### **Styling Requirements:**

- **Consistent with existing links** (same classes, hover states)
- **Active state highlighting** when on calendar page
- **Responsive design** for mobile devices
- **Role-based access** (only show for students)

### **Testing:**

1. **Desktop Navigation** - Verify Calendar link appears between Schedule and Assignments
2. **Mobile Navigation** - Ensure Calendar link works in mobile menu
3. **Active States** - Calendar link should highlight when on `/calendar` page
4. **Access Control** - Only students should see the Calendar link

### **Icon Usage:**

If using icons, use `CalendarDaysIcon` from Heroicons:

```tsx
import { CalendarDaysIcon } from '@heroicons/react/24/outline'

<CalendarDaysIcon className="h-5 w-5" />
```

## 📱 **Expected Result:**

Students will see navigation in this order:
- Dashboard
- Courses  
- Schedule
- **Calendar** ← New addition
- Assignments
- Notifications (if exists)

The Calendar link will navigate to `/calendar` and show the new calendar page we created.