'use client';

import type Creature from '@/types/creature';
import { useLocale } from '@/app/LocaleProvider';

interface SummaryPanelProps {
  creatures: Creature[];
  round: number;
  compact?: boolean;
  partyLevel: number;
  onPartyLevelChange: (nextLevel: number) => void;
  encounter: {
    playerCount: number;
    creatureCount: number;
    baseXp: number;
    adjustedXp: number;
    multiplier: number;
    thresholds: {
      easy: number;
      medium: number;
      hard: number;
      deadly: number;
    };
    difficulty: string;
  };
}

const SummaryPanel = ({
  creatures,
  round,
  compact = false,
  partyLevel,
  onPartyLevelChange,
  encounter,
}: SummaryPanelProps) => {
  const { t } = useLocale();
  const playerCount = creatures.filter((creature) => creature.isPlayer).length;
  const enemyCount = creatures.length - playerCount;
  const multiplierLabel = encounter.multiplier === 1 ? 'x' : `${encounter.multiplier}x`;

  return (
    <div className={`min-w-0 ${compact ? 'space-y-2' : 'space-y-3'}`}>
      <h2
        className={
          compact
            ? 'text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-300'
            : 'text-xs font-semibold uppercase tracking-[0.24em] text-stone-300'
        }
      >
        {t.Summary}
      </h2>

      <div
        className={`rounded-xl border border-white/10 bg-black/20 ${compact ? 'space-y-1 p-2.5 text-[11px]' : 'space-y-2 p-3 text-xs'}`}
      >
        <div className="flex justify-between">
          <span>{t.Round}</span>
          <span className="font-semibold">{round}</span>
        </div>
        <div className="flex justify-between">
          <span>{t.Creatures}</span>
          <span className="font-semibold">{creatures.length}</span>
        </div>
        <div className="flex justify-between">
          <span>{t.Players}</span>
          <span className="font-semibold">{playerCount}</span>
        </div>
        <div className="flex justify-between">
          <span>{t.Enemies}</span>
          <span className="font-semibold">{enemyCount}</span>
        </div>
      </div>

      <div
        className={`rounded-xl border border-amber-200/20 bg-amber-950/15 ${compact ? 'space-y-1 p-2.5 text-[11px]' : 'space-y-2 p-3 text-xs'}`}
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">{t.Encounter}</h3>
          <label className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-stone-400">Party Lv</span>
            <input
              type="number"
              min={1}
              max={20}
              value={partyLevel}
              onChange={(event) =>
                onPartyLevelChange(Math.min(20, Math.max(1, Number(event.target.value) || 1)))
              }
              className="h-6 w-11 rounded border border-white/20 bg-black/30 px-1 text-center text-[11px] text-white"
            />
          </label>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span>Difficulty</span>
            <span className="font-semibold text-amber-100">{encounter.difficulty}</span>
          </div>
          <div className="flex justify-between">
            <span>
              {t.Creatures} / {t.Players}
            </span>
            <span>
              {encounter.creatureCount} / {encounter.playerCount}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Base XP</span>
            <span>{encounter.baseXp}</span>
          </div>
          <div className="flex justify-between">
            <span>Adjusted XP</span>
            <span>
              {encounter.adjustedXp} ({multiplierLabel})
            </span>
          </div>
          <div className="text-[9px] text-stone-400">
            Thresholds E/M/H/D: {encounter.thresholds.easy}/{encounter.thresholds.medium}/
            {encounter.thresholds.hard}/{encounter.thresholds.deadly}
          </div>
        </div>
      </div>

      <div
        className={`rounded-xl border border-white/10 bg-black/20 ${compact ? 'space-y-1.5 p-2.5 text-[11px]' : 'space-y-2 p-3 text-xs'}`}
      >
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">{t.TurnOrder}</h3>
        <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
          {creatures.map((creature) => (
            <div key={creature.id} className="flex min-w-0 justify-between gap-2">
              <span className="truncate">{creature.name}</span>
              <span className="shrink-0 text-stone-300">{creature.initiative}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
SummaryPanel.displayName = 'SummaryPanel';
export default SummaryPanel;
