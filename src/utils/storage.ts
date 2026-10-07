import type { GeneratedComponent, Provider } from '../types';

export const MAX_HISTORY = 20;

export const STORAGE_KEYS = {
  apiKey: 'rcg:apiKey',
  provider: 'rcg:provider',
  history: 'rcg:promptHistory',
  components: 'rcg:components',
} as const;

const DEFAULT_PROVIDER: Provider = 'google';

/** localStorage에서 JSON을 읽는다. 값이 없거나 깨져 있으면 undefined. */
export function readJSON(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/** localStorage에 JSON을 쓴다. 용량 초과 등으로 실패하면 false (앱 동작은 막지 않는다). */
export function writeJSON(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * 최신순 목록을 저장한다. 용량이 부족하면 오래된(뒤쪽) 항목부터 버리며 다시 시도한다.
 * 메모리의 목록은 건드리지 않고, 저장되는 분량만 줄인다.
 */
export function writeTrimmedList(key: string, items: unknown[]): void {
  for (let count = items.length; count >= 0; count--) {
    if (writeJSON(key, items.slice(0, count))) return;
  }
}

export function parseProvider(value: unknown): Provider {
  return value === 'anthropic' || value === 'google' ? value : DEFAULT_PROVIDER;
}

export function parseApiKey(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function parseHistory(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const strings = value.filter((item): item is string => typeof item === 'string');
  return [...new Set(strings)].slice(0, MAX_HISTORY);
}

/** 새 프롬프트를 맨 앞에 두고, 중복은 제거하며, 최대 개수를 유지한다. */
export function addPromptToHistory(history: string[], prompt: string): string[] {
  return [prompt, ...history.filter((item) => item !== prompt)].slice(0, MAX_HISTORY);
}

export function parseComponents(value: unknown): GeneratedComponent[] {
  if (!Array.isArray(value)) return [];
  const components: GeneratedComponent[] = [];
  for (const item of value) {
    if (typeof item !== 'object' || item === null) continue;
    const { id, prompt, code, createdAt } = item as Record<string, unknown>;
    if (typeof id !== 'string' || typeof prompt !== 'string' || typeof code !== 'string') continue;
    if (typeof createdAt !== 'string' && typeof createdAt !== 'number') continue;
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) continue;
    components.push({ id, prompt, code, createdAt: date });
  }
  return components;
}
