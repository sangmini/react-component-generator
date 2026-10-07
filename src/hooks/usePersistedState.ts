import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { readJSON, writeJSON } from '../utils/storage';

/** localStorage에 값을 동기화하는 useState. 읽은 값은 parse로 검증·복원한다. */
export function usePersistedState<T>(
  key: string,
  parse: (value: unknown) => T,
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => parse(readJSON(key)));

  useEffect(() => {
    writeJSON(key, state);
  }, [key, state]);

  return [state, setState];
}
