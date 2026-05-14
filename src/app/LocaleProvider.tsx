'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { loadUiSettingsFromStorage } from '@/services/uiSettings'
import { DEFAULT_LOCALE, getAppUiText, getCombatUiText, type SupportedLocale } from '@/locales'

type LocaleContextValue = {
  locale: SupportedLocale
  setLocale: (locale: SupportedLocale) => void
  app: ReturnType<typeof getAppUiText>
  t: ReturnType<typeof getCombatUiText>
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export default function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<SupportedLocale>(DEFAULT_LOCALE)

  useEffect(() => {
    const settings = loadUiSettingsFromStorage()
    setLocale(settings.locale ?? DEFAULT_LOCALE)
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== null) {
        const settings = loadUiSettingsFromStorage()
        setLocale(settings.locale ?? DEFAULT_LOCALE)
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      app: getAppUiText(locale),
      t: getCombatUiText(locale),
    }),
    [locale]
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export const useLocale = () => {
  const context = useContext(LocaleContext)
  if (!context) {
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      app: getAppUiText(DEFAULT_LOCALE),
      t: getCombatUiText(DEFAULT_LOCALE),
    }
  }

  return context
}
