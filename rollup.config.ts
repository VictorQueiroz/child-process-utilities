import path from "path";
import { defineConfig, ModuleFormat, RollupOptions } from "rollup";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

export const distDir = path.resolve(__dirname, "dist");

const moduleFormatList = (
  formats: ModuleFormat[] | null = null,
): ModuleFormat[] =>
  formats !== null
    ? formats
    : [
        "amd",
        "cjs",
        "es",
        "iife",
        "system",
        "umd",
        "commonjs",
        "esm",
        "module",
        "systemjs",
      ];

const createConfiguration: (format: ModuleFormat) => RollupOptions = (
  format,
) => {
  const outDir = path.resolve(distDir, format);

  return {
    external: ["util", "child_process"],
    plugins: [
      typescript({
        module: "ESNext",
        declarationDir: outDir,
        tsconfig: path.resolve(__dirname, "tsconfig.json"),
        outputToFilesystem: true,
      }),
      terser({
        compress: {},
      }),
    ],
    output: {
      sourcemap: true,
      dir: outDir,
      format,
    },
    input: path.resolve(__dirname, "index.ts"),
  };
};

export default defineConfig(
  moduleFormatList(["commonjs", "esm"]).map((f) => createConfiguration(f)),
);
