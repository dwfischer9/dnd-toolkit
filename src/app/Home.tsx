'use client';

import Link from 'next/link';
import { useLocale } from '@/app/LocaleProvider';

export default function Home() {
  const { app } = useLocale();

  const highlights = [
    {
      title: app.CombatFirst,
      body: app.CombatFirstBody,
    },
    {
      title: app.CreatureSearch,
      body: app.CreatureSearchBody,
    },
    {
      title: app.StatefulTitle,
      body: app.LocalStorageBody,
    },
  ];

  const metrics = [
    { label: app.InitiativeTracker, value: app.InitiativeTrackerValue },
    { label: app.CreatureSearch, value: app.StateValue },
    { label: app.EncounterMath, value: app.EncounterMathValue },
  ];

  return (
    <main className="min-h-screen px-6 py-10 text-white md:px-10 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.75)]" />
            {app.DungeonMasterTools}
          </div>
          <Link
            href="/combat"
            className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/15 hover:text-white"
          >
            {app.OpenCombat}
          </Link>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">{app.AppName}</p>
              <h1 className="mt-4 text-5xl font-semibold leading-tight text-white md:text-6xl">
                {app.HomeHeroTitle}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">{app.HomeHeroBody}</p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/combat"
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:translate-y-[-1px] hover:bg-cyan-100"
              >
                {app.EnterCombat}
              </Link>
              <Link
                href="/settings"
                className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
              >
                {app.Settings}
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                >
                  <div className="text-xs uppercase tracking-[0.28em] text-slate-400">
                    {metric.label}
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-white">{metric.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/40 p-6">
              <div className="text-sm uppercase tracking-[0.3em] text-slate-400">
                {app.WhatIsInside}
              </div>
              <div className="mt-5 grid gap-3">
                {highlights.map((item, index) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-sm font-semibold text-cyan-200">
                        0{index + 1}
                      </div>
                      <div className="text-lg font-medium text-white">{item.title}</div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-400/15 bg-amber-400/[0.08] p-6">
              <div className="text-sm uppercase tracking-[0.3em] text-amber-100/70">
                {app.QuickStart}
              </div>
              <ol className="mt-4 space-y-3 text-sm leading-6 text-amber-50/90">
                <li>{app.QuickStartStep1}</li>
                <li>{app.QuickStartStep2}</li>
                <li>{app.QuickStartStep3}</li>
              </ol>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
