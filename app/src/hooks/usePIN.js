import { useState, useCallback } from 'react'
import { verifyPin } from '../lib/api'

const KEY = 'tj_pin_session'
const TTL = 15 * 60 * 1000 // 15 minutes

function getSession() {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const { pin, expires } = JSON.parse(raw)
    if (Date.now() > expires) { sessionStorage.removeItem(KEY); return null }
    return pin
  } catch { return null }
}

function setSession(pin) {
  sessionStorage.setItem(KEY, JSON.stringify({ pin, expires: Date.now() + TTL }))
}

export function usePIN() {
  const [pinModal, setPinModal] = useState(false)
  const [pinCb, setPinCb] = useState(null)

  const requirePin = useCallback((cb) => {
    const cached = getSession()
    if (cached) { cb(cached); return }
    setPinCb(() => cb)
    setPinModal(true)
  }, [])

  const onPinConfirmed = useCallback(async (pin) => {
    const ok = await verifyPin(pin)
    if (!ok) return false
    setSession(pin)
    setPinModal(false)
    if (pinCb) pinCb(pin)
    return true
  }, [pinCb])

  const closeModal = useCallback(() => {
    setPinModal(false)
    setPinCb(null)
  }, [])

  return { pinModal, requirePin, onPinConfirmed, closeModal }
}