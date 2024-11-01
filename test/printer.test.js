import { expect, test } from "vitest";
import { findPlaceholders } from "../src/printer";

test("testPlaceholder", () => {
  const placeholders = findPlaceholders("<div>#~1~#</div>");
  expect(placeholders).toEqual([
    {
      id: "#~1~#",
      start: 5,
      end: 10,
    },
  ]);
});

test("testPlaceholder multiple in same line", () => {
  const placeholders = findPlaceholders("<div>#~1~# #~2~#</div>");
  expect(placeholders).toEqual([
    {
      id: "#~1~#",
      start: 5,
      end: 10,
    },
    {
      id: "#~2~#",
      start: 11,
      end: 16,
    },
  ]);
});
