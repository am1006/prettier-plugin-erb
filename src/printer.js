import { doc } from "prettier";
const { utils } = doc;

process.env.PRETTIER_DEBUG = "true";

export function print(path, options, print) {
  const node = path.getNode();
  if (!node) {
    return [];
  }

  return "meh";
}

export function embed(path, options) {
  const node = path.node;
  if (node.type === "root") {
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
        return [node.nodes[currentDoc].originalText]
      });
    };
  }
}

export const findPlaceholders = (text) => {
  const match = text.match(/#~\d+~#/);

  if (match != null) {
    return [
      {
        id: match[0],
        start: match.index,
        end: match.index + match[0].length,
      },
    ];
  }

  return [];
};
