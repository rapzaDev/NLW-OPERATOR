import { randomUUID } from "node:crypto";
import { closeDatabaseConnection, db } from "../src/db/client";
import { CURRENT_ANALYSIS_VERSION } from "../src/db/constants";
import {
  type AnalysisMode,
  type DiffLineKind,
  type FeedbackTone,
  submissionAnalyses,
  submissionAnalysisItems,
  submissionDiffBlocks,
  submissionDiffLines,
  submissions,
} from "../src/db/schema";

const TOTAL_SUBMISSIONS = 100;
const BASE_CREATED_AT = new Date("2026-03-17T12:00:00.000Z");

type SeedAnalysisItem = {
  description: string;
  title: string;
  tone: FeedbackTone;
};

type SeedDiffBlock = {
  lines: Array<{
    content: string;
    kind: DiffLineKind;
  }>;
  sourceLabel: string;
  targetLabel: string;
};

type SeedEntry = {
  analysisMode: AnalysisMode;
  createdAt: Date;
  diffBlocks: SeedDiffBlock[];
  headline: string;
  items: SeedAnalysisItem[];
  language: string;
  scoreTenths: number;
  sourceCode: string;
  verdictLabel: string;
  verdictTone: FeedbackTone;
};

type SeedContext = {
  divider: number;
  entityPlural: string;
  entitySingular: string;
  handlerName: string;
  threshold: number;
  tmpVar: string;
};

type SeedTemplate = {
  baseScoreTenths: number;
  buildItems: (context: SeedContext) => SeedAnalysisItem[];
  buildSourceCode: (context: SeedContext) => string;
  language: string;
  topic: string;
};

const entityPairs = [
  ["user", "users"],
  ["order", "orders"],
  ["invoice", "invoices"],
  ["session", "sessions"],
  ["ticket", "tickets"],
  ["payment", "payments"],
  ["account", "accounts"],
  ["webhook", "webhooks"],
  ["report", "reports"],
  ["device", "devices"],
] as const;

const handlerNames = [
  "processQueue",
  "syncState",
  "cleanupRecords",
  "refreshCache",
  "publishBatch",
  "auditSnapshot",
  "calculateTotals",
  "hydratePayload",
  "shipUpdate",
  "mergeResults",
] as const;

const tmpVars = [
  "buffer",
  "cache",
  "draft",
  "payload",
  "snapshot",
  "mirror",
  "shadow",
  "result",
] as const;

const positiveItems: readonly SeedAnalysisItem[] = [
  {
    description:
      "Even with the rough edges, the snippet still keeps one obvious entry point for a future refactor.",
    title: "single place to start fixing",
    tone: "good",
  },
  {
    description:
      "The naming is at least close enough to the domain that another developer can find the problem quickly.",
    title: "domain terms are still recognizable",
    tone: "good",
  },
  {
    description:
      "The snippet is short, which limits the blast radius once someone decides to clean it up properly.",
    title: "small enough to rescue",
    tone: "good",
  },
] as const;

const roastHeadlineFormats = [
  "this %s is one postmortem away from becoming documentation.",
  "the %s here feels held together by luck and cached stack traces.",
  "this %s is asking production for emotional support.",
  "the %s reads like a shortcut that never stopped growing.",
] as const;

const honestHeadlineFormats = [
  "the %s would benefit from smaller control flow and clearer contracts.",
  "this %s needs safer defaults before it sees more traffic.",
  "the %s is carrying more implicit behavior than the code admits.",
  "this %s can be simplified without changing its intent.",
] as const;

