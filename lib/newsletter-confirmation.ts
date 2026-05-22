import { createHash, randomBytes } from 'node:crypto'

export const NEWSLETTER_CONFIRMATION_DAYS = 7

export function createNewsletterConfirmationToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashNewsletterConfirmationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function newsletterConfirmationExpiresAt(now = new Date()): string {
  const expires = new Date(now)
  expires.setDate(expires.getDate() + NEWSLETTER_CONFIRMATION_DAYS)
  return expires.toISOString()
}

export function newsletterConfirmationUrl(requestUrl: string, token: string): string {
  const url = new URL('/api/newsletter/confirm', requestUrl)
  url.searchParams.set('token', token)
  return url.toString()
}
