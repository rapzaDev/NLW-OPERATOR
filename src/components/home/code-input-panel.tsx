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

const stats = ["2,847 codes roasted", "avg score: 4.2/10"] as const;

export function CodeInputPanel() {
  return (
    <section className="mx-auto flex w-full max-w-[780px] flex-col gap-6 sm:gap-8">
      <CodeEditorRoot
        className="shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
        defaultValue={codeSample}
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
          <CodeEditorInput placeholder="// start typing your code here" />
        </CodeEditorBody>
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

        <Button className="w-full sm:w-auto" size="lg" variant="primary">
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
