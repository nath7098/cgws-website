# ConsignationPage — Spec UX (US-020)

**Purpose**: Page publique `/consignation` permettant au déposant (P3) de comprendre le service de dépôt-vente CGWS, ses conditions, et de soumettre une demande en ligne avec photos. C'est la page de conversion principale pour le flux consignation — elle doit convaincre et rassurer autant que collecter les données.

**Locations**:
- `app/pages/consignation.vue`
- `app/components/consignation/HowItWorks.vue`
- `app/components/consignation/ConsignmentForm.vue`
- `server/api/consignments/create.post.ts`

**Type impliqué**: `Consignment` de `app/types/index.ts`

---

## Note sur le type Consignment

Le champ `depositorName: string` (non optionnel) stocke le nom complet. Le formulaire présente deux champs distincts `Prénom` + `Nom` pour l'UX, concaténés à la soumission : `depositorName = \`${prenom.trim()} ${nom.trim()}\``.

Le champ `brand: string` est non optionnel dans le type mais l'US le liste sans astérisque (optionnel côté UX). Le développeur devra soit rendre le champ required dans le formulaire, soit annoter le type `brand?: string` — la décision doit être validée avec Camille. Cet spec traite `brand` comme optionnel (pas d'astérisque).

---

## Structure globale de la page

La page se compose de 7 blocs dans l'ordre suivant :

| # | Bloc | Composant | Fond |
|---|------|-----------|------|
| 1 | Hero / En-tête page | inline dans `consignation.vue` | `cgws-tack` |
| 2 | HowItWorks (3 étapes) | `HowItWorks.vue` | `cgws-parchment` |
| 3 | ConchoDivider | `ui/ConchoDivider.vue` (existant) | transition |
| 4 | ConditionsBlock (wanted poster) | inline dans `consignation.vue` | `cgws-cream` |
| 5 | ConchoDivider | `ui/ConchoDivider.vue` (existant) | transition |
| 6 | ConsignmentForm | `ConsignmentForm.vue` | `cgws-cream` |
| 7 | SuccessMessage | état interne de `ConsignmentForm.vue` | `cgws-cream` |

---

## Layout global — wireframes ASCII

### Desktop 1280px

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                               PAGE HERO                                      │
│  bg-cgws-tack · py-20 · text-center                                          │
│                                                                              │
│                    CONSIGNATION                                              │
│               (Rye 400, cgws-copper, text-sm tracking-widest)               │
│                                                                              │
│             DÉPOSEZ VOTRE MATÉRIEL                                           │
│           TROUVEZ-LUI UN NOUVEAU PROPRIÉTAIRE                                │
│         (Bebas Neue, 72px desktop, cgws-cream, leading-none)                │
│                                                                              │
│     « Confiez-nous votre selle, votre bride ou vos bottes —                 │
│       nous les exposons, nous les vendons pour vous. »                       │
│     (Playfair Display italic 400i, cgws-rope, text-lg, max-w-2xl mx-auto)   │
│                                                                              │
│                  [ DÉPOSER MA DEMANDE ↓ ]                                   │
│          (CgwsButton primary, ancre href="#consignment-form")               │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                           HOW IT WORKS                                       │
│  bg-cgws-parchment · py-16 · text-center                                     │
│                                                                              │
│                    COMMENT ÇA MARCHE                                         │
│          (Rye 400, cgws-copper, text-sm tracking-widest, uppercase)          │
│       Votre matériel mérite un nouveau propriétaire                          │
│       (Playfair Display italic 400i, cgws-charcoal/70, text-xl, mt-2)        │
│                                                                              │
│  ┌─────────────────────┐         ┌─────────────────────┐         ┌────────────────────┐
│  │                     │  ─────  │                     │  ─────  │                    │
│  │   ╭─────────────╮   │         │   ╭─────────────╮   │         │  ╭─────────────╮  │
│  │   │  ① copper   │   │         │   │  ② copper   │   │         │  │  ③ copper   │  │
│  │   ╰─────────────╯   │         │   ╰─────────────╯   │         │  ╰─────────────╯  │
│  │  [i-lucide-inbox]   │         │  [i-lucide-eye]     │         │  [i-lucide-        │
│  │       32px          │         │       32px          │         │  circle-dollar]    │
│  │      DÉPOSEZ        │         │      EXPOSEZ        │         │      VENDEZ        │
│  │   (Rye, charcoal)   │         │   (Rye, charcoal)   │         │  (Rye, charcoal)   │
│  │  Décrivez votre     │         │  Votre article est  │         │  Lorsqu'un         │
│  │  article, envoyez   │         │  mis en vitrine     │         │  acheteur est      │
│  │  vos photos et      │         │  sur notre site     │         │  trouvé, vous      │
│  │  indiquez votre     │         │  et en boutique     │         │  recevez le prix   │
│  │  prix souhaité.     │         │  à Brèches.         │         │  convenu, net.     │
│  │  (Inter 400, 14px)  │         │  (Inter 400, 14px)  │         │  (Inter 400, 14px) │
│  └─────────────────────┘         └─────────────────────┘         └────────────────────┘
│     bg-cgws-parchment               bg-cgws-parchment               bg-cgws-parchment
│     border-2 border-cgws-charcoal   border-2 border-cgws-charcoal   border-2 border-cgws-charcoal
│     rounded-sm  p-8                 rounded-sm  p-8                 rounded-sm  p-8
└──────────────────────────────────────────────────────────────────────────────┘

                         [ConchoDivider — bg-cgws-parchment]

