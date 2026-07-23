# CgwsApprovedBadge — Spec UX (US-110)

**Purpose** : Matérialiser la promesse centrale de la boutique — « Testé et approuvé par Camille » — sur les articles que Camille a personnellement utilisés et validés. C'est le différenciateur affiché du repositionnement reining (`docs/BRAND_DIRECTION.md` § Signature éditoriale). Le badge donne au `Compétiteur` un repère de confiance instantané (« si c'est dans le catalogue, c'est que ça marche ») avec un clin d'œil d'initié : le score de juge de reining **`+1½`** (la note d'une manœuvre excellente, l'échelle allant de −1½ à +1½).

**Location** : `app/components/ui/CgwsApprovedBadge.vue` (nouveau — famille des composants signature, cohérent avec `TagCard`, `StarDivider`, `CgwsBadge`).

**Note de cohérence design system** : le brief parle du « design system v2 (cuir/cuivre/denim) ». Sur le terrain, ce système a été porté en **v3 "Cowgirl élégante" theme-aware** (`app/assets/css/tokens.css`, `US-070`/`US-072`) : plus aucun token littéral `cgws-copper`/`cgws-leather` codé en dur dans les composants, mais des **rôles sémantiques** (`cgws-accent`, `cgws-ink`, `cgws-surface`, `cgws-edge`, `cgws-accent-deco`…) qui se ré-habillent selon 3 rendus : `elegante-jour` (défaut), `elegante-nuit` (`.dark`), `rugueux`. Le laiton/cuivre survit dans le rendu Rugueux (`accent #CF8438`, `accent-deco #B8650A`). **Ce badge suit strictement le système de rôles** — comme tous les composants signature récents — pour rester lisible et beau dans les 3 peaux. Toute couleur ci-dessous est un rôle, jamais un littéral.

**Règle de contraste héritée (US-072 §rappel)** : `accent-deco` = **décoratif uniquement, jamais de texte lisible** (couture pointillée, anneau poinçonné). Tout texte porteur d'information (le `+1½`, les libellés) utilise `accent`, `ink`, ou `on-accent`.

---

## 1. Concept visuel

**Le sceau de maître-sellier.** Le badge est un **médaillon frappé** (façon concho / poinçon de cuir estampé), pas une pastille e-commerce générique. Il réunit deux signes :

1. **Le sceau `+1½`** — un disque plein couleur `accent` bordé d'un **anneau poinçonné pointillé** (`accent-deco`), reprenant le vocabulaire déjà établi : la couture pointillée de `TagCard` et le centre « poinçonné » de `StarDivider`. Au centre, la note de juge `+1½` frappée en `on-accent`. C'est le clin d'œil reining : un cavalier reconnaît instantanément « manœuvre excellente », le néophyte lit juste un poinçon de qualité premium.
2. **Le paraphe** — à côté du sceau, un lockup texte court : eyebrow « TESTÉ & APPROUVÉ » + signature manuscrite-sérif « par Camille » (Playfair Italic), qui personnifie la caution et évite l'effet label industriel.

**Pourquoi ça reste premium-authentique, jamais kitsch** : aucune étoile de shérif, aucun fer à cheval, aucune dorure. On réutilise des gestes de sellerie réels déjà présents dans le DS (poinçon, couture, estampe cuir) et un code métier réel (la fiche de notation NRHA). Le `+1½` n'est **pas une note variable par produit** : c'est un glyphe fixe, identique sur tous les articles approuvés — un emblème, pas un système de rating (point à faire respecter en implémentation pour éviter toute confusion « avis client »).

---

## 2. Anatomie & variantes

### Props TypeScript

```ts
interface Props {
  /** Échelle contextuelle. Défaut 'md' (fiche produit). */
  size?: 'sm' | 'md' | 'lg'
  /** Affiche l'argumentaire de curation sous le lockup (fiche produit uniquement). */
  withArgument?: boolean
  /** Override du micro-argumentaire. Défaut = copie placeholder (cf. §6). */
  argument?: string
}
```

> Le composant est **purement présentationnel** : il ne reçoit PAS le `Product`. Le parent le monte conditionnellement (`v-if="product.camilleApproved"`, cf. §5). La colonne DB `camille_approved` (bool, défaut `false`) et le champ `Product.camilleApproved` sont la vérité — le badge n'est **jamais** rendu par défaut.

