import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import webExtension from "@samrum/vite-plugin-web-extension";
import path, { resolve } from "path";
import { getManifest } from "./src/manifest";

const extraInput = [
  "src/injected/hook.ts",
  "src/injected/backend/index.ts",
  "src/frontend/devtools/index.html",
  "src/frontend/devtools/panel/index.html",
  "src/frontend/devtools/sidebar/index.html"
]

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {

    build: {
      rollupOptions: {
        input: {
          ...Object.fromEntries(extraInput.map(it=>{
            const key = it.substring(0, it.lastIndexOf("."));
            const value = resolve(__dirname, it);
            return [key, value];
          }))
        },
        output: {
          /**
           * injectedScript里面的内容名字不加hash
           */
          entryFileNames(info): string {
            if (info.name.startsWith("src/injected")) {
              return "[name].js"
            }
            return "[name].[hash].js";
          }
        },
      },
      sourcemap: true,
    },
    plugins: [
      react(),
      webExtension({
        manifest: getManifest(Number(env.MANIFEST_VERSION)),
      }),
    ],
    resolve: {
      alias: {
        "~": path.resolve(__dirname, "./src"),
      },
    },
  };
});
