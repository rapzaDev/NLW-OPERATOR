import type { BundledLanguage } from "shiki";
import { DEFAULT_ROAST_LANGUAGE } from "./roast";

export const codeEditorLanguages = [
  { label: "Angular HTML", value: "angular-html" },
  { label: "Angular TypeScript", value: "angular-ts" },
  { label: "Astro", value: "astro" },
  { label: "Blade", value: "blade" },
  { label: "C", value: "c" },
  { label: "CoffeeScript", value: "coffee" },
  { label: "C++", value: "cpp" },
  { label: "CSS", value: "css" },
  { label: "CSV", value: "csv" },
  { label: "GLSL", value: "glsl" },
  { label: "GraphQL", value: "graphql" },
  { label: "Ruby Haml", value: "haml" },
  { label: "Handlebars", value: "handlebars" },
  { label: "HTML", value: "html" },
  { label: "HTML (Derivative)", value: "html-derivative" },
  { label: "HTTP", value: "http" },
  { label: "Hurl", value: "hurl" },
  { label: "Imba", value: "imba" },
  { label: "Java", value: "java" },
  { label: "JavaScript", value: "javascript" },
  { label: "Jinja", value: "jinja" },
  { label: "Jison", value: "jison" },
  { label: "JSON", value: "json" },
  { label: "JSON5", value: "json5" },
  { label: "JSON with Comments", value: "jsonc" },
  { label: "JSON Lines", value: "jsonl" },
  { label: "JSX", value: "jsx" },
  { label: "Julia", value: "julia" },
  { label: "Less", value: "less" },
  { label: "Markdown", value: "markdown" },
  { label: "Marko", value: "marko" },
  { label: "MDC", value: "mdc" },
  { label: "MDX", value: "mdx" },
  { label: "PHP", value: "php" },
  { label: "PostCSS", value: "postcss" },
  { label: "Pug", value: "pug" },
  { label: "Python", value: "python" },
  { label: "R", value: "r" },
  { label: "RegExp", value: "regexp" },
  { label: "Sass", value: "sass" },
  { label: "SCSS", value: "scss" },
  { label: "Shell", value: "shellscript" },
  { label: "SQL", value: "sql" },
  { label: "Stylus", value: "stylus" },
  { label: "Svelte", value: "svelte" },
  { label: "TypeScript with Tags", value: "ts-tags" },
  { label: "TSX", value: "tsx" },
  { label: "TypeScript", value: "typescript" },
  { label: "Vue", value: "vue" },
  { label: "Vue HTML", value: "vue-html" },
  { label: "Vue Vine", value: "vue-vine" },
  { label: "WebAssembly", value: "wasm" },
  { label: "WGSL", value: "wgsl" },
  { label: "WebAssembly Interface Types", value: "wit" },
  { label: "XML", value: "xml" },
  { label: "YAML", value: "yaml" },
] as const satisfies ReadonlyArray<{
  label: string;
  value: BundledLanguage;
}>;

export type CodeEditorLanguage = (typeof codeEditorLanguages)[number]["value"];
export type CodeEditorLanguageMode = CodeEditorLanguage | "auto";

export type CodeLanguageDetector = {
  highlightAuto: (
    code: string,
    languageSubset?: string[],
  ) => {
    language?: string;
  };
};

const codeEditorLanguageValues = codeEditorLanguages.map(
  ({ value }) => value,
) as CodeEditorLanguage[];
const codeEditorLanguageSet = new Set<string>(codeEditorLanguageValues);
const minimumDetectedCodeLength = 6;
const autoDetectLanguageCandidates = [
  "python",
  "javascript",
  "typescript",
  "jsx",
  "tsx",
  "java",
  "c",
  "cpp",
  "php",
  "ruby",
  "bash",
  "shell",
  "sql",
  "pgsql",
  "xml",
  "css",
  "scss",
  "sass",
  "less",
  "graphql",
  "json",
  "json5",
  "yaml",
  "markdown",
  "handlebars",
  "pug",
] as const;
const codeEditorLanguageAliases = {
  "c++": "cpp",
  bash: "shellscript",
  cjs: "javascript",
  coffeescript: "coffee",
  cts: "typescript",
  gql: "graphql",
  hbs: "handlebars",
  jade: "pug",
  js: "javascript",
  md: "markdown",
  mjs: "javascript",
  mts: "typescript",
  py: "python",
  pgsql: "sql",
  regex: "regexp",
  sh: "shellscript",
  shell: "shellscript",
  styl: "stylus",
  ts: "typescript",
  yml: "yaml",
  zsh: "shellscript",
} as const satisfies Partial<Record<string, CodeEditorLanguage>>;

let codeLanguageDetectorPromise: Promise<CodeLanguageDetector> | null = null;

function isCodeEditorLanguage(value: string): value is CodeEditorLanguage {
  return codeEditorLanguageSet.has(value);
}

function hasMeaningfulCodeContent(code: string) {
  const normalizedCode = code.trim();
  const meaningfulLength = normalizedCode.replace(/\s+/g, "").length;

  return (
    normalizedCode.length > 0 && meaningfulLength >= minimumDetectedCodeLength
  );
}

export function normalizeDetectedCodeLanguage(
  code: string,
  detectedLanguage: string | undefined,
): CodeEditorLanguage | null {
  if (!detectedLanguage) {
    return null;
  }

  const normalizedLanguage: string =
    codeEditorLanguageAliases[
      detectedLanguage as keyof typeof codeEditorLanguageAliases
    ] ?? detectedLanguage;

  if (normalizedLanguage === "xml") {
    const normalizedCode = code.toLowerCase();

    if (
      normalizedCode.includes("<!doctype html") ||
      normalizedCode.includes("<html")
    ) {
      return "html";
    }
  }

  return isCodeEditorLanguage(normalizedLanguage) ? normalizedLanguage : null;
}

export async function getCodeLanguageDetector() {
  if (!codeLanguageDetectorPromise) {
    codeLanguageDetectorPromise = import("highlight.js").then(
      (highlightJsModule) => highlightJsModule.default,
    );
  }

  return codeLanguageDetectorPromise;
}

export async function detectCodeLanguage(
  code: string,
  loadDetector: () => Promise<CodeLanguageDetector> = getCodeLanguageDetector,
) {
  if (!hasMeaningfulCodeContent(code)) {
    return null;
  }

  try {
    const languageDetector = await loadDetector();
    const detectionResult = languageDetector.highlightAuto(
      code,
      autoDetectLanguageCandidates.slice(),
    );

    return normalizeDetectedCodeLanguage(code, detectionResult.language);
  } catch {
    return null;
  }
}

export async function resolveRoastSubmitLanguage(
  {
    code,
    languageMode,
    resolvedLanguage,
  }: {
    code: string;
    languageMode: CodeEditorLanguageMode;
    resolvedLanguage: CodeEditorLanguage | null;
  },
  loadDetector: () => Promise<CodeLanguageDetector> = getCodeLanguageDetector,
) {
  if (languageMode !== "auto") {
    return languageMode;
  }

  const detectedLanguage = await detectCodeLanguage(code, loadDetector);

  return detectedLanguage ?? resolvedLanguage ?? DEFAULT_ROAST_LANGUAGE;
}
