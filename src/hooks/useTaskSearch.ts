import { getAllTasks } from '../lib/db';
import { useDatedSearch } from './useDatedSearch';
import type { SearchScope } from './useDatedSearch';

export type { SearchScope };

// Any status matches — search finds tasks regardless of open/done. The
// matching/scoping logic itself lives in useDatedSearch, shared with Diary's
// search over diaryEntries.
export function useTaskSearch(query: string, scope: SearchScope) {
  return useDatedSearch(query, scope, getAllTasks);
}
