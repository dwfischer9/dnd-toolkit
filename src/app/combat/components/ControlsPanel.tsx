'use client';

import MusicPanel from './MusicPanel';
import { useLocale } from '@/app/LocaleProvider';

interface ControlsPanelProps {
  round: number;
  turn: number;
  activeCreatureName: string;
  onEndCombat?: () => void;
  onRollInitiative?: () => void;
  onNextTurn?: () => void;
  onPreviousTurn?: () => void;
  onAddPc?: () => void;
  onExportData?: () => void;
  onImportData?: () => void;
  missingPlayerInitiatives?: number;
  canRollInitiative?: boolean;
  compact?: boolean;
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
  onExportData,
  onImportData,
  missingPlayerInitiatives = 0,
  canRollInitiative = true,
  compact = false,
}: ControlsPanelProps) {
  const { t } = useLocale();
  return (
    <div className={compact ? 'space-y-2.5' : 'space-y-3'}>
      <h2
        className={
          compact
            ? 'text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-300'
            : 'text-xs font-semibold uppercase tracking-[0.24em] text-stone-300'
        }
      >
        {t.CombatControls}
      </h2>

      <div
        className={`rounded-xl border border-white/10 bg-black/20 ${compact ? 'space-y-1.5 p-2.5' : 'space-y-2 p-3'}`}
      >
        <h3
          className={
            compact
              ? 'text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-300'
              : 'text-sm font-semibold uppercase tracking-[0.2em] text-stone-300'
          }
        >
          {t.QuickActions}
        </h3>
        <div className={compact ? 'grid grid-cols-1 gap-1.5' : 'space-y-2'}>
          <button
            type="button"
            onClick={onEndCombat}
            className={`w-full rounded-lg border border-red-300/25 bg-red-500/80 text-white transition hover:bg-red-500 ${
              compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
            }`}
          >
            {t.EndCombat}
          </button>
          <button
            type="button"
            disabled={!canRollInitiative}
            onClick={onRollInitiative}
            className={`w-full rounded-lg border border-amber-200/25 bg-amber-300 font-semibold text-stone-900 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50 ${
              compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
            }`}
          >
            {t.RollInitiative}
          </button>
          <button
            type="button"
            onClick={onAddPc}
            className={`w-full rounded-lg border border-emerald-300/20 bg-emerald-600/85 text-white transition hover:bg-emerald-500 ${
              compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
            }`}
          >
            {t.AddPc}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onExportData}
              className={`rounded-lg border border-white/15 bg-white/5 text-stone-100 transition hover:bg-white/10 ${
                compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
              }`}
            >
              Export
            </button>
            <button
              type="button"
              onClick={onImportData}
              className={`rounded-lg border border-white/15 bg-white/5 text-stone-100 transition hover:bg-white/10 ${
                compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
              }`}
            >
              Import
            </button>
          </div>
        </div>
      </div>

      {(onPreviousTurn || onNextTurn) && (
        <div
          className={`rounded-xl border border-amber-300/25 bg-amber-950/20 ${compact ? 'space-y-1.5 p-2.5' : 'space-y-2 p-3'}`}
        >
          <h3
            className={
              compact
                ? 'text-xs font-semibold uppercase tracking-[0.2em] text-stone-300'
                : 'text-sm font-semibold uppercase tracking-[0.2em] text-stone-300'
            }
          >
            {t.TurnNavigation}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onPreviousTurn}
              className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-100 transition hover:bg-white/10"
            >
              {t.PrevTurn}
            </button>
            <button
              type="button"
              onClick={onNextTurn}
              className="rounded-lg border border-amber-200/45 bg-amber-200/20 px-2.5 py-1.5 text-xs font-semibold text-amber-50 shadow-md shadow-amber-900/30 transition hover:bg-amber-200/30"
            >
              {t.NextTurn}
            </button>
          </div>
        </div>
      )}

      <div
        className={`rounded-xl border border-white/10 bg-black/20 ${compact ? 'space-y-1.5 p-2.5' : 'space-y-2 p-3'}`}
      >
        <h3
          className={
            compact
              ? 'text-xs font-semibold uppercase tracking-[0.2em] text-stone-300'
              : 'text-sm font-semibold uppercase tracking-[0.2em] text-stone-300'
          }
        >
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
            <span className="max-w-[14rem] break-words text-right font-semibold leading-tight text-amber-200">
              {activeCreatureName}
            </span>
          </div>
          {missingPlayerInitiatives > 0 && (
            <div className="rounded-xl border border-red-400/20 bg-red-950/40 px-2 py-1 text-[11px] text-red-100">
              {missingPlayerInitiatives} PC initiative{missingPlayerInitiatives === 1 ? '' : 's'}{' '}
              still need to be set.
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
  );
}
