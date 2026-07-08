import { useState, useEffect, useCallback } from 'react'
import { settingsApi, UserSettings, CurrencyOption } from '../services/api'

/**
 * Shared settings hook.
 *
 * request<T>() in services/api.ts returns { data: T, error?, message? }.
 * We unwrap `res.data` before consuming.
 */
export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyOption[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [saved, setSaved] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    settingsApi
      .get()
      .then((res: any) => {
        if (cancelled) return
        const payload = res?.data
        if (!payload) {
          setError(res?.error || 'Failed to load settings')
          return
        }
        if ('settings' in payload) {
          setSettings(payload.settings)
          setAvailableCurrencies(payload.availableCurrencies || [])
        } else {
          setSettings(payload)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const save = useCallback(async (updates: Partial<UserSettings>) => {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const res: any = await settingsApi.update(updates)
      const payload = res?.data
      if (!payload) {
        throw new Error(res?.error || 'Save failed')
      }
      const nextSettings = 'settings' in payload ? payload.settings : payload
      setSettings(nextSettings)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      return nextSettings
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      throw err
    } finally {
      setSaving(false)
    }
  }, [])

  return { settings, availableCurrencies, loading, saving, saved, error, save }
}