### Anatomie (variante `md`, fiche produit)

```
 ┌─ sceau ─┐
 ╭─────────╮   TESTÉ & APPROUVÉ        ← eyebrow : font-eyebrow, uppercase, text-cgws-accent
 │ ╌╌╌╌╌╌╌ │   par Camille             ← signature : font-serif italic, text-cgws-ink
 │  + 1 ½  │
 │ ╌╌╌╌╌╌╌ │   ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄   ← (si withArgument) filet pointillé accent-deco
 ╰─────────╯   « Je l'ai monté et testé… »  ← argumentaire : font-sans, text-cgws-ink-soft
   ↑ disque accent
   + anneau pointillé accent-deco
   + « +1½ » en on-accent (Playfair 700, tabular-nums)
```

| Élément | Détail |
|---|---|
| Sceau (disque) | `rounded-full bg-cgws-accent`, diamètre selon `size` |
| Anneau poinçonné | `border border-dashed border-cgws-on-accent/40` en retrait (`inset`) — signature « cuir cousu » |
| Score `+1½` | `font-display font-bold tabular-nums text-cgws-on-accent`, `leading-none` |
| Eyebrow | « TESTÉ & APPROUVÉ » — `font-eyebrow uppercase tracking-wider text-cgws-accent` |
| Paraphe | « par Camille » — `font-serif italic text-cgws-ink` |
| Argumentaire (opt.) | 1–2 phrases, `font-sans text-cgws-ink-soft`, séparé par un filet pointillé `accent-deco` |

### Les 3 tailles

| `size` | Contexte | Rendu |
|---|---|---|
| **`sm`** | Carte catalogue (`ProductCard`) + mini-cartes homepage | **Sceau seul**, épinglé en coin d'image, sans lockup texte visible (libellé porté par `aria-label` + `sr-only`). Sceau ø **32px**. `+1½` en `text-[13px]`. Non interactif (la carte entière est déjà un lien). |
| **`md`** | Fiche produit (`ProductInfo`) | **Sceau ø 44px + lockup horizontal** (eyebrow + paraphe). Argumentaire affiché via `withArgument`. |
| **`lg`** | Mise en avant homepage / section « promesse de curation » | **Sceau ø 60px**, lockup empilé et centré, eyebrow en **Rye** (`font-heading`) pour l'accent letterpress premium. Argumentaire recommandé. |

> **Rye (`font-heading`) réservé au `lg`** : Rye est peu lisible en petit corps (règle typo v3, `US-072` §3). En `sm`/`md`, l'eyebrow reste en `font-eyebrow` (Playfair) uppercase ; seul le `lg`, où le mot est grand et court (« TESTÉ & APPROUVÉ » = 3 mots), peut porter Rye sans perte de lisibilité.

### Variante « avec argumentaire » (fiche produit)

`<CgwsApprovedBadge size="md" with-argument />` — encart autoportant, esthétique proche de l'encart consignation existant (`ProductInfo.vue` l.240) mais **habillé de la couture pointillée** signature plutôt qu'un simple `border` :

```
╭──────────────────────────────────────────────╮  ← border border-dashed border-cgws-accent-deco
│ ╭─────╮  TESTÉ & APPROUVÉ                      │     rounded-[6px] bg-cgws-surface p-4
│ │ +1½ │  par Camille                           │
│ ╰─────╯                                        │
│  Je l'ai monté et testé en concours comme à    │  ← argumentaire, max ~180 caractères
│  l'entraînement. S'il est ici, c'est qu'il      │
│  tient ses promesses.                          │
│                            — à valider par Camille │  ← mention placeholder (retirée au contenu final)
╰──────────────────────────────────────────────╯
```

---

## 3. Layout, breakpoints & classes Tailwind

### Breakpoints