const templates: readonly SeedTemplate[] = [
  {
    baseScoreTenths: 10,
    buildItems: ({ entityPlural }) => [
      {
        description:
          "Executing arbitrary script strings from the data payload turns every row into a remote code path.",
        title: "runtime evaluation on user data",
        tone: "critical",
      },
      {
        description:
          "Writing joined output directly into the DOM skips any boundary between data and rendered markup.",
        title: "unsafe dom write",
        tone: "critical",
      },
      {
        description: `Loose boolean checks on ${entityPlural} make the control flow harder to trust and reason about.`,
        title: "loose equality in branching",
        tone: "warning",
      },
    ],
    buildSourceCode: ({
      entityPlural,
      handlerName,
    }) => `function ${handlerName}(${entityPlural}) {
  var output = [];

  for (var i = 0; i < ${entityPlural}.length; i++) {
    if (${entityPlural}[i].enabled == true) {
      output.push(eval(${entityPlural}[i].script));
    }
  }

  document.body.innerHTML = output.join(",");
  return output;
}`,
    language: "javascript",
    topic: "runtime safety",
  },
  {
    baseScoreTenths: 18,
    buildItems: () => [
      {
        description:
          "Using any as the main contract erases the point of TypeScript right where the payload matters most.",
        title: "type system intentionally disabled",
        tone: "critical",
      },
      {
        description:
          "The boolean branches restate the same fact three times and still leave room for surprising behavior.",
        title: "redundant boolean flow",
        tone: "warning",
      },
      {
        description:
          "The optional chaining plus fallback array hides data-shape problems instead of making them explicit.",
        title: "silent contract drift",
        tone: "warning",
      },
    ],
    buildSourceCode: ({
      entitySingular,
      handlerName,
    }) => `type ${toPascalCase(entitySingular)}Payload = any;

export function ${handlerName}(payload: ${toPascalCase(entitySingular)}Payload, flag?: boolean) {
  if (flag == true) {
    return true;
  }

  if (flag == false) {
    return false;
  }

  return payload?.items?.map((item: any) => item?.value) || [];
}`,
    language: "typescript",
    topic: "type boundaries",
  },
  {
    baseScoreTenths: 14,
    buildItems: ({ entityPlural }) => [
      {
        description:
          "Selecting every column makes the query more expensive and couples consumers to schema noise they did not ask for.",
        title: "wildcard select in app query",
        tone: "warning",
      },
      {
        description:
          "Mixing AND and OR without explicit grouping is how filters quietly stop matching what the team thinks they mean.",
        title: "ambiguous operator precedence",
        tone: "critical",
      },
      {
        description: `Interpolating identifiers from ${entityPlural} access paths is a good way to normalize unsafe query habits.`,
        title: "string-built filtering",
        tone: "warning",
      },
    ],
    buildSourceCode: ({
      entityPlural,
      tmpVar,
    }) => `SELECT * FROM ${entityPlural}
WHERE 1 = 1
  AND status <> 'deleted'
  OR owner_id = '${tmpVar}_owner'
ORDER BY created_at DESC;`,
    language: "sql",
    topic: "query hygiene",
  },
  {
    baseScoreTenths: 22,
    buildItems: ({ divider }) => [
      {
        description:
          "Appending everything into a global cache makes call order matter in ways the function signature never explains.",
        title: "global mutable state",
        tone: "critical",
      },
      {
        description:
          "Truthy checks on numeric amounts quietly skip zeros, which are usually valid data and not empty input.",
        title: "truthiness instead of data rules",
        tone: "warning",
      },
      {
        description: `Dividing by ${divider} without an explanatory name leaves future maintainers to reverse-engineer business rules from math.`,
        title: "magic number in calculation",
        tone: "warning",
      },
    ],
    buildSourceCode: ({ divider, entityPlural, handlerName }) => `cache = []

def ${handlerName}(${entityPlural}):
    global cache
    total = 0

    for item in ${entityPlural}:
        cache.append(item)
        if item.get("amount"):
            total = total + item["amount"]

    return total / ${divider}`,
    language: "python",
    topic: "state handling",
  },
  {
    baseScoreTenths: 16,
    buildItems: ({ entitySingular }) => [
      {
        description:
          "Ignoring the returned error path makes file access failure indistinguishable from valid empty data.",
        title: "discarded error handling",
        tone: "critical",
      },
      {
        description:
          "Panic is doing operational work here that should belong to normal control flow and explicit return values.",
        title: "panic used as branch logic",
        tone: "warning",
      },
      {
        description: `Building file paths with raw ${entitySingular} identifiers is easy to ship and harder to secure later.`,
        title: "path construction by concatenation",
        tone: "warning",
      },
    ],
    buildSourceCode: ({
      entitySingular,
      handlerName,
    }) => `func ${toPascalCase(handlerName)}(${entitySingular}ID string) string {
    result, _ := os.ReadFile("/tmp/" + ${entitySingular}ID)
    if len(result) == 0 {
        panic("missing file")
    }

    return string(result)
}`,
    language: "go",
    topic: "error handling",
  },
  {
    baseScoreTenths: 27,
    buildItems: ({ entitySingular }) => [
      {
        description:
          "Untyped maps are acting like domain models, which shifts contract validation into runtime guesswork.",
        title: "domain object modeled as generic map",
        tone: "warning",
      },
      {
        description:
          "Nested if/else blocks add indentation without adding new information, which slows down scanning for the real path.",
        title: "branch nesting without payoff",
        tone: "warning",
      },
      {
        description: `Repeated lookup of ${entitySingular}.get("name") does work the code could centralize once.`,
        title: "duplicated access pattern",
        tone: "good",
      },
    ],
    buildSourceCode: ({
      entitySingular,
      handlerName,
    }) => `public String ${handlerName}(Map<String, Object> ${entitySingular}) {
  if (${entitySingular} == null) {
    return "";
  } else {
    if (${entitySingular}.get("name") != null) {
      return ${entitySingular}.get("name").toString().trim().toLowerCase();
    } else {
      return "unknown";
    }
  }
}`,
    language: "java",
    topic: "branch complexity",
  },
  {
    baseScoreTenths: 12,
    buildItems: () => [
      {
        description:
          "md5 is not a password strategy, it is a reminder that legacy defaults age into liabilities.",
        title: "obsolete password hashing",
        tone: "critical",
      },
      {
        description:
          "Boolean ceremony here only wraps a direct comparison and adds nothing except more lines to misread.",
        title: "manual boolean return",
        tone: "warning",
      },
      {
        description:
          "This function is at least small enough that replacing it with password_verify would be cheap.",
        title: "small refactor surface",
        tone: "good",
      },
    ],
    buildSourceCode: ({
      entitySingular,
      handlerName,
    }) => `function ${handlerName}($${entitySingular}, $password) {
    if (md5($password) === $${entitySingular}["hash"]) {
        return true;
    }

    return false;
}`,
    language: "php",
    topic: "auth flow",
  },
  {
    baseScoreTenths: 20,
    buildItems: () => [
      {
        description:
          "Blocking on async calls with Result can deadlock request threads and wastes the concurrency model you already paid for.",
        title: "sync-over-async blocking",
        tone: "critical",
      },
      {
        description:
          "Checking IsSuccessStatusCode against true is more typing with zero extra meaning.",
        title: "boolean comparison noise",
        tone: "warning",
      },
      {
        description:
          "Returning an empty string on failure erases the reason the request failed and turns debugging into archaeology.",
        title: "silent failure response",
        tone: "warning",
      },
    ],
    buildSourceCode: ({
      handlerName,
    }) => `public string ${toPascalCase(handlerName)}(HttpClient client, string url)
{
    var response = client.GetAsync(url).Result;
    if (response.IsSuccessStatusCode == true)
    {
        return response.Content.ReadAsStringAsync().Result;
    }

    return "";
}`,
    language: "csharp",
    topic: "async boundaries",
  },
  {
    baseScoreTenths: 11,
    buildItems: ({ entityPlural }) => [
      {
        description:
          "Parsing ls output breaks on spaces, glob characters, and the first filename that behaves like real user data.",
        title: "ls used as api",
        tone: "critical",
      },
      {
        description:
          "Unquoted variables in shell scripts are one of the fastest routes from okay demo to destructive production bug.",
        title: "unquoted shell expansion",
        tone: "critical",
      },
      {
        description: `The cleanup step wipes /tmp/${entityPlural} with no guard rail or dry-run path.`,
        title: "destructive cleanup by default",
        tone: "warning",
      },
    ],
    buildSourceCode: ({
      entityPlural,
      tmpVar,
    }) => `for file in $(ls /tmp/${entityPlural}); do
  cat $file >> /tmp/${tmpVar}.log
done

rm -rf /tmp/${entityPlural}/*`,
    language: "bash",
    topic: "shell safety",
  },
  {
    baseScoreTenths: 19,
    buildItems: ({ threshold }) => [
      {
        description:
          "A bare rescue swallows every failure mode and replaces observability with guessing.",
        title: "blanket exception rescue",
        tone: "critical",
      },
      {
        description:
          "Deep hash access without guards assumes structure that the method never enforces or documents.",
        title: "unchecked nested access",
        tone: "warning",
      },
      {
        description: `Hardcoding ${threshold} as a fallback timeout makes the policy real while keeping the intent invisible.`,
        title: "implicit fallback policy",
        tone: "warning",
      },
    ],
    buildSourceCode: ({ handlerName, threshold }) => `def ${handlerName}(item)
  begin
    timeout = item[:config][:timeout] || ${threshold}
    timeout / 0
  rescue
    nil
  end
end`,
    language: "ruby",
    topic: "exception handling",
  },
] as const;

