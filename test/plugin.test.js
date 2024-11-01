import { expect, test, skip } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { format } from "prettier";
import * as erbPlugin from "../src/index";

const prettify = (code, options = {}) =>
  format(code, {
    parser: "erb-template",
    plugins: [erbPlugin],
    ...options,
  });

const testFolder = join(__dirname, "cases");
let tests = readdirSync(testFolder);
if (tests.some((path) => path.startsWith("#"))) {
  tests = tests.filter((item) => item.startsWith("#"));
}

test.each(tests)("%s", async (path) => {
  if (path.startsWith("_")) {
    return;
  }

  const pathTest = join(testFolder, path);
  const input = readFileSync(join(pathTest, "input.html"), "utf-8").trimEnd();
  const expected = readFileSync(
    join(pathTest, "expected.html"),
    "utf-8",
  ).trimEnd();

  expect(await prettify(input)).toEqual(expected);
});
