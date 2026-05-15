'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  buildYouTubePlaylistEmbedUrl,
  extractYouTubePlaylistId,
  loadMusicSettings,
  saveMusicSettings,
} from '@/services/music';
import { MusicSources } from '@/types/app';
import type { MusicSource } from '@/types/app';

interface LocalTrack {
  id: string;
  name: string;
  url: string;
  type: string;
}

interface MusicPanelProps {
  compact?: boolean;
}

const buildTrackId = (name: string, index: number) => `${name}:${index}:${crypto.randomUUID()}`;

export default function MusicPanel({ compact = false }: MusicPanelProps) {
  const [source, setSource] = useState<MusicSource>(MusicSources.YouTube);
  const [youtubePlaylistInput, setYoutubePlaylistInput] = useState('');
  const [tracks, setTracks] = useState<LocalTrack[]>([]);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const tracksRef = useRef<LocalTrack[]>([]);

  useEffect(() => {
    const settings = loadMusicSettings();
    setSource(settings.source);
    setYoutubePlaylistInput(settings.youtubePlaylistInput);
    setIsExpanded(Boolean(settings.youtubePlaylistInput));
  }, []);

  useEffect(() => {
    saveMusicSettings({ source, youtubePlaylistInput });
  }, [source, youtubePlaylistInput]);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(
    () => () => {
      tracksRef.current.forEach((track) => window.URL.revokeObjectURL(track.url));
    },
    [],
  );

  const playlistId = useMemo(
    () => extractYouTubePlaylistId(youtubePlaylistInput),
    [youtubePlaylistInput],
  );
  const youtubeEmbedUrl = useMemo(
    () => buildYouTubePlaylistEmbedUrl(youtubePlaylistInput),
    [youtubePlaylistInput],
  );
  const activeTrack = tracks.find((track) => track.id === activeTrackId) ?? null;
  const currentSourceLabel = source === MusicSources.YouTube ? 'YouTube' : 'Local';

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) {
      return;
    }

    const nextTracks = selectedFiles.map((file, index) => ({
      id: buildTrackId(file.name, index),
      name: file.name,
      url: window.URL.createObjectURL(file),
      type: file.type || 'audio/*',
    }));

    setTracks((previousTracks) => {
      const nextList = [...previousTracks, ...nextTracks];
      if (!activeTrackId && nextList[0]) {
        setActiveTrackId(nextList[0].id);
      }
      return nextList;
    });

    setSource(MusicSources.Local);
    setIsExpanded(true);
    event.target.value = '';
  };

  const removeTrack = (trackId: string) => {
    setTracks((previousTracks) => {
      const nextTracks = previousTracks.filter((track) => track.id !== trackId);
      const removedTrack = previousTracks.find((track) => track.id === trackId);
      if (removedTrack) {
        window.URL.revokeObjectURL(removedTrack.url);
      }

      if (activeTrackId === trackId) {
        setActiveTrackId(nextTracks[0]?.id ?? null);
      }

      return nextTracks;
    });
  };

  const clearTracks = () => {
    tracks.forEach((track) => window.URL.revokeObjectURL(track.url));
    setTracks([]);
    setActiveTrackId(null);
  };

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-slate-950/50 ${compact ? 'space-y-2 p-3' : 'space-y-3 p-4'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3
            className={
              compact
                ? 'text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200/80'
                : 'text-sm font-semibold uppercase tracking-[0.25em] text-cyan-200/80'
            }
          >
            Music
          </h3>
          <p
            className={compact ? 'mt-1 text-[11px] text-slate-400' : 'mt-1 text-xs text-slate-400'}
          >
            {currentSourceLabel}
            {source === MusicSources.YouTube && playlistId ? ' playlist ready' : ''}
            {source === MusicSources.Local && tracks.length > 0
              ? ` • ${tracks.length} track${tracks.length === 1 ? '' : 's'}`
              : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded((previous) => !previous)}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-200 transition hover:bg-white/10"
        >
          {isExpanded ? 'Hide' : 'Show'}
        </button>
      </div>

      {isExpanded && (
        <div className={compact ? 'space-y-2' : 'space-y-3'}>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSource(MusicSources.YouTube)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                source === MusicSources.YouTube
                  ? 'bg-cyan-400 text-slate-950'
                  : 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
              }`}
            >
              YouTube
            </button>
            <button
              type="button"
              onClick={() => setSource(MusicSources.Local)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                source === MusicSources.Local
                  ? 'bg-cyan-400 text-slate-950'
                  : 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
              }`}
            >
              Local
            </button>
          </div>

          {source === MusicSources.YouTube ? (
            <div className="space-y-2">
              <label className="block space-y-1.5">
                <span className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                  Playlist URL or ID
                </span>
                <input
                  type="text"
                  value={youtubePlaylistInput}
                  onChange={(event) => setYoutubePlaylistInput(event.target.value)}
                  placeholder="https://www.youtube.com/playlist?list=..."
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400/60"
                />
              </label>

              <p className="text-[11px] leading-5 text-slate-400">
                Public playlists can play without a login. The embedded player loads here in the
                browser.
              </p>

              {youtubeEmbedUrl ? (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
                  <iframe
                    title="YouTube playlist player"
                    className="aspect-video w-full"
                    src={youtubeEmbedUrl}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-3 py-4 text-center text-xs text-slate-400">
                  Paste a playlist link to load the player.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                multiple
                onChange={handleFileChange}
                className="block w-full cursor-pointer rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-950 hover:bg-slate-950/80"
              />

              <p className="text-[11px] leading-5 text-slate-400">
                Imported audio plays in this browser session. Refreshing will clear the files.
              </p>

              {tracks.length > 0 ? (
                <div className="space-y-2">
                  <audio controls className="w-full" src={activeTrack?.url ?? tracks[0]?.url} />
                  <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
                    {tracks.map((track) => (
                      <div
                        key={track.id}
                        className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs ${
                          activeTrackId === track.id
                            ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-50'
                            : 'border-white/10 bg-white/[0.04] text-slate-200'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveTrackId(track.id)}
                          className="min-w-0 flex-1 truncate text-left"
                        >
                          {track.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeTrack(track.id)}
                          className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-300 transition hover:bg-white/10"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={clearTracks}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition hover:bg-white/10"
                  >
                    Clear Imported Tracks
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-3 py-4 text-center text-xs text-slate-400">
                  Import one or more audio files to build a local playlist.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