function toPascalCase(value: string) {
  return value
    .split(/[^a-zA-Z0-9]/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join("");
}

function getCycledValue<T>(items: readonly T[], index: number) {
  const item = items[index % items.length];

  if (item === undefined) {
    throw new Error("Cannot pick from an empty collection.");
  }

  return item;
}

function countLines(sourceCode: string) {
  return sourceCode.split(/\r\n|\r|\n/).length;
}

function buildCreatedAt(index: number) {
  return new Date(BASE_CREATED_AT.getTime() - index * 37 * 60 * 1000);
}

function buildContext(index: number): SeedContext {
  const [entitySingular, entityPlural] = getCycledValue(entityPairs, index);

  return {
    divider: 2 + (index % 4),
    entityPlural,
    entitySingular,
    handlerName: getCycledValue(handlerNames, index * 3),
    threshold: 10 + ((index * 7) % 35),
    tmpVar: `${getCycledValue(tmpVars, index * 5)}${index}`,
  };
}

function buildHeadline(topic: string, mode: AnalysisMode, index: number) {
  const formats =
    mode === "roast" ? roastHeadlineFormats : honestHeadlineFormats;
  const format = getCycledValue(formats, index);

  return format.replace("%s", topic);
}

function pickPositiveItem(index: number) {
  return getCycledValue(positiveItems, index);
}

function buildVerdict(scoreTenths: number) {
  if (scoreTenths <= 18) {
    return {
      verdictLabel: "needs_serious_help",
      verdictTone: "critical" as const,
    };
  }

  if (scoreTenths <= 40) {
    return {
      verdictLabel: "needs_cleanup",
      verdictTone: "warning" as const,
    };
  }

  if (scoreTenths <= 60) {
    return {
      verdictLabel: "rough_edges",
      verdictTone: "warning" as const,
    };
  }

  return {
    verdictLabel: "surprisingly_ok",
    verdictTone: "good" as const,
  };
}

function buildDetailedEntry(): SeedEntry {
  return {
    analysisMode: "roast",
    createdAt: buildCreatedAt(0),
    diffBlocks: [
      {
        lines: [
          {
            content: "function calculateTotal(items) {",
            kind: "context",
          },
          {
            content: "  var total = 0;",
            kind: "removed",
          },
          {
            content: "  for (var i = 0; i < items.length; i++) {",
            kind: "removed",
          },
          {
            content: "    total = total + items[i].price;",
            kind: "removed",
          },
          {
            content: "  }",
            kind: "removed",
          },
          {
            content: "  return total;",
            kind: "removed",
          },
          {
            content:
              "  return items.reduce((sum, item) => sum + item.price, 0);",
            kind: "added",
          },
          {
            content: "}",
            kind: "context",
          },
        ],
        sourceLabel: "your_code.ts",
        targetLabel: "improved_code.ts",
      },
    ],
    headline:
      "this code looks like it was written during a power outage... in 2005.",
    items: [
      {
        description:
          "var is function-scoped and easier to misuse than const or let in modern JavaScript.",
        title: "using var instead of const/let",
        tone: "critical",
      },
      {
        description:
          "The explicit loop works, but it is verbose and makes the accumulation logic harder to scan.",
        title: "imperative loop pattern",
        tone: "warning",
      },
      {
        description:
          "Names like calculateTotal and items communicate intent clearly without extra comments.",
        title: "clear naming conventions",
        tone: "good",
      },
      {
        description:
          "The function still focuses on one responsibility, which makes a refactor straightforward.",
        title: "single responsibility",
        tone: "good",
      },
    ],
    language: "javascript",
    scoreTenths: 35,
    sourceCode: `function calculateTotal(items) {
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
}`,
    verdictLabel: "needs_cleanup",
    verdictTone: "warning",
  };
}

function buildGeneratedEntry(index: number): SeedEntry {
  const template = getCycledValue(templates, index - 1);
  const context = buildContext(index);
  const analysisMode: AnalysisMode = index % 5 === 0 ? "honest" : "roast";
  const scoreTenths = Math.max(
    6,
    Math.min(78, template.baseScoreTenths + ((index * 7) % 17) - 8),
  );
  const items = template.buildItems(context).slice(0, 2);

  if (index % 3 === 0) {
    items.push(pickPositiveItem(index));
  }

  return {
    analysisMode,
    createdAt: buildCreatedAt(index),
    diffBlocks: [],
    headline: buildHeadline(template.topic, analysisMode, index),
    items,
    language: template.language,
    scoreTenths,
    sourceCode: template.buildSourceCode(context),
    ...buildVerdict(scoreTenths),
  };
}

function buildSeedEntries(total: number) {
  return Array.from({ length: total }, (_, rawIndex) => {
    const index = rawIndex + 1;

    if (index === 1) {
      return buildDetailedEntry();
    }

    return buildGeneratedEntry(index);
  });
}

async function main() {
  const entries = buildSeedEntries(TOTAL_SUBMISSIONS);

  await db.transaction(async (tx) => {
    await tx.delete(submissions);

    for (const entry of entries) {
      const processedAt = new Date(entry.createdAt.getTime() + 15_000);
      const [submission] = await tx
        .insert(submissions)
        .values({
          analysisMode: entry.analysisMode,
          createdAt: entry.createdAt,
          language: entry.language,
          languageSource: "manual",
          lineCount: countLines(entry.sourceCode),
          processedAt,
          publicId: randomUUID(),
          sourceCode: entry.sourceCode,
          status: "completed",
          updatedAt: processedAt,
        })
        .returning({ id: submissions.id });

      const [analysis] = await tx
        .insert(submissionAnalyses)
        .values({
          analysisVersion: CURRENT_ANALYSIS_VERSION,
          createdAt: processedAt,
          headline: entry.headline,
          scoreTenths: entry.scoreTenths,
          submissionId: submission.id,
          verdictLabel: entry.verdictLabel,
          verdictTone: entry.verdictTone,
        })
        .returning({ id: submissionAnalyses.id });

      if (entry.items.length > 0) {
        await tx.insert(submissionAnalysisItems).values(
          entry.items.map((item, position) => ({
            analysisId: analysis.id,
            createdAt: processedAt,
            description: item.description,
            position,
            title: item.title,
            tone: item.tone,
          })),
        );
      }

      for (const [blockPosition, block] of entry.diffBlocks.entries()) {
        const [insertedBlock] = await tx
          .insert(submissionDiffBlocks)
          .values({
            analysisId: analysis.id,
            createdAt: processedAt,
            position: blockPosition,
            sourceLabel: block.sourceLabel,
            targetLabel: block.targetLabel,
          })
          .returning({ id: submissionDiffBlocks.id });

        if (block.lines.length > 0) {
          await tx.insert(submissionDiffLines).values(
            block.lines.map((line, linePosition) => ({
              content: line.content,
              diffBlockId: insertedBlock.id,
              kind: line.kind,
              position: linePosition,
            })),
          );
        }
      }
    }
  });

  console.log(`Seeded ${entries.length} submissions with analyses.`);
}

main()
  .then(async () => {
    await closeDatabaseConnection();
  })
  .catch(async (error) => {
    console.error(error);
    await closeDatabaseConnection();
    process.exitCode = 1;
  });
