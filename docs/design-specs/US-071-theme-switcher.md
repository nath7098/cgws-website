# ThemeSwitcher — Spec UX (US-071)

**Purpose** : Permet au visiteur de choisir sa peau (Élégante/Rugueux) et, quand Élégante est active, son mode jour/nuit — persisté, avec défaut `prefers-color-scheme`, sans flash au premier chargement.
**Location** : `app/components/layout/ThemeSwitcher.vue` (nouveau), intégré dans `app/components/layout/AppHeader.vue` et `app/components/layout/MobileMenu.vue`.
**Dépend de** : `US-070` (tokens `[data-skin]` en place).
**Prérequis MCP** : consulter `mcp__nuxt-ui-remote__get-component` sur `ColorModeButton`/`ColorModeSwitch`/`ColorModeSelect` et `mcp__nuxt-remote__*` pour `useHead`/`app.head.script` avant d'implémenter — cf. `DESIGN_SYSTEM_v3.md` §6.2.

---

## 1. Modèle de données / composables

Deux préférences indépendantes, l'une native Nuxt UI, l'autre custom :

```ts
// Axe 1 — jour/nuit, natif @nuxtjs/color-mode (auto-enregistré par @nuxt/ui)
const colorMode = useColorMode()
// colorMode.preference: 'system' | 'light' | 'dark'
// colorMode.value: 'light' | 'dark' (résolu)

// Axe 2 — peau, composable custom à créer
// app/composables/useCgwsSkin.ts
type CgwsSkin = 'elegante' | 'rugueux'
function useCgwsSkin(): { skin: Ref<CgwsSkin>; setSkin: (s: CgwsSkin) => void }
```

`useCgwsSkin()` :
- État réactif backé par `localStorage['cgws-skin']` (clé dédiée, distincte de la clé du module color-mode).
- Défaut `'elegante'` si aucune valeur stockée.
- `setSkin()` met à jour le state, `localStorage`, et l'attribut `data-skin` sur `<html>` (via `document.documentElement.dataset.skin = value` côté client ; le rendu SSR initial doit déjà porter la bonne valeur grâce au script anti-flash, cf. §4).

## 2. Layout (ASCII wireframe)

**Desktop (≥1024px)**, dans `AppHeader`, à droite, avant l'icône téléphone :

```
┌───────────────────────────────────────────────────────────────────┐
│ CGWS      Catalogue  Consignation  À Propos  Contact   [✦|⚙] ☀ 📞  │
└───────────────────────────────────────────────────────────────────┘
                                                          ↑    ↑
                                                   skin toggle │
                                                     mode toggle (masqué si Rugueux)
```

Détail du bloc `ThemeSwitcher` (segment à 2 boutons + toggle conditionnel) :

```
┌─────────────┬─────────────┐     ┌────┐
│  ✦ Élégante │  ⚙ Rugueux  │     │ ☀/☾ │  ← visible seulement si skin === 'elegante'
└─────────────┴─────────────┘     └────┘
   accent quand actif                icône change selon colorMode.value résolu
```

**Mobile (<1024px)** : intégré dans `MobileMenu` (drawer), sous forme de deux lignes distinctes en bas du menu, au-dessus du CTA téléphone :

```
┌───────────────────────────────┐
│  Apparence                    │  ← eyebrow, font-eyebrow
│  ┌───────────┬───────────┐    │
│  │ ✦ Élégante│ ⚙ Rugueux │    │
│  └───────────┴───────────┘    │
│  ┌───────────────────────┐    │
│  │ ☀ Clair   /   ☾ Sombre│    │  ← masqué si Rugueux actif
│  └───────────────────────┘    │
└───────────────────────────────┘
```

## 3. Breakpoints

