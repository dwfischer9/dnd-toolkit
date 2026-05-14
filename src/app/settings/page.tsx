'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useLocale } from '@/app/LocaleProvider'
import {
  DEFAULT_UI_SETTINGS,
  loadUiSettingsFromStorage,
  saveUiSettingsToStorage,
} from '@/services/uiSettings'
import { LOCALE_LABELS, SUPPORTED_LOCALES } from '@/locales'

export default function SettingsPage() {
  const { locale, setLocale, app } = useLocale()
  const [settings, setSettings] = useState(DEFAULT_UI_SETTINGS)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSettings(loadUiSettingsFromStorage())
  }, [])

  const saveSettings = () => {
    saveUiSettingsToStorage(settings)
    setLocale(settings.locale)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  return (
    <main className="min-h-screen px-6 py-10 text-white md:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{app.Preferences}</p>
            <h1 className="mt-2 text-4xl font-semibold">{app.Settings}</h1>
          </div>
          <Link
            href="/combat"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10"
          >
            {app.BackToCombat}
          </Link>
        </div>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">{app.ToggleAutoFade}</h2>
              <p className="mt-1 text-sm text-slate-400">{app.SettingsSubtitle}</p>
            </div>
            {saved && (
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
                {app.SettingsSaved}
              </span>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm">
              <span>
                <span className="block font-medium text-white">{app.LocaleLabel}</span>
                <span className="mt-1 block text-slate-400">{app.LocaleLabelBody}</span>
              </span>
              <select
                value={settings.locale}
                onChange={(event) =>
                  setSettings((previous) => ({
                    ...previous,
                    locale: event.target.value as typeof locale,
                  }))
                }
                className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-cyan-400/70"
              >
                {SUPPORTED_LOCALES.map((supportedLocale) => (
                  <option key={supportedLocale} value={supportedLocale}>
                    {LOCALE_LABELS[supportedLocale]}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm">
              <span>
                <span className="block font-medium text-white">{app.ToggleAutoFade}</span>
                <span className="mt-1 block text-slate-400">{app.ToggleAutoFadeBody}</span>
              </span>
              <input
                type="checkbox"
                checked={settings.resultPopupAutoFade}
                onChange={(event) =>
                  setSettings((previous) => ({
                    ...previous,
                    resultPopupAutoFade: event.target.checked,
                  }))
                }
                className="h-5 w-5 rounded border-white/20 bg-white/10"
              />
            </label>

            <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm">
              <span>
                <span className="block font-medium text-white">{app.ToggleAutoFadeDelay}</span>
                <span className="mt-1 block text-slate-400">{app.ToggleAutoFadeDelayBody}</span>
              </span>
              <input
                type="number"
                min={500}
                max={15000}
                step={100}
                value={settings.resultPopupAutoFadeMs}
                onChange={(event) =>
                  setSettings((previous) => ({
                    ...previous,
                    resultPopupAutoFadeMs: Math.min(15000, Math.max(500, Number(event.target.value) || 3000)),
                  }))
                }
                className="h-11 w-32 rounded-xl border border-white/10 bg-white/5 px-3 text-right text-sm text-white outline-none focus:border-cyan-400/70"
              />
            </label>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={saveSettings}
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100"
            >
              {app.SaveSettings}
            </button>
            <p className="text-sm text-slate-400">{app.SettingsStorageBody}</p>
          </div>
        </section>
      </div>
    </main>
  )
}
