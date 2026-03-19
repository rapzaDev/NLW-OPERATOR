"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Button,
  CodeEditorBody,
  CodeEditorComment,
  CodeEditorHeader,
  CodeEditorInput,
  CodeEditorLanguageSelect,
  CodeEditorLineNumbers,
  CodeEditorRoot,
  ToggleLabel,
  ToggleRoot,
  ToggleThumb,
  ToggleTrack,
} from "@/components/ui";
import type {
  CodeEditorLanguage,
  CodeEditorLanguageMode,
} from "@/lib/code-languages";
import { DEFAULT_ROAST_LANGUAGE } from "@/lib/roast";
import { useTRPC } from "@/trpc/client";

const codeSample = `function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }

  if (total > 100) {
    console.log("discount applied");
    total = total * 0.9;
  }

  // TODO: handle tax calculation
  // TODO: handle currency conversion

  return total;
}`;

const codeCharacterLimit = 2000;
const codeCharacterFormatter = new Intl.NumberFormat("en-US");

export function CodeInputPanel() {
  const router = useRouter();
  const trpc = useTRPC();
  const [codeValue, setCodeValue] = useState(codeSample);
  const [languageMode, setLanguageMode] =
    useState<CodeEditorLanguageMode>("auto");
  const [resolvedLanguage, setResolvedLanguage] =
    useState<CodeEditorLanguage | null>("javascript");
  const [roastMode, setRoastMode] = useState(true);
  const codeCharacterCount = codeValue.length;
  const exceededCharacterCount = Math.max(
    codeCharacterCount - codeCharacterLimit,
    0,
  );
  const isCodeLimitExceeded = codeCharacterCount > codeCharacterLimit;
  const normalizedCodeValue = codeValue.trim();
  const resolvedSubmitLanguage =
    languageMode === "auto"
      ? (resolvedLanguage ?? DEFAULT_ROAST_LANGUAGE)
      : languageMode;
  const createRoastMutation = useMutation(
    trpc.roast.create.mutationOptions({
      onSuccess: ({ id }) => {
        router.push(`/roast/${id}`);
      },
    }),
  );
  const isSubmitDisabled =
    isCodeLimitExceeded ||
    !normalizedCodeValue ||
    createRoastMutation.isPending;

  return (
    <section className="mx-auto flex w-full max-w-[780px] flex-col gap-6 sm:gap-8">
      <CodeEditorRoot
        className="shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
        onLanguageChange={setLanguageMode}
        onResolvedLanguageChange={setResolvedLanguage}
        onValueChange={setCodeValue}
        value={codeValue}
      >
        <CodeEditorHeader>
          <CodeEditorLanguageSelect />
        </CodeEditorHeader>
        <CodeEditorComment>
          {
            "// edit this example, replace it, or paste your own code to test it here"
          }
        </CodeEditorComment>
        <CodeEditorBody>
          <CodeEditorLineNumbers />
          <CodeEditorInput
            aria-invalid={isCodeLimitExceeded}
            placeholder="// start typing your code here"
          />
        </CodeEditorBody>
        <div
          aria-live="polite"
          className="flex items-center justify-end gap-3 border-t border-stroke px-3 py-2 font-body text-[11px] leading-5 sm:px-4"
          role="status"
        >
          {isCodeLimitExceeded ? (
            <span className="text-critical">
              trim {codeCharacterFormatter.format(exceededCharacterCount)} chars
            </span>
          ) : null}
          <span
            className={isCodeLimitExceeded ? "text-critical" : "text-subtle"}
          >
            {codeCharacterFormatter.format(codeCharacterCount)} /{" "}
            {codeCharacterFormatter.format(codeCharacterLimit)} chars
          </span>
        </div>
      </CodeEditorRoot>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <ToggleRoot checked={roastMode} onCheckedChange={setRoastMode}>
            <ToggleTrack>
              <ToggleThumb />
            </ToggleTrack>
            <ToggleLabel className="text-[12px] sm:text-[13px]">
              roast mode
            </ToggleLabel>
          </ToggleRoot>
          <p className="font-body text-xs leading-5 text-subtle sm:text-xs">
            {"// maximum sarcasm enabled"}
          </p>
        </div>

        <Button
          className="w-full sm:w-auto"
          disabled={isSubmitDisabled}
          onClick={() => {
            if (isSubmitDisabled) {
              return;
            }

            createRoastMutation.mutate({
              code: normalizedCodeValue,
              language: resolvedSubmitLanguage,
              roastMode,
            });
          }}
          size="lg"
          variant="primary"
        >
          {createRoastMutation.isPending ? "$ roasting..." : "$ roast_my_code"}
        </Button>
      </div>

      {createRoastMutation.error ? (
        <p className="font-body text-xs leading-5 text-critical">
          {createRoastMutation.error.message}
        </p>
      ) : null}
    </section>
  );
}
