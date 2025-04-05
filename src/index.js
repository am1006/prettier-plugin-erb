import { parse } from "./parser.js";
import { print, embed, getVisitorKeys } from "./printer.js";

const PLUGIN_KEY = "erb-template";

export const languages = [
  {
    name: "erbTemplate",
    parsers: [PLUGIN_KEY],
    extensions: [".erb"],
  },
];

export const parsers = {
  [PLUGIN_KEY]: {
    astFormat: PLUGIN_KEY,
    parse,
    locStart: (node) => node.index,
    locEnd: (node) => node.index + node.length,
  },
};

export const printers = {
  [PLUGIN_KEY]: {
    print,
    embed,
    getVisitorKeys,
  }
}
