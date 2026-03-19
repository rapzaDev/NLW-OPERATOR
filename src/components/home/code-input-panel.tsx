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
  LoadingDots,
  ToggleLabel,
  ToggleRoot,
  ToggleThumb,
  ToggleTrack,
} from "@/components/ui";
import {
  type CodeEditorLanguage,
  type CodeEditorLanguageMode,
  resolveRoastSubmitLanguage,
} from "@/lib/code-languages";
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
const roastSubmitLabel = "$ roast_my_code";

export function CodeInputPanel() {
  const router = useRouter();
  const trpc = useTRPC();
  const [codeValue, setCodeValue] = useState(codeSample);
  const [languageMode, setLanguageMode] =
    useState<CodeEditorLanguageMode>("auto");
  const [resolvedLanguage, setResolvedLanguage] =
    useState<CodeEditorLanguage | null>(null);
  const [isPreparingSubmit, setIsPreparingSubmit] = useState(false);
  const [roastMode, setRoastMode] = useState(true);
  const codeCharacterCount = codeValue.length;
  const exceededCharacterCount = Math.max(
    codeCharacterCount - codeCharacterLimit,
    0,
  );
  const isCodeLimitExceeded = codeCharacterCount > codeCharacterLimit;
  const normalizedCodeValue = codeValue.trim();
  const createRoastMutation = useMutation(
    trpc.roast.create.mutationOptions({
      onSuccess: ({ id }) => {
        router.push(`/roast/${id}`);
      },
    }),
  );
  const isSubmitPending = isPreparingSubmit || createRoastMutation.isPending;
  const isSubmitDisabled =
    isCodeLimitExceeded || !normalizedCodeValue || isSubmitPending;

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
          aria-busy={isSubmitPending}
          className="w-full sm:w-auto"
          disabled={isSubmitDisabled}
          onClick={async () => {
            if (isSubmitDisabled) {
              return;
            }

            setIsPreparingSubmit(true);

            try {
              const language = await resolveRoastSubmitLanguage({
                code: normalizedCodeValue,
                languageMode,
                resolvedLanguage,
              });

              await createRoastMutation.mutateAsync({
                code: normalizedCodeValue,
                language,
                roastMode,
              });
            } finally {
              setIsPreparingSubmit(false);
            }
          }}
          size="lg"
          variant="primary"
        >
          <span>{roastSubmitLabel}</span>
          {isSubmitPending ? (
            <>
              <LoadingDots className="text-background/80" />
              <span className="sr-only">Analyzing your code</span>
            </>
          ) : null}
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
