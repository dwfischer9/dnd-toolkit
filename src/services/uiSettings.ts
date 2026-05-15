import { StorageKeys } from '@/types/app';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from '@/locales';

export const UI_SETTINGS_STORAGE_KEY = StorageKeys.UiSettings;

export interface UiSettings {
  resultPopupAutoFade: boolean;
  resultPopupAutoFadeMs: number;
  locale: UiLocale;
}

export type UiLocale = SupportedLocale;

export const DEFAULT_UI_SETTINGS: UiSettings = {
  resultPopupAutoFade: true,
  resultPopupAutoFadeMs: 3000,
  locale: DEFAULT_LOCALE,
};

const clampFadeMs = (value: number) => Math.min(15000, Math.max(500, value));

export const normalizeUiSettings = (raw: Partial<UiSettings> | null | undefined): UiSettings => ({
  resultPopupAutoFade:
    typeof raw?.resultPopupAutoFade === 'boolean'
      ? raw.resultPopupAutoFade
      : DEFAULT_UI_SETTINGS.resultPopupAutoFade,
  resultPopupAutoFadeMs:
    typeof raw?.resultPopupAutoFadeMs === 'number' && Number.isFinite(raw.resultPopupAutoFadeMs)
      ? clampFadeMs(raw.resultPopupAutoFadeMs)
      : DEFAULT_UI_SETTINGS.resultPopupAutoFadeMs,
  locale:
    raw?.locale && SUPPORTED_LOCALES.includes(raw.locale as SupportedLocale)
      ? (raw.locale as SupportedLocale)
      : DEFAULT_UI_SETTINGS.locale,
});

export const loadUiSettingsFromStorage = (): UiSettings => {
  if (typeof window === 'undefined') {
    return DEFAULT_UI_SETTINGS;
  }

  try {
    const rawSettings = window.localStorage.getItem(UI_SETTINGS_STORAGE_KEY);
    if (!rawSettings) {
      return DEFAULT_UI_SETTINGS;
    }

    return normalizeUiSettings(JSON.parse(rawSettings) as Partial<UiSettings>);
  } catch {
    return DEFAULT_UI_SETTINGS;
  }
};

export const saveUiSettingsToStorage = (settings: UiSettings) => {
  if (typeof window === 'undefined') {
    return;
  }

  const normalizedSettings = normalizeUiSettings(settings);
  window.localStorage.setItem(UI_SETTINGS_STORAGE_KEY, JSON.stringify(normalizedSettings));
};
