# Fondations Design System v3 — Spec UX (US-070)

**Purpose** : Poser l'infrastructure technique (tokens CSS, config Tailwind v4/@nuxt/ui, chargement fonts) du rebranding "Cowgirl élégante" sans encore migrer les composants un par un (couvert par `US-071`/`US-072` et les US de pages `US-073`-`US-075`). Cette US est un prérequis bloquant pour toutes les autres US du Sprint 6.
**Référence** : `docs/design-specs/DESIGN_SYSTEM_v3.md` (document maître — toutes les valeurs hex et règles de contraste y sont détaillées, ne pas les redupliquer de mémoire).
**Location** :
- `app/assets/css/tokens.css`
- `app/assets/css/main.css`
- `nuxt.config.ts` (googleFonts)
- `app/app.config.ts` (nouveau fichier — theming runtime Nuxt UI, cf. §3)

**Révision** : intègre le rôle `danger`/`on-danger` (tranché par le client, remplace `cgws-rust` — cf. `DESIGN_SYSTEM_v3.md` §2.1/§2.6/§7). Ce n'est plus un point bloquant : le token est défini ci-dessous.

---

## 1. Contexte technique à vérifier avant implémentation (règle MCP absolue)

Avant toute modification, `nuxt-developer` DOIT consulter `mcp__nuxt-ui-remote__*` pour :
- Confirmer la syntaxe `@theme static` et le mécanisme de variables CSS theme-aware (`/docs/getting-started/theme/css-variables`, `/docs/getting-started/theme/design-system`) — déjà vérifié au niveau design dans `DESIGN_SYSTEM_v3.md` §6.2, à re-confirmer côté implémentation si la version du module a changé.
- Confirmer le comportement par défaut de `@nuxtjs/color-mode` auto-enregistré par `@nuxt/ui` (cible DOM exacte de la classe `dark`/`light` — `<html>` par défaut selon la documentation du module, à valider), avant d'écrire les sélecteurs CSS `[data-skin="elegante"].dark`.
- Consulter `mcp__nuxt-remote__*` pour l'API `app.head.script` / `useHead()` (Nuxt 4) avant d'implémenter le script anti-flash de l'axe "peau" (non couvert nativement par color-mode, cf. `DESIGN_SYSTEM_v3.md` §6.2).

## 2. Structure `tokens.css` bi-peaux

Remplacement complet du fichier actuel (rôles matière v2 → rôles sémantiques v3, cf. `DESIGN_SYSTEM_v3.md` §2 pour les valeurs exactes) :

```css
/* app/assets/css/tokens.css */
:root {
  /* Rôles sémantiques — défaut = Élégante Jour */
  --cgws-ground: #F6EDDF;
  --cgws-surface: #EFE1CC;
  --cgws-surface-2: #E7D6BC;
  --cgws-edge: #8A4B2F;
  --cgws-hairline: #D8C4A8;
  --cgws-ink: #2A1D16;
  --cgws-ink-soft: #5B4436;
  --cgws-heading: #8A4B2F;
  --cgws-accent: #8C4A56;
  --cgws-accent-deco: #B76E79;
  --cgws-on-accent: #FFF7F0;
  --cgws-danger: #A23A47;
  --cgws-on-danger: #FFF7F0;

  /* Littéraux de marque — fixes, jamais theme-swappés */
  --cgws-brand-cream: #F6EDDF;
  --cgws-brand-parchment: #EFE1CC;
  --cgws-brand-sand: #CBAD85;
  --cgws-brand-rose: #B76E79;
  --cgws-brand-mauve: #8C4A56;
  --cgws-brand-blush: #E8C4CB;
  --cgws-brand-chestnut: #8A4B2F;
  --cgws-brand-tack: #4E3227;
  --cgws-brand-espresso: #2A1D16;

  /* Rayon global — Élégante */
  --ui-radius: 0.5rem;

  /* Typographie */
  --font-display: 'Playfair Display', Georgia, serif;
  --font-heading: 'Rye', serif;
  --font-eyebrow: 'Playfair Display', Georgia, serif;
  --font-serif:   'Playfair Display', Georgia, serif;
  --font-sans:    'Inter', system-ui, sans-serif;

  /* Espacements — inchangés v2 */
  --section-py:    clamp(3rem, 8vw, 6rem);
  --container-max: 1280px;
  --container-px:  clamp(1rem, 4vw, 2rem);
}

/* Élégante Nuit — suit .dark posé par @nuxtjs/color-mode sur <html> */
[data-skin="elegante"].dark {
  --cgws-ground: #241811;
  --cgws-surface: #33231A;
  --cgws-surface-2: #402C20;
  --cgws-edge: #7A5334;
  --cgws-hairline: #4B3527;
  --cgws-ink: #F3E7D7;
  --cgws-ink-soft: #C8AC93;
  --cgws-heading: #E8B9C0;
  --cgws-accent: #D98F9B;
  --cgws-accent-deco: #C98B94;
  --cgws-on-accent: #241811;
  --cgws-danger: #E0808C;
  --cgws-on-danger: #241811;
}

/* Rugueux — rendu unique, sombre, ignore volontairement .dark */
[data-skin="rugueux"] {
  --cgws-ground: #1E140D;
  --cgws-surface: #2C1F15;
  --cgws-surface-2: #3A2A1C;
  --cgws-edge: #7A5A38;
  --cgws-hairline: #463322;
  --cgws-ink: #ECDCC6;
  --cgws-ink-soft: #B39676;
  --cgws-heading: #E8B57E;
  --cgws-accent: #CF8438;
  --cgws-accent-deco: #B8650A;
  --cgws-on-accent: #241A10;
  --cgws-danger: #D66F3E;
  --cgws-on-danger: #241A10;
  --cgws-denim: #5B7A9B;
  --ui-radius: 0.25rem;
}
```

