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
    <div className={`min-w-0 ${compact ? 'space-y-2' : 'space-y-4'}`}>
      <h2 className={compact ? 'text-lg font-bold' : 'text-2xl font-bold'}>{t.Summary}</h2>

      <div
        className={`rounded-lg border border-white/10 bg-stone-900/80 ${compact ? 'space-y-1.5 p-3 text-xs' : 'space-y-3 p-4'}`}
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
        className={`rounded-lg border border-white/10 bg-stone-900/80 ${compact ? 'space-y-1.5 p-3 text-xs' : 'space-y-3 p-4'}`}
      >
        <div className="flex items-center justify-between">
          <h3
            className={
              compact
                ? 'text-sm font-semibold text-amber-300'
                : 'text-lg font-semibold text-amber-300'
            }
          >
            {t.Encounter}
          </h3>
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase tracking-wide text-gray-400">Party Lv</span>
            <input
              type="number"
              min={1}
              max={20}
              value={partyLevel}
              onChange={(event) =>
                onPartyLevelChange(Math.min(20, Math.max(1, Number(event.target.value) || 1)))
              }
              className="h-6 w-12 rounded border border-gray-600 bg-gray-900 px-1 text-center text-xs text-white"
            />
          </div>
        </div>
        <div className={compact ? 'space-y-1 text-xs' : 'space-y-1.5 text-sm'}>
          <div className="flex justify-between">
            <span>Difficulty</span>
            <span className="font-semibold">{encounter.difficulty}</span>
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
          <div className="text-[10px] text-gray-400">
            Thresholds E/M/H/D: {encounter.thresholds.easy}/{encounter.thresholds.medium}/
            {encounter.thresholds.hard}/{encounter.thresholds.deadly}
          </div>
        </div>
      </div>
      <div
        className={`rounded-lg border border-white/10 bg-stone-900/80 ${compact ? 'space-y-2 p-3' : 'space-y-3 p-4'}`}
      >
        <h3
          className={
            compact
              ? 'text-sm font-semibold text-amber-300'
              : 'text-lg font-semibold text-amber-300'
          }
        >
          {t.TurnOrder}
        </h3>
        <div className={compact ? 'space-y-1 text-xs' : 'space-y-2 text-sm'}>
          {creatures.map((creature) => (
            <div key={creature.id} className="flex min-w-0 justify-between gap-2">
              <span className="truncate">{creature.name}</span>
              <span className="shrink-0">{creature.initiative}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
SummaryPanel.displayName = 'SummaryPanel';
export default SummaryPanel;
