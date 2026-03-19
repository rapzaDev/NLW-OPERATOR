export type RoastDiffLine = {
  content: string;
  kind: "context" | "removed" | "added";
};

function splitDiffInput(value: string) {
  return value.split(/\r\n|\r|\n/);
}

export function buildRoastDiffLines(
  sourceCode: string,
  suggestedFix: string,
): RoastDiffLine[] {
  const sourceLines = splitDiffInput(sourceCode);
  const suggestedLines = splitDiffInput(suggestedFix);
  const totalLines = Math.max(sourceLines.length, suggestedLines.length);
  const lines: RoastDiffLine[] = [];

  for (let index = 0; index < totalLines; index += 1) {
    const sourceLine = sourceLines[index];
    const suggestedLine = suggestedLines[index];

    if (
      sourceLine !== undefined &&
      suggestedLine !== undefined &&
      sourceLine === suggestedLine
    ) {
      lines.push({
        content: sourceLine,
        kind: "context",
      });
      continue;
    }

    if (sourceLine !== undefined) {
      lines.push({
        content: sourceLine,
        kind: "removed",
      });
    }

    if (suggestedLine !== undefined) {
      lines.push({
        content: suggestedLine,
        kind: "added",
      });
    }
  }

  return lines;
}