- **Mobile 375px** : `sm` inchangé (sceau 32px en coin d'image). `md` sur fiche = sceau + lockup passent en ligne, le lockup peut wrapper sous le sceau si <320px de large (`flex-wrap`). `lg` homepage = pile centrée, sceau 56px.
- **Tablet 768px** : `md` toujours horizontal ; `lg` sceau 60px.
- **Desktop 1440px** : identique tablet ; `lg` peut monter à 64px si la maquette homepage le justifie (via classe utilitaire au point d'usage, pas dans le composant).

### Classes clés — sceau (commun, taille pilotée par `size`)

```
/* wrapper sceau */
relative inline-flex items-center justify-center flex-shrink-0 rounded-full
bg-cgws-accent
size-8            /* sm */   md:… piloté par prop, pas par breakpoint
/* md */ size-11
/* lg */ size-14 md:size-15

/* anneau poinçonné (élément absolu interne) */
absolute inset-[3px] rounded-full border border-dashed border-cgws-on-accent/40
aria-hidden="true"

/* score +1½ */
relative z-10 font-display font-bold tabular-nums leading-none text-cgws-on-accent
/* sm */ text-[13px]   /* md */ text-base   /* lg */ text-xl
```

> Le `½` : rendre le glyphe unicode `½` (U+00BD) pour une fraction propre et alignée, `+1½` en une seule chaîne. `tabular-nums` garantit l'alignement métier.

### Classes clés — lockup (`md`/`lg`)

```
/* conteneur */
inline-flex items-center gap-3        /* md */
flex-col items-center text-center gap-2  /* lg */

/* eyebrow */
font-eyebrow uppercase tracking-wider text-cgws-accent
text-[11px]                            /* md */
font-heading text-sm normal-case tracking-wide  /* lg — Rye */

/* paraphe */
font-serif italic text-cgws-ink
text-sm                                /* md */   text-base  /* lg */
```

### Classes clés — encart argumentaire (`with-argument`)

```
/* encart */
mt-3 rounded-[6px] bg-cgws-surface p-4
border border-dashed border-cgws-accent-deco   /* couture signature */

/* filet séparateur avant l'argumentaire */
my-3 border-t border-dashed border-cgws-accent-deco/50   aria-hidden="true"

/* texte argumentaire */
font-sans text-[13px] leading-relaxed text-cgws-ink-soft

/* mention placeholder (supprimée au contenu validé) */
mt-2 block font-sans text-[11px] italic text-cgws-ink-soft/70
```

### Placement carte — sceau `sm` en coin d'image

```
/* dans ProductCard, sur la zone image (aspect-[4/3]) */
absolute top-3 right-3 z-10       /* symétrique du badge "sold" en top-3 left-3 */
```

---

## 4. États

Le badge est **décoratif/statique par défaut** (il n'est pas un contrôle interactif : ni bouton, ni lien).

| État | Rendu |
|---|---|
| Default | Sceau `bg-cgws-accent` + anneau pointillé, statique. |
| Hover (carte) | Aucun effet propre au badge — il suit le `translateY(-4px)` de la carte parente (`ProductCard`). Le badge ne capte pas le pointeur (`pointer-events-none` sur le sceau `sm` en coin d'image, pour ne pas gêner le clic vers la fiche). |
| Focus | **Non focusable** (élément non interactif). Aucun `ring`. |
| Apparition (`lg`, scroll) | *(optionnel)* animation « estampe » — cf. §5 GSAP. |
| Réduction de mouvement | `prefers-reduced-motion: reduce` → aucune animation, rendu final immédiat. |

> **Pas d'état interactif / pas de tooltip sur la carte** : `ProductCard` est déjà un `NuxtLink` couvrant toute la carte ; imbriquer un déclencheur `UTooltip` (`@nuxt/ui`, vérifié via MCP `mcp__nuxt-ui-remote__` — c'est un overlay avec trigger focusable) créerait un contrôle interactif imbriqué dans un lien (anti-pattern a11y). L'argumentaire n'apparaît donc **que** sur la fiche produit via `with-argument`, jamais en tooltip sur la carte. Le sens du sceau `sm` est intégralement porté par `aria-label` (§4 accessibilité), pas par une révélation au survol.

---

## 5. Animations (GSAP — `lg` uniquement, optionnel)

Effet « coup de tampon » à l'entrée en viewport (mise en avant homepage) :

- `ScrollTrigger` `once: true`, garde `onMounted`, nettoyage `onUnmounted` (règle CLAUDE.md GSAP).
- Sceau : `{ scale: 1.25, rotate: -8, opacity: 0 }` → `{ scale: 1, rotate: 0, opacity: 1 }`, `0.4s`, `back.out(2)` (rebond léger = pression du tampon).
- Lockup : `fade + y: 8` en `stagger 0.08`, `power2.out`, après le sceau.
- `sm`/`md` : **pas d'animation propre** (le `md` hérite du stagger `product-info-*` de `ProductInfo`, le `sm` hérite de l'entrée de `TagCard`).
- Toujours gardé derrière `matchMedia('(prefers-reduced-motion: reduce)')`.

---

## 6. Accessibilité

- **Rôle** : `role="img"` sur le composant racine. Le `+1½` est un glyphe d'initié non signifiant pour un lecteur d'écran → il ne doit **jamais** être lu tel quel.
- **aria-label** (sur la racine) : `« Sélection Camille — testé et approuvé »`. Le sceau, l'anneau et le `+1½` sont `aria-hidden="true"`. En `md`/`lg`, le texte visible (« Testé & approuvé — par Camille ») est laissé lisible (non caché) car il redit le sens ; on évite alors la double lecture en gardant l'`aria-label` sur la racine `role="img"` et le lockup textuel purement visuel à l'intérieur (le `role="img"` fait que le contenu interne n'est pas ré-annoncé).
- **Le `sm` (carte)** porte tout le sens dans l'`aria-label` (aucun texte visible). Il complète, sans le remplacer, l'`aria-label` déjà riche de `ProductCard` — vérifier en implémentation que l'information « approuvé » remonte bien dans le libellé accessible de la carte (soit via l'`aria-label` du sceau, soit en enrichissant le `ariaLabel` calculé de `ProductCard` d'un suffixe « — Sélection Camille »). **Recommandation** : enrichir le `ariaLabel` de `ProductCard` (approche déjà utilisée pour « — Produit vendu », l.51-58) plutôt que de compter sur un `img` imbriqué dans le lien.
- **Contraste (≥ 4.5:1, vérifié dans les rendus de peau existants — valeurs mesurées `US-072`/doc maître §2.6)** :
  - `+1½` = `on-accent` sur `accent` → **≥ 5.6:1** dans les 3 rendus (paire garantie AA par conception, identique au bouton primary et au badge `sold`). ✔
  - eyebrow/paraphe = `accent` et `ink` sur `surface` (encart) ou `ground` (contexte page) → `accent` sur `ground` **≥ 5.6:1** ; `ink` sur `ground` très élevé. La paire `accent`/`surface` (fond légèrement plus clair que `ground`) reste ≥ AA — **à confirmer QA** comme pour `TagCard` (même réserve, `surface` non pré-mesuré dans le doc maître mais proche de `ground`). ✔ (sous réserve mesure)
  - Anneau pointillé & couture = `accent-deco` → **décoratif pur, aucun texte** : hors périmètre contraste texte (règle US-072). ✔
- **Vérification des deux fonds (skin switcher public/admin)** : valider visuellement dans **`elegante-jour`**, **`elegante-nuit`** et **`rugueux`** (procédure §9 US-072). Points d'attention :
  - En **Rugueux**, `accent` (laiton `#CF8438`), `accent-deco` (copper `#B8650A`) et `danger` sont de la même famille chaude → s'assurer que le sceau approuvé ne se confond pas visuellement avec un badge `occasion`/`sold`. Le `+1½` + l'anneau pointillé le distinguent nettement ; confirmer en revue.
  - En **Élégante Nuit**, vérifier que `on-accent` (`#241811`, sombre) sur `accent` (`#D98F9B`, rose clair) reste franc (mesuré ≥ 5.6:1). ✔
  - **Admin** : le badge peut apparaître dans l'aperçu de `ProductForm` — s'assurer qu'il rend correctement sur `surface`/`surface-2` du backoffice (mêmes rôles, aucun code couleur en dur).

---

## 7. Placement recommandé

Le badge n'est **jamais affiché par défaut** — toujours gardé par `v-if="product.camilleApproved"` côté parent (colonne `camille_approved`, cf. US-110 Gherkin).

### 7.1 Carte catalogue — `app/components/catalogue/ProductCard.vue`
- **Où** : sceau `size="sm"` épinglé **en coin haut-droit de la zone image** (`absolute top-3 right-3 z-10`), symétrique du badge « Vendu » (top-3 left-3). Se lit comme un cachet de cire apposé sur l'étiquette cuir.
- **Compatibilité états** : ne pas superposer au bandeau diagonal « Réservé » ni à l'overlay « Voir le produit » (le sceau est en `z-10`, l'overlay hover en `z` supérieur le recouvre proprement — acceptable). Sur carte `sold` (grayscale), **masquer le sceau** (une pièce vendue n'a plus à afficher la caution d'achat) : `v-if="product.camilleApproved && !isSold"`.
- **a11y** : enrichir le `ariaLabel` calculé de la carte (cf. §6), ne pas imbriquer d'élément interactif.