- **Mobile 375px** : dans `MobileMenu`, pleine largeur, boutons segmentés `grid grid-cols-2 gap-2`, hauteur tactile ≥44px.
- **Tablet 768px** : identique mobile (le switcher reste dans le menu si la nav principale n'est pas encore desktop — dépend du breakpoint `lg:` déjà utilisé par `AppHeader`/`MobileMenu`, à aligner sur celui-ci).
- **Desktop 1440px** : inline dans `AppHeader`, icônes compactes `w-9 h-9`, segment skin `h-9`, tooltip au survol (`title` natif suffit, pas de composant tooltip dédié requis).

## 4. Anti-flash SSR — comportement attendu

1. **Axe jour/nuit** : couvert nativement par `@nuxtjs/color-mode` — le module injecte son propre script bloquant avant paint. Aucune implémentation custom requise pour cet axe, cf. `DESIGN_SYSTEM_v3.md` §6.2.
2. **Axe peau** : nécessite un script bloquant custom, injecté dans `<head>` avant tout rendu du `<body>`, qui :
   - lit `localStorage['cgws-skin']`
   - si absent, pose `data-skin="elegante"` (défaut)
   - si présent (`'elegante'` ou `'rugueux'`), pose `document.documentElement.dataset.skin` en conséquence
   - s'exécute de façon synchrone, avant le premier paint (ni `async`, ni `defer`)
   - **Implémentation exacte à vérifier via `mcp__nuxt-remote`** avant de coder (`app.head.script` dans `nuxt.config.ts` vs script inline via un plugin Nuxt avec `useHead()` en mode SSR — les deux approches existent dans l'écosystème Nuxt 4, la bonne doit être confirmée par la doc officielle, pas supposée).
3. **Comportement attendu observable** : recharger la page avec `cgws-skin=rugueux` dans `localStorage` ne doit **jamais** montrer, même une fraction de seconde, le rendu Élégante avant de basculer en Rugueux.

## 5. States

| État | Rendu |
|---|---|
| Skin "Élégante" actif | Bouton segmenté "Élégante" en `bg-cgws-accent text-cgws-on-accent`, "Rugueux" en `bg-cgws-surface-2 text-cgws-ink-soft` |
| Skin "Rugueux" actif | Inverse — "Rugueux" en `bg-cgws-accent text-cgws-on-accent` |
| Mode jour/nuit — quand Élégante actif | Icône soleil (`i-lucide-sun`) si `colorMode.value === 'light'`, lune (`i-lucide-moon`) si `'dark'` |
| Mode jour/nuit — quand Rugueux actif | Contrôle **masqué** (`v-if`), pas seulement désactivé visuellement — Rugueux n'a pas de variante jour, l'afficher désactivé serait trompeur |
| Hover (desktop) | `translateY(-1px)` léger, transition couleur 150ms |
| Focus clavier | Ring `cgws-accent` 2px, offset 2px, visible sur fond sombre header comme clair |
| Chargement avant hydratation | Rendu SSR déjà correct (anti-flash), donc pas de skeleton nécessaire ; le contenu affiché côté serveur = contenu final, pas de `<ClientOnly>` sur l'axe peau (contrairement à l'axe jour/nuit qui suit le pattern documenté Nuxt UI, cf. §6) |

## 6. Gestion de l'hydratation — axe jour/nuit

Reprendre le pattern officiel Nuxt UI documenté (`mcp__nuxt-ui-remote`, `/docs/getting-started/integrations/color-mode/nuxt`) :

```vue
<ClientOnly v-if="!colorMode?.forced">
  <UButton
    :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
    color="neutral"
    variant="ghost"
    :aria-label="`Passer en mode ${isDark ? 'clair' : 'sombre'}`"
    @click="isDark = !isDark"
  />
  <template #fallback>
    <div class="size-9" />
  </template>
</ClientOnly>
```

Le bouton "peau" n'a pas besoin de ce wrapping (rendu SSR déjà correct via le script anti-flash, cf. §4) — seul l'axe jour/nuit suit le pattern `ClientOnly`/fallback documenté par Nuxt UI, car `colorMode.value` n'est fiable côté client qu'après hydratation même si le script du module a déjà posé la bonne classe visuellement.

## 7. Tailwind classes (clés)

**Segment skin (conteneur)** :
```
inline-flex items-center rounded-full border border-cgws-hairline
bg-cgws-surface-2/50 p-0.5 gap-0.5
```

**Bouton skin actif** :
```
inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
bg-cgws-accent text-cgws-on-accent
font-sans text-xs font-semibold uppercase tracking-wide
transition-colors duration-150
```

**Bouton skin inactif** :
```
inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
text-cgws-ink-soft hover:text-cgws-ink hover:bg-cgws-surface-2
font-sans text-xs font-semibold uppercase tracking-wide
transition-colors duration-150
```

**Toggle jour/nuit** :
```
inline-flex items-center justify-center w-9 h-9 rounded-full
text-cgws-ink-soft hover:text-cgws-accent hover:bg-cgws-surface-2
transition-colors duration-150
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent focus-visible:ring-offset-2
```

## 8. Accessibilité

- Segment skin : `role="radiogroup"` avec `aria-label="Choix de l'apparence du site"` ; chaque bouton `role="radio"` + `aria-checked`.
- Toggle jour/nuit : `<button>` natif, `aria-label` dynamique (`"Passer en mode sombre"` / `"Passer en mode clair"`), pas d'icône seule sans label.
- Navigation clavier : `Tab` atteint le segment skin puis le toggle jour/nuit (ou uniquement le segment skin si Rugueux actif) ; `Enter`/`Espace` activent ; flèches gauche/droite navigables au sein du `radiogroup` (pattern ARIA standard radiogroup).
- Annoncer le changement via `aria-live="polite"` sur une région visuellement masquée (`sr-only`) : `"Apparence changée : Élégante, mode sombre"`.
- Contraste : boutons actifs `on-accent` sur `accent` ≥5.6:1 dans les 3 rendus (cf. `DESIGN_SYSTEM_v3.md` §2.6) ; boutons inactifs `ink-soft` sur `surface-2` à vérifier ≥4.5:1 lors de l'implémentation (paire non pré-calculée dans le doc maître, `ink-soft` a été mesuré sur `ground`, pas `surface-2` — QA doit revérifier cette paire spécifique).

## 9. Critères d'acceptation (Gherkin)

```gherkin
Feature: Sélecteur de peau et de mode

  Scenario: Défaut à la première visite
    Given un visiteur sans préférence stockée en localStorage
    And son système est configuré en dark mode
    When il charge n'importe quelle page du site
    Then la peau affichée est "elegante"
    And le mode affiché est "sombre" (suit prefers-color-scheme)
    And aucun flash de la peau ou du mode par défaut n'est visible avant le rendu final

  Scenario: Changement de peau persistant
    Given un visiteur sur la peau "elegante"
    When il clique sur "Rugueux" dans le ThemeSwitcher
    Then toute l'interface bascule immédiatement sur les tokens Rugueux
    And le contrôle jour/nuit disparaît du ThemeSwitcher
    And en rechargeant la page, la peau "rugueux" est appliquée dès le premier rendu serveur, sans flash

  Scenario: Changement de mode jour/nuit en peau Élégante
    Given un visiteur sur la peau "elegante", mode clair
    When il clique sur le toggle jour/nuit
    Then l'interface bascule sur les tokens Élégante Nuit
    And ce choix persiste au rechargement, indépendamment de prefers-color-scheme

  Scenario: Retour à Élégante après avoir choisi Rugueux
    Given un visiteur ayant précédemment choisi le mode "sombre" en Élégante, puis basculé sur Rugueux
    When il revient sur "Élégante"
    Then le mode jour/nuit précédemment choisi (sombre) est restauré, pas réinitialisé au défaut système

  Scenario: Accessibilité clavier
    Given le focus clavier sur le ThemeSwitcher
    When l'utilisateur navigue avec Tab puis les flèches au sein du segment skin
    Then chaque contrôle reçoit un ring de focus visible en cgws-accent
    And l'activation au clavier (Enter/Espace) produit le même effet qu'un clic
```

## 10. Points non spécifiés — décisions prises

- **Icônes** : `i-lucide-sun`/`i-lucide-moon` pour le mode, une icône étoile-boussole simplifiée (réutilisant le motif `StarDivider`, cf. `US-072`) pour "Élégante" et une icône bouton/rivet (`i-lucide-circle-dot` ou équivalent laiton, à choisir en implémentation via `mcp__nuxt-ui-remote__search-icons`) pour "Rugueux" — le brief ne spécifie pas d'iconographie pour le switcher, ce choix est à valider visuellement.
- **Comportement si JS désactivé** : le rendu SSR par défaut (`elegante`, mode selon `prefers-color-scheme` — non détectable côté serveur sans JS, donc fallback jour) reste figé, le switcher n'étant pas fonctionnel sans JS ; acceptable, cohérent avec la dépendance JS déjà assumée par le reste du site (GSAP, Pinia).
