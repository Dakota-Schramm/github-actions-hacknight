const prettier = require("prettier");

let code = "";
process.stderr.write(JSON.stringify(process.argv, undefined, 2))
process.stdin.setEncoding("utf8");
process.stdin.on("readable", () => {
  let chunk;
  while ((chunk = process.stdin.read())) {
    code += chunk;
  }
});

process.stdin.on("end", () => {
  format(code);
});

function format(code) {
  try {
    const withoutUnsupportedConst = code.replaceAll(/(?<=[<][^>]*?|,[\s\n\t]*?)const /g, "/*const */");
    const config = {
      parser: 'typescript',
      ...prettier.resolveConfig.sync(process.cwd())
    };
    const pretty = prettier.format(withoutUnsupportedConst, config);
    const output = pretty.replaceAll(/\/\*const \*\//g, "const");
    process.stdout.write(output);
  } catch (e) {
    console.error(e);
  }
}
