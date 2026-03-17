import type { ComponentPropsWithoutRef } from "react";
import { type BundledLanguage, codeToTokens } from "shiki";

export interface CodeBlockProps
  extends Omit<ComponentPropsWithoutRef<"figure">, "children"> {
  code: string;
  filename?: string;
  lang: BundledLanguage;
  showFilename?: boolean;
  showLineNumbers?: boolean;
}

export async function CodeBlock({
  className,
  code,
  filename,
  lang,
  showFilename = true,
  showLineNumbers = true,
  ...props
}: CodeBlockProps) {
  const highlightedCode = await codeToTokens(code, {
    lang,
    theme: "vesper",
  });

  const highlightedLines = highlightedCode.tokens.length
    ? highlightedCode.tokens
    : [[]];

  const lineNumbers = highlightedLines.map((line, index) => ({
    id: `${index + 1}:${line.map((token) => token.content).join("")}`,
    value: index + 1,
  }));

  return (
    <figure
      className={["overflow-hidden border border-stroke bg-surface", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <figcaption className="flex h-10 items-center gap-2 border-b border-stroke px-3 sm:gap-3 sm:px-4">
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
        {showFilename ? (
          <span className="ml-auto truncate font-display text-[11px] text-subtle sm:text-[12px]">
            {filename ?? `snippet.${lang}`}
          </span>
        ) : null}
      </figcaption>

      <div className="flex">
        {showLineNumbers ? (
          <ol
            aria-hidden="true"
            className="flex w-8 shrink-0 flex-col items-end gap-1.5 border-r border-stroke bg-surface-muted px-2 py-3 font-display text-[11px] leading-[1.5] text-subtle sm:w-10 sm:px-[10px] sm:text-[13px] sm:leading-[1.45]"
          >
            {lineNumbers.map((lineNumber) => (
              <li key={lineNumber.id}>{lineNumber.value}</li>
            ))}
          </ol>
        ) : null}

        <pre className="min-w-0 flex-1 overflow-x-auto bg-transparent p-2.5 font-display text-[11px] leading-[1.55] text-foreground-soft sm:p-3 sm:text-[13px] sm:leading-[1.45]">
          <code className="grid min-w-max whitespace-pre">
            {highlightedLines.map((line, index) => (
              <span
                className="block min-h-[1.05rem] sm:min-h-[1.175rem]"
                key={lineNumbers[index].id}
              >
                {line.length === 0 ? (
                  <span>&nbsp;</span>
                ) : (
                  line.map((token) => (
                    <span
                      key={`${lineNumbers[index].id}-${token.offset}`}
                      style={{ color: token.color ?? highlightedCode.fg }}
                    >
                      {token.content}
                    </span>
                  ))
                )}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </figure>
  );
}
