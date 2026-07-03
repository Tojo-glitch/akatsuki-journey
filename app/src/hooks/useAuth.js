// ── useAuth — Phase 2A Route Guard ──────────────────────────────
// จัดการ "owner session" แยกจาก PIN modal
// Owner = คนที่ unlock ด้วย PIN แล้ว (15 นาที)
// Public = ทุกคนที่เปิดเว็บ (อ่านได้อย่างเดียว)

import { useState, useCallback, useEffect } from 'react'

const SESSION_KEY = 'tj_owner_session'
const TTL = 15 * 60 * 1000 // 15 นาที

export function getOwnerSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const { pin, expires } = JSON.parse(raw)
    if (Date.now() > expires) {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }
    return pin
  } catch { return null }
}

export function setOwnerSession(pin) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    pin,
    expires: Date.now() + TTL,
  }))
}

export function clearOwnerSession() {
  sessionStorage.removeItem(SESSION_KEY)
}

// หน้าที่ต้องเป็น owner ถึงเข้าได้
export const PROTECTED_PAGES = ['add', 'settings']

// หน้าที่ทุกคนเข้าได้
export const PUBLIC_PAGES = ['dashboard', 'history', 'calendar', 'public']

export function isProtectedPage(page) {
  return PROTECTED_PAGES.includes(page)
}

export function useAuth() {
  const [isOwner, setIsOwner] = useState(() => !!getOwnerSession())

  // Re-check ทุก 30 วินาที (กรณี session หมดอายุระหว่างใช้งาน)
  useEffect(() => {
    const interval = setInterval(() => {
      const has = !!getOwnerSession()
      setIsOwner(prev => prev !== has ? has : prev)
    }, 30_000)
    return () => clearInterval(interval)
  }, [])

  const unlock = useCallback((pin) => {
    setOwnerSession(pin)
    setIsOwner(true)
  }, [])

  const lock = useCallback(() => {
    clearOwnerSession()
    setIsOwner(false)
  }, [])

  return { isOwner, unlock, lock }
}