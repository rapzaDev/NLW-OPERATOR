"use client";

import { ChevronDown } from "lucide-react";
import type {
  ComponentPropsWithoutRef,
  HTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import {
  createContext,
  startTransition,
  useContext,
  useDeferredValue,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type { BundledLanguage } from "shiki";

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

const codeEditorTheme = "vesper";
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

const codeEditorLanguageValues = codeEditorLanguages.map(
  ({ value }) => value,
) as CodeEditorLanguage[];
const codeEditorLanguageSet = new Set<string>(codeEditorLanguageValues);
const codeEditorLanguageLabelByValue = Object.fromEntries(
  codeEditorLanguages.map(({ label, value }) => [value, label]),
) as Record<CodeEditorLanguage, string>;
const minimumDetectedCodeLength = 6;
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
  regex: "regexp",
  sh: "shellscript",
  shell: "shellscript",
  styl: "stylus",
  ts: "typescript",
  yml: "yaml",
  zsh: "shellscript",
} as const satisfies Partial<Record<string, CodeEditorLanguage>>;

type CodeEditorHighlightToken = {
  color?: string;
  content: string;
  offset: number;
};

type CodeEditorHighlightSnapshot = {
  code: string;
  fg: string;
  language: CodeEditorLanguage;
  lines: CodeEditorHighlightToken[][];
};

type CodeEditorContextValue = {
  commentId: string;
  currentLanguageMode: CodeEditorLanguageMode;
  currentValue: string;
  detectedLanguage: CodeEditorLanguage | null;
  minLines: number;
  resolvedLanguage: CodeEditorLanguage | null;
  setLanguageMode: (language: CodeEditorLanguageMode) => void;
  setValue: (value: string) => void;
};

const CodeEditorContext = createContext<CodeEditorContextValue | null>(null);

type CodeEditorLanguageDetector = Awaited<
  typeof import("highlight.js")
>["default"];

async function createCodeEditorHighlighter() {
  const { getSingletonHighlighter } = await import("shiki/bundle/web");

  return getSingletonHighlighter({
    themes: [codeEditorTheme],
  });
}

type CodeEditorHighlighter = Awaited<
  ReturnType<typeof createCodeEditorHighlighter>
>;

let highlighterPromise: Promise<CodeEditorHighlighter> | null = null;
let languageDetectorPromise: Promise<CodeEditorLanguageDetector> | null = null;

async function getCodeEditorHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createCodeEditorHighlighter();
  }

  return highlighterPromise;
}

async function getCodeEditorLanguageDetector() {
  if (!languageDetectorPromise) {
    languageDetectorPromise = import("highlight.js").then(
      (highlightJsModule) => highlightJsModule.default,
    );
  }

  return languageDetectorPromise;
}

function isCodeEditorLanguage(value: string): value is CodeEditorLanguage {
  return codeEditorLanguageSet.has(value);
}

