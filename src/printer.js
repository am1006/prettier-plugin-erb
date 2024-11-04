import { doc } from "prettier";
const { utils, builders } = doc;

const { concat, hardline } = doc.builders;

process.env.PRETTIER_DEBUG = "true";

export const getVisitorKeys = (ast) => {
  if ("type" in ast) {
    return ast.type === "root" ? ["nodes"] : [];
  }

  return Object.values(ast)
    .filter((node) => {
      return node.type === "block";
    })
    .map((e) => e.id);
};

export function print(path, options, print) {
  const node = path.node;
  if (!node) {
    return [];
  }

  if (node.type === "expression") {
    return printExpression(node);
  }

  if (node.type === "statement") {
    return printStatement(node);
  }

  if (node.type === "comment") {
    return builders.group([builders.join(" ", ["<%#", node.content, "%>"])], {
      shouldBreak: true, // I dunno if this will have consequences in another parts
    });
  }

  return [];
}

const printExpression = (node) => {
  const multiline = node.content.includes("\n");

  if (multiline) {
    const lines = node.content.split("\n");

    return concat([
      ["<%=", " "],
      ...lines.map((line, i) => [
        i !== 0 ? "    " : "",
        line,
        i !== lines.length - 1 ? hardline : "",
      ]),
      [" ", "%>"],
    ]);
  }

  return builders.group(
    builders.join(" ", ["<%=", builders.indent(node.content), "%>"]),
  );
};

const printStatement = (node) => {
  const statement = builders.group(
    builders.join(" ", ["<%", node.content, "%>"]),
  );

  if (["else", "elsif"].includes(node.keyword)) {
    return [builders.dedent(builders.hardline), statement, builders.hardline];
  }

  return statement;
};

const formatRubyCode = async (node, textToDoc, options) => {
  if (node.type !== "expression") {
    return;
  }

  let doc;
  if (node.type === "expression" && node.startBlock) {
    const contentWithEnd = node.content + "\nend";
    doc = await textToDoc(contentWithEnd, { ...options, parser: "ruby" });
    doc = doc.slice(0, -4); // Remove temporal "\nend"
  } else {
    doc = await textToDoc(node.content, { ...options, parser: "ruby" });
  }

  node.contentPreRubyParser = node.content;
  node.content = doc;
};

export function embed() {
  return async (textToDoc, print, path, options) => {
    const node = path.node;

    if ("nodes" in node) {
      for (const n of Object.values(node.nodes)) {
        if (!n.contentPreRubyParser) {
          await formatRubyCode(n, textToDoc, options);
        }
      }
    }

    if (!node || !["root", "block"].includes(node.type)) {
      return undefined;
    }

    const mapped = await Promise.all(
      splitAtElse(node).map(async (content) => {
        let doc;
        if (content in node.nodes) {
          doc = content;
        } else {
          doc = await textToDoc(content, { ...options, parser: "html" });
        }

        return utils.mapDoc(doc, (currentDoc) => {
          if (typeof currentDoc !== "string") {
            return currentDoc;
          }

          const idxs = findPlaceholders(currentDoc);
          if (idxs.length === 0) {
            return currentDoc;
          }
          let res = [];
          let lastEnd = 0;

          for (const { start, end } of idxs) {
            if (lastEnd < start) {
              res.push(currentDoc.slice(lastEnd, start));
            }

            const p = currentDoc.slice(start, end);

            if (p in node.nodes) {
              res.push(path.call(print, "nodes", p));
            } else {
              res.push(p);
            }

            lastEnd = end;
          }

          if (lastEnd > 0 && currentDoc.length > lastEnd) {
            res.push(currentDoc.slice(lastEnd));
          }

          return res;
        });
      }),
    );

    if (node.type === "block") {
      return builders.group([
        path.call(print, "nodes", node.start.id),
        builders.indent([builders.softline, mapped]),
        builders.hardline,
        path.call(print, "nodes", node.end.id),
      ]);
    }

    return [...mapped, builders.hardline];
  };
}

const splitAtElse = (node) => {
  const elseNodes = Object.values(node.nodes).filter(
    (n) =>
      n.type === "statement" &&
      ["else", "elsif"].includes(n.keyword) &&
      node.content.search(n.id) !== -1,
  );

  if (elseNodes.length === 0) {
    return [node.content];
  }

  const re = new RegExp(`(${elseNodes.map((e) => e.id).join(")|(")})`);
  return node.content.split(re).filter(Boolean);
};

const getMultilineGroup = (content) => {
  // Dedent the content by the minimum indentation of any non-blank lines.
  const lines = content.split("\n");
  const minIndent = Math.min(
    ...lines
      .slice(1) // can't be the first line
      .filter((line) => line.trim())
      .map((line) => line.search(/\S/)),
  );

  return builders.group(
    lines.map((line, i) => [
      builders.hardline,
      i === 0
        ? line.trim() // don't dedent the first line
        : line.trim()
          ? line.slice(minIndent).trimEnd()
          : "",
    ]),
  );
};

export const findPlaceholders = (text) => {
  let i = 0;
  let res = [];

  let match;
  while ((match = text.slice(i).match(/#~\d+~#/)) != null) {
    const matchLength = match[0].length;

    res.push({
      id: match[0],
      start: i + match.index,
      end: i + match.index + match[0].length,
    });

    i += match.index + matchLength;
  }

  return res;
};
