export interface SessionReport {
  id: string;
  timestamp: number;
  grammarScore: number; // 0-100
  vocabularyScore: number; // 0-100
  fluencyScore: number; // 0-100
  pacingScore: number; // 0-100
  summary: string;
  keyImprovements: string[];
  vocabularySuggestions: { original: string; suggested: string; reason: string }[];
}

const STORAGE_KEY = 'profx_session_history';

export const getSessionHistory = (): SessionReport[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveSessionReport = (report: SessionReport) => {
  const history = getSessionHistory();
  const updated = [report, ...history].slice(0, 50); // Keep last 50
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const clearHistory = () => {
  localStorage.removeItem(STORAGE_KEY);
};