### 7.2 Fiche produit — `app/components/product/ProductInfo.vue` (via `catalogue/[slug].vue`)
- **Où** : `size="md"` **avec `with-argument`**, placé **juste après la ligne de badges** (l.163-167) et **avant le H1**, ou en encart autoportant **sous le prix** — recommandation : **sous le prix / au-dessus de la description**, là où l'acheteur décide, pour que l'argumentaire de curation appuie la conversion. Ajouter la classe d'ancre GSAP (`product-info-approved`) au stagger d'entrée existant (l.135-152).
- Coexiste avec l'encart consignation existant (un produit peut être consigné ET approuvé) : les deux encarts s'empilent, le badge approuvé au-dessus (la caution personnelle prime éditorialement).

### 7.3 Mises en avant homepage — `app/pages/index.vue` / section « promesse de curation »
- **Où** : `size="lg"` dans le bloc « promesse de curation » (le futur `CurationPromise.vue` évoqué en US-108) comme emblème central de la section, et/ou `size="sm"` sur les mini-cartes produits mises en avant (intégration soft prévue par US-108 : la section fonctionne sans le badge si US-110 n'est pas encore mergée).

---

## 8. Micro-argumentaire de curation

**Rôle** : dire « pourquoi cet article est dans le catalogue » — la promesse « si c'est ici, c'est que ça marche » (`BRAND_DIRECTION.md`).

**Ton** : Camille à la **première personne**, spécialiste passionnée, chaleureux et concret (jamais vocabulaire luxe/Hermès — cf. `US-112`). Registre reining/terrain : « monté », « testé en concours », « à l'entraînement ».

**Longueur** : **1 à 2 phrases, ≤ 180 caractères**. Au-delà, ça cesse d'être un gage rapide et concurrence la description produit.

**Exemple placeholder** (prop `argument` par défaut) — **à valider par Camille**, à afficher avec la mention placeholder tant que non validé (même pattern que US-011/US-099) :

> « Je l'ai monté et testé, en concours comme à l'entraînement. S'il est dans ma sélection, c'est qu'il tient ses promesses. »
> — *à valider par Camille*

Variantes de ton acceptables (pour arbitrage Camille, non normatif) :
- Courte / factuelle : « Testé sur mes chevaux avant d'entrer au catalogue. Je ne vends que ce que j'utilise. »
- Chaleureuse / prescriptrice : « Un matériel que je recommande les yeux fermés — je l'ai éprouvé moi-même. »

> **Blocage contenu (non bloquant pour livrer le composant)** : le texte définitif est une validation Camille. Le composant se livre avec le placeholder ci-dessus clairement marqué ; le remplacement est une itération de contenu isolée.

---

## 9. Récapitulatif des dépendances de données

| Élément | Source | Statut |
|---|---|---|
| `product.camilleApproved` | `Product` (`app/types/index.ts`) — à ajouter, aligné sur colonne `camille_approved` | À créer (US-110, hors périmètre de cette spec) |
| Gate d'affichage | `v-if="product.camilleApproved"` côté parent | Prescrit ci-dessus |
| Contenu argumentaire | Prop `argument` / placeholder | Placeholder livré, texte réel = validation Camille |

Le composant `CgwsApprovedBadge.vue` reste **présentationnel et sans état** : aucune requête, aucune lecture du store, aucune logique métier — cohérent avec `CgwsBadge`/`StarDivider`.