**Note d'implémentation critique (danger Rugueux)** : `#D66F3E` est une valeur **ajustée par calcul de contraste**, différente de la valeur "brique" `#C4562B` initialement approuvée par le client (qui mesure 4.06:1 sur `ground` et 3.59:1 sur `surface`, sous le seuil AA 4.5:1 requis pour un rôle texte). Voir `DESIGN_SYSTEM_v3.md` §2.4 pour le détail du calcul. Si le client demande de revenir à la valeur d'origine après revue visuelle, `danger` devra alors être restreint à un usage "fill uniquement + `on-danger`" (jamais comme couleur de texte directe sur `ground`/`surface`), ce qui changerait le composant `CgwsInput` (message d'erreur ne pourrait plus être en `text-cgws-danger` sur fond clair) — à arbitrer avec `product-owner` si ce cas se présente, ne pas trancher unilatéralement côté implémentation.

**Note d'implémentation critique (data-skin/.dark)** : `[data-skin="elegante"].dark` suppose que l'attribut `data-skin` ET la classe `.dark` sont posés sur le **même élément** (`<html>`). Si `nuxt-developer` confirme via MCP que `@nuxtjs/color-mode` cible un autre élément par défaut, adapter le sélecteur en conséquence (`html.dark[data-skin="elegante"]` reste équivalent quel que soit l'ordre des attributs, mais si la classe est posée sur `<body>` au lieu de `<html>`, il faudra soit reconfigurer le module, soit poser `data-skin` sur `<body>` également pour que le sélecteur composé fonctionne).

## 3. Config Tailwind v4 / `@theme` (`main.css`)

```css
/* app/assets/css/main.css */
@import "tailwindcss";
@import "@nuxt/ui";
@import './tokens.css';

@theme static {
  /* Rôles — exposent les utilitaires bg-cgws-*, text-cgws-*, border-cgws-* */
  --color-cgws-ground:      var(--cgws-ground);
  --color-cgws-surface:     var(--cgws-surface);
  --color-cgws-surface-2:   var(--cgws-surface-2);
  --color-cgws-edge:        var(--cgws-edge);
  --color-cgws-hairline:    var(--cgws-hairline);
  --color-cgws-ink:         var(--cgws-ink);
  --color-cgws-ink-soft:    var(--cgws-ink-soft);
  --color-cgws-heading:     var(--cgws-heading);
  --color-cgws-accent:      var(--cgws-accent);
  --color-cgws-accent-deco: var(--cgws-accent-deco);
  --color-cgws-on-accent:   var(--cgws-on-accent);
  --color-cgws-danger:      var(--cgws-danger);
  --color-cgws-on-danger:   var(--cgws-on-danger);
  --color-cgws-denim:       var(--cgws-denim);

  /* Littéraux de marque */
  --color-cgws-brand-cream:     var(--cgws-brand-cream);
  --color-cgws-brand-parchment: var(--cgws-brand-parchment);
  --color-cgws-brand-sand:      var(--cgws-brand-sand);
  --color-cgws-brand-rose:      var(--cgws-brand-rose);
  --color-cgws-brand-mauve:     var(--cgws-brand-mauve);
  --color-cgws-brand-blush:     var(--cgws-brand-blush);
  --color-cgws-brand-chestnut:  var(--cgws-brand-chestnut);
  --color-cgws-brand-tack:      var(--cgws-brand-tack);
  --color-cgws-brand-espresso:  var(--cgws-brand-espresso);

  /* Typographie */
  --font-display: var(--font-display);
  --font-heading: var(--font-heading);
  --font-eyebrow: var(--font-eyebrow);
  --font-serif:   var(--font-serif);
  --font-sans:    var(--font-sans);
}

*, *::before, *::after { box-sizing: border-box; }

html {
  font-family: var(--font-sans);
  color: var(--cgws-ink);
  background-color: var(--cgws-ground);
}
```

> ⚠️ Vérifier via `mcp__nuxt-ui-remote__get-documentation-page` (`/docs/getting-started/theme/design-system`) que la syntaxe `--color-cgws-x: var(--cgws-x)` (indirection vers une variable déjà theme-aware) est bien supportée par `@theme static` de Tailwind v4 avant implémentation — sinon dupliquer les valeurs hex directement à chaque niveau `[data-skin]` sous `@theme` n'est pas possible (Tailwind v4 résout `@theme` au build, pas au runtime) : la couche d'indirection via variable CSS classique (hors `@theme`) est la bonne approche, à confirmer par test réel (`bg-cgws-ground` doit changer de couleur en live quand `data-skin`/`.dark` changent, sans rebuild).

## 4. `app.config.ts` — theming runtime Nuxt UI (nouveau fichier)

```ts
// app/app.config.ts
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'cgws-accent', // nécessite que 'cgws-accent' soit un color custom Tailwind complet (50-950) — voir note
      neutral: 'stone',
    },
  },
})
```

**Point à trancher avec `nuxt-developer`** : `ui.colors.primary` de Nuxt UI v4 attend un nom de couleur Tailwind avec **toutes les nuances 50 à 950** (cf. `DESIGN_SYSTEM_v3.md` MCP research — "make sure to define all shades from 50 to 950"), alors que nos rôles CGWS sont des tokens plats (une seule valeur par rôle/mode, pas une échelle). Deux options, à arbitrer en implémentation :
1. Ne pas relier `ui.colors.primary` aux tokens CGWS — les composants Nuxt UI génériques (`UButton`, `USelect`, etc.) gardent leur palette neutre Nuxt UI par défaut, et **tous les composants CGWS custom** (`CgwsButton`, `TagCard`, etc.) utilisent directement les classes `bg-cgws-accent` etc. C'est l'approche la plus sûre et la plus proche de l'existant v2 (qui ne touchait pas `app.config.ts`).
2. Générer une échelle 50-950 synthétique par teinte à partir de `accent`/`accent-deco` (via un outil de génération de palette) pour permettre `ui.colors.primary`. Plus cohérent pour les composants Nuxt UI natifs utilisés tels quels (`UModal`, `USelectMenu`…) mais travail supplémentaire non demandé explicitement par le brief.

**Recommandation** : option 1 pour ce sprint (scope maîtrisé), à documenter comme dette si des composants Nuxt UI natifs non stylés custom apparaissent dans le backoffice.

## 5. Chargement fonts (`nuxt.config.ts`)

```ts
googleFonts: {
  families: {
    'Rye': true,
    'Playfair Display': { wght: [400, 600, 700], ital: [400] },
    'Inter': [400, 500, 700],
  },
  display: 'swap',
},
```
Retirer entièrement l'entrée `'Bebas Neue': true`.

## 6. Stratégie de remplacement copper/denim/rust (64 fichiers impactés)

Grep de vérification effectué sur `app/` : **64 fichiers** référencent au moins un token `cgws-*` ou `font-display`/`font-eyebrow` v2, dont **32** référencent spécifiquement `cgws-rust`. Remplacement **manuel guidé par contexte**, jamais un rechercher/remplacer aveugle, car un même ancien token se ventile vers plusieurs rôles selon l'usage (texte vs décoratif) :

| Ancien usage trouvé dans le code | Nouveau token | Vérification à faire avant de remplacer |
|---|---|---|
| `bg-cgws-cream` (fond de page) | `bg-cgws-ground` | — |
| `bg-cgws-parchment` (fond de carte) | `bg-cgws-surface` | — |
| `border-cgws-leather` (bordure structurelle épaisse, ex. TagCard 2px) | `border-cgws-edge` | — |
| `border-cgws-leather/20`, `/25`, `/30` (séparateurs fins) | `border-cgws-hairline` (sans opacité, la valeur hairline est déjà atténuée) | Vérifier visuellement, l'opacité peut ne plus être nécessaire |
| `text-cgws-charcoal` (texte fort) | `text-cgws-ink` | — |
| `text-cgws-leather` (marque produit, texte secondaire) | `text-cgws-ink-soft` | — |
| `text-cgws-rope` (texte sur fond sombre, header/footer) | `text-cgws-ink-soft` si sur `surface`/`ground` sombre, sinon réévaluer au cas par cas | **Résolu** — header/footer suivent désormais les rôles jour/nuit de la peau active (décision client, cf. `US-073-074-075-pages-outline.md` §US-075), donc ce token se comporte comme n'importe quel autre bloc du site, pas de traitement spécial |
| `text-cgws-copper` **utilisé comme texte lisible** (prix, liens, labels) | `text-cgws-accent` | ⚠️ Jamais `accent-deco` ici — règle de contraste |
| `border-cgws-copper` **décoratif** (couture pointillée TagCard, ConchoStat) | `border-cgws-accent-deco` | — |
| `bg-cgws-copper` (bouton primaire, badge plein) | `bg-cgws-accent` + `text-cgws-on-accent` | Revoir le texte associé — `text-cgws-charcoal` v2 devient `text-cgws-on-accent` |
| `bg-cgws-denim` / `border-cgws-denim` / `text-cgws-denim` | `bg-cgws-denim` (inchangé, Rugueux uniquement — masquer/neutraliser en Élégante, cf. décision `product-owner` requise si un bouton secondaire denim existe hors contexte Rugueux) | Confirmer avec `product-owner` si "secondary" CTA existe encore en Élégante et quelle couleur il prend (probablement `accent` en variante outline) |
| `bg-cgws-rust` / `text-cgws-rust` / `border-cgws-rust` | `bg-cgws-danger` + `text-cgws-on-danger` (fills pleins) · `text-cgws-danger` / `border-cgws-danger` (texte/bordure sur fond clair) | **Tranché par le client** — rôle `danger`/`on-danger` défini `DESIGN_SYSTEM_v3.md` §2. Fichiers concernés : `RejectModal.vue` (icône, message d'erreur, bouton "Confirmer le refus", hover bouton déconnexion admin), `CgwsInput`/`CgwsTextarea`/`CgwsSelect` (état erreur), `CgwsBadge` (nouvel état "Refusé"). Détail composant par composant : `US-072` §6 (badges), `US-075` (RejectModal, formulaires admin). |
| `font-display` (classe déjà en place) | Inchangée syntaxiquement, résout maintenant vers Playfair Display au lieu de Bebas Neue | Revoir tous les usages `font-display text-2xl` etc. — Playfair Display est visuellement plus dense que Bebas Neue, vérifier qu'aucun troncage/débordement n'apparaît (ex. prix TagCard, hero H1) |
| `font-eyebrow` (classe déjà en place, résolvait vers Rye) | Résout maintenant vers Playfair Display capitales — **tous les usages actuels de `font-eyebrow` doivent être audités** : ceux qui sont des vrais eyebrows (au-dessus d'un H2) restent `font-eyebrow` ; ceux qui sont en réalité des titres H2/H3 courts doivent migrer vers la nouvelle classe `font-heading` (Rye) | Fichiers concernés (grep) : `AppFooter.vue`, `ConchoStat.vue`/`StarDivider.vue`, `HowItWorks.vue`, etc. |

## 7. Critères d'acceptation (Gherkin)

```gherkin
Feature: Fondations Design System v3

  Scenario: Les tokens de rôle sont définis pour les trois rendus
    Given le fichier app/assets/css/tokens.css est chargé
    Then les variables --cgws-ground, --cgws-surface, --cgws-surface-2, --cgws-edge,
      --cgws-hairline, --cgws-ink, --cgws-ink-soft, --cgws-heading, --cgws-accent,
      --cgws-accent-deco, --cgws-on-accent, --cgws-danger, --cgws-on-danger
      sont définies dans :root (Élégante Jour)
    And les mêmes variables sont redéfinies sous [data-skin="elegante"].dark (Élégante Nuit)
    And les mêmes variables plus --cgws-denim sont redéfinies sous [data-skin="rugueux"]
    And aucune variable v2 (--cgws-tack, --cgws-leather, --cgws-copper, --cgws-rope,
      --cgws-parchment, --cgws-cream, --cgws-rust, --cgws-charcoal) ne subsiste dans tokens.css

  Scenario: Bebas Neue est retiré, Rye conservé
    Given nuxt.config.ts
    Then la famille 'Bebas Neue' n'apparaît plus dans googleFonts.families
    And la famille 'Rye' est toujours présente
    And 'Playfair Display' inclut les graisses 400, 600, 700 et le style italique 400

  Scenario: Les utilitaires Tailwind cgws-* résolvent vers les bons rôles
    Given une page rendue avec [data-skin="elegante"] et sans classe .dark
    When j'inspecte un élément avec la classe bg-cgws-ground
    Then sa couleur de fond calculée est #F6EDDF
    Given la même page avec [data-skin="elegante"] et classe .dark ajoutée sur <html>
    Then la couleur de fond calculée de ce même élément devient #241811
    Given [data-skin="rugueux"] (avec ou sans .dark présent)
    Then la couleur de fond calculée devient #1E140D dans tous les cas

  Scenario: Gate de contraste — accent vs accent-deco
    Given les trois rendus (elegante-jour, elegante-nuit, rugueux)
    Then le ratio de contraste text-cgws-accent sur bg-cgws-ground est >= 4.5:1 dans chaque rendu
    And aucune classe text-cgws-accent-deco n'est utilisée sur du texte lisible dans le code livré
      (vérifié par grep manuel qa-engineer : text-cgws-accent-deco ne doit apparaître que sur
      border-*, bg-*/opacité réduite, ou fill SVG décoratif — jamais en classe text-* portant
      un contenu textuel non-aria-hidden)

  Scenario: Gate de contraste — danger
    Given les trois rendus (elegante-jour, elegante-nuit, rugueux)
    Then le ratio de contraste text-cgws-danger sur bg-cgws-ground est >= 4.5:1 dans chaque rendu
    And le ratio de contraste text-cgws-danger sur bg-cgws-surface est >= 4.5:1 dans chaque rendu
    And le ratio de contraste text-cgws-on-danger sur bg-cgws-danger est >= 4.5:1 dans chaque rendu
    And en Rugueux, --cgws-danger vaut #D66F3E (valeur ajustée) et non #C4562B (valeur d'origine
      insuffisante — 4.06:1/3.59:1, cf. DESIGN_SYSTEM_v3.md §2.4/§2.6)

  Scenario: app.config.ts ne casse pas les composants Nuxt UI existants
    Given le backoffice admin utilise des composants Nuxt UI natifs (ex. UTable, USelectMenu)
    When app.config.ts est ajouté avec la config ui.colors
    Then aucun composant Nuxt UI natif existant ne lève d'erreur de couleur non définie au build
    And vue-tsc --noEmit ne remonte aucune erreur
```

## 8. Definition of Done spécifique

- [ ] `tokens.css` et `main.css` conformes à §2/§3, y compris `--cgws-danger`/`--cgws-on-danger` dans les 3 rendus
- [ ] `app.config.ts` créé, décision §4 tranchée et documentée en commentaire dans le fichier
- [ ] `nuxt.config.ts` fonts mis à jour, Bebas Neue retiré
- [ ] Build Tailwind sans erreur, `vue-tsc --noEmit` sans erreur
- [ ] Aucune régression visuelle bloquante sur les pages existantes (elles referencent encore les anciens noms de composants — la migration composant par composant est couverte par `US-071`/`US-072`/`US-073`-`US-075`, mais rien ne doit être visuellement cassé de façon irrécupérable à ce stade, ex. couleurs `undefined`/transparentes)
- [ ] Gate de contraste `danger`/`on-danger` vérifiée dans les 3 rendus (§7) — en particulier la valeur Rugueux ajustée `#D66F3E`, pas la valeur client d'origine `#C4562B`
