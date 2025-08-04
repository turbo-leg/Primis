# Database-Driven Course Schedule System

This system uses course data fields to generate dynamic schedules for enrolled users.

## Database Fields Used

### Course Table Fields
- **startDate**: When the course begins (Date)
- **duration**: Length of the course (Number)
- **durationUnit**: Unit of duration ('days', 'weeks', 'months', 'years')
- **schedule**: Day and time format string
- **location**: Where the course takes place

### Schedule Format
The `schedule` field uses this format:
```
"Monday,Wednesday,Friday 09:00-10:30"
"Tuesday,Thursday 11:00-12:30"
"Monday,Wednesday 14:00-15:30"
```

## How It Works

### 1. Course Duration Calculation
```typescript
courseEndDate = startDate + (duration * durationUnit)
```

### 2. Schedule Parsing
- Split by space: `["Monday,Wednesday,Friday", "09:00-10:30"]`
- Parse days: `["Monday", "Wednesday", "Friday"]` → `[1, 3, 5]`
- Parse time: `"09:00-10:30"` → `{startTime: "09:00", endTime: "10:30"}`

### 3. Event Generation
For each scheduled day:
1. Find first occurrence of that day after course start
2. Generate weekly recurring events until course end
3. Only include events within requested date range

### 4. User Filtering
- Only shows courses where user has ACTIVE enrollment
- Respects course start/end dates
- Includes assignment due dates

## API Response Format
```json
{
  "id": "course-123-1-2024-01-15",
  "title": "Advanced Mathematics",
  "courseTitle": "Advanced Mathematics", 
  "startTime": "09:00",
  "endTime": "10:30",
  "date": "2024-01-15",
  "instructor": "Dr. Smith",
  "type": "CLASS",
  "isEnrolled": true,
  "courseId": "123",
  "description": "Course description",
  "location": "Room 101",
  "color": "blue"
}
```

## Calendar Display
- **Blue events**: Class sessions
- **Red events**: Assignment due dates
- **Tooltips**: Full event details
- **Responsive**: Mobile-friendly grid

## Benefits
✅ **Database-driven**: No hardcoded schedules
✅ **User-specific**: Only enrolled courses
✅ **Dynamic**: Respects course durations
✅ **Flexible**: Supports various schedule patterns
✅ **Complete**: Includes assignments and classes