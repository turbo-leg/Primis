/**
 * Utility functions for handling Mongolia timezone (Asia/Ulaanbaatar) operations
 */

export const MONGOLIA_TIMEZONE = 'Asia/Ulaanbaatar'

/**
 * Get current date and time in Mongolia timezone
 */
export function getCurrentMongoliaTime(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: MONGOLIA_TIMEZONE }))
}

/**
 * Convert a date to Mongolia timezone
 */
export function toMongoliaTime(date: Date): Date {
  return new Date(date.toLocaleString("en-US", { timeZone: MONGOLIA_TIMEZONE }))
}

/**
 * Format a date in Mongolia timezone
 */
export function formatMongoliaDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: MONGOLIA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }
  
  return date.toLocaleString('en-US', { ...defaultOptions, ...options })
}

/**
 * Format a date for Mongolia timezone display
 */
export function formatMongoliaDateShort(date: Date): string {
  return date.toLocaleString('en-US', {
    timeZone: MONGOLIA_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Format time only in Mongolia timezone
 */
export function formatMongoliaTime(date: Date): string {
  return date.toLocaleString('en-US', {
    timeZone: MONGOLIA_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Get the start of day in Mongolia timezone
 */
export function getStartOfDayMongolia(date: Date): Date {
  const mongoliaDate = toMongoliaTime(date)
  mongoliaDate.setHours(0, 0, 0, 0)
  return mongoliaDate
}

/**
 * Get the end of day in Mongolia timezone
 */
export function getEndOfDayMongolia(date: Date): Date {
  const mongoliaDate = toMongoliaTime(date)
  mongoliaDate.setHours(23, 59, 59, 999)
  return mongoliaDate
}

/**
 * Check if a date is today in Mongolia timezone
 */
export function isTodayMongolia(date: Date): boolean {
  const today = getCurrentMongoliaTime()
  const checkDate = toMongoliaTime(date)
  
  return today.toDateString() === checkDate.toDateString()
}

/**
 * Get Mongolia timezone offset string
 */
export function getMongoliaTimezoneOffset(): string {
  const now = new Date()
  const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000))
  const mongoliaTime = new Date(utc.getTime() + (8 * 3600000)) // UTC+8
  
  return '+08:00'
}
