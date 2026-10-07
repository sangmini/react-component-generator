import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { readJSON, writeJSON } from '../utils/storage';

/** localStorage에 값을 동기화하는 useState. 읽은 값은 parse로 검증·복원한다. */
export function usePersistedState<T>(
  key: string,
  parse: (value: unknown) => T,
  write: (key: string, value: T) => unknown = writeJSON,
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => parse(readJSON(key)));

  useEffect(() => {
    write(key, state);
    // write는 호출부에서 고정된 함수를 넘기므로 의존성에서 제외한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, state]);

  return [state, setState];
}
