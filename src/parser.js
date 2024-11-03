import re from "./regex.js";

const PLACEHOLDER = {
  start: "#~",
  end: "~#",
};

const placeholderGenerator = (text) => {
  let id = 0;

  return () => {
    while (true) {
      id++;

      const placeholder = PLACEHOLDER.start + id + PLACEHOLDER.end;
      if (!text.includes(placeholder)) {
        return placeholder;
      }
    }
  };
};

const replaceAt = (str, replacement, start, length) =>
  str.slice(0, start) + replacement + str.slice(start + length);

export const parse = (text) => {
  let statementStack = [];

  const root = {
    id: "0",
    type: "root",
    content: text,
    originalText: text,
    index: 0,
    length: 0,
    nodes: {},
  };

  const generatePlaceholder = placeholderGenerator(text);

  let match;
  let i = 0;
  while ((match = root.content.slice(i).match(re)) !== null) {
    const matchText = match.groups.node;
    const expression = match.groups.expression;
    const statement = match.groups.statement;
    const comment = match.groups.comment;

    const placeholder = generatePlaceholder();

    const node = {
      id: placeholder,
      originalText: matchText,
      index: match.index + i,
      length: match[0].length,
    };

    if (comment != null) {
      root.nodes[node.id] = {
        ...node,
        type: "comment",
        content: comment,
      };

      root.content = replaceAt(
        root.content,
        placeholder,
        match.index + i,
        match[0].length,
      );

      i += match.index + placeholder.length;
    }

    if (expression != null) {
      root.nodes[node.id] = {
        ...node,
        type: "expression",
        content: expression,
        startBlock: false,
      };

      const expressionIsBlock = expression.match(/do( \|[\w_, ]+\|)?$/) != null;
      if (expressionIsBlock) {
        // If a expression is opening a block, we'll treat that expression as a statement to
        // simplify the logic of blocks
        root.nodes[placeholder].startBlock = true;
        statementStack.push(root.nodes[placeholder]);
        i += match.index + match[0].length;
      } else {
        root.content = replaceAt(
          root.content,
          placeholder,
          match.index + i,
          match[0].length,
        );

        i += match.index + placeholder.length;
      }
    }

    if (statement != null) {
      const keyword = match.groups.keyword;

      if (keyword === "end") {
        // Traverse the statement stacks until I find the matching statement group
        let start;
        while (!start) {
          start = statementStack.pop();
          if (!start) {
            throw new Error(
              `No opening statement for closing statement ${statement}`,
            );
          }

          const hasValidKeyword = ["if", "unless"].includes(start.keyword);
          const hasBlock = start.content.match(/do( \|[\w_, ]+\|)?$/) != null;
          // If the statement is not matching, replace the content with the placeholder
          if (!hasValidKeyword && !hasBlock) {
            root.content = replaceAt(
              root.content,
              start.id,
              start.index,
              start.length,
            );
            i += start.id.length - start.length;

            start = undefined;
            continue;
          }
        }

        const end = {
          ...node,
          index: match.index + i,
          type: "statement",
          content: statement,
          keyword,
        };
        root.nodes[end.id] = end;

        const originalText = root.content.slice(
          start.index,
          end.index + end.length,
        );

        const block = {
          id: generatePlaceholder(),
          type: "block",
          start: start,
          end: end,
          content: originalText.slice(
            start.length,
            originalText.length - end.length,
          ),
          index: start.index,
          length: end.index + end.length - start.index,
          nodes: root.nodes,
        };
        root.nodes[block.id] = block;

        root.content = replaceAt(
          root.content,
          block.id,
          start.index,
          originalText.length,
        );

        i += match.index + block.id.length + end.length - originalText.length;
      } else {
        root.nodes[node.id] = {
          ...node,
          type: "statement",
          content: statement,
          keyword,
        };
        statementStack.push(root.nodes[placeholder]);

        i += match.index + match[0].length;
      }
    }
  }

  for (const stmt of statementStack) {
    root.content = root.content.replace(stmt.originalText, stmt.id);
  }

  return root;
};
