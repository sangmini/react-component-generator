export const MAX_PROMPT_LENGTH = 500;

export interface PromptLengthResult {
  valid: boolean;
  length: number;
}

/** 서버로 전송되는 값(trim 후)을 기준으로 프롬프트 길이를 검증한다. */
export function validatePromptLength(prompt: string): PromptLengthResult {
  const length = prompt.trim().length;
  return { valid: length <= MAX_PROMPT_LENGTH, length };
}
