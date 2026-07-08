import { useState, useCallback } from 'react'
import { verifyPin } from '../lib/api'
import { getOwnerSession, setOwnerSession } from './useAuth'

export function usePIN(onUnlock) {
  const [pinModal, setPinModal] = useState(false)
  const [pinCb,    setPinCb]    = useState(null)

  const requirePin = useCallback((cb) => {
    const cachedToken = getOwnerSession()
    if (cachedToken) { cb(cachedToken); return }
    setPinCb(() => cb)
    setPinModal(true)
  }, [])

  const onPinConfirmed = useCallback(async (pin) => {
    try {
      const res = await verifyPin(pin)
      if (!res?.success || !res?.token) return false
      
      // บันทึกเฉพาะโทเค็น UUID อายุสั้นแทนรหัส PIN
      setOwnerSession(res.token)
      if (onUnlock) onUnlock(res.token)
      setPinModal(false)
      if (pinCb) pinCb(res.token)
      return true
    } catch (err) {
      console.error('PIN verification pipeline failed:', err)
      return false
    }
  }, [pinCb, onUnlock])

  const closeModal = useCallback(() => {
    setPinModal(false)
    setPinCb(null)
  }, [])

  return { pinModal, requirePin, onPinConfirmed, closeModal }
}