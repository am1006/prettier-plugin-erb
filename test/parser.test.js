import { expect, test } from "vitest";
import { parse } from "../src/parser";

test("test", () => {
  const source = `<div class="<%= className %>">\n<%= test %>\n</div>`;
  const root = parse(source);

  expect(root.nodes["#~1~#"].content).toContain("className");
  expect(root.nodes["#~2~#"].content).toContain("test");
});
