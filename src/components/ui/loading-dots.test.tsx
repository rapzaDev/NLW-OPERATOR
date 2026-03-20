import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { LoadingDots } from "./loading-dots";

test("LoadingDots renders three animated dots", () => {
  const markup = renderToStaticMarkup(<LoadingDots />);

  assert.equal(markup.match(/data-loading-dot/g)?.length ?? 0, 3);
  assert.match(markup, /aria-hidden="true"/);
  assert.match(markup, /animate-pulse/);
});
