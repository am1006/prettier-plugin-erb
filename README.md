# An opinionated prettier erb plugin.

A prettier plugin for Rails erb template files that works with prettier v3.

It is opinionated, in the sense that it:
- does not format ruby code by default. Later, I plan to add the support to format ruby code using [ruby-lsp](https://shopify.github.io/ruby-lsp/#formatting)
- first-class support for tailwindcss prettier plugin

# Install

## Prerequisites
- Assuming you have `prettier` installed, with `.prettierrc` or other config files properly set up.
- Install tailwindcss prettier plugin, if you want to format tailwindcss code.
    ```bash
    npm install --save-dev prettier-plugin-tailwindcss
    ```

## Installation

```bash
npm install --save-dev @am1006/prettier-plugin-erb
```
```bash
yarn add -D prettier @am1006/prettier-plugin-erb
```
```bash
pnpm install --save-dev @am1006/prettier-plugin-erb
```

Then add the plugins to your `.prettierrc`:
```json
{
    "plugins": ["prettier-plugin-tailwindcss", "@am1006/prettier-plugin-erb"]
}
```

If any file doesn't format, check the output running prettier in the terminal:
```bash
npx prettier ./src/myfile.html.rb
```

## Ruby
TODO - [ruby-lsp](https://shopify.github.io/ruby-lsp/#formatting)

Wait for update from upstream:
1. https://github.com/Shopify/ruby-lsp/issues/536
2. https://github.com/Shopify/ruby-lsp/issues/1055

# Configuration
TODO

# Roadmap
Along with the upstream roadmaps:
- [x] Support erb delimiters. Ex: `<%- delimiters -%>`. (To suppress leading and trailing whitespaces, you can use `<%-` `-%>` interchangeably with `<%` `%>`.)
- [ ] Port library to TypeSript.
- [ ] Add a way to ignore sections of code of being formatted.
- [ ] Support more ways to format blocks.

I plan to support
- [x] tailwindcss plugin interoperability
- [ ] ruby-lsp formatting - using Rubocop

# Testing
To run tests:
```
cd prettier-plugin-html-erb
npm install
npm run test
```

# Thanks
- https://github.com/adamzapasnik/prettier-plugin-erb
- https://github.com/Nilkee/prettier-plugin-html-erb
- https://github.com/aliariff/vscode-erb-beautify

# License
[MIT](https://github.com/ForAzens/prettier-plugin-html-erb/blob/main/LICENSE)
