import { doc } from "prettier";
const { utils, builders } = doc;

process.env.PRETTIER_DEBUG = "true";

export function print(path, options, print) {
  const node = path.node;
  if (!node) {
    return [];
  }

  if (node.type === "expression") {
    return builders.group(builders.join(" ", ["<%=", node.content, "%>"]));
  }

  if (node.type === "statement") {
    return builders.group(builders.join(" ", ["<%", node.content, "%>"]));
  }

  return "meh";
}

export function embed(path, options) {
  const node = path.node;
  if (!node || node.type !== "root") {
    return undefined;
  }

  return async (textToDoc) => {
    const doc = await textToDoc(node.content, { ...options, parser: "html" });

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
      for (const { id, start, end } of idxs) {
        if (lastEnd < start) {
          res.push(currentDoc.slice(lastEnd, start));
        }

        const p = currentDoc.slice(start, end);

        if (node.nodes[p] != null) {
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
  };
}

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
