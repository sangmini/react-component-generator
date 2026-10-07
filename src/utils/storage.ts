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

/** localStorage에 JSON을 쓴다. 용량 초과 등으로 실패해도 앱 동작을 막지 않는다. */
export function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 실패는 무시한다 (영속화는 부가 기능).
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
  return value.filter((item): item is string => typeof item === 'string');
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
