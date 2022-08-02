# redi-devtools



## Project Setup

```sh
pnpm install
```

## Commands
### Build
#### Development, HMR

Hot Module Reloading is used to load changes inline without requiring extension rebuilds and extension/page reloads
```sh
pnpm run dev
```

#### Development, Watch

Rebuilds extension on file changes. Requires a reload of the extension (and page reload if using content scripts)
```sh
pnpm run watch
```

#### Production

Minifies and optimizes extension build
```sh
pnpm run build
```

### Load extension in browser

Loads the contents of the dist directory into the specified browser
```sh
pnpm run serve:chrome
```

```sh
pnpm run serve:firefox
```
