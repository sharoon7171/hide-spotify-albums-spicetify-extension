# Hide Albums in Spicetify

Spicetify extension for the Spotify desktop client. It hides albums on Home, Artist, Search, and carousels while album pages stay open. Pair it with [Hide Albums in Spotify](https://github.com/sharoon7171/hide-spotify-albums-chrome-extension) by pointing both at the **same Firebase project** and signing in with the **same account**.

Build and apply this package locally. There is no hosted backend—you use **your** Firebase project and create Auth users yourself.

## What Spicetify Is

[Spicetify](https://spicetify.app/) is a command-line tool that customizes the **official Spotify desktop app** (not Spotify Web in the browser). It injects themes and JavaScript extensions into Spotify’s UI. This project is one of those extensions: you build it, install it into Spicetify’s Extensions folder, then run `spicetify apply` so Spotify loads it.

You need:

1. Spotify Desktop installed from Spotify (or a supported package manager)
2. Spicetify CLI installed and able to patch that Spotify install
3. This repo built and applied on top of Spicetify

Full platform notes (Flatpak, Snap, AUR paths, and more) live in the [Spicetify getting started guide](https://spicetify.app/docs/getting-started).

## Install Spicetify

If Spotify is a fresh install, open it and stay signed in for at least a minute so it creates the files Spicetify expects. Then install the CLI.

### macOS

```bash
curl -fsSL https://raw.githubusercontent.com/spicetify/cli/main/install.sh | sh
```

Or with Homebrew:

```bash
brew install spicetify-cli
spicetify config spotify_path "/Applications/Spotify.app/Contents/Resources"
```

### Windows

PowerShell:

```powershell
iwr -useb https://raw.githubusercontent.com/spicetify/cli/main/install.ps1 | iex
```

Other options: `winget install Spicetify.Spicetify`, Scoop (`scoop install spicetify-cli`), or Chocolatey (`choco install spicetify-cli`).

### Linux

```bash
curl -fsSL https://raw.githubusercontent.com/spicetify/cli/main/install.sh | sh
```

Or Homebrew / AUR as documented in the [getting started](https://spicetify.app/docs/getting-started) page. Some Linux Spotify packages need write permission on the Spotify directory before Spicetify can patch them.

### First Apply

After the CLI is installed:

```bash
spicetify backup apply
```

Confirm `spicetify` is on your `PATH` (`which spicetify` or `spicetify --help`). After Spotify itself updates, re-run:

```bash
spicetify backup apply
```

If that fails, update Spicetify (`spicetify update` or your package manager), then `spicetify restore backup apply` if needed.

Marketplace is optional. This extension is applied from source with `npm run apply`; you do not need Marketplace to install it.

## How to Use

1. Apply the extension with Spicetify and open the Spotify desktop app
2. Open **Hide Albums in Spicetify** from the global nav (next to Home / Search)
3. Sign in with an email and password you created in Firebase Authentication
4. Open any album and choose **Hide** in the action bar
5. With **Hide in Grids** on, that album leaves Home, Artist, Search, and carousels
6. Unhide from the album page, or remove the row from the manager panel

### Manager Panel

- **Sign in / Sign out** — accounts that already exist in your Firebase project only
- **Hide in Grids** — local on/off for grid hiding; does not delete albums
- **Hidden list** — search, open, remove one, or **Clear All**

Clear All deletes every album doc for that signed-in user in your Firestore project, so Chrome and other clients on the same account update too.

## Setup

### Requirements

- Node.js 20.19+ or 22.12+ (Vite 8)
- Spicetify CLI installed and already able to customize Spotify Desktop (see above)
- Your own Firebase project with Email/Password authentication and Cloud Firestore
- macOS paths in `scripts/install.sh` (Spotify under `/Applications/Spotify.app`); adjust if your install differs

### Create Accounts Manually

The panel only supports sign-in. There is no signup flow in the extension.

1. In the Firebase console, open **Authentication** → **Users**
2. Add each email and password you want to allow
3. Use those credentials here (and in the Chrome extension if you sync)

Disable public self-registration in Firebase Auth if it is on, so only accounts you add can sign in.

### Environment

Copy `.env.example` to `.env` and fill in values from **your** Firebase web app config (same keys as the Chrome package if you share one project):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### Firestore Rules

Deploy [`firestore.rules`](https://github.com/sharoon7171/hide-spotify-albums-chrome-extension/blob/main/firestore.rules) from [Hide Albums in Spotify](https://github.com/sharoon7171/hide-spotify-albums-chrome-extension) to that Firebase project. Rules allow each signed-in user to read and write only `users/{uid}/savedAlbums/{albumId}`.

### Build and Apply

1. `npm install`
2. `npm run apply` (builds, copies scripts into Spicetify Extensions, and runs `spicetify apply`)

Or step by step:

1. `npm run build`
2. `bash scripts/install.sh`

`package.json` already lists `allowScripts` for Firebase’s `@firebase/util` and `protobufjs`, plus macOS `fsevents` for Vite watching ([npm install-scripts](https://docs.npmjs.com/cli/v11/commands/npm-install-scripts)). After a dependency bump, if npm warns about new install scripts, run `npm install-scripts ls` then `npm install-scripts approve <pkg>`.

`npm run watch` rebuilds the main bundle while you iterate; run `npm run apply` (or install again) when you need bootstrap / post-snapshot updates and a full Spicetify refresh.

## Storage Model

| Layer | What it holds |
| --- | --- |
| Firestore `users/{uid}/savedAlbums/{albumId}` | One doc per album (`updatedAt`, optional `title` / `url`) |
| Firestore persistent cache | Client source of truth; `onSnapshot` drives the store and UI |
| `localStorage` | **Hide in Grids** only (device-local, not synced) |

The in-app store mirrors Firestore via cache hydrate plus realtime listeners. Hide / unhide updates that mirror optimistically, then the same listeners keep Chrome and desktop aligned.

## Project Layout

| Path | Role |
| --- | --- |
| `src/index.ts` | Extension entry after Spicetify is ready |
| `src/albums` | Store, album IDs, early hidden-ID mirror |
| `src/lib/firebase` | App, Auth, Firestore album CRUD and listeners |
| `src/features` | Manager panel, album / discography hide toggles, DOM apply |
| `src/hiding` | Route-aware grid and search hiding |
| `src/ui` | Nav mount, album anchors, hide button host |
| `src/webpack` | Bootstrap and post-snapshot hooks for virtual lists |
| `scripts/install.sh` | Copy builds into Spicetify and apply |

Outputs: `hide-albums.js`, `hide-albums-bootstrap.js`, `hide-albums-post-snapshot.js`.

Stack: TypeScript, Vite, Firebase Auth, Cloud Firestore.

## Scripts

| Command | Action |
| --- | --- |
| `npm run build` | Typecheck and write all three bundles to `dist` |
| `npm run watch` | Watch the main extension bundle |
| `npm run apply` | Build, install into Spicetify, and apply |
