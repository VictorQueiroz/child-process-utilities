import { spawn } from "child-process-utilities";
import path from "path";
import fs from "fs";
import configuration from "./configuration";
import { PackageJson } from "type-fest";
import { ModuleFormat } from "rollup";
import CodeStream from "textstreamjs";

(async () => {
  await spawn("npm", ["test"]).wait();

  await fs.promises.rm(configuration.distribution.path, { recursive: true });

  await spawn("npx", [
    "rollup",
    "-c",
    path.resolve(__dirname, "../rollup.config.js")
  ]).wait();
  const pkg: PackageJson = JSON.parse(
    await fs.promises.readFile(
      path.resolve(__dirname, "../package.json"),
      "utf-8"
    )
  );

  for (const folder of await fs.promises.readdir(
    configuration.distribution.path
  )) {
    const buildFolder = path.resolve(configuration.distribution.path, folder);
    const newPkg = { ...pkg, scripts: {}, files: [] };
    switch (folder as ModuleFormat) {
      case "esm":
      case "es":
      case "module":
        newPkg.type = "module";
        break;
      case "amd":
      case "cjs":
      case "iife":
      case "system":
      case "umd":
      case "systemjs":
      case "commonjs":
        newPkg.type = "commonjs";
        break;
    }

    newPkg.name = `@child-process/${folder}`;

    await fs.promises.writeFile(
      path.resolve(buildFolder, "package.json"),
      JSON.stringify(newPkg, null, 2)
    );

    const cs = new CodeStream();

    let moduleImportCall: string;

    switch (newPkg.type) {
      case "module":
        moduleImportCall = "(await import('./index.js'))";
        break;
      case "commonjs":
        moduleImportCall = "(require('.'))";
    }

    const assertions = [
      `typeof ${moduleImportCall}.spawn === 'function'`,
      `typeof ${moduleImportCall}.spawn.pipe === 'function'`,
      `typeof ${moduleImportCall}.spawn.wait === 'function'`
    ];
    function escape(value: string, targetCharacter: string) {
      return value.replace(
        new RegExp(`${targetCharacter}`, "gm"),
        `\\${targetCharacter}`
      );
    }
    cs.write(
      "(async function() {\n",
      () => {
        cs.write(`const assert = await import('node:assert');\n`);
        for (const assertion of assertions) {
          cs.write(
            "assert.strict.ok(\n",
            () => {
              cs.write(`${assertion}\n`);
            },
            `, '${escape(`Assertion failure to the expression: "${assertion}"`, "'")}');\n`
          );
        }
      },
      "})().catch(reason => {\n"
    );
    cs.indentBlock(() => {
      cs.write(`console.error(reason);\n`);
      cs.write(`process.exit(1);\n`);
    });
    cs.write("})\n");

    const code = cs.value();

    await spawn("node", ["-e", code], { cwd: buildFolder }).wait();

    await spawn("npm", ["publish", "--access", "public"], {
      cwd: buildFolder
    }).wait();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
