import { doc } from "prettier";
const { utils, builders } = doc;

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
    return builders.group(builders.join(" ", ["<%=", node.content, "%>"]));
  }

  if (node.type === "statement") {
    return printStatement(node);
  }

  return [];
}

const printStatement = (node) => {
  const statement = builders.group(
    builders.join(" ", ["<%", node.content, "%>"]),
  );

  if (["else", "elsif"].includes(node.keyword)) {
    return [builders.dedent(builders.hardline), statement, builders.hardline];
  }

  return statement;
};

export function embed() {
  return async (textToDoc, print, path, options) => {
    const node = path.node;
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