┌──────────────────────────────────────────────────────────────────────────────┐
│                      CONDITIONS DE CONSIGNATION                              │
│  bg-cgws-cream · py-16                                                       │
│                                                                              │
│              NOS CONDITIONS                                                  │
│      (Rye 400, cgws-copper, text-sm tracking-widest, centered)              │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  ╔══════════════════════════════════════════════════════════════════╗  │  │
│  │  ║                                                                  ║  │  │
│  │  ║   DÉPÔT-VENTE CGWS · BRÈCHES · INDRE-ET-LOIRE                  ║  │  │
│  │  ║   (Rye 400, cgws-charcoal, text-base, text-center)             ║  │  │
│  │  ║                                                                  ║  │  │
│  │  ╠══════════════════════════════════════════════════════════════════╣  │  │
│  │  ║                                                                  ║  │  │
│  │  ║   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   ║  │  │
│  │  ║   │   COMMISSION   │  │     DURÉE      │  │     ÉTAT       │   ║  │  │
│  │  ║   │  (Rye, 11px)   │  │  (Rye, 11px)   │  │  (Rye, 11px)   │   ║  │  │
│  │  ║   │                │  │                │  │                │   ║  │  │
│  │  ║   │      20 %      │  │    3 MOIS      │  │   EXCELLENT    │   ║  │  │
│  │  ║   │  (Bebas, 48px  │  │  (Bebas, 48px  │  │    À BON       │   ║  │  │
│  │  ║   │   cgws-copper) │  │   cgws-copper) │  │  (Bebas, 32px  │   ║  │  │
│  │  ║   │                │  │   renouvelab.  │  │   cgws-copper) │   ║  │  │
│  │  ║   │  sur le prix   │  │  (Inter, 12px) │  │                │   ║  │  │
│  │  ║   │  de vente      │  │                │  │  état minimum  │   ║  │  │
│  │  ║   │  (Inter, 12px) │  │                │  │  (Inter, 12px) │   ║  │  │
│  │  ║   └────────────────┘  └────────────────┘  └────────────────┘   ║  │  │
│  │  ║                                                                  ║  │  │
│  │  ║   Prix de mise en vente défini en accord avec vous.             ║  │  │
│  │  ║   (Inter 400, 14px, cgws-charcoal/70, italic, text-center)      ║  │  │
│  │  ║                                                                  ║  │  │
│  │  ╚══════════════════════════════════════════════════════════════════╝  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│     wanted-poster container :                                                │
│     bg-cgws-parchment · border-[3px] border-cgws-charcoal · p-1.5          │
│     inner frame : border border-cgws-charcoal · p-8                         │
└──────────────────────────────────────────────────────────────────────────────┘

                         [ConchoDivider — bg-cgws-cream]

