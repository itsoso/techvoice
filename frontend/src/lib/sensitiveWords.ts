const SENSITIVE_WORDS = ["去死", "杀人", "恐怖袭击", "极端主义"];

export function containsSensitiveWord(content: string) {
  return SENSITIVE_WORDS.some((word) => content.includes(word));
}
