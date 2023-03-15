/**
 * Because of the TS 5.0 'const type parameters' feature,
 * using prettier without modification will fail.
 *
 * To format TS files, install the jkillian.custom-local-formatters
 * VSCode extension (included in workspace recommendations)
 */
/** @type {import("prettier").Config} */
module.exports = {
  semi: true,
  trailingComma: "all",
  arrowParens: "avoid",
  tabWidth: 2,
};
