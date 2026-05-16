'use client';

import Link from 'next/link';
import { useLocale } from '@/app/LocaleProvider';

export default function Home() {
  const { app } = useLocale();

  const encounterPillars = [
    {
      title: app.CombatFirst,
      body: app.CombatFirstBody,
      sigil: 'I',
    },
    {
      title: app.CreatureSearch,
      body: app.CreatureSearchBody,
      sigil: 'II',
    },
    {
      title: app.StatefulTitle,
      body: app.LocalStorageBody,
      sigil: 'III',
    },
  ];

  const metrics = [
    { label: app.InitiativeTracker, value: app.InitiativeTrackerValue },
    { label: app.CreatureSearch, value: app.StateValue },
    { label: app.EncounterMath, value: app.EncounterMathValue },
  ];

  return (
    <main className="encounter-home min-h-screen px-4 py-6 sm:px-6 sm:py-8 lg:px-12 lg:py-10">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1.18fr_0.82fr]">
        <section className="war-table-panel relative overflow-hidden rounded-[2rem] border border-amber-200/20 p-6 sm:p-8 lg:p-10">
          <div className="initiative-track" aria-hidden="true" />

          <header className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-100/30 bg-stone-900/60 px-4 py-2 text-xs uppercase tracking-[0.24em] text-amber-100/90">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.75)]" />
              {app.DungeonMasterTools}
            </div>
            <Link
              href="/settings"
              className="rounded-full border border-stone-200/20 bg-stone-900/55 px-4 py-2 text-sm font-medium text-stone-100 transition hover:border-stone-100/40 hover:bg-stone-900/80"
            >
              {app.Settings}
            </Link>
          </header>

          <div className="relative z-10 mt-8 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.38em] text-amber-200/80">{app.AppName}</p>
            <h1 className="mt-4 text-balance font-['Iowan_Old_Style',_'Palatino_Linotype',_Palatino,_serif] text-4xl leading-[1.05] text-amber-50 sm:text-5xl lg:text-7xl">
              Run sharp encounters without losing table momentum.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-stone-200 sm:text-lg sm:leading-8">
              {app.HomeHeroBody}
            </p>
          </div>

          <div className="relative z-10 mt-8 flex flex-wrap gap-3">
            <Link
              href="/combat"
              className="rounded-full border border-amber-100/40 bg-amber-100 px-6 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-stone-950 transition hover:-translate-y-0.5 hover:bg-amber-50"
            >
              {app.EnterCombat}
            </Link>
            <Link
              href="/combat"
              className="rounded-full border border-amber-100/30 bg-transparent px-6 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-amber-50 transition hover:border-amber-100/60 hover:bg-amber-50/10"
            >
              {app.OpenCombat}
            </Link>
          </div>

          <div className="relative z-10 mt-10 grid gap-3 sm:grid-cols-3">
            {metrics.map((metric) => (
              <article
                key={metric.label}
                className="rounded-2xl border border-amber-100/15 bg-stone-900/60 p-4 backdrop-blur-sm"
              >
                <p className="text-[11px] uppercase tracking-[0.26em] text-stone-300">{metric.label}</p>
                <p className="mt-2 text-2xl font-semibold text-amber-50">{metric.value}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[1.8rem] border border-stone-100/12 bg-stone-900/65 p-5 sm:p-6">
            <h2 className="text-sm uppercase tracking-[0.27em] text-stone-300">{app.WhatIsInside}</h2>
            <div className="mt-4 space-y-3">
              {encounterPillars.map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-stone-100/12 bg-stone-950/55 p-4 transition hover:border-amber-200/25 hover:bg-stone-900/85"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-100/30 bg-amber-50/10 font-['Iowan_Old_Style',_'Palatino_Linotype',_Palatino,_serif] text-xs font-semibold tracking-[0.16em] text-amber-50">
                      {item.sigil}
                    </div>
                    <h3 className="text-base font-semibold text-stone-100">{item.title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-stone-300">{item.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-amber-100/20 bg-[linear-gradient(160deg,rgba(146,64,14,0.22),rgba(41,37,36,0.65))] p-5 sm:p-6">
            <h2 className="text-sm uppercase tracking-[0.27em] text-amber-100/85">{app.QuickStart}</h2>
            <ol className="mt-3 space-y-2 text-sm leading-6 text-amber-50/95">
              <li>{app.QuickStartStep1}</li>
              <li>{app.QuickStartStep2}</li>
              <li>{app.QuickStartStep3}</li>
            </ol>
          </section>
        </aside>
      </div>
    </main>
  );
}
