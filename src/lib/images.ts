/**
 * Utility function to handle profile image URLs
 * Ensures images work correctly in both development and production
 */
export function getProfileImageUrl(imageUrl?: string): string | undefined {
  if (!imageUrl) return undefined

  // If it's already a full URL (Cloudinary, etc.), return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  // If it's a relative URL starting with /uploads and we're in production,
  // it won't work on Vercel, so return undefined to show fallback
  if (imageUrl.startsWith('/uploads/') && (process.env.NODE_ENV === 'production' || process.env.VERCEL)) {
    console.warn('Local upload detected in production environment:', imageUrl)
    return undefined
  }

  // For relative URLs in development, return as-is
  return imageUrl
}

/**
 * Check if profile images are properly configured for the current environment
 */
export function isImageUploadConfigured(): boolean {
  // In development, local storage is OK
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  // In production, we need Cloudinary
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}