function normalizeDetectedLanguage(
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

function useCodeEditorContext() {
  const context = useContext(CodeEditorContext);

  if (!context) {
    throw new Error(
      "CodeEditor subcomponents must be used within CodeEditorRoot.",
    );
  }

  return context;
}

export interface CodeEditorRootProps
  extends Omit<ComponentPropsWithoutRef<"figure">, "children"> {
  children: ReactNode;
  defaultLanguage?: CodeEditorLanguageMode;
  defaultValue?: string;
  language?: CodeEditorLanguageMode;
  minLines?: number;
  onLanguageChange?: (language: CodeEditorLanguageMode) => void;
  onValueChange?: (value: string) => void;
  value?: string;
}

export function CodeEditorRoot({
  children,
  className,
  defaultLanguage = "auto",
  defaultValue = "",
  language,
  minLines = 14,
  onLanguageChange,
  onValueChange,
  value,
  ...props
}: CodeEditorRootProps) {
  const commentId = useId();
  const [uncontrolledLanguageMode, setUncontrolledLanguageMode] =
    useState(defaultLanguage);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [detectedLanguage, setDetectedLanguage] =
    useState<CodeEditorLanguage | null>(null);
  const currentLanguageMode = language ?? uncontrolledLanguageMode;
  const isControlled = value !== undefined;
  const isLanguageControlled = language !== undefined;
  const currentValue = isControlled ? value : uncontrolledValue;
  const deferredValue = useDeferredValue(currentValue);
  const resolvedLanguage =
    currentLanguageMode === "auto" ? detectedLanguage : currentLanguageMode;

  useEffect(() => {
    let isCancelled = false;
    const normalizedValue = deferredValue.trim();
    const meaningfulLength = normalizedValue.replace(/\s+/g, "").length;

    if (currentLanguageMode !== "auto") {
      return;
    }

    if (!normalizedValue || meaningfulLength < minimumDetectedCodeLength) {
      startTransition(() => {
        setDetectedLanguage(null);
      });

      return;
    }

    void getCodeEditorLanguageDetector()
      .then((languageDetector) => languageDetector.highlightAuto(deferredValue))
      .then((detectionResult) => {
        if (isCancelled) {
          return;
        }

        startTransition(() => {
          setDetectedLanguage(
            normalizeDetectedLanguage(deferredValue, detectionResult.language),
          );
        });
      })
      .catch(() => {
        if (isCancelled) {
          return;
        }

        startTransition(() => {
          setDetectedLanguage(null);
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [currentLanguageMode, deferredValue]);

  return (
    <CodeEditorContext.Provider
      value={{
        commentId,
        currentLanguageMode,
        currentValue,
        detectedLanguage,
        minLines,
        resolvedLanguage,
        setLanguageMode: (nextLanguage) => {
          if (!isLanguageControlled) {
            setUncontrolledLanguageMode(nextLanguage);
          }

          onLanguageChange?.(nextLanguage);
        },
        setValue: (nextValue) => {
          if (!isControlled) {
            setUncontrolledValue(nextValue);
          }

          onValueChange?.(nextValue);
        },
      }}
    >
      <figure
        className={joinClasses(
          "overflow-hidden border border-stroke bg-surface",
          className,
        )}
        {...props}
      >
        {children}
      </figure>
    </CodeEditorContext.Provider>
  );
}

export interface CodeEditorHeaderProps extends HTMLAttributes<HTMLElement> {}

export function CodeEditorHeader({
  children,
  className,
  ...props
}: CodeEditorHeaderProps) {
  return (
    <figcaption
      className={joinClasses(
        "flex h-10 items-center gap-2 border-b border-stroke px-3 sm:gap-3 sm:px-4",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="size-2 rounded-full bg-critical sm:size-2.5"
      />
      <span
        aria-hidden="true"
        className="size-2 rounded-full bg-warning sm:size-2.5"
      />
      <span
        aria-hidden="true"
        className="size-2 rounded-full bg-accent-green sm:size-2.5"
      />
      {children}
    </figcaption>
  );
}

export interface CodeEditorLanguageSelectProps
  extends Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    "children" | "defaultValue" | "onChange" | "value"
  > {}

export function CodeEditorLanguageSelect({
  className,
  ...props
}: CodeEditorLanguageSelectProps) {
  const { currentLanguageMode, detectedLanguage, setLanguageMode } =
    useCodeEditorContext();
  const autoLabel = detectedLanguage
    ? `Auto (${codeEditorLanguageLabelByValue[detectedLanguage]})`
    : "Auto detect";

  return (
    <div className={joinClasses("ml-auto", className)}>
      <div className="relative">
        <select
          aria-label="Select syntax language"
          className="h-8 appearance-none border border-stroke bg-surface-subtle pl-3 pr-8 font-display text-[11px] uppercase tracking-[0.18em] text-foreground outline-none transition-colors hover:border-subtle focus-visible:border-accent-green sm:text-[12px]"
          onChange={(event) => {
            setLanguageMode(event.target.value as CodeEditorLanguageMode);
          }}
          value={currentLanguageMode}
          {...props}
        >
          <option value="auto">{autoLabel}</option>
          {codeEditorLanguages.map((languageOption) => (
            <option key={languageOption.value} value={languageOption.value}>
              {languageOption.label}
            </option>
          ))}
        </select>

        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-subtle"
          strokeWidth={1.75}
        />
      </div>
    </div>
  );
}

export interface CodeEditorCommentProps
  extends HTMLAttributes<HTMLDivElement> {}

export function CodeEditorComment({
  children,
  className,
  ...props
}: CodeEditorCommentProps) {
  const { commentId } = useCodeEditorContext();

  return (
    <div
      className={joinClasses(
        "border-b border-stroke px-3 py-2.5 font-body text-xs leading-5 text-subtle sm:px-4",
        className,
      )}
      id={commentId}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CodeEditorBodyProps extends HTMLAttributes<HTMLDivElement> {}

export function CodeEditorBody({
  children,
  className,
  ...props
}: CodeEditorBodyProps) {
  return (
    <div
      className={joinClasses(
        "flex max-h-[32rem] overflow-x-hidden overflow-y-auto",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CodeEditorLineNumbersProps
  extends ComponentPropsWithoutRef<"ol"> {}

export function CodeEditorLineNumbers({
  className,
  ...props
}: CodeEditorLineNumbersProps) {
  const { currentValue, minLines } = useCodeEditorContext();
  const visibleLineCount = Math.max(currentValue.split("\n").length, minLines);
  const lineNumbers = Array.from({ length: visibleLineCount }, (_, index) => ({
    id: `editor-line-${index + 1}`,
    value: index + 1,
  }));

  return (
    <ol
      aria-hidden="true"
      className={joinClasses(
        "flex w-8 shrink-0 flex-col items-end gap-1.5 border-r border-stroke bg-surface-muted px-2 py-3 font-display text-[11px] leading-[1.55] text-subtle sm:w-10 sm:px-[10px] sm:text-[13px] sm:leading-[1.45]",
        className,
      )}
      {...props}
    >
      {lineNumbers.map((lineNumber) => (
        <li key={lineNumber.id}>{lineNumber.value}</li>
      ))}
    </ol>
  );
}

export interface CodeEditorInputProps
  extends Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    "children" | "defaultValue" | "value"
  > {}

export function CodeEditorInput({
  className,
  onChange,
  spellCheck = false,
  wrap = "off",
  ...props
}: CodeEditorInputProps) {
  const { commentId, currentValue, minLines, resolvedLanguage, setValue } =
    useCodeEditorContext();
  const deferredValue = useDeferredValue(currentValue);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const mirrorRef = useRef<HTMLPreElement | null>(null);
  const [highlightSnapshot, setHighlightSnapshot] =
    useState<CodeEditorHighlightSnapshot | null>(null);
  const visibleLineCount = Math.max(currentValue.split("\n").length, minLines);
  const isHighlightReady =
    resolvedLanguage !== null &&
    highlightSnapshot?.code === currentValue &&
    highlightSnapshot.language === resolvedLanguage;
  const highlightedLineEntries = isHighlightReady
    ? (() => {
        let lineStartOffset = 0;

        return highlightSnapshot.lines.map((line) => {
          const lineText = line.map((token) => token.content).join("");
          const lineId = `${lineStartOffset}:${lineText}`;

          lineStartOffset += lineText.length + 1;

          return {
            id: lineId,
            tokens: line,
          };
        });
      })()
    : [];

  useEffect(() => {
    let isCancelled = false;

    if (!deferredValue.trim() || !resolvedLanguage) {
      startTransition(() => {
        setHighlightSnapshot(null);
      });

      return;
    }

    void getCodeEditorHighlighter()
      .then(async (highlighter) => {
        if (!highlighter.getLoadedLanguages().includes(resolvedLanguage)) {
          await highlighter.loadLanguage(resolvedLanguage);
        }

        return highlighter.codeToTokens(deferredValue, {
          lang: resolvedLanguage,
          theme: codeEditorTheme,
        });
      })
      .then((highlightedCode) => {
        if (isCancelled) {
          return;
        }

        startTransition(() => {
          setHighlightSnapshot({
            code: deferredValue,
            fg: highlightedCode.fg ?? "var(--color-foreground-soft)",
            language: resolvedLanguage,
            lines: highlightedCode.tokens.length
              ? highlightedCode.tokens
              : [[]],
          });
        });
      })
      .catch(() => {
        if (isCancelled) {
          return;
        }

        startTransition(() => {
          setHighlightSnapshot(null);
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [deferredValue, resolvedLanguage]);

  useEffect(() => {
    const inputElement = inputRef.current;
    const mirrorElement = mirrorRef.current;

    if (!isHighlightReady || !inputElement || !mirrorElement) {
      return;
    }

    mirrorElement.scrollLeft = inputElement.scrollLeft;
    mirrorElement.scrollTop = inputElement.scrollTop;
  }, [isHighlightReady]);

  return (
    <div className="relative min-w-0 flex-1">
      {isHighlightReady ? (
        <pre
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden bg-transparent p-2.5 font-display text-[11px] leading-[1.55] text-foreground-soft sm:p-3 sm:text-[13px] sm:leading-[1.45]"
          ref={mirrorRef}
          style={{ tabSize: 2 }}
        >
          <code className="grid min-w-max whitespace-pre">
            {highlightedLineEntries.map((lineEntry) => (
              <span
                className="block min-h-[1.0625rem] sm:min-h-[1.175rem]"
                key={lineEntry.id}
              >
                {lineEntry.tokens.length === 0 ? (
                  <span>&nbsp;</span>
                ) : (
                  lineEntry.tokens.map((token) => (
                    <span
                      key={`${lineEntry.id}:${token.offset}:${token.content}`}
                      style={{ color: token.color ?? highlightSnapshot.fg }}
                    >
                      {token.content}
                    </span>
                  ))
                )}
              </span>
            ))}
          </code>
        </pre>
      ) : null}

      <textarea
        aria-describedby={commentId}
        className={joinClasses(
          "relative z-10 min-h-[18rem] w-full resize-none overflow-x-auto overflow-y-hidden bg-transparent p-2.5 font-display text-[11px] leading-[1.55] outline-none placeholder:text-subtle sm:p-3 sm:text-[13px] sm:leading-[1.45]",
          currentValue && isHighlightReady
            ? "text-transparent"
            : "text-foreground",
          className,
        )}
        onChange={(event) => {
          setValue(event.target.value);
          onChange?.(event);
        }}
        onScroll={(event) => {
          const mirrorElement = mirrorRef.current;

          if (!mirrorElement) {
            return;
          }

          mirrorElement.scrollLeft = event.currentTarget.scrollLeft;
          mirrorElement.scrollTop = event.currentTarget.scrollTop;
        }}
        ref={inputRef}
        rows={visibleLineCount}
        spellCheck={spellCheck}
        style={{ caretColor: "var(--color-foreground)", tabSize: 2 }}
        value={currentValue}
        wrap={wrap}
        {...props}
      />
    </div>
  );
}

export type CodeEditorProps = CodeEditorRootProps;
