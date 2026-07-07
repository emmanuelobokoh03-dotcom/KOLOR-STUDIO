import { useState, useEffect, useCallback } from 'react'
import { settingsApi, UserSettings } from '../services/api'

interface Currency {
  code: string
  name: string
  symbol: string
}

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>([])
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
        // Handle both response shapes: { settings, availableCurrencies } or raw UserSettings
        if (res && typeof res === 'object' && 'settings' in res) {
          setSettings(res.settings)
          setAvailableCurrencies(res.availableCurrencies || [])
        } else {
          setSettings(res)
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
      const nextSettings = res && typeof res === 'object' && 'settings' in res ? res.settings : res
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
