import { MusicSources, StorageKeys } from '@/types/app';

export const MUSIC_SETTINGS_STORAGE_KEY = StorageKeys.MusicSettings;

export type MusicSource = (typeof MusicSources)[keyof typeof MusicSources];

export interface MusicSettings {
  source: MusicSource;
  youtubePlaylistInput: string;
}

export const DEFAULT_MUSIC_SETTINGS: MusicSettings = {
  source: MusicSources.YouTube,
  youtubePlaylistInput: '',
};

export const normalizeMusicSettings = (
  raw: Partial<MusicSettings> | null | undefined,
): MusicSettings => ({
  source: raw?.source === MusicSources.Local ? MusicSources.Local : MusicSources.YouTube,
  youtubePlaylistInput:
    typeof raw?.youtubePlaylistInput === 'string' ? raw.youtubePlaylistInput : '',
});

export const loadMusicSettings = (): MusicSettings => {
  if (typeof window === 'undefined') {
    return DEFAULT_MUSIC_SETTINGS;
  }

  try {
    const rawValue = window.localStorage.getItem(MUSIC_SETTINGS_STORAGE_KEY);
    if (!rawValue) {
      return DEFAULT_MUSIC_SETTINGS;
    }

    return normalizeMusicSettings(JSON.parse(rawValue) as Partial<MusicSettings>);
  } catch {
    return DEFAULT_MUSIC_SETTINGS;
  }
};

export const saveMusicSettings = (settings: MusicSettings) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    MUSIC_SETTINGS_STORAGE_KEY,
    JSON.stringify(normalizeMusicSettings(settings)),
  );
};

export const extractYouTubePlaylistId = (input: string) => {
  const trimmed = input.trim();
  if (!trimmed) {
    return '';
  }

  if (!trimmed.includes('http')) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const playlistId = url.searchParams.get('list');
    if (playlistId) {
      return playlistId;
    }

    const pathSegments = url.pathname.split('/').filter(Boolean);
    return pathSegments[pathSegments.length - 1] ?? '';
  } catch {
    return trimmed;
  }
};

export const buildYouTubePlaylistEmbedUrl = (input: string) => {
  const playlistId = extractYouTubePlaylistId(input);
  if (!playlistId) {
    return '';
  }

  const params = new URLSearchParams({
    list: playlistId,
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
  });

  return `https://www.youtube-nocookie.com/embed/videoseries?${params.toString()}`;
};
