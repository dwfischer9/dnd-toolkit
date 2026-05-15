'use client';

import { useEffect, useState } from 'react';
import { creatureApi, type CreatureSearchResult } from '@/services/creatureApi';
import type Creature from '@/types/creature';
import { useLocale } from '@/app/LocaleProvider';

interface CreatureSearchPanelProps {
  onAddCreature: (creature: Creature) => void;
  onCreateCreature: () => void;
  compact?: boolean;
}

export default function CreatureSearchPanel({
  onAddCreature,
  onCreateCreature,
  compact = false,
}: CreatureSearchPanelProps) {
  const { t } = useLocale();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CreatureSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCreature, setSelectedCreature] = useState<CreatureSearchResult | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await creatureApi.searchCreatures(searchQuery);
        setSearchResults(response.results || []);
      } catch (searchError) {
        setError(searchError instanceof Error ? searchError.message : t.SearchCreaturesFailed);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery, t.SearchCreaturesFailed]);

  const handleCreatureSelect = async (creature: CreatureSearchResult) => {
    setSelectedCreature(creature);
    setIsLoadingDetails(true);
    setError(null);

    try {
      const apiCreature = await creatureApi.getCreatureDetails(creature.index);
      const convertedCreature = creatureApi.convertApiCreatureToCreature(apiCreature);
      onAddCreature(convertedCreature);
      setSearchQuery('');
      setSearchResults([]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t.LoadCreatureDetailsFailed);
    } finally {
      setIsLoadingDetails(false);
      setSelectedCreature(null);
    }
  };

  return (
    <section
      className={`min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className="grid grid-cols-1 gap-2">
        <div className="min-w-0 flex-1">
          <h3
            className={
              compact
                ? 'text-xs font-semibold uppercase tracking-[0.24em] text-amber-200/85'
                : 'text-sm font-semibold uppercase tracking-[0.24em] text-amber-200/85'
            }
          >
            {t.SearchCreatures}
          </h3>
          <p
            className={compact ? 'mt-1 text-[11px] text-slate-400' : 'mt-1 text-sm text-slate-400'}
          >
            {t.SearchCreaturesBody}
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateCreature}
          className={`rounded-full border border-amber-400/20 bg-amber-400/10 font-medium text-amber-100 transition hover:bg-amber-400/15 ${
            compact
              ? 'w-full px-3 py-1 text-[11px] text-center'
              : 'w-full px-4 py-2 text-sm'
          }`}
        >
          {t.CreateCreature}
        </button>
      </div>

      <div className="mt-3 space-y-3">
        <input
          type="text"
          placeholder={t.SearchCreaturesPlaceholder}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 text-white outline-none placeholder:text-slate-500 focus:border-amber-400/70 focus:bg-white/10"
        />

        {isLoading && (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-8 text-center text-slate-400">
            {t.SearchCreaturesLoading}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {!isLoading && searchQuery && searchResults.length === 0 && !error && (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-8 text-center text-slate-400">
            {t.SearchCreaturesEmpty}
          </div>
        )}

        {!isLoading && searchResults.length > 0 && (
          <div className="grid min-w-0 gap-2">
            {searchResults.map((creature) => (
              <button
                key={creature.index}
                type="button"
                onClick={() => void handleCreatureSelect(creature)}
                className="flex w-full min-w-0 items-center justify-between gap-2 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-amber-400/40 hover:bg-white/[0.08]"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-white">{creature.name}</div>
                  <div className="mt-1 truncate text-sm text-slate-400">
                    CR {creature.challengeRating ?? '?'} · XP {creature.xp ?? '?'}
                  </div>
                </div>
                {isLoadingDetails && selectedCreature?.index === creature.index && (
                  <div className="shrink-0 whitespace-nowrap rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">
                    {t.LoadingCreature}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {!searchQuery && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 py-8 text-center text-slate-400">
            {t.SearchCreaturesStart}
          </div>
        )}
      </div>
    </section>
  );
}
