/**
 * Déclaration ambiante pour le programme TypeScript `node`
 * (.nuxt/tsconfig.node.json) UNIQUEMENT — branchée via
 * `typescript.nodeTsConfig.include` dans nuxt.config.ts.
 *
 * Pourquoi : @nuxt/image référence `image/providers.d.ts` depuis
 * `.nuxt/nuxt.node.d.ts`, qui fait `typeof import('app/providers/
 * supabase-provider.ts')` — le fichier source du provider est donc
 * type-checké dans le contexte `node`, qui n'a NI les globaux d'auto-import
 * de l'app, NI de mapping `#imports`/`#app`. Or le pattern officiel
 * @nuxt/image pour les providers custom repose sur `useRuntimeConfig`
 * auto-importé (résolu par le bundler vers la bonne implémentation dans
 * chaque bundle : vue app et nitro).
 *
 * Cette déclaration est TRUTHFUL : elle pointe vers le vrai type de
 * `useRuntimeConfig` (nuxt/app), celui que le provider utilise réellement à
 * l'exécution. Aucun impact runtime (fichier .d.ts pur).
 *
 * Ce dossier racine `types/` n'est matché par aucun include des programmes
 * app/shared/server (qui déclarent déjà ce global) — pas de double
 * déclaration.
 */

declare global {
  const useRuntimeConfig: (typeof import('nuxt/app'))['useRuntimeConfig']
}

export {}
