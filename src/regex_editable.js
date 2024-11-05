import { regex } from "regex";

export default regex`
  (?<node>
    # Expression
    <%=\s*(?<expression> (?>\g<ESCAPEQUOTES> | \g<ALLSYMBOLS>)*?)\s*%>
    | 
    # Comment
    <%\#\s*(?<comment>\g<EVERYTHING>)\s* %>
    |
    # Statement
    <%\s*(?<statement> (?<keyword>\g<KEYWORD>?) (?>\g<ESCAPEQUOTES> | \g<ALLSYMBOLS>)*?)\s* %>
  )

  (?(DEFINE)
    (?<EVERYTHING>		\g<ALLSYMBOLS>*?)
    (?<ALLSYMBOLS>    [\s\S])
    (?<ESCAPEQUOTES>	'[^']*'|"[^"]*")
    (?<KEYWORD>       if|else|elsif|unless|case|when|end)
  )
`;
