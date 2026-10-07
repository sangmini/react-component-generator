import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  MAX_HISTORY,
  addPromptToHistory,
  parseApiKey,
  parseComponents,
  parseHistory,
  parseProvider,
  readJSON,
  writeJSON,
} from './storage';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('readJSON / writeJSON', () => {
  it('저장한 값을 그대로 읽는다', () => {
    writeJSON('k', { a: 1 });
    expect(readJSON('k')).toEqual({ a: 1 });
  });

  it('저장된 값이 없으면 undefined를 반환한다', () => {
    expect(readJSON('none')).toBeUndefined();
  });

  it('JSON이 깨져 있으면 undefined를 반환한다', () => {
    localStorage.setItem('k', '{broken');
    expect(readJSON('k')).toBeUndefined();
  });

  it('저장소가 가득 차 setItem이 실패해도 예외를 던지지 않는다', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    expect(() => writeJSON('k', 'v')).not.toThrow();
  });
});

describe('parseProvider', () => {
  it('유효한 provider는 그대로 반환한다', () => {
    expect(parseProvider('anthropic')).toBe('anthropic');
  });

  it('값이 없으면 google을 기본값으로 쓴다', () => {
    expect(parseProvider(undefined)).toBe('google');
  });

  it('알 수 없는 값이면 google을 기본값으로 쓴다', () => {
    expect(parseProvider('openai')).toBe('google');
  });
});

describe('parseApiKey', () => {
  it('문자열이면 그대로 반환한다', () => {
    expect(parseApiKey('sk-ant-123')).toBe('sk-ant-123');
  });

  it('문자열이 아니면 빈 문자열을 반환한다', () => {
    expect(parseApiKey(42)).toBe('');
  });
});

describe('parseHistory', () => {
  it('문자열 배열은 그대로 반환한다', () => {
    expect(parseHistory(['a', 'b'])).toEqual(['a', 'b']);
  });

  it('배열이 아니면 빈 배열을 반환한다', () => {
    expect(parseHistory('a')).toEqual([]);
  });

  it('문자열이 아닌 항목은 제외한다', () => {
    expect(parseHistory(['a', 1, null, 'b'])).toEqual(['a', 'b']);
  });
});

describe('addPromptToHistory', () => {
  it('새 프롬프트를 맨 앞에 추가한다', () => {
    expect(addPromptToHistory(['a'], 'b')).toEqual(['b', 'a']);
  });

  it('이미 있는 프롬프트는 중복 없이 맨 앞으로 옮긴다', () => {
    expect(addPromptToHistory(['a', 'b', 'c'], 'c')).toEqual(['c', 'a', 'b']);
  });

  it(`최대 ${MAX_HISTORY}개까지만 유지한다`, () => {
    const history = Array.from({ length: MAX_HISTORY }, (_, i) => `p${i}`);
    const next = addPromptToHistory(history, 'new');
    expect(next).toHaveLength(MAX_HISTORY);
    expect(next[0]).toBe('new');
    expect(next).not.toContain(`p${MAX_HISTORY - 1}`);
  });
});

describe('parseComponents', () => {
  const raw = {
    id: '1',
    prompt: '버튼',
    code: 'render(<div />)',
    createdAt: '2026-01-02T03:04:05.000Z',
  };

  it('createdAt 문자열을 Date로 복원한다', () => {
    const [component] = parseComponents([raw]);
    expect(component.createdAt).toBeInstanceOf(Date);
    expect(component.createdAt.toISOString()).toBe(raw.createdAt);
  });

  it('배열이 아니면 빈 배열을 반환한다', () => {
    expect(parseComponents({})).toEqual([]);
  });

  it('형태가 맞지 않는 항목은 제외한다', () => {
    const result = parseComponents([raw, { id: '2' }, null, { ...raw, id: '3', code: 1 }]);
    expect(result.map((c) => c.id)).toEqual(['1']);
  });

  it('날짜가 유효하지 않은 항목은 제외한다', () => {
    expect(parseComponents([{ ...raw, createdAt: 'not-a-date' }])).toEqual([]);
  });
});
