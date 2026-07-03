export const REVIEW_LANGUAGES = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'C',
  'C++',
  'C#',
  'Go',
  'Rust',
  'PHP',
  'Ruby',
  'Swift',
  'Kotlin',
  'Scala',
  'SQL',
  'Shell'
] as const;

type LanguageMeta = {
  monacoId: string;
  extension: string;
};

const DEFAULT_LANGUAGE_META: LanguageMeta = {
  monacoId: 'plaintext',
  extension: 'txt'
};

export const LANGUAGE_META: Record<(typeof REVIEW_LANGUAGES)[number], LanguageMeta> = {
  JavaScript: { monacoId: 'javascript', extension: 'js' },
  TypeScript: { monacoId: 'typescript', extension: 'ts' },
  Python: { monacoId: 'python', extension: 'py' },
  Java: { monacoId: 'java', extension: 'java' },
  C: { monacoId: 'c', extension: 'c' },
  'C++': { monacoId: 'cpp', extension: 'cpp' },
  'C#': { monacoId: 'csharp', extension: 'cs' },
  Go: { monacoId: 'go', extension: 'go' },
  Rust: { monacoId: 'rust', extension: 'rs' },
  PHP: { monacoId: 'php', extension: 'php' },
  Ruby: { monacoId: 'ruby', extension: 'rb' },
  Swift: { monacoId: 'swift', extension: 'swift' },
  Kotlin: { monacoId: 'kotlin', extension: 'kt' },
  Scala: { monacoId: 'scala', extension: 'scala' },
  SQL: { monacoId: 'sql', extension: 'sql' },
  Shell: { monacoId: 'shell', extension: 'sh' }
};

export const getLanguageMeta = (language: string): LanguageMeta => {
  return LANGUAGE_META[language as keyof typeof LANGUAGE_META] ?? DEFAULT_LANGUAGE_META;
};
