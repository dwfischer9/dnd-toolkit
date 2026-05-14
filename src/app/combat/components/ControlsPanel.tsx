'use client'

import MusicPanel from './MusicPanel'
import { useLocale } from '@/app/LocaleProvider'

interface ControlsPanelProps {
  round: number
  turn: number
  activeCreatureName: string
  onEndCombat?: () => void
  onRollInitiative?: () => void
  onNextTurn?: () => void
  onPreviousTurn?: () => void
  onAddPc?: () => void
  missingPlayerInitiatives?: number
  canRollInitiative?: boolean
  compact?: boolean
}

export default function ControlsPanel({
  round,
  turn,
  activeCreatureName,
  onEndCombat,
  onRollInitiative,
  onNextTurn,
  onPreviousTurn,
  onAddPc,
  missingPlayerInitiatives = 0,
  canRollInitiative = true,
  compact = false,
}: ControlsPanelProps) {
  const { t } = useLocale()
  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <h2 className={compact ? 'text-base font-bold' : 'text-xl font-bold'}>{t.CombatControls}</h2>

      <div className={`rounded-2xl border border-white/10 bg-slate-950/50 ${compact ? 'space-y-2 p-3' : 'space-y-3 p-4'}`}>
        <h3 className={compact ? 'text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200/80' : 'text-sm font-semibold uppercase tracking-[0.25em] text-cyan-200/80'}>
          {t.QuickActions}
        </h3>
        <div className={compact ? 'grid grid-cols-1 gap-1.5' : 'space-y-2'}>
          <button
            type="button"
            onClick={onEndCombat}
            className={`w-full rounded-xl bg-red-600 text-white hover:bg-red-500 ${
              compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2'
            }`}
          >
            {t.EndCombat}
          </button>
          <button
            type="button"
            disabled={!canRollInitiative}
            onClick={onRollInitiative}
            className={`w-full rounded-xl bg-yellow-600 font-semibold text-black hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50 ${
              compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2'
            }`}
          >
            {t.RollInitiative}
          </button>
          <button
            type="button"
            onClick={onAddPc}
            className={`w-full rounded-xl bg-green-600 text-white hover:bg-green-500 ${
              compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2'
            }`}
          >
            {t.AddPc}
          </button>
        </div>
      </div>

      {(onPreviousTurn || onNextTurn) && (
        <div className={`rounded-2xl border border-white/10 bg-slate-950/50 ${compact ? 'space-y-2 p-3' : 'space-y-3 p-4'}`}>
          <h3 className={compact ? 'text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200/80' : 'text-sm font-semibold uppercase tracking-[0.25em] text-cyan-200/80'}>
            {t.TurnNavigation}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onPreviousTurn}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 transition hover:bg-white/10"
            >
              {t.PrevTurn}
            </button>
            <button
              type="button"
              onClick={onNextTurn}
              className="rounded-xl border border-yellow-500/30 bg-yellow-500/15 px-3 py-2 text-sm font-semibold text-yellow-100 transition hover:bg-yellow-500/20"
            >
              {t.NextTurn}
            </button>
          </div>
        </div>
      )}

      <div className={`rounded-2xl border border-white/10 bg-slate-950/50 ${compact ? 'space-y-2 p-3' : 'space-y-3 p-4'}`}>
        <h3 className={compact ? 'text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200/80' : 'text-sm font-semibold uppercase tracking-[0.25em] text-cyan-200/80'}>
          {t.CombatStatus}
        </h3>
        <div className={`${compact ? 'space-y-1 text-xs' : 'space-y-2 text-sm'} text-slate-200`}>
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">{t.Round}</span>
            <span className="font-semibold">{round}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">{t.Turn}</span>
            <span className="font-semibold">{turn}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">{t.Active}</span>
            <span className="max-w-[11rem] truncate font-semibold text-yellow-300">{activeCreatureName}</span>
          </div>
          {missingPlayerInitiatives > 0 && (
            <div className="rounded-xl border border-red-400/20 bg-red-950/40 px-2 py-1 text-[11px] text-red-100">
              {missingPlayerInitiatives} PC initiative{missingPlayerInitiatives === 1 ? '' : 's'} still need to be set.
            </div>
          )}
          {!canRollInitiative && (
            <div className="rounded-xl border border-amber-400/20 bg-amber-950/40 px-2 py-1 text-[11px] text-amber-100">
              Set every PC initiative before starting combat.
            </div>
          )}
        </div>
      </div>

      <MusicPanel compact={compact} />
    </div>
  )
}
