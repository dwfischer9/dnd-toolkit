import type { UiLocale } from '@/services/uiSettings'
import { AppText as enAppText } from './en'
import { CombatUiText as enCombatUiText } from './en'
import { AppText as esAppText } from './es'
import { CombatUiText as frCombatUiText } from './fr'
import { AppText as frAppText } from './fr'
import { CombatUiText as esCombatUiText } from './es'

export const SUPPORTED_LOCALES = ['en', 'es', 'fr'] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export type CombatUiTextMap = Readonly<Record<string, string>>
export type AppUiTextMap = Readonly<Record<string, string>>

export const DEFAULT_LOCALE: SupportedLocale = 'en'

export const COMBAT_UI_TEXT_BY_LOCALE = {
  en: enCombatUiText,
  es: esCombatUiText,
  fr: frCombatUiText,
} as const satisfies Record<SupportedLocale, CombatUiTextMap>

export const APP_UI_TEXT_BY_LOCALE = {
  en: enAppText,
  es: esAppText,
  fr: frAppText,
} as const satisfies Record<SupportedLocale, AppUiTextMap>

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
}

export const getCombatUiText = (locale: UiLocale | null | undefined) =>
  COMBAT_UI_TEXT_BY_LOCALE[
    (locale && SUPPORTED_LOCALES.includes(locale as SupportedLocale)
      ? locale
      : DEFAULT_LOCALE) as SupportedLocale
  ]

export const getAppUiText = (locale: UiLocale | null | undefined) =>
  APP_UI_TEXT_BY_LOCALE[
    (locale && SUPPORTED_LOCALES.includes(locale as SupportedLocale)
      ? locale
      : DEFAULT_LOCALE) as SupportedLocale
  ]
