import { useState, useCallback, useEffect } from 'react'

const TOKEN_KEY = 'tj_owner_token'
const REVIEWER_KEY = 'tj_reviewer_token'

export function getOwnerSession() {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    return raw
  } catch { return null }
}

export function getReviewerSession() {
  try {
    const raw = sessionStorage.getItem(REVIEWER_KEY)
    if (!raw) return null
    return raw
  } catch { return null }
}

export function setOwnerSession(token) {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function setReviewerSession(token) {
  sessionStorage.setItem(REVIEWER_KEY, token)
}

export function clearOwnerSession() {
  sessionStorage.removeItem(TOKEN_KEY)
}

export function clearReviewerSession() {
  sessionStorage.removeItem(REVIEWER_KEY)
}

export const PROTECTED_PAGES = ['add', 'settings']
export const PUBLIC_PAGES = ['dashboard', 'history']

export function isProtectedPage(page) {
  return PROTECTED_PAGES.includes(page)
}

export function useAuth() {
  const [isOwner, setIsOwner] = useState(() => !!getOwnerSession())
  const [isReviewer, setIsReviewer] = useState(() => !!getReviewerSession())

  useEffect(() => {
    // ── ตรวจสอบลิ้งก์ตรวจพอร์ตอัจฉริยะ ( traling.app/history?review=xxxxxxx ) ──
    const params = new URLSearchParams(window.location.search)
    const reviewToken = params.get('review')
    
    if (reviewToken) {
      setReviewerSession(reviewToken)
      setIsReviewer(true)
      
      // ปัดกวาดแถบลลิ้งก์ URL ด้านบนให้คลีนสวยงามไร้รอยค้างของพารามิเตอร์ทันที
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    const interval = setInterval(() => {
      setIsOwner(!!getOwnerSession())
      setIsReviewer(!!getReviewerSession())
    }, 15_000)
    
    return () => clearInterval(interval)
  }, [])

  const unlock = useCallback((token) => {
    setOwnerSession(token)
    setIsOwner(true)
  }, [])

  const lock = useCallback(() => {
    clearOwnerSession()
    clearReviewerSession()
    setIsOwner(false)
    setIsReviewer(false)
  }, [])

  return { isOwner, isReviewer, unlock, lock }
}