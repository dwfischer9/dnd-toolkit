'use client';

import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getDefenseConflicts,
  performCreatureFeature,
  resetCreatureResources,
  rollD20,
} from '../combatState';
import { getCreatureAbilityRows } from '../creatureCardViewModel';
import type Creature from '../../../types/creature';
import {
  CreatureDefenseEffectCategories,
  CreatureEffectSources,
  CreatureHands,
  CreatureFeatureTypes,
  CreatureRollKinds,
} from '../../../types/creature';
import type {
  AbilityKey,
  CreatureDefenseEffectCategory,
  CreatureFeature,
  CreatureFeatureType,
  CreatureHand,
  CreatureRollKind,
} from '../../../types/creature';

interface CreatureCardProps {
  round: number;
  anchorOptions: Array<{ id: string; name: string }>;
  creature: Creature;
  onUpdateCreature: (creature: Creature) => void;
  onRemoveCreature: (creatureId: string) => void;
  onEditCreature?: (creature: Creature) => void;
}

export default function CreatureCard({
  round,
  anchorOptions,
  creature,
  onUpdateCreature,
  onRemoveCreature,
  onEditCreature,
}: CreatureCardProps) {
  const healthAdjustRef = useRef<HTMLInputElement>(null);
  const [openFeatureGroups, setOpenFeatureGroups] = useState<Record<string, boolean>>({});
  const [hoveredFeature, setHoveredFeature] = useState<{
    feature: CreatureFeature;
    rect: DOMRect;
  } | null>(null);
  const [effectCategory, setEffectCategory] = useState<CreatureDefenseEffectCategory>(
    CreatureDefenseEffectCategories.Resistance,
  );
  const [effectScope, setEffectScope] = useState('all damage types');
  const [effectDuration, setEffectDuration] = useState('');
  const [effectTiming, setEffectTiming] = useState<'round' | 'turn_start'>('round');
  const [effectAnchorCreatureId, setEffectAnchorCreatureId] = useState(creature.id);
  const [effectNotice, setEffectNotice] = useState<string | null>(null);
  const [isEffectEditorOpen, setIsEffectEditorOpen] = useState(false);
  const [customConditionName, setCustomConditionName] = useState('');
  const conditionOptions = [
    'Blinded',
    'Charmed',
    'Deafened',
    'Exhaustion',
    'Frightened',
    'Grappled',
    'Incapacitated',
    'Invisible',
    'Necrotic',
    'Paralyzed',
    'Petrified',
    'Poisoned',
    'Prone',
    'Restrained',
    'Stunned',
    'Unconscious',
    'Other',
  ];

  useEffect(() => {
    if (!effectNotice) {
      return;
    }
    const timeoutId = window.setTimeout(() => setEffectNotice(null), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [effectNotice]);

  const effects = creature.effects ?? [];
  const defenseConflicts = getDefenseConflicts(effects);

  const adjustFeatureUses = (featureId: string, delta: number) => {
    const bucket = creature.featureState?.[featureId];
    if (!bucket?.uses) {
      return;
    }

    const { maximum } = bucket.uses;
    const nextCurrent = Math.min(maximum, Math.max(0, bucket.uses.current + delta));
    if (nextCurrent === bucket.uses.current) {
      return;
    }

    onUpdateCreature({
      ...creature,
      featureState: {
        ...(creature.featureState ?? {}),
        [featureId]: {
          ...bucket,
          uses: {
            ...bucket.uses,
            current: nextCurrent,
          },
        },
      },
    });
  };

  const formatBonus = (bonus: number) => (bonus >= 0 ? `+${bonus}` : `${bonus}`);
  const formatRollDetail = (dieRoll: number, bonus: number) =>
    `d20 ${dieRoll} ${bonus >= 0 ? '+' : '-'} ${Math.abs(bonus)}`;
  const getAbilityModifier = (score: number) => Math.floor((score - 10) / 2);

  const recordSingleRoll = (
    featureId: string,
    title: string,
    label: string,
    bonus: number,
    kind: CreatureRollKind = CreatureRollKinds.Other,
  ) => {
    const dieRoll = rollD20();
    const total = dieRoll + bonus;
    onUpdateCreature({
      ...creature,
      lastActionResult: {
        featureId,
        featureName: title,
        summary: `${label} check`,
        rolls: [
          {
            label,
            value: total,
            detail: formatRollDetail(dieRoll, bonus),
            kind,
          },
        ],
      },
    });
  };

  const handleAbilityCheck = (ability: { abilityKey: AbilityKey; short: string }) => {
    const score = creature.abilityScores?.[ability.abilityKey];
    if (score === undefined) {
      return;
    }

    recordSingleRoll(
      `ability-check:${ability.abilityKey}`,
      `${ability.short} Check`,
      ability.short,
      getAbilityModifier(score),
      CreatureRollKinds.Other,
    );
  };

  const handleSaveRoll = (ability: { abilityKey: AbilityKey; short: string }, bonus: number) => {
    recordSingleRoll(
      `saving-throw:${ability.abilityKey}`,
      `${ability.short} Save`,
      `${ability.short} Save`,
      bonus,
      CreatureRollKinds.Save,
    );
  };

  const handleSkillRoll = (skillName: string, bonus: number) => {
    recordSingleRoll(
      `skill-check:${skillName.toLowerCase()}`,
      `${skillName} Check`,
      skillName,
      bonus,
      CreatureRollKinds.Other,
    );
  };

  const handleDamage = (amount: number) => {
    onUpdateCreature({
      ...creature,
      currentHp: Math.max(0, creature.currentHp - amount),
    });
  };

  const handleHeal = (amount: number) => {
    onUpdateCreature({
      ...creature,
      currentHp: Math.min(creature.maxHp, creature.currentHp + amount),
    });
  };

  const modifyHealth = () => {
    const amountRaw = healthAdjustRef.current?.value?.trim() || '';
    const parsedAmount = Number(amountRaw);
    if (!Number.isFinite(parsedAmount) || parsedAmount === 0) {
      return;
    }

    if (parsedAmount < 0) {
      handleDamage(Math.abs(parsedAmount));
    } else {
      handleHeal(parsedAmount);
    }

    if (healthAdjustRef.current) {
      healthAdjustRef.current.value = '';
    }
  };

  const hpPercent = (creature.currentHp / creature.maxHp) * 100;
  const featureGroups = creature.featureGroups ?? [];
  const featureCount = featureGroups.reduce((sum, group) => sum + group.features.length, 0);
  const abilityRows = useMemo(() => getCreatureAbilityRows(creature), [creature]);
  const skillEntries = useMemo(
    () =>
      Object.entries(creature.skillBonuses ?? {}).sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    [creature.skillBonuses],
  );

  const badgeClassName = creature.isPlayer
    ? 'border-amber-400/30 bg-amber-400/10 text-amber-100'
    : 'border-red-400/30 bg-red-400/10 text-red-100';
  const sourceLabel =
    creature.origin === 'api' ? 'API' : creature.origin === 'imported' ? 'Imported' : 'User';
  const getEffectBadgeClasses = (effect: (typeof effects)[number]) => {
    if (effect.durationRounds !== undefined) {
      return 'border-yellow-400/35 bg-yellow-950/45 text-yellow-100';
    }

    return 'border-amber-400/20 bg-amber-950/35 text-amber-100';
  };

  const getEffectDurationTextClasses = (effect: (typeof effects)[number]) => {
    if (effect.durationRounds !== undefined) {
      return 'text-yellow-300/95';
    }

    return 'text-amber-300/90';
  };

  const getEffectRemainingLabel = (effect: (typeof effects)[number]) => {
    if (effect.durationRounds === undefined) {
      return null;
    }
    if (effect.timing === 'turn_start') {
      const elapsed = effect.elapsedTurnStarts ?? 0;
      const remainingTurns = Math.max(0, effect.durationRounds - elapsed);
      return `${remainingTurns}t`;
    }
    const elapsedRounds =
      effect.anchorRound !== undefined ? Math.max(0, round - effect.anchorRound) : 0;
    const remainingRounds = Math.max(0, effect.durationRounds - elapsedRounds);
    const remainingSeconds = remainingRounds * 6;
    return `${remainingRounds}r/${remainingSeconds}s`;
  };

  const getFeatureIcon = (type: CreatureFeatureType) => {
    switch (type) {
      case CreatureFeatureTypes.Action:
        return '⚔';
      case CreatureFeatureTypes.Legendary:
        return '♛';
      case CreatureFeatureTypes.Reaction:
        return '↺';
      case CreatureFeatureTypes.Spell:
        return '✦';
      default:
        return '◇';
    }
  };

  const handleFeatureRoll = (feature: CreatureFeature, versatileGrip?: CreatureHand) => {
    onUpdateCreature(
      performCreatureFeature(
        creature,
        feature,
        undefined,
        versatileGrip === CreatureHands.Two ? { versatileGrip: CreatureHands.Two } : undefined,
      ),
    );
  };

  const outcomeFeatureId = creature.lastActionResult?.featureId;
  const outcomeUses =
    outcomeFeatureId !== undefined ? creature.featureState?.[outcomeFeatureId]?.uses : undefined;

  const toggleFeatureGroup = (groupKey: string) => {
    setOpenFeatureGroups((previous) => ({
      ...previous,
      [groupKey]: !previous[groupKey],
    }));
  };

  const addEffect = () => {
    const resolvedScope =
      effectCategory === CreatureDefenseEffectCategories.Condition && effectScope === 'Other'
        ? customConditionName.trim()
        : effectScope.trim();
    const normalizedScope = resolvedScope;
    if (!normalizedScope) {
      return;
    }
    const parsedDuration = Number(effectDuration);
    const hasDuration = Number.isFinite(parsedDuration) && parsedDuration > 0;
    const replacementIndex = effects.findIndex(
      (effect) =>
        effect.source === CreatureEffectSources.Encounter &&
        effect.category === effectCategory &&
        effect.scope.toLowerCase() === normalizedScope.toLowerCase() &&
        (effect.timing ?? 'round') === effectTiming &&
        (effect.timing !== 'turn_start' || effect.anchorCreatureId === effectAnchorCreatureId),
    );

    const nextEffect = {
      id:
        replacementIndex >= 0
          ? effects[replacementIndex].id
          : `encounter:${effectCategory}:${normalizedScope}:${crypto.randomUUID()}`,
      label: `${effectCategory} (${normalizedScope})`,
      category: effectCategory,
      scope: normalizedScope,
      source: CreatureEffectSources.Encounter,
      timing: effectTiming,
      durationRounds: hasDuration ? parsedDuration : undefined,
      anchorRound: hasDuration && effectTiming === 'round' ? round : undefined,
      anchorCreatureId: effectTiming === 'turn_start' ? effectAnchorCreatureId : undefined,
      elapsedTurnStarts: effectTiming === 'turn_start' ? 0 : undefined,
    };

    const nextEffects =
      replacementIndex >= 0
        ? effects.map((effect, index) => (index === replacementIndex ? nextEffect : effect))
        : [...effects, nextEffect];

    onUpdateCreature({
      ...creature,
      effects: nextEffects,
    });
    setEffectNotice(replacementIndex >= 0 ? `Reapplied: ${nextEffect.label}` : null);
    setEffectDuration('');
    setCustomConditionName('');
    setIsEffectEditorOpen(false);
  };

  const removeEncounterEffect = (effectId: string) => {
    onUpdateCreature({
      ...creature,
      effects: effects.filter(
        (effect) => effect.id !== effectId || effect.source === CreatureEffectSources.Baseline,
      ),
    });
  };

  const showFeatureTooltip = (feature: CreatureFeature, element: HTMLElement) => {
    setHoveredFeature({
      feature,
      rect: element.getBoundingClientRect(),
    });
  };

  const hideFeatureTooltip = () => {
    setHoveredFeature(null);
  };

  const renderFeatureButton = (feature: CreatureFeature, groupPrefix: string, index: number) => {
    const uses = creature.featureState?.[feature.id]?.uses;
    const hasVersatile = Boolean(feature.versatileDamage?.length);

    return (
      <div
        key={`${creature.id}:${groupPrefix}:${feature.id}:${index}`}
        className="group relative min-w-0 rounded-xl border border-white/10 bg-slate-950/70 shadow-sm transition hover:border-amber-400/30 hover:bg-slate-900/80"
        onMouseEnter={(event) => showFeatureTooltip(feature, event.currentTarget)}
        onMouseMove={(event) => {
          if (hoveredFeature?.feature.id === feature.id) {
            setHoveredFeature({
              feature,
              rect: event.currentTarget.getBoundingClientRect(),
            });
          }
        }}
        onMouseLeave={hideFeatureTooltip}
        onFocus={(event) => showFeatureTooltip(feature, event.currentTarget)}
        onBlur={hideFeatureTooltip}
        tabIndex={-1}
      >
        {hasVersatile ? (
          <div className="flex min-w-0 divide-x divide-white/10">
            <button
              type="button"
              onClick={() => handleFeatureRoll(feature, CreatureHands.One)}
              className="flex min-w-0 flex-1 flex-col px-3 py-2 text-left transition hover:bg-white/[0.05]"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{getFeatureIcon(feature.type)}</span>
                <span className="truncate text-sm font-medium text-white">{feature.name}</span>
              </div>
              <span className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">
                One-handed
              </span>
              {uses && (
                <span className="mt-1 w-fit rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2 py-0.5 text-[10px] text-yellow-200">
                  {uses.current}/{uses.maximum}
                </span>
              )}
            </button>
            <button
              type="button"
              title="Versatile - two-handed"
              onClick={() => handleFeatureRoll(feature, CreatureHands.Two)}
              className="flex w-12 shrink-0 flex-col items-center justify-center px-1 py-1 text-center transition hover:bg-white/[0.05]"
            >
              <span className="text-sm">{getFeatureIcon(feature.type)}</span>
              <span className="mt-1 text-[10px] font-bold uppercase tracking-tight text-amber-300">
                2H
              </span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => handleFeatureRoll(feature, CreatureHands.One)}
            className="flex w-full min-w-0 items-center gap-2 px-3 py-2 text-left transition hover:bg-white/[0.05]"
          >
            <span className="text-sm">{getFeatureIcon(feature.type)}</span>
            <span className="flex-1 truncate text-sm font-medium leading-5 text-white">
              {feature.name}
            </span>
            {uses && (
              <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2 py-0.5 text-[10px] text-yellow-200">
                {uses.current}/{uses.maximum}
              </span>
            )}
          </button>
        )}
      </div>
    );
  };

  const tooltip =
    hoveredFeature && typeof window !== 'undefined'
      ? createPortal(
          (() => {
            const viewportPadding = 12;
            const gap = 10;
            const tooltipWidth = Math.min(416, window.innerWidth - viewportPadding * 2);
            const estimatedHeight = hoveredFeature.feature.description.length > 140 ? 280 : 220;
            const enoughRoomBelow =
              hoveredFeature.rect.bottom + gap + estimatedHeight <=
              window.innerHeight - viewportPadding;
            const enoughRoomAbove =
              hoveredFeature.rect.top - gap - estimatedHeight >= viewportPadding;
            const top = enoughRoomBelow
              ? hoveredFeature.rect.bottom + gap
              : enoughRoomAbove
                ? hoveredFeature.rect.top - gap - estimatedHeight
                : Math.max(
                    viewportPadding,
                    Math.min(
                      hoveredFeature.rect.bottom + gap,
                      window.innerHeight - viewportPadding - estimatedHeight,
                    ),
                  );
            const left = Math.max(
              viewportPadding,
              Math.min(
                hoveredFeature.rect.left,
                window.innerWidth - viewportPadding - tooltipWidth,
              ),
            );

            return (
              <div
                className="pointer-events-none fixed z-[80] rounded-2xl border border-white/10 bg-slate-950 p-4 text-xs shadow-2xl shadow-black/40"
                style={{
                  top,
                  left,
                  width: tooltipWidth,
                  maxHeight: 'min(24rem, calc(100vh - 1.5rem))',
                  overflowY: 'auto',
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-white">{hoveredFeature.feature.name}</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase text-gray-200">
                    {hoveredFeature.feature.type}
                  </span>
                  {hoveredFeature.feature.attackBonus !== undefined && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-gray-200">
                      Attack +{hoveredFeature.feature.attackBonus}
                    </span>
                  )}
                  {hoveredFeature.feature.savingThrow && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-gray-200">
                      DC {hoveredFeature.feature.savingThrow.dc}{' '}
                      {hoveredFeature.feature.savingThrow.ability}
                    </span>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-line text-gray-300">
                  {hoveredFeature.feature.description}
                </p>
                {hoveredFeature.feature.damage && hoveredFeature.feature.damage.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {hoveredFeature.feature.damage.map((damage, damageIndex) => (
                      <span
                        key={`${hoveredFeature.feature.id}:dmg:${damageIndex}:${damage.type}:${damage.dice}`}
                        className="rounded-full border border-red-400/20 bg-red-400/10 px-2 py-0.5 text-[10px] text-red-100"
                      >
                        {damage.dice} {damage.type} (one-handed / default)
                      </span>
                    ))}
                  </div>
                )}
                {hoveredFeature.feature.versatileDamage &&
                  hoveredFeature.feature.versatileDamage.length > 0 && (
                    <div className="mt-2">
                      <div className="mb-1 text-[10px] uppercase tracking-wide text-gray-400">
                        Versatile (2H)
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {hoveredFeature.feature.versatileDamage.map((damage, vIdx) => (
                          <span
                            key={`${hoveredFeature.feature.id}:vt:${vIdx}:${damage.type}:${damage.dice}`}
                            className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-100"
                          >
                            {damage.dice} {damage.type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            );
          })(),
          document.body,
        )
      : null;

  const effectEditorModal =
    isEffectEditorOpen && typeof window !== 'undefined'
      ? createPortal(
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4">
            <div className="w-full max-w-xl rounded-2xl border border-amber-400/20 bg-slate-950 p-4 shadow-2xl">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100">
                  Add Effect
                </div>
                <button
                  type="button"
                  onClick={() => setIsEffectEditorOpen(false)}
                  className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] text-white"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_5rem_auto] sm:items-center">
                <select
                  value={effectCategory}
                  onChange={(event) => {
                    const nextCategory = event.target.value as CreatureDefenseEffectCategory;
                    setEffectCategory(nextCategory);
                    if (nextCategory === CreatureDefenseEffectCategories.Condition) {
                      setEffectScope(conditionOptions[0]);
                    } else if (conditionOptions.includes(effectScope)) {
                      setEffectScope('all damage types');
                    }
                  }}
                  className="rounded-xl border border-white/10 bg-slate-950 px-2 py-1 text-xs text-white outline-none focus:border-amber-400/70"
                >
                  <option value={CreatureDefenseEffectCategories.Resistance}>resistance</option>
                  <option value={CreatureDefenseEffectCategories.Immunity}>immunity</option>
                  <option value={CreatureDefenseEffectCategories.Vulnerability}>
                    vulnerability
                  </option>
                  <option value={CreatureDefenseEffectCategories.Condition}>condition</option>
                </select>
                {effectCategory === CreatureDefenseEffectCategories.Condition ? (
                  <select
                    value={effectScope}
                    onChange={(event) => setEffectScope(event.target.value)}
                    className="rounded-xl border border-white/10 bg-slate-950 px-2 py-1 text-xs text-white outline-none focus:border-amber-400/70"
                  >
                    {conditionOptions.map((condition) => (
                      <option key={`condition-option:${condition}`} value={condition}>
                        {condition}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={effectScope}
                    onChange={(event) => setEffectScope(event.target.value)}
                    placeholder="scope or all damage types"
                    className="rounded-xl border border-white/10 bg-slate-950 px-2 py-1 text-xs text-white outline-none focus:border-amber-400/70"
                  />
                )}
                <input
                  value={effectDuration}
                  onChange={(event) => setEffectDuration(event.target.value)}
                  placeholder="rounds"
                  inputMode="numeric"
                  className="rounded-xl border border-white/10 bg-slate-950 px-2 py-1 text-xs text-white outline-none focus:border-amber-400/70"
                />
                <button
                  type="button"
                  onClick={addEffect}
                  className="inline-flex h-7 w-fit items-center gap-1 rounded-lg border border-amber-400/30 bg-amber-400/10 px-2 text-[11px] font-semibold text-amber-100 transition hover:bg-amber-400/20"
                >
                  <span aria-hidden="true">+</span>
                  <span>Add</span>
                </button>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <select
                  value={effectTiming}
                  onChange={(event) =>
                    setEffectTiming(event.target.value as 'round' | 'turn_start')
                  }
                  className="rounded-xl border border-white/10 bg-slate-950 px-2 py-1 text-xs text-white outline-none focus:border-amber-400/70"
                >
                  <option value="round">Round-based</option>
                  <option value="turn_start">Turn-start based</option>
                </select>
                {effectTiming === 'turn_start' && (
                  <select
                    value={effectAnchorCreatureId}
                    onChange={(event) => setEffectAnchorCreatureId(event.target.value)}
                    className="rounded-xl border border-white/10 bg-slate-950 px-2 py-1 text-xs text-white outline-none focus:border-amber-400/70"
                  >
                    {anchorOptions.map((option) => (
                      <option key={`effect-anchor:${option.id}`} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {effectCategory === CreatureDefenseEffectCategories.Condition &&
                effectScope === 'Other' && (
                  <input
                    value={customConditionName}
                    onChange={(event) => setCustomConditionName(event.target.value)}
                    placeholder="Custom condition name"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-2 py-1 text-xs text-white outline-none focus:border-amber-400/70"
                  />
                )}
              {effectTiming === 'round' && (
                <div className="mt-2 text-[10px] text-slate-400">
                  Time-based is default. Duration is counted in rounds (6 seconds each).
                </div>
              )}
              {effects.some((effect) => effect.source === CreatureEffectSources.Encounter) && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {effects
                    .filter((effect) => effect.source === CreatureEffectSources.Encounter)
                    .map((effect) => (
                      <span
                        key={`effect-editor-chip:${effect.id}`}
                        className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-slate-950/70 px-2 py-0.5 text-[10px] text-slate-200"
                      >
                        {effect.category}:
                        {effect.scope === 'all damage types' ? 'ALL' : effect.scope}
                        <button
                          type="button"
                          onClick={() => removeEncounterEffect(effect.id)}
                          className="text-red-300 hover:text-red-100"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      className={`relative rounded-2xl border p-4 shadow-md transition-all ${
        creature.isActive
          ? 'border-amber-400/40 bg-slate-900/95'
          : 'border-white/10 bg-slate-950/60'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-white">{creature.name}</h3>
            <span className={`rounded-full border px-2 py-0.5 text-xs ${badgeClassName}`}>
              {creature.isPlayer ? 'PC' : 'Creature'}
            </span>
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-gray-300">
              Source: {sourceLabel}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-gray-300">
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
              Init {creature.initiative}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
              AC {creature.ac}
            </span>
            {effects.map((effect) => (
              <span
                key={`compact-effect:${effect.id}`}
                title={effect.scope}
                className={`rounded-full border px-2 py-1 text-[11px] ${getEffectBadgeClasses(effect)}`}
              >
                {effect.category}:{effect.scope === 'all damage types' ? 'ALL' : effect.scope}
                {getEffectRemainingLabel(effect) && (
                  <span className={`ml-1 ${getEffectDurationTextClasses(effect)}`}>
                    {getEffectRemainingLabel(effect)}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onEditCreature && (
            <button
              onClick={() => onEditCreature(creature)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white transition hover:bg-white/10"
            >
              Edit
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsEffectEditorOpen(true)}
            className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-100 transition hover:bg-amber-400/20"
          >
            + Effect
          </button>
          {featureCount > 0 && (
            <button
              onClick={() => onUpdateCreature(resetCreatureResources(creature))}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white transition hover:bg-white/10"
            >
              Reset Uses
            </button>
          )}
          <button
            onClick={() => onRemoveCreature(creature.id)}
            className="rounded-full border border-red-400/20 bg-red-500/20 px-3 py-1 text-white transition hover:bg-red-500/30"
          >
            x
          </button>
        </div>
      </div>

      <div className="mb-2 mt-3 flex items-center gap-1.5">
        <div className="relative h-7 flex-1 overflow-hidden rounded-full border border-white/10 bg-slate-950/70">
          <div className="h-full bg-green-500 transition-all" style={{ width: `${hpPercent}%` }} />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
            HP {creature.currentHp}/{creature.maxHp}
          </div>
        </div>
        <div className="inline-flex flex-wrap items-center gap-1 rounded-2xl border border-white/10 bg-slate-950/70 p-1">
          <button
            onClick={() => handleDamage(5)}
            className="rounded-xl border border-red-500/60 bg-red-950/60 px-2 py-1 text-[11px] text-red-100 transition hover:bg-red-900/70"
          >
            -5
          </button>
          <button
            onClick={() => handleDamage(1)}
            className="rounded-xl border border-red-500/60 bg-red-950/60 px-2 py-1 text-[11px] text-red-100 transition hover:bg-red-900/70"
          >
            -1
          </button>
          <input
            ref={healthAdjustRef}
            type="text"
            inputMode="numeric"
            pattern="-?[0-9]*"
            placeholder="±"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                modifyHealth();
              }
            }}
            className="h-7 w-12 rounded-xl border border-white/10 bg-slate-950 px-1 text-center text-[11px] text-white outline-none focus:border-amber-400/70"
          />
          <button
            onClick={() => handleHeal(1)}
            className="rounded-xl border border-green-500/60 bg-green-950/60 px-2 py-1 text-[11px] text-green-100 transition hover:bg-green-900/70"
          >
            +1
          </button>
          <button
            onClick={() => handleHeal(5)}
            className="rounded-xl border border-green-500/60 bg-green-950/60 px-2 py-1 text-[11px] text-green-100 transition hover:bg-green-900/70"
          >
            +5
          </button>
          <button
            onClick={modifyHealth}
            className="rounded-xl border border-amber-500/60 bg-amber-950/60 px-2 py-1 text-[11px] text-amber-100 transition hover:bg-amber-900/70"
          >
            Go
          </button>
        </div>
      </div>

      {defenseConflicts.length > 0 && (
        <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-950/30 px-2 py-1 text-[11px] text-amber-200">
          Defense conflict: automated damage adjustment is disabled on conflicting scopes.
        </div>
      )}
      {effectNotice && (
        <div className="mb-3 rounded-xl border border-amber-400/20 bg-amber-950/40 px-2 py-1 text-[11px] text-amber-100">
          {effectNotice}
        </div>
      )}

      {(abilityRows.length > 0 || skillEntries.length > 0) && (
        <div className="mb-3 space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Stats & Proficiencies
            </div>
            {creature.proficiencyBonus !== undefined && (
              <div className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-gray-200">
                Prof {formatBonus(creature.proficiencyBonus)}
              </div>
            )}
          </div>

          {abilityRows.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-[5rem_minmax(0,1fr)] sm:items-start">
              <div className="shrink-0 pt-1 text-[10px] uppercase tracking-wide text-slate-400">
                Abilities
              </div>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
                {abilityRows.map((ability) => {
                  const bonus = ability.saveBonus;
                  const isProficient = ability.saveIsProficient;

                  return (
                    <div
                      key={`ability-row:${ability.abilityKey}`}
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-950/70 px-1.5 py-1"
                    >
                      <span
                        title={`${ability.short} ${ability.score}`}
                        className="min-w-[2.5rem] text-[10px] font-semibold uppercase tracking-wide text-slate-200"
                      >
                        {ability.short} {formatBonus(ability.modifier)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAbilityCheck(ability)}
                        className="rounded-md border border-amber-500/50 bg-amber-950/45 px-1.5 py-0.5 text-[10px] font-medium text-amber-100 transition hover:border-amber-300"
                      >
                        Check
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveRoll(ability, bonus)}
                        title={isProficient ? 'Proficient save' : 'Non-proficient save (flat d20)'}
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium transition hover:border-amber-300 ${
                          isProficient
                            ? 'border border-amber-600/60 bg-amber-950/45 text-amber-100'
                            : 'border border-white/15 bg-slate-900/80 text-slate-200'
                        }`}
                      >
                        Save {formatBonus(bonus)}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {skillEntries.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-[5rem_minmax(0,1fr)] sm:items-start">
              <div className="shrink-0 pt-1 text-[10px] uppercase tracking-wide text-slate-400">
                Skills
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {skillEntries.map(([skillName, bonus]) => (
                  <button
                    key={`skill:${skillName}`}
                    type="button"
                    onClick={() => handleSkillRoll(skillName, bonus)}
                    className="rounded-2xl border border-emerald-600/50 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-100 transition hover:border-emerald-400"
                  >
                    {skillName} {formatBonus(bonus)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {featureGroups.length > 0 && (
        <div className="space-y-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-400">
            Feature Library
          </div>

          {featureGroups.map((group) => {
            const groupKey = `${creature.id}:${group.type}`;
            const isOpen = openFeatureGroups[groupKey] ?? group.features.length <= 6;

            return (
              <section
                key={groupKey}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
              >
                <button
                  type="button"
                  onClick={() => toggleFeatureGroup(groupKey)}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200">
                      {group.label}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-300">
                      {group.features.length}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">{isOpen ? 'Collapse' : 'Expand'}</span>
                </button>

                <div
                  className={`mt-3 overflow-hidden transition-[max-height] duration-300 ${
                    isOpen ? 'max-h-[36rem]' : 'max-h-24'
                  }`}
                >
                  <div className="grid gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
                    {group.features.map((feature, index) =>
                      renderFeatureButton(feature, groupKey, index),
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {creature.lastActionResult && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <div className="text-xs uppercase tracking-wide text-slate-400">Last Result</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-medium text-yellow-300">
              {creature.lastActionResult.featureName}
            </span>
            <span className="text-gray-300">{creature.lastActionResult.summary}</span>
            {outcomeUses && outcomeFeatureId && (
              <span className="inline-flex items-center gap-0.5 rounded-full border border-yellow-600/45 bg-yellow-950/35 px-2 py-0.5 text-[10px] font-medium text-yellow-200">
                <span className="px-0.5 text-[9px] font-normal uppercase tracking-wide opacity-85">
                  {outcomeUses.label}
                </span>
                <button
                  type="button"
                  aria-label="Decrease uses for this ability"
                  className="flex h-4 w-4 items-center justify-center rounded border border-yellow-500/35 bg-transparent text-[11px] leading-none hover:bg-yellow-900/50 disabled:pointer-events-none disabled:opacity-35"
                  onClick={() => adjustFeatureUses(outcomeFeatureId, -1)}
                  disabled={outcomeUses.current <= 0}
                >
                  −
                </button>
                <span className="min-w-[1.6rem] text-center tabular-nums">
                  {outcomeUses.current}/{outcomeUses.maximum}
                </span>
                <button
                  type="button"
                  aria-label="Increase uses for this ability"
                  className="flex h-4 w-4 items-center justify-center rounded border border-yellow-500/35 bg-transparent text-[11px] leading-none hover:bg-yellow-900/50 disabled:pointer-events-none disabled:opacity-35"
                  onClick={() => adjustFeatureUses(outcomeFeatureId, 1)}
                  disabled={outcomeUses.current >= outcomeUses.maximum}
                >
                  +
                </button>
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {creature.lastActionResult.rolls.map((roll, index) => (
              <div
                key={`${creature.id}:${creature.lastActionResult?.featureId ?? 'roll'}:${roll.kind}:${index}:${roll.detail ?? roll.label}`}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold ${
                  roll.kind === CreatureRollKinds.Damage
                    ? 'border-red-500 bg-red-950 text-red-100'
                    : roll.kind === CreatureRollKinds.Save
                      ? 'border-amber-500 bg-amber-950 text-amber-100'
                      : 'border-yellow-500 bg-yellow-950 text-yellow-100'
                }`}
              >
                <span className="whitespace-nowrap">{roll.label}</span>
                <span className="tabular-nums">{roll.value}</span>
                {roll.detail && (
                  <span className="text-[9px] font-normal opacity-80">{roll.detail}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {tooltip}
      {effectEditorModal}
    </div>
  );
}
