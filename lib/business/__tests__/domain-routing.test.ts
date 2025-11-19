import { describe, it, expect } from '@jest/globals'
import {
  shouldRestrictRoute,
  getBusinessRedirectPath,
  isAllowedOnCustomDomain
} from '../domain-routing'

describe('domain-routing', () => {
  describe('isAllowedOnCustomDomain', () => {
    it('allows /business routes', () => {
      expect(isAllowedOnCustomDomain('/business/dashboard')).toBe(true)
      expect(isAllowedOnCustomDomain('/business/login')).toBe(true)
      expect(isAllowedOnCustomDomain('/business/settings')).toBe(true)
    })

    it('allows /_next routes', () => {
      expect(isAllowedOnCustomDomain('/_next/static/chunk.js')).toBe(true)
    })

    it('allows /api/business routes', () => {
      expect(isAllowedOnCustomDomain('/api/business/profile')).toBe(true)
    })

    it('allows /favicon.ico', () => {
      expect(isAllowedOnCustomDomain('/favicon.ico')).toBe(true)
    })

    it('blocks frontend routes', () => {
      expect(isAllowedOnCustomDomain('/')).toBe(false)
      expect(isAllowedOnCustomDomain('/search')).toBe(false)
      expect(isAllowedOnCustomDomain('/booking')).toBe(false)
    })

    it('blocks admin routes', () => {
      expect(isAllowedOnCustomDomain('/admin')).toBe(false)
      expect(isAllowedOnCustomDomain('/admin/dashboard')).toBe(false)
    })

    it('blocks vendor routes', () => {
      expect(isAllowedOnCustomDomain('/vendor')).toBe(false)
      expect(isAllowedOnCustomDomain('/vendor/dashboard')).toBe(false)
    })

    it('blocks customer routes', () => {
      expect(isAllowedOnCustomDomain('/customer')).toBe(false)
      expect(isAllowedOnCustomDomain('/customer/bookings')).toBe(false)
    })

    it('blocks other API routes', () => {
      expect(isAllowedOnCustomDomain('/api/admin/users')).toBe(false)
    })
  })

  describe('getBusinessRedirectPath', () => {
    it('redirects authenticated users to dashboard', () => {
      expect(getBusinessRedirectPath(true)).toBe('/business/dashboard')
    })

    it('redirects unauthenticated users to login', () => {
      expect(getBusinessRedirectPath(false)).toBe('/business/login')
    })
  })

  describe('shouldRestrictRoute', () => {
    it('returns false for main domain', () => {
      expect(shouldRestrictRoute('yourdomain.com', 'yourdomain.com')).toBe(false)
    })

    it('returns false for localhost', () => {
      expect(shouldRestrictRoute('localhost:3001', 'yourdomain.com')).toBe(false)
    })

    it('returns true for subdomain', () => {
      expect(shouldRestrictRoute('acme.yourdomain.com', 'yourdomain.com')).toBe(true)
    })

    it('returns true for custom domain', () => {
      expect(shouldRestrictRoute('transfers.acmehotel.com', 'yourdomain.com')).toBe(true)
    })
  })
})
