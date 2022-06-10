import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import webWorkerLoader from "rollup-plugin-web-worker-loader";

export default {
  input: "src/index.ts",
  output: {
    file: "dist/bundle.js",
    format: "iife",
    name: "eyetrack",
  },
  plugins: [nodeResolve(), webWorkerLoader(), commonjs(), typescript()],
};
