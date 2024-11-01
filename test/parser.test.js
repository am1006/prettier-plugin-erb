import { expect, test } from "vitest";
import { parse } from "../src/parser";

test("test expression", () => {
  const source = `<div class="<%= className %>">\n<%= test %>\n</div>`;
  const root = parse(source);

  expect(root.nodes["#~1~#"].content).toContain("className");
  expect(root.nodes["#~2~#"].content).toContain("test");
});

test("test statement", () => {
  const source = `<div><% if @test %></div>`;
  const root = parse(source);

  expect(root.nodes["#~1~#"].keyword).toBe("if");
});

test("test statement no space", () => {
  const source = `<div><%if%></div>`;
  const root = parse(source);

  expect(root.nodes["#~1~#"].keyword).toBe("if");
});

test("test statement without keyword", () => {
  const source = `<div><% @test = true %></div>`;
  const root = parse(source);

  expect(root.nodes["#~1~#"].content).toContain("@test = true");
});