┌──────────────────────────────────────────────────────────────────────────────┐
│                         FORMULAIRE DE DÉPÔT                                  │
│  bg-cgws-cream · py-16 · id="consignment-form"                               │
│  max-w-2xl mx-auto (formulaire centré)                                       │
│                                                                              │
│                      VOTRE DEMANDE                                           │
│               (Rye 400, cgws-copper, text-sm tracking-widest)               │
│             Formulaire de Consignation                                       │
│             (Playfair Display 700, text-3xl, cgws-charcoal)                  │
│                                                                              │
│  ┌── fieldset (bg-cgws-cream border border-cgws-leather/30 rounded-sm p-6)──┐│
│  │  <legend> VOS COORDONNÉES                                                ││
│  │  (Inter 600, text-xs uppercase tracking-widest cgws-copper, mb-4)        ││
│  │                                                                           ││
│  │  ┌───────────────────────────┐  ┌───────────────────────────┐            ││
│  │  │  CgwsInput                │  │  CgwsInput                │            ││
│  │  │  label="Prénom" required  │  │  label="Nom" required     │            ││
│  │  └───────────────────────────┘  └───────────────────────────┘            ││
│  │  ┌───────────────────────────┐  ┌───────────────────────────┐            ││
│  │  │  CgwsInput                │  │  CgwsInput                │            ││
│  │  │  type="email" required    │  │  type="tel" required      │            ││
│  │  └───────────────────────────┘  └───────────────────────────┘            ││
│  └───────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌── fieldset (même style) ─────────────────────────────────────────────────┐│
│  │  <legend> VOTRE ARTICLE                                                  ││
│  │                                                                           ││
│  │  ┌──────────────────────────────────────────────────────────────────┐   ││
│  │  │  CgwsTextarea (nouveau composant)                                │   ││
│  │  │  label="Description de l'article" required rows=4               │   ││
│  │  │  placeholder="Marque, taille, état général, accessoires inclus…" │   ││
│  │  └──────────────────────────────────────────────────────────────────┘   ││
│  │  ┌───────────────────────────┐  ┌───────────────────────────┐            ││
│  │  │  CgwsInput                │  │  CgwsSelect (nouveau)     │            ││
│  │  │  label="Marque"           │  │  label="État *" required  │            ││
│  │  │  (optionnel, no *)        │  │  options: excellent/good  │            ││
│  │  └───────────────────────────┘  └───────────────────────────┘            ││
│  │  ┌───────────────────────────┐                                            ││
│  │  │  CgwsInput                │                                            ││
│  │  │  type="number" required   │                                            ││
│  │  │  label="Prix souhaité (€)"│                                            ││
│  │  └───────────────────────────┘                                            ││
│  └───────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌── fieldset (même style) ─────────────────────────────────────────────────┐│
│  │  <legend> VOS PHOTOS — optionnel, 5 photos max                           ││
│  │                                                                           ││
│  │  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐    ││
│  │  ┊  [i-lucide-cloud-upload 32px cgws-copper/60]                   ┊    ││
│  │  ┊  Glissez vos photos ici                                        ┊    ││
│  │  ┊  (Inter 500, cgws-charcoal)                                    ┊    ││
│  │  ┊  ou  [ Parcourir les fichiers ]  (CgwsButton ghost sm)         ┊    ││
│  │  ┊  JPEG ou PNG · 5 photos max · 5 MB par fichier                 ┊    ││
│  │  ┊  (Inter 400, 12px, cgws-rope)                                  ┊    ││
│  │  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘    ││
│  │  border-2 border-dashed border-cgws-copper/40 rounded-sm p-8            ││
│  │                                                                           ││
│  │  Grille aperçu (après ajout de fichiers) :                              ││
│  │  grid grid-cols-5 gap-2 mt-4                                            ││
│  │  ┌──────┐ ┌──────┐ ┌──────┐                                            ││
│  │  │      │ │      │ │      │   (80×80px, aspect-square, object-cover)    ││
│  │  │ [×]  │ │ [×]  │ │ [×]  │   Bouton × : absolute top-1 right-1        ││
│  │  └──────┘ └──────┘ └──────┘   bg-cgws-rust text-white w-5 h-5          ││
│  └───────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  [Message d'erreur global si la soumission échoue — role="alert"]           │
│  bg-cgws-rust/10 border border-cgws-rust text-cgws-rust rounded-sm p-4      │
│                                                                              │
│              [ ENVOYER MA DEMANDE ]   ← CgwsButton primary size:md         │
│          (full width sur mobile, auto sur desktop)                          │
│                                                                              │
│          Ou contactez-nous directement :                                    │
│          [02 XX XX XX XX]  (lien tel:, Inter 400, cgws-copper)              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Tablet 768px

```
┌───────────────────────────────────────────────┐
│  PAGE HERO  · py-16 · text-center             │
│  DÉPOSEZ VOTRE MATÉRIEL (Bebas 56px)          │
│  tagline (max-w-lg mx-auto)                   │
│  [DÉPOSER MA DEMANDE ↓]                       │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│  HOW IT WORKS  · bg-cgws-parchment · py-14    │
│  Grille 3 colonnes (gap-6)                    │
│  Flèches horizontales visibles (→)            │
│                                               │
│  ┌──────────┐ → ┌──────────┐ → ┌──────────┐  │
│  │ ① DÉPOSEZ│   │ ② EXPOSEZ│   │ ③ VENDEZ │  │
│  └──────────┘   └──────────┘   └──────────┘  │
└───────────────────────────────────────────────┘

[ConchoDivider]

┌───────────────────────────────────────────────┐
│  CONDITIONS  · py-14                          │
│  ┌── wanted poster (max-w-xl mx-auto) ──────┐ │
│  │  ╔═══════════════════════════════════╗   │ │
│  │  ║  DÉPÔT-VENTE CGWS               ║   │ │
│  │  ╠═══════════════════════════════════╣   │ │
│  │  ║  3 conditions en row (gap-4)     ║   │ │
│  │  ╚═══════════════════════════════════╝   │ │
│  └──────────────────────────────────────────┘ │
└───────────────────────────────────────────────┘

[ConchoDivider]

┌───────────────────────────────────────────────┐
│  FORMULAIRE  · py-14                          │
│  max-w-xl mx-auto                             │
│                                               │
│  Prénom + Nom en 2 colonnes (grid-cols-2)     │
│  Email + Tél en 2 colonnes                   │
│  Description full-width                      │
│  Marque + État en 2 colonnes                 │
│  Prix seul (col-span-1)                      │
│  Upload zone full-width                      │
│  [ENVOYER MA DEMANDE] full-width             │
└───────────────────────────────────────────────┘
```

### Mobile 375px

```
┌──────────────────────────────┐
│  PAGE HERO  · py-12          │
│  CONSIGNATION (eyebrow)      │
│  DÉPOSEZ VOTRE               │
│  MATÉRIEL                    │
│  (Bebas Neue 48px, 2 lignes) │
│  tagline (text-base)         │
│  [DÉPOSER MA DEMANDE ↓]      │
│  w-full                      │
└──────────────────────────────┘

┌──────────────────────────────┐
│  HOW IT WORKS · py-10        │
│  bg-cgws-parchment           │
│                              │
│  ┌──────────────────────┐    │
│  │ ① DÉPOSEZ            │    │
│  │ [icon 24px]          │    │
│  │ description          │    │
│  └──────────────────────┘    │
│            ↓                 │
│  ┌──────────────────────┐    │
│  │ ② EXPOSEZ            │    │
│  └──────────────────────┘    │
│            ↓                 │
│  ┌──────────────────────┐    │
│  │ ③ VENDEZ             │    │
│  └──────────────────────┘    │
│  Flèche verticale entre les  │
│  cartes (↓, cgws-copper)     │
└──────────────────────────────┘

[ConchoDivider]

┌──────────────────────────────┐
│  CONDITIONS · py-10          │
│  ┌── wanted poster ─────┐    │
│  │ ╔═══════════════════╗ │    │
│  │ ║ DÉPÔT-VENTE CGWS  ║ │    │
│  │ ╠═══════════════════╣ │    │
│  │ ║ 3 items en colonne║ │    │
│  │ ║  COMMISSION 20%   ║ │    │
│  │ ║  DURÉE 3 MOIS     ║ │    │
│  │ ║  ÉTAT EXCELLENT   ║ │    │
│  │ ╚═══════════════════╝ │    │
│  └───────────────────────┘    │
└──────────────────────────────┘

[ConchoDivider]

┌──────────────────────────────┐
│  FORMULAIRE · py-10          │
│                              │
│  Tous les champs en          │
│  colonne unique (col-span-1) │
│  ┌──────────────────────┐    │
│  │ [Prénom *]           │    │
│  └──────────────────────┘    │
│  ┌──────────────────────┐    │
│  │ [Nom *]              │    │
│  └──────────────────────┘    │
│  ┌──────────────────────┐    │
│  │ [Email *]            │    │
│  └──────────────────────┘    │
│  ┌──────────────────────┐    │
│  │ [Téléphone *]        │    │
│  └──────────────────────┘    │
│  ┌──────────────────────┐    │
│  │ [Description *]      │    │
│  │ (textarea 4 rows)    │    │
│  └──────────────────────┘    │
│  ┌──────────────────────┐    │
│  │ [Marque]             │    │
│  └──────────────────────┘    │
│  ┌──────────────────────┐    │
│  │ [État * — select]    │    │
│  └──────────────────────┘    │
│  ┌──────────────────────┐    │
│  │ [Prix souhaité * €]  │    │
│  └──────────────────────┘    │
│  ┌─ ─ ─ upload zone ─ ─┐    │
│  │ [icon] Glissez ou   │    │
│  │ [Parcourir]         │    │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘    │
│  Miniatures en grille 3 col  │
│  [ENVOYER MA DEMANDE] w-full │
└──────────────────────────────┘
```

---

## Composant HowItWorks

**Fichier** : `app/components/consignation/HowItWorks.vue`

### Données statiques (prop-free, contenu hardcodé FR)

```
Étape 1 — DÉPOSEZ
  Icône : i-lucide-inbox
  Titre (Rye) : DÉPOSEZ
  Corps (Inter) : Décrivez votre article, envoyez vos photos
                  et indiquez votre prix de vente souhaité.
                  Nous vous répondons sous 48h.

Étape 2 — EXPOSEZ
  Icône : i-lucide-eye
  Titre (Rye) : EXPOSEZ
  Corps (Inter) : Votre article est mis en vitrine sur notre site
                  et en boutique à Brèches. Camille s'occupe de
                  tout — photos, annonce, accueil des acheteurs.

Étape 3 — VENDEZ
  Icône : i-lucide-circle-dollar-sign
  Titre (Rye) : VENDEZ
  Corps (Inter) : Lorsqu'un acheteur est trouvé, vous recevez
                  le prix convenu, déduction faite de la commission.
                  Paiement sous 7 jours après la vente.
```

### Style des cartes étapes

Chaque carte est rendue par une boucle `v-for` sur un tableau de 3 objets.

```
Carte :
  bg-cgws-parchment
  border-2 border-cgws-charcoal
  rounded-sm
  p-8
  text-center
  relative

Cercle numéro (position absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2) :
  w-10 h-10 rounded-full
  bg-cgws-copper text-cgws-charcoal
  font-display text-2xl
  flex items-center justify-center
  border-2 border-cgws-charcoal

Icône :
  w-8 h-8 text-cgws-leather mx-auto mt-4 mb-3

Titre :
  font-eyebrow text-cgws-charcoal text-base uppercase tracking-wider mb-3

Corps :
  font-sans text-sm text-cgws-charcoal/75 leading-relaxed
```

### Flèches entre étapes

- **Desktop / Tablet** : `i-lucide-arrow-right` 20px cgws-copper, `hidden md:flex`, positionnée en `absolute` au niveau de l'icône ou via flex gap separator
- **Mobile** : `i-lucide-arrow-down` 20px cgws-copper, `flex md:hidden`, centré entre les cartes

Implémentation suggérée : grille parent `grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr]` — les colonnes `auto` accueillent les flèches.

---

## ConditionsBlock — wanted poster

**Section inline dans `consignation.vue`**

Le "wanted poster" est l'élément signature de cette page. Il est réservé à ce seul usage dans le design system.

### Structure HTML/Tailwind

```
<section class="bg-cgws-cream py-16">
  <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">

    <!-- Eyebrow -->
    <p class="font-eyebrow text-cgws-copper text-sm tracking-widest uppercase
              text-center mb-8">
      NOS CONDITIONS
    </p>

    <!-- Conteneur wanted poster — max-w-2xl centré -->
    <div class="mx-auto max-w-2xl">

      <!-- Bordure externe (3px charcoal) -->
      <div class="border-[3px] border-cgws-charcoal bg-cgws-parchment p-1.5">

        <!-- Bordure interne (1px charcoal) -->
        <div class="border border-cgws-charcoal p-8">

          <!-- Header poster -->
          <p class="font-eyebrow text-cgws-charcoal text-xs tracking-[0.2em]
                    uppercase text-center mb-6">
            DÉPÔT-VENTE CGWS · BRÈCHES · INDRE-ET-LOIRE
          </p>

          <!-- ConchoDivider léger (border-t uniquement, sans le médaillon) -->
          <div class="border-t border-cgws-charcoal/40 mb-6" />

          <!-- 3 conditions : flex row desktop, col mobile -->
          <div class="flex flex-col sm:flex-row gap-6 text-center">

            <!-- Item Commission -->
            <div class="flex-1">
              <p class="font-eyebrow text-cgws-charcoal/60 text-[11px]
                        uppercase tracking-widest mb-1">COMMISSION</p>
              <p class="font-display text-5xl text-cgws-copper leading-none">
                20 %</p>
              <p class="font-sans text-xs text-cgws-charcoal/60 mt-1">
                sur le prix de vente</p>
            </div>

            <!-- Séparateur vertical -->
            <div class="hidden sm:block w-px bg-cgws-charcoal/20 self-stretch"/>

            <!-- Item Durée -->
            <div class="flex-1">
              <p class="font-eyebrow text-cgws-charcoal/60 text-[11px]
                        uppercase tracking-widest mb-1">DURÉE</p>
              <p class="font-display text-5xl text-cgws-copper leading-none">
                3 MOIS</p>
              <p class="font-sans text-xs text-cgws-charcoal/60 mt-1">
                renouvelable par accord</p>
            </div>

            <!-- Séparateur vertical -->
            <div class="hidden sm:block w-px bg-cgws-charcoal/20 self-stretch"/>

            <!-- Item État -->
            <div class="flex-1">
              <p class="font-eyebrow text-cgws-charcoal/60 text-[11px]
                        uppercase tracking-widest mb-1">ÉTAT REQUIS</p>
              <p class="font-display text-3xl text-cgws-copper leading-none">
                EXCELLENT<br>À BON</p>
              <p class="font-sans text-xs text-cgws-charcoal/60 mt-1">
                état minimum accepté</p>
            </div>

          </div><!-- /conditions row -->

          <!-- Note bas de poster -->
          <div class="border-t border-cgws-charcoal/40 mt-6 pt-4">
            <p class="font-sans text-sm text-cgws-charcoal/60 text-center italic">
              Le prix de mise en vente est défini en accord avec vous.
            </p>
          </div>

        </div><!-- /inner border -->
      </div><!-- /outer border -->
    </div><!-- /max-w-2xl -->
  </div>
</section>
```

**Note contenu** : Le pourcentage 20 % et la durée 3 mois sont des placeholders — Camille doit confirmer les valeurs réelles avant la mise en production. Laisser un commentaire `<!-- TODO: confirmer avec Camille -->` dans le template.

---

## Composant ConsignmentForm

**Fichier** : `app/components/consignation/ConsignmentForm.vue`

### Props

Aucune prop — composant autonome gérant son propre état.

### État interne (refs)

```typescript
// Champs du formulaire (mapping → Consignment)
const prenom = ref('')           // → depositorName (concatenated)
const nom = ref('')              // → depositorName (concatenated)
const email = ref('')            // → depositorEmail
const phone = ref('')            // → depositorPhone
const description = ref('')      // → itemDescription
const brand = ref('')            // → brand (optionnel)
const condition = ref<ProductCondition | ''>('')  // → condition
const askingPrice = ref<number | null>(null)      // → askingPrice
const uploadedFiles = ref<File[]>([])             // → images (après upload)

// États UI
const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)
const isSuccess = ref(false)
const submittedPrenom = ref('')  // Pour personnaliser le message succès
const serverError = ref('')
```

### Validation front-end (temps réel — blur + submit)

| Champ | Règle | Message d'erreur |
|-------|-------|-----------------|
| Prénom | Requis, min 2 car. | "Le prénom est requis" |
| Nom | Requis, min 2 car. | "Le nom est requis" |
| Email | Requis, format RFC email | "Adresse email invalide" |
| Téléphone | Requis, format FR/intl (/^[0-9+\s\-\(\)]{7,20}$/) | "Numéro de téléphone invalide" |
| Description | Requis, min 20 car. | "Décrivez l'article en au moins 20 caractères" |
| Condition | Requis, valeur dans ['excellent','good','fair'] | "Veuillez indiquer l'état de l'article" |
| Prix souhaité | Requis, > 0, max 50 000 | "Veuillez indiquer un prix valide" |
| Fichiers | 5 max, JPEG/PNG, < 5 MB chacun | Voir section Upload |

La validation se déclenche `@blur` sur chaque champ (pas en cours de saisie), et sur le `@submit` pour tous les champs simultanément.

### CgwsSelect — composant à créer

`CgwsSelect.vue` n'existe pas encore dans `app/components/ui/`. Ce composant doit être créé par le développeur en suivant exactement les mêmes patterns que `CgwsInput.vue` :

- Même système de `label`, `error`, `hint`, `required`, `disabled`
- Même styling : `bg-cgws-cream border rounded-sm px-3 py-2.5`
- Même comportement `aria-invalid` / `aria-describedby`
- Rendu comme `<select>` natif stylé (pas de dropdown custom)

Options pour l'état de l'article (`ProductCondition`) :

```
<option value="">— Sélectionnez —</option>
<option value="excellent">Excellent état</option>
<option value="good">Bon état</option>
<option value="fair">État correct</option>
```

Note : `new` n'est pas proposé ici — le service de consignation concerne uniquement les articles d'occasion.

### CgwsTextarea — composant à créer

`CgwsTextarea.vue` n'existe pas encore. Créer en suivant `CgwsInput.vue`, avec :
- Propriété `rows?: number` (default: 4)
- Rendu comme `<textarea>` natif avec `resize-y` et `min-h-[100px]`
- Même styling que CgwsInput
- Même accessibilité (aria-required, aria-invalid, aria-describedby)

### Zone upload photos

```
Zone drag & drop :
  class="relative border-2 border-dashed border-cgws-copper/40 rounded-sm p-8
         text-center cursor-pointer transition-colors duration-200
         hover:border-cgws-copper hover:bg-cgws-parchment/50"

État drag-over :
  class="border-cgws-copper bg-cgws-parchment border-solid"

Input caché :
  <input type="file" accept="image/jpeg,image/png"
         multiple :disabled="uploadedFiles.length >= 5"
         class="sr-only" ref="fileInputRef" />
```

**Grille aperçu** (`grid grid-cols-3 sm:grid-cols-5 gap-2 mt-4`) :

Chaque miniature :
```
<div class="relative aspect-square rounded-sm overflow-hidden bg-cgws-parchment
             border border-cgws-leather/30">
  <img :src="previewUrl" alt="Aperçu photo" class="w-full h-full object-cover" />
  <button
    type="button"
    @click="removeFile(index)"
    aria-label="Supprimer cette photo"
    class="absolute top-1 right-1 w-5 h-5 rounded-full bg-cgws-rust text-white
           flex items-center justify-center text-xs font-bold leading-none
           hover:bg-cgws-charcoal transition-colors"
  >×</button>
</div>
```

**Règles de validation upload** :

| Condition | Message inline sous la zone |
|-----------|----------------------------|
| Fichier > 5 MB | "« nom_fichier.jpg » dépasse 5 MB — fichier ignoré" |
| Format non JPEG/PNG | "Format non accepté — seuls JPEG et PNG sont autorisés" |
| Plus de 5 fichiers | "Maximum 5 photos — les fichiers supplémentaires ont été ignorés" |

Les messages d'erreur upload sont affichés dans un `<p role="alert">` sous la zone, en `text-cgws-rust text-xs mt-2`.

---

## États du formulaire

### Default

Formulaire vide, tous les champs en état initial. Bouton submit actif.

### Validation (temps réel — après blur)

- CgwsInput reçoit `error="message"` → bordure `cgws-rust`, message rouge sous le champ (`role="alert"`)
- `aria-invalid="true"` sur le champ en erreur
- `aria-describedby` pointe vers l'ID du message d'erreur

### Soumission en cours

```
isSubmitting = true
→ CgwsButton : loading=true (spinner interne déjà géré par CgwsButton)
→ Tous les inputs : disabled=true
→ Zone upload : disabled, opacité réduite
→ Le bouton passe à "ENVOI EN COURS…"
```

Le bouton affiche le texte par défaut "ENVOYER MA DEMANDE" et le variant `loading` de `CgwsButton` gère le spinner.

### Succès

`isSuccess = true` → le formulaire est remplacé par le bloc de confirmation :

```
<div role="status" aria-live="polite" aria-atomic="true">
  <!-- Bloc wanted-poster succès (max-w-xl centré) -->
  <div class="mx-auto max-w-xl border-[3px] border-cgws-charcoal
              bg-cgws-parchment p-1.5">
    <div class="border border-cgws-charcoal p-8 text-center">

      <UIcon name="i-lucide-check-circle"
             class="w-12 h-12 text-cgws-copper mx-auto mb-4" />

      <p class="font-display text-4xl text-cgws-charcoal tracking-wide mb-2">
        DEMANDE REÇUE !
      </p>
      <p class="font-serif font-semibold text-xl text-cgws-charcoal mb-4">
        Merci {{ submittedPrenom }} !
      </p>
      <p class="font-sans text-sm text-cgws-charcoal/70 leading-relaxed mb-2">
        Votre demande de consignation a bien été enregistrée.
      </p>
      <p class="font-sans text-sm text-cgws-charcoal/70 leading-relaxed mb-2">
        Camille vous contactera sous 48h pour valider les conditions.
      </p>
      <p class="font-sans text-xs text-cgws-charcoal/50 italic">
        Un email de confirmation vient d'être envoyé à votre adresse.
      </p>

    </div>
  </div>

  <!-- CTA après succès -->
  <div class="flex flex-col sm:flex-row gap-3 justify-center mt-8">
    <CgwsButton variant="secondary" as="NuxtLink" to="/catalogue">
      RETOUR AU CATALOGUE
    </CgwsButton>
    <CgwsButton variant="ghost" @click="resetForm">
      Faire une nouvelle demande
    </CgwsButton>
  </div>
</div>
```

### Erreur serveur

En cas d'échec de l'API (réseau, 500, etc.) :

```
<div role="alert" class="bg-cgws-rust/10 border border-cgws-rust rounded-sm p-4 mb-6">
  <p class="font-sans text-sm text-cgws-rust font-medium">
    Une erreur est survenue lors de l'envoi. Veuillez réessayer ou nous
    contacter directement au [numéro de téléphone].
  </p>
</div>
```

Le bouton redevient actif, les champs restent remplis.

---

## Tailwind classes — récapitulatif des éléments clés

```
Page hero :
  bg-cgws-tack py-20 text-center
  Eyebrow : font-eyebrow text-cgws-copper text-sm tracking-widest uppercase
  H1 : font-display text-[72px] md:text-[72px] text-cgws-cream leading-none uppercase
  Mobile H1 : text-[48px]
  Tagline : font-serif italic text-cgws-rope text-lg max-w-2xl mx-auto mt-4

Section HowItWorks :
  bg-cgws-parchment py-16
  Grille : grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-0 md:gap-4 items-center
  Carte : bg-cgws-parchment border-2 border-cgws-charcoal rounded-sm p-8 text-center relative
  Cercle N° : absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full
              bg-cgws-copper text-cgws-charcoal font-display text-2xl
              flex items-center justify-center border-2 border-cgws-charcoal
  Icône : w-8 h-8 text-cgws-leather mx-auto mt-4 mb-3
  Titre step : font-eyebrow text-cgws-charcoal text-base uppercase tracking-wider mb-3
  Corps step : font-sans text-sm text-cgws-charcoal/75 leading-relaxed

Wanted poster (conditions) :
  Outer : border-[3px] border-cgws-charcoal bg-cgws-parchment p-1.5
  Inner : border border-cgws-charcoal p-8
  Header : font-eyebrow text-cgws-charcoal/60 text-[11px] uppercase tracking-[0.2em] text-center
  Valeur : font-display text-5xl text-cgws-copper leading-none
  Label  : font-eyebrow text-cgws-charcoal/60 text-[11px] uppercase tracking-widest mb-1
  Note   : font-sans text-sm text-cgws-charcoal/60 text-center italic

Fieldsets formulaire :
  bg-cgws-cream border border-cgws-leather/30 rounded-sm p-6 mb-6
  legend : font-sans font-semibold text-xs uppercase tracking-widest
           text-cgws-copper mb-4 block
  Grille champs : grid grid-cols-1 sm:grid-cols-2 gap-4

Zone upload :
  border-2 border-dashed border-cgws-copper/40 rounded-sm p-8 text-center
  cursor-pointer transition-colors duration-200
  hover:border-cgws-copper hover:bg-cgws-parchment/50
  [drag-over] border-solid border-cgws-copper bg-cgws-parchment

Miniature upload :
  relative aspect-square rounded-sm overflow-hidden
  bg-cgws-parchment border border-cgws-leather/30

Bouton suppression miniature :
  absolute top-1 right-1 w-5 h-5 rounded-full
  bg-cgws-rust text-white text-xs font-bold
  flex items-center justify-center hover:bg-cgws-charcoal transition-colors

Erreur globale :
  bg-cgws-rust/10 border border-cgws-rust text-cgws-rust rounded-sm p-4 mb-6
```

---

## Animations GSAP

Toutes les animations GSAP sont initialisées dans `onMounted()` et nettoyées dans `onUnmounted()`. Elles respectent `prefers-reduced-motion: reduce` via une condition préalable.

### HowItWorks — entrance au scroll (dans `HowItWorks.vue`)

```javascript
// Stagger des 3 cartes d'étapes
gsap.fromTo(
  '.how-it-works-card',   // classe appliquée à chaque carte
  { opacity: 0, y: 40 },
  {
    opacity: 1,
    y: 0,
    duration: 0.6,
    stagger: 0.15,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '.how-it-works-section',
      start: 'top 75%',
      once: true,
    }
  }
)
```

### ConditionsBlock — entrance au scroll

```javascript
gsap.fromTo(
  '.conditions-poster',
  { opacity: 0, scale: 0.97 },
  {
    opacity: 1,
    scale: 1,
    duration: 0.5,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '.conditions-section',
      start: 'top 80%',
      once: true,
    }
  }
)
```

### Formulaire — pas d'animation d'entrance

Le formulaire est une zone fonctionnelle — pas d'animation de révélation, pour ne pas gêner l'interaction. Seule la transition vers le message de succès est animée :

```javascript
// Transition fade form → success
// Utiliser une Transition Vue native
// <Transition name="fade-form">
//   <div v-if="!isSuccess" key="form">…</div>
//   <div v-else key="success">…</div>
// </Transition>

// CSS dans le composant :
// .fade-form-leave-active, .fade-form-enter-active { transition: opacity 0.3s ease; }
// .fade-form-enter-from, .fade-form-leave-to { opacity: 0; }
```

---

## Accessibilité

### Rôles et attributs ARIA

| Élément | Attribut | Valeur |
|---------|----------|--------|
| `<form>` | `aria-label` | "Formulaire de demande de consignation" |
| Champs requis | `aria-required` | `"true"` |
| Champs en erreur | `aria-invalid` | `"true"` |
| Messages d'erreur | `aria-describedby` | ID du `<p>` d'erreur (déjà géré par CgwsInput) |
| Messages d'erreur | `role` | `"alert"` |
| Zone upload | `role` | `"button"` + `tabindex="0"` (si `<div>`) |
| Zone upload | `aria-label` | `"Zone de dépôt de photos — activez pour parcourir vos fichiers"` |
| Bouton suppression miniature | `aria-label` | `"Supprimer la photo numéro {n}"` |
| Message de succès | `role` | `"status"` |
| Message de succès | `aria-live` | `"polite"` |
| Message de succès | `aria-atomic` | `"true"` |
| Erreur serveur | `role` | `"alert"` |
| Erreur upload | `role` | `"alert"` |
| Section HowItWorks | `aria-label` | `"Fonctionnement du service de consignation en 3 étapes"` |
| Flèches décoratives | `aria-hidden` | `"true"` |

### Navigation clavier

- Zone upload : accessible via `Tab`, activation via `Enter` ou `Space` (ouvre le file picker)
- Boutons de suppression miniature : `Tab`, `Enter`/`Space`
- Pas de piège de focus

### Contrastes (WCAG AA — ratio ≥ 4.5:1)

| Paire texte / fond | Ratio estimé |
|--------------------|-------------|
| cgws-charcoal (#1A0B03) sur cgws-cream (#FAF3E3) | ~16:1 ✓ |
| cgws-copper (#B8650A) sur cgws-cream (#FAF3E3) | ~4.7:1 ✓ |
| cgws-copper (#B8650A) sur cgws-parchment (#F0DDB8) | ~4.6:1 ✓ |
| cgws-rope (#C8AB82) sur cgws-tack (#3D1A06) | ~5.1:1 ✓ |
| cgws-rust (#943218) sur cgws-cream (#FAF3E3) | ~5.4:1 ✓ |
| cgws-charcoal/75 sur cgws-parchment | ~9:1 ✓ |

### Ordre de focus logique

Hero CTA → (scroll) → pas de focus dans les sections décoratives → Formulaire : Prénom → Nom → Email → Téléphone → Description → Marque → État → Prix → Zone upload → Bouton submit.

---

## Breakpoints

### Mobile 375px
- H1 hero : `text-[48px]`
- Grille HowItWorks : `grid-cols-1`, cartes empilées, flèches verticales (`↓`)
- Conditions : 3 items en colonne (`flex-col`), séparateurs horizontaux
- Formulaire : `grid-cols-1`, tous les champs full-width
- Grille upload aperçu : `grid-cols-3`
- Bouton submit : `w-full`

### Tablet 768px
- H1 hero : `text-[56px]`
- Grille HowItWorks : `grid-cols-3` avec flèches horizontales
- Conditions : 3 items en ligne (`flex-row`)
- Formulaire : `grid-cols-2` pour Prénom/Nom et Email/Tél, sinon full-width
- Grille upload aperçu : `grid-cols-5`
- Bouton submit : largeur auto, centré

### Desktop 1280px (1440px)
- H1 hero : `text-[72px]`
- Layout général : `max-w-[1280px] mx-auto px-8`
- Formulaire : `max-w-2xl mx-auto`
- Wanted poster : `max-w-2xl mx-auto`

---

## Route API — `server/api/consignments/create.post.ts`

Cette route est spécifiée ici pour que le designer valide le flux UX complet.

**Flux de données** :
1. Front-end construit un `FormData` avec tous les champs texte + fichiers images
2. `POST /api/consignments/create` avec `Content-Type: multipart/form-data`
3. Serveur : validation Zod du payload texte
4. Serveur : upload des images dans Supabase Storage (`product-images/consignments/{id}/`)
5. Serveur : insert dans la table `consignments` avec `status = 'pending'` et URLs images
6. Serveur : envoi email de confirmation via Resend (template à créer)
7. Réponse `200 { success: true, consignmentId: string }` ou `422 { errors: {} }` / `500`

**Comportement UX selon réponse** :
- `200` → `isSuccess = true`, transition vers le message de confirmation
- `422` → mapper les erreurs serveur sur les champs (`errors.ref = message`), scroll vers le premier champ en erreur
- `500` → afficher l'alerte d'erreur générique (`serverError`)

**Email de confirmation déposant** (template Resend, `server/services/email.ts`) :
- Expéditeur : `CGWS <noreply@cgws.fr>`
- Sujet : `Votre demande de consignation est bien reçue — CGWS`
- Corps HTML : récapitulatif (nom, article décrit, prix souhaité, "Camille vous recontacte sous 48h")

---

## Composants nouveaux à créer

| Composant | Fichier | Priorité |
|-----------|---------|----------|
| CgwsTextarea | `app/components/ui/CgwsTextarea.vue` | Requis pour ce composant |
| CgwsSelect | `app/components/ui/CgwsSelect.vue` | Requis pour ce composant |

Ces deux composants doivent être ajoutés à la page `/dev-components` (US-003) lors de leur création.
