// ── usePIN v2 — ผสานกับ useAuth ─────────────────────────────────
// เมื่อ verify PIN สำเร็จ → unlock owner session อัตโนมัติ

import { useState, useCallback } from 'react'
import { verifyPin } from '../lib/api'
import { getOwnerSession, setOwnerSession } from './useAuth'

export function usePIN(onUnlock) {
  const [pinModal, setPinModal] = useState(false)
  const [pinCb,    setPinCb]    = useState(null)

  const requirePin = useCallback((cb) => {
    // ถ้ามี session อยู่แล้ว ใช้ cached PIN ทันที
    const cached = getOwnerSession()
    if (cached) { cb(cached); return }
    setPinCb(() => cb)
    setPinModal(true)
  }, [])

  const onPinConfirmed = useCallback(async (pin) => {
    try {
      const ok = await verifyPin(pin)
      if (!ok) return false
      // บันทึก session + แจ้ง useAuth
      setOwnerSession(pin)
      if (onUnlock) onUnlock(pin)
      setPinModal(false)
      if (pinCb) pinCb(pin)
      return true
    } catch (err) {
      // Rate limit หรือ network error
      console.error('PIN verify error:', err)
      return false
    }
  }, [pinCb, onUnlock])

  const closeModal = useCallback(() => {
    setPinModal(false)
    setPinCb(null)
  }, [])

  return { pinModal, requirePin, onPinConfirmed, closeModal }
}