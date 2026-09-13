import { getAllDiaryEntries } from '../lib/db';
import { useDatedSearch } from './useDatedSearch';
import type { SearchScope } from './useDatedSearch';

export type { SearchScope };

// Same matching/scoping logic as Checklist's useTaskSearch (shared via
// useDatedSearch) — this just points it at the "diaryEntries" store instead.
export function useDiaryEntrySearch(query: string, scope: SearchScope) {
  return useDatedSearch(query, scope, getAllDiaryEntries);
}
