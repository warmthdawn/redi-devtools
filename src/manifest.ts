import { type } from "os";
import pkg from "../package.json";

type ManifestBase = chrome.runtime.ManifestBase;
type ManifestV2 = chrome.runtime.ManifestV2;
type ManifestV3 = chrome.runtime.ManifestV3;

const sharedManifest: Partial<ManifestBase> = {
  content_scripts: [
    {
      js: ["src/content/injectHook.ts"],
      matches: ["*://*/*"],
      run_at: 'document_start'
    },
  ],
  icons: {
    16: "icons/16.png",
    19: "icons/19.png",
    32: "icons/32.png",
    38: "icons/38.png",
    48: "icons/48.png",
    64: "icons/64.png",
    96: "icons/96.png",
    128: "icons/128.png",
    256: "icons/256.png",
    512: "icons/512.png",
  },
  options_ui: {
    page: "src/frontend/options/index.html",
    open_in_tab: true,
  },
  devtools_page: "src/frontend/devtools/index.html",
  permissions: [],
};

const browserAction = {
  default_icon: {
    16: "icons/16.png",
    19: "icons/19.png",
    32: "icons/32.png",
    38: "icons/38.png",
  },
  default_popup: "src/frontend/popup/index.html",
};

const ManifestV2: Partial<ManifestV2> = {
  ...sharedManifest,
  background: {
    scripts: ["src/background/script.ts"],
    persistent: false,
  },
  web_accessible_resources: [
    "src/common/*.js",
    "src/injected/*.js",
    "assets/*",
  ],
  browser_action: browserAction,
  options_ui: {
    ...sharedManifest.options_ui,
    chrome_style: false,
  },
  permissions: [...sharedManifest.permissions, "*://*/*"],
  manifest_version: 2,
};

const ManifestV3: Partial<ManifestV3> = {
  ...sharedManifest,
  action: browserAction,
  background: {
    service_worker: "src/background/serviceWorker.ts",
  },
  host_permissions: ["*://*/*"],
  web_accessible_resources: [
    {
      resources: [
        "src/common/*.js",
        "src/injected/*.js",
        "assets/*",
      ],
      matches: ["*://*/*"]
    }
  ],
  manifest_version: 3,
};

export function getManifest(manifestVersion: number): chrome.runtime.ManifestV2 | chrome.runtime.ManifestV3 {
  const manifest = {
    author: pkg.author,
    description: pkg.description,
    name: pkg.displayName ?? pkg.name,
    version: pkg.version,
  };

  if (manifestVersion === 2) {
    return {
      ...manifest,
      ...ManifestV2,
      manifest_version: 2,
    };
  }

  if (manifestVersion === 3) {
    return {
      ...manifest,
      ...ManifestV3,
      manifest_version: 3,
    };
  }

  throw new Error(
    `Missing manifest definition for manifestVersion ${manifestVersion}`
  );
}
