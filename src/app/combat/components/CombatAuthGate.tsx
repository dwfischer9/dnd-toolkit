'use client'

import { useEffect, useState, type FormEvent } from 'react'
import CombatScreen from '../CombatScreen'
import { createAccount, loadCurrentUser, signIn, signOut, type AuthUser } from '@/services/auth'
import { AuthModes } from '@/types/app'
import type { AuthMode } from '@/types/app'
import { useLocale } from '@/app/LocaleProvider'

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong.')

export default function CombatAuthGate() {
  const { t } = useLocale()
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [mode, setMode] = useState<AuthMode>(AuthModes.SignIn)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setCurrentUser(loadCurrentUser())
    setHydrated(true)
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const nextUser =
        mode === AuthModes.Create
          ? await createAccount({
              displayName,
              email,
              password,
            })
          : await signIn({
              email,
              password,
            })

      setCurrentUser(nextUser)
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setSubmitting(false)
    }
  }

  const handleSignOut = () => {
    signOut()
    setCurrentUser(null)
    setPassword('')
    setError(null)
  }

  if (!hydrated) {
    return (
      <main className="grid h-[100dvh] place-items-center px-4 text-white">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] px-6 py-5 text-sm text-slate-200 shadow-2xl shadow-black/20 backdrop-blur">
          {t.LoadingCombatConsole}
        </div>
      </main>
    )
  }

  if (currentUser) {
    return <CombatScreen currentUser={currentUser} onSignOut={handleSignOut} />
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8 text-white">
      <section className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-2xl shadow-black/20 backdrop-blur md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">{t.AppTitle}</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              Sign in to run encounters.
            </h1>
          </div>
          <div className="rounded-full border border-white/10 bg-slate-950/50 px-3 py-1 text-xs text-slate-300">
            Local demo auth
          </div>
        </div>

        <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
          Accounts are stored in this browser for portfolio/demo use. Public music playlists
          and local audio can be managed after you sign in.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-slate-950/40 p-2">
          <button
            type="button"
            onClick={() => setMode(AuthModes.SignIn)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
              mode === AuthModes.SignIn
                ? 'bg-white text-slate-950'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode(AuthModes.Create)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
              mode === AuthModes.Create
                ? 'bg-white text-slate-950'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {mode === AuthModes.Create && (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">Display name</span>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Dungeon Master"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none transition focus:border-cyan-400/60"
              />
            </label>
          )}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none transition focus:border-cyan-400/60"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none transition focus:border-cyan-400/60"
            />
          </label>

          {error && (
            <div className="rounded-2xl border border-red-400/20 bg-red-950/40 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? 'Working...'
              : mode === AuthModes.Create
                ? 'Create and Continue'
                : 'Sign In'}
          </button>
        </form>
      </section>
    </main>
  )
}
