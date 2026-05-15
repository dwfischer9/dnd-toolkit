import { titleCase as formatTitleCase } from 'title-case';

export const toTitleCase = (value: string) => {
  const normalized = value.trim();
  if (!normalized) {
    return '';
  }
  return formatTitleCase(normalized);
};
