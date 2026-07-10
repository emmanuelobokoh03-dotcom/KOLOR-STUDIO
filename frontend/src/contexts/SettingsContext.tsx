import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { settingsApi, UserSettings, CurrencyOption } from '../services/api'

interface SettingsContextValue {
  settings: UserSettings | null
  availableCurrencies: CurrencyOption[]
  loading: boolean
  saving: boolean
  saved: boolean
  error: string | null
  save: (updates: Partial<UserSettings>) => Promise<UserSettings | undefined>
  refetch: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: null,
  availableCurrencies: [],
  loading: true,
  saving: false,
  saved: false,
  error: null,
  save: async () => undefined,
  refetch: async () => {},
})

interface SettingsProviderProps {
  children: ReactNode
}

/**
 * SettingsProvider (iter 260).
 *
 * Wraps SettingsModal and pages/Settings so tab components share ONE
 * fetch instead of 3. Previously each tab (MoneyTab, NotificationsTab,
 * UserContactInfo) instantiated its own useUserSettings hook.
 *
 * Response unwrap logic matches iter 259 hotfix: request<T>() returns
 * { data, error, message }, so payload lives at res.data.
 */
export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyOption[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [saved, setSaved] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res: any = await settingsApi.get()
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
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const save = useCallback(
    async (updates: Partial<UserSettings>) => {
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
    },
    [],
  )

  return (
    <SettingsContext.Provider
      value={{
        settings,
        availableCurrencies,
        loading,
        saving,
        saved,
        error,
        save,
        refetch: fetchSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

/**
 * useSettings — hook consumers call to read + save settings. Same
 * interface as the old useUserSettings for drop-in migration.
 */
export function useSettings() {
  return useContext(SettingsContext)
}
