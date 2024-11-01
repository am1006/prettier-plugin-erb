import { regex } from "regex";

const PLACEHOLDER = {
  start: "#~",
  end: "~#",
};

const re = regex`
  (?<node>
    # Expression
    <%= (?<expression>\s*(?>\g<ESCAPEQUOTES> | \g<ALLSYMBOLS>)*?)\s*%>
    |
    # Statement
    <% (?<statement>\s*(?<keyword>\g<KEYWORD>?) (?>\g<ESCAPEQUOTES> | \g<ALLSYMBOLS>)*?)\s* %>


  )

  (?(DEFINE)
    (?<EVERYTHING>		\g<ALLSYMBOLS>*?)
    (?<ALLSYMBOLS>    [\s\S])
    (?<ESCAPEQUOTES>	'[^']*'|"[^"]*")
    (?<KEYWORD>       if|else|elsif|unless|end)
  )
`;

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

    const placeholder = generatePlaceholder();

    const node = {
      id: placeholder,
      originalText: matchText,
      index: match.index + i,
      length: match.length,
    };

    if (expression != null) {
      root.content = replaceAt(
        root.content,
        placeholder,
        match.index + i,
        match[0].length,
      );

      root.nodes[node.id] = {
        ...node,
        type: "expression",
        content: expression.trim(),
      };

      i += match.index + placeholder.length;
    }

    if (statement != null) {
      const keyword = match.groups.keyword;

      root.nodes[node.id] = {
        ...node,
        type: "statement",
        content: statement.trim(),
        keyword,
      };

      root.content = root.content.replace(node.originalText, node.id);

      i += match.index + placeholder.length;
    }
  }

  return root;
};
