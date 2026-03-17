"use client";

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
import { demoRoastHref } from "@/lib/demo-roasts";

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
const stats = ["2,847 codes roasted", "avg score: 4.2/10"] as const;

export function CodeInputPanel() {
  const router = useRouter();
  const [codeValue, setCodeValue] = useState(codeSample);
  const codeCharacterCount = codeValue.length;
  const exceededCharacterCount = Math.max(
    codeCharacterCount - codeCharacterLimit,
    0,
  );
  const isCodeLimitExceeded = codeCharacterCount > codeCharacterLimit;

  return (
    <section className="mx-auto flex w-full max-w-[780px] flex-col gap-6 sm:gap-8">
      <CodeEditorRoot
        className="shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
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
          <ToggleRoot defaultChecked>
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
          disabled={isCodeLimitExceeded}
          onClick={() => {
            router.push(demoRoastHref);
          }}
          size="lg"
          variant="primary"
        >
          $ roast_my_code
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-body text-center text-xs leading-5 text-subtle">
        {stats.map((stat, index) => (
          <div className="flex items-center gap-4" key={stat}>
            {index > 0 ? (
              <span className="font-display text-muted">·</span>
            ) : null}
            <span>{stat}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
