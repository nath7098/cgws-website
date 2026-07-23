# EmailFallbackBanner — Spec UX (US-094)

**Purpose** : alerter Camille, de façon impossible à manquer mais non intrusive, tant que les emails du site (contact, consignation, vente) partent depuis le domaine de test Resend (`onboarding@resend.dev`) plutôt que depuis `cgws.fr` vérifié — cause confirmée de #27 et #24. Ce bandeau ne doit **jamais** pouvoir être fermé définitivement : masquer un vrai problème de production irait à l'encontre de sa raison d'être (cf. critère Gherkin US-094, 2ᵉ scénario).

**Location** : `app/components/admin/EmailFallbackBanner.vue`, monté dans `app/pages/admin/dashboard.vue` (couverture suffisante selon la note technique de la US — Camille consulte le dashboard à chaque connexion admin ; pas monté dans `layouts/admin.vue` pour éviter de dupliquer l'appel réseau `email-status` sur chaque page admin sans bénéfice supplémentaire).

Aucun composant Nuxt UI natif utilisé : `UAlert` a été écarté après vérification (`mcp__nuxt-ui-remote__get-component Alert`) — sa prop `color` (`error`/`warning`/`neutral`...) est indexée sur la palette Nuxt UI par défaut, et `app/app.config.ts` confirme explicitement que `ui.colors` n'est **pas** relié aux rôles CGWS (`--cgws-danger`, etc. restent des tokens plats, pas une échelle 50-950 requise par Nuxt UI v4). Utiliser `UAlert color="error"` rendrait donc une couleur rouge Nuxt UI générique, non theme-aware entre les 3 peaux — exactement le type de régression qui a fait échouer la QA `US-070`. Le bandeau est un `<div>` custom en classes `bg-cgws-*`, aligné sur le pattern déjà établi par `RejectModal.vue` (icône dans cercle `bg-cgws-danger/10` + `text-cgws-danger`) et `KpiCard.vue` (variante `warning` : `border-l-4` de couleur de rôle) plutôt qu'une nouvelle convention.

## Layout (ASCII wireframe)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ⚠  Expéditeur email de test actif — vos emails de contact, consignation  │
│    et vente ne partent qu'à l'adresse du compte Resend. Le domaine       │
│    cgws.fr doit être vérifié dans Resend.                                │
└──────────────────────────────────────────────────────────────────────────┘
   ↑ bg-cgws-surface · border-l-4 border-l-cgws-danger · icône bg-cgws-danger/10
   (PAS de bouton de fermeture)
```

Positionné en première position dans `admin/dashboard.vue`, au-dessus du titre "Tableau de bord" — visible sans scroll sur mobile comme desktop, mais sous la topbar (ne bloque jamais la navigation).

## Breakpoints

- **Mobile 375px** : bandeau pleine largeur, icône + texte empilés horizontalement (`flex items-start gap-3`), texte en `text-[13px]`, padding réduit (`p-3`).
- **Tablet 768px** : `p-4`, `text-sm`.
- **Desktop 1440px** : identique à tablet, largeur contrainte par le conteneur `space-y-8` existant de `dashboard.vue` (pas de `max-w` supplémentaire — le bandeau suit la largeur du contenu admin comme les autres blocs de la page).

Pas de rupture de layout à prévoir : un seul bloc de texte, pas de grille.

## États

- **Default (fallback actif)** : bandeau visible, tel que décrit ci-dessus. Reste affiché tant que `GET /api/admin/email-status` retourne `{ isFallback: true }` — aucune interaction utilisateur ne peut le masquer (pas de bouton fermer, conformément au critère Gherkin).
- **Résolu (domaine vérifié)** : `isFallback: false` → le composant ne rend rien (`v-if`, pas de `v-show` — retrait complet du DOM, pas seulement caché visuellement, pour ne laisser aucune trace/`aria-hidden` orpheline).
- **Loading** : pendant l'appel réseau initial (`onMounted`), rien ne s'affiche (pas de skeleton) — un flash de bandeau qui apparaît puis disparaît serait plus perturbant qu'une absence momentanée. Le composant reste `null` tant que la réponse n'est pas connue.
- **Erreur réseau** (l'endpoint `email-status` échoue) : afficher le bandeau par défaut (fail-safe côté visibilité : mieux vaut un faux positif visible qu'un vrai problème silencieux) plutôt que de le masquer — cohérent avec la philosophie de la US (« ne plus jamais découvrir après-coup »).
- **Non-admin / visiteur public** : sans objet — le composant n'est monté que dans `pages/admin/dashboard.vue`, layout `admin` protégé par le middleware `auth.ts`. L'endpoint `email-status.get.ts` doit lui-même exiger l'auth admin (cf. notes techniques de la US) — double garde (page + API), aucune info n'est exposée publiquement même par requête directe à l'API.

## Tailwind classes (clés)

```html
<div
  v-if="isFallback"
  role="alert"
  class="flex items-start gap-3 p-3 md:p-4 rounded-[--ui-radius]
         bg-cgws-surface border border-cgws-hairline border-l-4 border-l-cgws-danger"
>
  <div class="flex-shrink-0 w-8 h-8 rounded-full bg-cgws-danger/10 flex items-center justify-center">
    <UIcon name="i-lucide-mail-warning" class="w-4 h-4 text-cgws-danger" aria-hidden="true" />
  </div>
  <p class="font-sans text-[13px] md:text-sm text-cgws-ink leading-relaxed">
    <strong class="font-semibold text-cgws-danger">Expéditeur email de test actif</strong> —
    vos emails de contact, consignation et vente ne partent qu'à l'adresse du compte Resend.
    Le domaine cgws.fr doit être vérifié dans Resend.
  </p>
</div>
```

Le message reprend **mot pour mot** le texte imposé par le critère Gherkin de la US — aucune reformulation. Le mot « Expéditeur email de test actif » est mis en emphase (`text-cgws-danger`, court, 4 mots) pour scanner l'alerte en un coup d'œil, le reste du message en `text-cgws-ink` (contraste ≥13:1 sur `surface` dans les 3 rendus — pas de dépendance à un fond translucide, cf. règle §2.1 `DESIGN_SYSTEM_v3.md` sur les compositions `/opacity`) pour rester lisible sans fatigue.

`border-l-4 border-l-cgws-danger` : bordure structurelle opaque (pas de composition `/opacity`), directement vérifiée par les mesures `DESIGN_SYSTEM_v3.md` §2.6 (`danger` sur `surface` : 5.04:1 Jour / 5.47:1 Nuit / 4.72:1 Rugueux — élément non textuel, seuil 3:1, largement dépassé). `bg-cgws-danger/10` ne porte que l'icône (élément graphique, seuil 3:1 non-texte également couvert par la marge de `danger`), jamais de texte — donc pas soumis à la règle plus stricte des compositions `/15` texte (§2.1/§4.1).

## Composable / logique (résumé, pour cohérence avec l'implémentation)

```ts
const isFallback = ref(false)

onMounted(async () => {
  try {
    const { isFallback: fallback } = await $fetch<{ isFallback: boolean }>('/api/admin/email-status')
    isFallback.value = fallback
  }
  catch {
    isFallback.value = true // fail-safe : afficher plutôt que masquer en cas d'échec réseau
  }
})
```

*(À confirmer par `nuxt-developer` via `mcp__nuxt-remote` : usage de `$fetch` vs `useFetch`/`useAsyncData` dans ce contexte `onMounted` client-only — l'endpoint dépend de l'état serveur au moment de la requête et n'a pas besoin d'être résolu en SSR pour cette bannière admin, un simple `$fetch` en `onMounted` évite un flash SSR inutile sur une donnée qui n'affecte que l'admin authentifiée après hydratation ; à valider que ce choix ne casse pas une convention déjà en place ailleurs dans `app/pages/admin/`.)*

## Accessibilité

- `role="alert"` : annonce automatique aux lecteurs d'écran dès l'insertion dans le DOM (pas besoin d'`aria-live` supplémentaire, `role="alert"` implique `aria-live="assertive"` par défaut) — cohérent avec l'usage déjà en place pour les messages d'erreur de formulaire (`RejectModal.vue` : `role="alert"` sur le message de validation).
- `aria-label` : non nécessaire, le contenu textuel du bandeau est déjà le message complet et suffisant pour un lecteur d'écran (pas de contenu tronqué visuellement qui nécessiterait un label plus long).
- Focus : le bandeau ne contient aucun élément interactif (pas de bouton fermer, pas de lien) — rien à ajouter à l'ordre de tabulation, conformément au critère Gherkin (« pas de bouton fermer définitivement »).
- Contraste : `text-cgws-ink` sur `bg-cgws-surface` ≥13:1 (3 rendus, §2.6) ; `text-cgws-danger` (emphase courte) sur `bg-cgws-surface` ≥4.72:1 (le plus bas des 3 rendus, Rugueux) — tous deux au-dessus du seuil AA 4.5:1 texte normal.
- Icône `i-lucide-mail-warning` : décorative en complément du texte (`aria-hidden="true"`), l'information n'est jamais portée uniquement par l'icône.

## Point non tranché par ce spec

Le nom d'icône `i-lucide-mail-warning` n'a pas été vérifié via `mcp__nuxt-ui-remote__search-icons` dans cette session — à confirmer par `nuxt-developer` avant implémentation (alternative plausible si absente : `i-lucide-triangle-alert` déjà dans la famille utilisée ailleurs en admin, ou `i-lucide-mail-x`).
