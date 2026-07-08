import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'

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
  const [isReviewer, setIsReviewer] = useState(false) // เริ่มต้นเป็นเท็จเสมอเพื่อป้องกันการปลอมสิทธิ์หน้าเว็บ

  const verifyReviewerTokenOnServer = async (token) => {
    try {
      const { data, error } = await supabase.rpc('check_reviewer_auth', { p_token: token })
      if (!error && data?.success) {
        setReviewerSession(token)
        setIsReviewer(true)
      } else {
        // หากทอเคนเป็นโมฆะ ทำการเคลียร์สิทธิ์ผู้ตรวจทิ้งทันที
        clearReviewerSession()
        setIsReviewer(false)
      }
    } catch {
      setIsReviewer(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const reviewToken = params.get('review')
    const cachedToken = getReviewerSession()
    
    if (reviewToken) {
      // 🌟 อุดช่องโหว่: บังคับยิงไปถามสิทธิ์ที่ฐานข้อมูลจริงเสมอ ห้ามเชื่อ URL ลอยๆ
      verifyReviewerTokenOnServer(reviewToken)
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (cachedToken) {
      verifyReviewerTokenOnServer(cachedToken)
    }

    const interval = setInterval(() => {
      setIsOwner(!!getOwnerSession())
      const activeReviewer = getReviewerSession()
      if (activeReviewer) {
        verifyReviewerTokenOnServer(activeReviewer)
      } else {
        setIsReviewer(false)
      }
    }, 20_000)
    
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