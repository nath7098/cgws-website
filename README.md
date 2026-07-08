# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Synchronisation GitHub ↔ Notion

Deux scripts dans `scripts/` maintiennent une base Notion et les issues GitHub en miroir :

- `sync-to-notion.cjs` — pousse une issue vers Notion à chaque événement GitHub
  (workflow `.github/workflows/github-to-notion.yml`).
- `sync-to-github.cjs` — relit la base Notion et répercute les changements
  vers les issues GitHub, toutes les 10 min via cron
  (workflow `.github/workflows/notion-to-github.yml`).

Les champs **titre**, **état**, **labels** et **corps (Body)** sont synchronisés
dans les deux sens ; en cas de différence, **Notion fait foi**.

### Limites connues

- Le corps (Body) est stocké dans Notion en blocs `rich_text` de 2000 caractères
  (limite de l'API Notion). La synchro en découpe / recompose automatiquement le
  texte, jusqu'à **~40 000 caractères** (20 blocs). Au-delà, le contenu est tronqué
  côté Notion avec la mention « (...) contenu tronqué, voir l'issue GitHub » ;
  dans ce cas, GitHub reste la source de vérité et le corps de l'issue n'est pas
  réécrit depuis Notion.
