# ContactPage — Spec UX (US-021)

**Purpose**: Page `/contact` permettant au visiteur (P2, P4) de contacter CGWS par formulaire sans quitter le site. Elle associe un formulaire simple (4 champs + protection anti-spam) à des informations pratiques (adresse, horaires, carte OpenStreetMap) pour créer la confiance : le visiteur voit une boutique physique réelle avant d'écrire. Conversion cible : réduire le ticket d'entrée vers un achat ou une consignation.

**Locations** :
- `app/pages/contact.vue`
- `server/api/contact.post.ts`

**Types impliqués** : Aucun type dédié dans `app/types/index.ts` — les données du formulaire sont transmises à Resend et non stockées en base. Le payload API est éphémère.

**Composants UI utilisés** (tous existants) : `CgwsButton`, `CgwsInput`, `CgwsTextarea`, `CgwsSelect`, `ConchoDivider`

---

## Structure globale de la page

| # | Bloc | Fond |
|---|------|------|
| 1 | Page Hero | `cgws-tack` |
| 2 | ConchoDivider | transition |
| 3 | Section principale (2 colonnes) | `cgws-cream` |

---

## Layout (ASCII wireframes)

### Desktop 1280px

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              PAGE HERO                                       │
│  bg-cgws-tack · py-16 · text-center                                          │
│                                                                              │
│              SELLERIE DE BRÈCHES          ← Rye 400, cgws-copper, 12px      │
│                                              uppercase tracking-[0.2em]      │
│                                              mb-3                            │
│                   CONTACTEZ-NOUS                                             │
│        (Bebas Neue 64px, cgws-cream, leading-none, uppercase, mb-4)          │
│                                                                              │
│  « Une question sur un article, un rendez-vous en boutique,                 │
│    un projet de consignation — nous sommes à votre écoute. »                │
│  (Playfair Display italic 400i, cgws-rope, text-lg, max-w-2xl mx-auto)       │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

                             [ConchoDivider]

┌──────────────────────────────────────────────────────────────────────────────┐
│  bg-cgws-cream · py-16                                                       │
│  max-w-[1280px] mx-auto px-[var(--container-px)]                            │
│                                                                              │
│  ┌─────────────────────────────────────────┬──────────────────────────────┐  │
│  │  COLONNE GAUCHE — formulaire            │  COLONNE DROITE — infos+carte│  │
│  │  flex-1 min-w-0                         │  w-[400px] flex-shrink-0     │  │
│  │                                         │                              │  │
│  │  NOUS ÉCRIRE                            │  NOUS TROUVER                │  │
│  │  (Rye, cgws-copper, 11px, eyebrow)      │  (Rye, cgws-copper, 11px)    │  │
│  │                                         │                              │  │
│  │  Envoyez-nous un message                │  ┌──────────────────────────┐│  │
│  │  (Playfair 700, 28px, cgws-charcoal)    │  │  bg-cgws-parchment        ││  │
│  │                                         │  │  border-2 border-cgws-   ││  │
│  │  ┌─────────────────────────────────┐    │  │  leather/50 rounded-[4px]││  │
│  │  │ [CgwsInput label="Nom" req]     │    │  │  p-6                     ││  │
│  │  └─────────────────────────────────┘    │  │                          ││  │
│  │  ┌─────────────────────────────────┐    │  │  [map-pin] Adresse        ││  │
│  │  │ [CgwsInput label="Email" req    │    │  │  CGWS — Route de Brèches  ││  │
│  │  │   type="email"]                 │    │  │  37320 Brèches (37)       ││  │
│  │  └─────────────────────────────────┘    │  │                          ││  │
│  │  ┌─────────────────────────────────┐    │  │  [phone] Téléphone        ││  │
│  │  │ [CgwsSelect label="Sujet" req]  │    │  │  06 XX XX XX XX           ││  │
│  │  └─────────────────────────────────┘    │  │                          ││  │
│  │  ┌─────────────────────────────────┐    │  │  [clock] Horaires         ││  │
│  │  │ [CgwsTextarea label="Message"   │    │  │  Mar–Ven  10h–18h         ││  │
│  │  │   req, rows=5]                  │    │  │  Samedi   9h–17h          ││  │
│  │  │                                 │    │  │  Dim–Lun  Fermé           ││  │
│  │  └─────────────────────────────────┘    │  │                          ││  │
│  │                                         │  │  [mail] Email             ││  │
│  │  <!-- honeypot caché -->                │  │  contact@cgws.fr          ││  │
│  │                                         │  └──────────────────────────┘│  │
│  │  [Message d'erreur serveur — si 500]    │                              │  │
│  │                                         │  [ConchoDivider aria-hidden] │  │
│  │  [ ENVOYER MON MESSAGE ]                │                              │  │
│  │  (CgwsButton primary, type="submit")   │  ┌──────────────────────────┐│  │
│  │                                         │  │  Carte OpenStreetMap     ││  │
│  │                                         │  │  w-full h-[280px]        ││  │
│  │                                         │  │  Leaflet.js (client-only)││  │
│  │                                         │  │  border border-cgws-     ││  │
│  │                                         │  │  leather/40 rounded-[4px]││  │
│  │                                         │  │  overflow-hidden         ││  │
│  │                                         │  │  marker: cgws-copper     ││  │
│  │                                         │  └──────────────────────────┘│  │
│  └─────────────────────────────────────────┴──────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Tablet 768px

```
┌───────────────────────────────────────┐
│  PAGE HERO · py-12 · text-center      │
│  CONTACTEZ-NOUS (Bebas 56px)          │
│  tagline (max-w-lg mx-auto)           │
└───────────────────────────────────────┘

[ConchoDivider]

┌───────────────────────────────────────┐
│  bg-cgws-cream · py-12                │
│  2 colonnes flex (gap-8)              │
│                                       │
│  ┌──────────────────┬───────────────┐ │
│  │  Formulaire      │  Infos + carte│ │
│  │  flex-1          │  w-[280px]    │ │
│  │                  │               │ │
│  │  Nom (full)      │  [InfoBlock]  │ │
│  │  Email (full)    │  réduit       │ │
│  │  Sujet (full)    │               │ │
│  │  Message (full)  │  [Carte 200px]│ │
│  │  [ENVOYER]       │               │ │
│  └──────────────────┴───────────────┘ │
└───────────────────────────────────────┘
```

### Mobile 375px

```
┌──────────────────────────────┐
│  PAGE HERO · py-10            │
│  CONTACTEZ-NOUS              │
│  (Bebas 48px, 2 lignes ok)   │
│  tagline (text-base)         │
└──────────────────────────────┘

[ConchoDivider]

┌──────────────────────────────┐
│  bg-cgws-cream · py-10        │
│  Colonne unique              │
│                              │
│  NOUS ÉCRIRE (eyebrow)       │
│  Envoyez-nous un message     │
│  (Playfair 700, 24px)        │
│                              │
│  ┌──────────────────────┐    │
│  │ [Nom *]              │    │
│  └──────────────────────┘    │
│  ┌──────────────────────┐    │
│  │ [Email *]            │    │
│  └──────────────────────┘    │
│  ┌──────────────────────┐    │
│  │ [Sujet * — select]   │    │
│  └──────────────────────┘    │
│  ┌──────────────────────┐    │
│  │ [Message * textarea] │    │
│  │ (4 rows)             │    │
│  └──────────────────────┘    │
│  [ENVOYER] w-full            │
│                              │
│  ──── [ConchoDivider] ────   │
│                              │
│  NOUS TROUVER (eyebrow)      │
│                              │
│  ┌──────────────────────┐    │
│  │  [InfoBlock]         │    │
│  │  adresse, tél,       │    │
│  │  horaires, email     │    │
│  └──────────────────────┘    │
│                              │
│  ┌──────────────────────┐    │
│  │  [Carte OSM]         │    │
│  │  h-[220px] w-full    │    │
│  └──────────────────────┘    │
└──────────────────────────────┘
```

---

## Breakpoints

- **Mobile 375px** : colonne unique, H1 `text-[48px]`, formulaire full-width, infos sous le formulaire, carte `h-[220px]`, bouton submit `w-full`
- **Tablet 768px** : 2 colonnes flex (`gap-8`), H1 `text-[56px]`, colonne droite `w-[280px]`, carte `h-[200px]`
- **Desktop 1280px** : 2 colonnes flex (`gap-12`), H1 `text-[64px]`, colonne droite `w-[400px]`, carte `h-[280px]`

---

## Sections détaillées

### 2.1 Page Hero

```
Section : <section class="bg-cgws-tack py-10 md:py-16 text-center">
Container : <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">

Eyebrow : font-eyebrow text-cgws-copper text-[12px] uppercase tracking-[0.2em] mb-3
H1 : font-display text-[48px] sm:text-[56px] md:text-[64px] text-cgws-cream
     leading-none uppercase mb-4
Tagline : font-serif italic text-cgws-rope text-base md:text-lg
          max-w-2xl mx-auto leading-relaxed
```

Pas de CTA dans le hero de cette page — le formulaire est immédiatement visible en-dessous. Pas de scroll-jump anchor nécessaire (la section est courte).

### 2.2 Section principale — layout

```
<section class="bg-cgws-cream py-10 md:py-16">
  <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">
    <div class="flex flex-col md:flex-row gap-10 md:gap-8 lg:gap-12 items-start">
      <!-- Colonne gauche : formulaire -->
      <div class="flex-1 min-w-0">…</div>
      <!-- Colonne droite : infos + carte -->
      <div class="w-full md:w-[280px] lg:w-[400px] flex-shrink-0">…</div>
    </div>
  </div>
</section>
```

### 2.3 Formulaire de contact

**Titre de la colonne gauche :**

```
Eyebrow : <p class="font-eyebrow text-cgws-copper text-[11px] uppercase
                    tracking-[0.2em] mb-2">NOUS ÉCRIRE</p>
Titre   : <h2 class="font-serif font-bold text-[24px] md:text-[28px]
                     text-cgws-charcoal leading-snug mb-8">
              Envoyez-nous un message
           </h2>
```

**Formulaire :**

```html
<form
  aria-label="Formulaire de contact CGWS"
  @submit.prevent="handleSubmit"
  novalidate
>
  <!-- Honeypot — champ caché pour filtrer les robots -->
  <input
    v-model="honeypot"
    type="text"
    name="website"
    class="sr-only"
    tabindex="-1"
    autocomplete="off"
    aria-hidden="true"
  />

  <div class="flex flex-col gap-5">
    <CgwsInput
      v-model="name"
      label="Nom"
      :required="true"
      name="name"
      autocomplete="name"
      :error="errors.name"
      @blur="validateField('name')"
    />

    <CgwsInput
      v-model="email"
      label="Email"
      type="email"
      :required="true"
      name="email"
      autocomplete="email"
      :error="errors.email"
      @blur="validateField('email')"
    />

    <CgwsSelect
      v-model="subject"
      label="Sujet"
      :required="true"
      name="subject"
      :error="errors.subject"
      @blur="validateField('subject')"
    >
      <option value="">— Choisissez un sujet —</option>
      <option value="question-produit">Question sur un produit</option>
      <option value="consignation">Service de consignation</option>
      <option value="rdv-boutique">Rendez-vous en boutique</option>
      <option value="commande">Commande / Livraison</option>
      <option value="autre">Autre</option>
    </CgwsSelect>

    <CgwsTextarea
      v-model="message"
      label="Message"
      :required="true"
      name="message"
      :rows="5"
      placeholder="Décrivez votre demande en quelques mots…"
      :error="errors.message"
      @blur="validateField('message')"
    />

    <!-- Erreur serveur globale -->
    <div
      v-if="serverError"
      role="alert"
      class="bg-cgws-rust/10 border border-cgws-rust rounded-sm p-4"
    >
      <p class="font-sans text-sm text-cgws-rust font-medium">{{ serverError }}</p>
    </div>

    <CgwsButton
      type="submit"
      variant="primary"
      :loading="isSubmitting"
      :disabled="isSubmitting"
      class="w-full sm:w-auto"
    >
      ENVOYER MON MESSAGE
    </CgwsButton>
  </div>
</form>
```

**Options de `CgwsSelect` Sujet :**

| Valeur | Label |
|--------|-------|
| `question-produit` | Question sur un produit |
| `consignation` | Service de consignation |
| `rdv-boutique` | Rendez-vous en boutique |
| `commande` | Commande / Livraison |
| `autre` | Autre |

Justification du select plutôt qu'un champ libre : Camille traite les messages seule. Les sujets prédéfinis lui permettent de prioriser rapidement sans lire le message en entier.

**État interne (refs) :**

```typescript
const name = ref('')
const email = ref('')
const subject = ref('')
const message = ref('')
const honeypot = ref('')   // champ piège anti-spam

const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)
const isSuccess = ref(false)
const submittedName = ref('')  // prénom pour personnaliser le message succès
const serverError = ref('')
```

### 2.4 Validation front-end

Se déclenche `@blur` sur chaque champ, et globalement au `@submit.prevent`.

| Champ | Règle | Message d'erreur |
|-------|-------|-----------------|
| Nom | Requis, min 2 caractères | "Votre nom est requis" |
| Email | Requis, format RFC | "Adresse email invalide" |
| Sujet | Requis, valeur non vide | "Veuillez choisir un sujet" |
| Message | Requis, min 10 caractères | "Votre message doit faire au moins 10 caractères" |

Les props `error` et `aria-invalid` / `aria-describedby` sont déjà gérées par `CgwsInput`, `CgwsTextarea` et `CgwsSelect` (pattern établi en US-020).

### 2.5 Bloc infos pratiques

**Titre de la colonne droite :**

```
<p class="font-eyebrow text-cgws-copper text-[11px] uppercase
          tracking-[0.2em] mb-4">NOUS TROUVER</p>
```

**Carte info :**

```
<div class="bg-cgws-parchment border-2 border-cgws-leather/40
            rounded-[4px] p-6 mb-6">
```

Chaque ligne d'info suit ce pattern :

```
┌─────────────────────────────────────────┐
│  [icône w-5 h-5 text-cgws-copper mt-0.5]  [texte Inter 400 14px cgws-charcoal]  │
└─────────────────────────────────────────┘
```

Structure HTML d'un item :

```html
<div class="flex items-start gap-3 [&:not(:last-child)]:mb-5">
  <UIcon name="i-lucide-map-pin"
         class="w-5 h-5 text-cgws-copper flex-shrink-0 mt-0.5"
         aria-hidden="true" />
  <div>
    <p class="font-sans font-semibold text-[13px] text-cgws-leather
              uppercase tracking-wide mb-0.5">Adresse</p>
    <p class="font-sans text-sm text-cgws-charcoal leading-relaxed">
      CGWS<br>
      Brèches<br>
      37320 Indre-et-Loire<!-- TODO: confirmer adresse exacte avec Camille -->
    </p>
  </div>
</div>
```

**Icônes par item :**

| Item | Icône Lucide |
|------|-------------|
| Adresse | `i-lucide-map-pin` |
| Téléphone | `i-lucide-phone` |
| Horaires | `i-lucide-clock` |
| Email | `i-lucide-mail` |

**Contenu placeholder (à confirmer avec Camille) :**

```
Adresse  : CGWS — Brèches, 37320 Indre-et-Loire
Téléphone: 06 XX XX XX XX  (lien <a href="tel:+33XXXXXXXXX">)
Horaires :
  Mardi – Vendredi   10h – 18h
  Samedi             9h – 17h
  Dimanche – Lundi   Fermé
Email    : contact@cgws.fr  (lien <a href="mailto:contact@cgws.fr">)
```

Les liens `tel:` et `mailto:` sont rendus en `text-cgws-copper hover:underline transition-colors duration-150`.

**Séparateur entre infos et carte :**

```html
<ConchoDivider class="my-6" aria-hidden="true" />
```

### 2.6 Carte OpenStreetMap

**Implémentation** : Leaflet.js via `<ClientOnly>`. Leaflet ne supporte pas le SSR — le composant doit être rendu uniquement côté client.

**Coordonnées de Brèches** : `lat: 47.4833, lng: 0.5167`

**Conteneur :**

```html
<div class="w-full h-[220px] sm:h-[240px] md:h-[200px] lg:h-[280px]
            border border-cgws-leather/40 rounded-[4px] overflow-hidden
            bg-cgws-parchment">
  <ClientOnly>
    <LMapContainer ... />
    <!-- fallback skeleton pendant le chargement -->
    <template #fallback>
      <div class="w-full h-full bg-cgws-parchment animate-pulse
                  flex items-center justify-center">
        <UIcon name="i-lucide-map" class="w-8 h-8 text-cgws-leather/30" aria-hidden="true"/>
      </div>
    </template>
  </ClientOnly>
</div>
```

**Configuration Leaflet recommandée :**

```typescript
// Dans le composant ClientOnly ou un composant dédié ContactMap.vue
// Tiles : OpenStreetMap standard — aucun tracking Google
const tileLayer = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const attribution = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

// Marker personnalisé couleur cgws-copper via CSS (DivIcon)
// ou utiliser un marker SVG personnalisé
const center = [47.4833, 0.5167]
const zoom = 14
```

Note : Pour éviter d'alourdir le bundle, utiliser `vue-leaflet` (`@vue-leaflet/vue-leaflet`) ou importer Leaflet directement dans `onMounted()` avec un dynamic import `await import('leaflet')`.

**Accessibilité de la carte** :

```html
<div role="application"
     aria-label="Carte OpenStreetMap centrée sur Brèches, Indre-et-Loire">
  …
</div>
```

Un lien de contournement est affiché sous la carte pour les utilisateurs qui ne peuvent pas interagir avec une carte :

```html
<a
  href="https://www.openstreetmap.org/?mlat=47.4833&mlon=0.5167#map=14/47.4833/0.5167"
  target="_blank"
  rel="noopener noreferrer"
  class="font-sans text-xs text-cgws-copper hover:underline mt-2 inline-block"
>
  Ouvrir dans OpenStreetMap
  <span class="sr-only">(ouvre un nouvel onglet)</span>
</a>
```

---

## États du formulaire

### Default

Formulaire vide, tous les champs en état initial. Aucune erreur affichée. Bouton "ENVOYER MON MESSAGE" actif.

### Validation (blur par champ)

- `CgwsInput` / `CgwsTextarea` / `CgwsSelect` reçoivent la prop `error="message"` → bordure `cgws-rust`, message en `text-cgws-rust text-xs` sous le champ
- `aria-invalid="true"` sur le champ en erreur (géré par les composants)
- `aria-describedby` pointe vers l'ID du message d'erreur (géré par les composants)

### Soumission en cours

```
isSubmitting = true
→ CgwsButton : loading=true → spinner interne (géré par CgwsButton)
→ Tous les inputs/select/textarea : disabled=true (via v-bind)
→ Bouton : désactivé visuellement (opacity-40)
```

Le texte du bouton reste "ENVOYER MON MESSAGE" — le spinner CgwsButton indique le chargement.

### Succès (inline, sans rechargement)

`isSuccess = true` → le formulaire est remplacé par un bloc de confirmation. La colonne droite (infos + carte) reste visible.

```
Transition Vue : <Transition name="fade-contact">
  <form v-if="!isSuccess" …>…</form>
  <div v-else role="status" aria-live="polite" aria-atomic="true" …>…</div>
</Transition>
```

**Bloc succès :**

```
┌──────────────────────────────────────────┐
│  bg-cgws-parchment                       │
│  border-2 border-cgws-leather/40         │
│  rounded-[4px] p-8 text-center           │
│                                          │
│  [i-lucide-check-circle]                 │
│  w-10 h-10 text-cgws-copper mx-auto mb-4 │
│                                          │
│  MESSAGE ENVOYÉ                          │
│  font-display text-3xl text-cgws-charcoal│
│  tracking-wide mb-2                      │
│                                          │
│  Merci, {submittedName} !                │
│  font-serif font-semibold text-xl        │
│  text-cgws-charcoal mb-3                 │
│                                          │
│  Camille vous répondra dans les          │
│  meilleurs délais.                       │
│  font-sans text-sm text-cgws-charcoal/70 │
│  leading-relaxed                         │
│                                          │
│  [ RETOUR AU CATALOGUE ]  [ Nouveau msg ]│
│  CgwsButton secondary    CgwsButton ghost│
│  as="NuxtLink" to="/catalogue"           │
│  @click="resetForm" sur ghost            │
└──────────────────────────────────────────┘
```

Le bloc succès est intentionnellement sobre (pas de "wanted poster" — ce motif est réservé aux conditions de consignation). Un fond parchment avec une bordure leather rappelle l'univers sans sur-encoder.

### Erreur serveur (500 / réseau)

```html
<div role="alert"
     class="bg-cgws-rust/10 border border-cgws-rust rounded-sm p-4 mb-5">
  <p class="font-sans text-sm text-cgws-rust font-medium">
    Une erreur est survenue. Veuillez réessayer ou nous contacter
    directement par téléphone.
  </p>
</div>
```

Le formulaire reste rempli. Le bouton redevient actif.

### Rate limit (429)

Traité côté UX comme une erreur serveur avec un message distinct :

```
"Trop de messages envoyés. Veuillez patienter avant de réessayer."
```

---

## Tailwind classes — récapitulatif

```
Hero :
  section : bg-cgws-tack py-10 md:py-16 text-center
  container : max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]
  eyebrow : font-eyebrow text-cgws-copper text-[12px] uppercase tracking-[0.2em] mb-3
  H1 : font-display text-[48px] sm:text-[56px] md:text-[64px] text-cgws-cream
       leading-none uppercase mb-4
  tagline : font-serif italic text-cgws-rope text-base md:text-lg
            max-w-2xl mx-auto leading-relaxed

Section principale :
  bg-cgws-cream py-10 md:py-16
  Layout flex : flex flex-col md:flex-row gap-10 md:gap-8 lg:gap-12 items-start

Colonne gauche :
  flex-1 min-w-0
  eyebrow sous-titre : font-eyebrow text-cgws-copper text-[11px] uppercase
                       tracking-[0.2em] mb-2
  titre H2 : font-serif font-bold text-[24px] md:text-[28px]
             text-cgws-charcoal leading-snug mb-8
  form champs : flex flex-col gap-5

Colonne droite :
  w-full md:w-[280px] lg:w-[400px] flex-shrink-0
  eyebrow : idem colonne gauche, mb-4

InfoBlock :
  bg-cgws-parchment border-2 border-cgws-leather/40 rounded-[4px] p-6 mb-6
  item : flex items-start gap-3 [&:not(:last-child)]:mb-5
  icône : w-5 h-5 text-cgws-copper flex-shrink-0 mt-0.5
  label info : font-sans font-semibold text-[13px] text-cgws-leather
               uppercase tracking-wide mb-0.5
  valeur info : font-sans text-sm text-cgws-charcoal leading-relaxed
  liens tel/mail : text-cgws-copper hover:underline transition-colors duration-150

Carte OSM :
  w-full h-[220px] sm:h-[240px] md:h-[200px] lg:h-[280px]
  border border-cgws-leather/40 rounded-[4px] overflow-hidden bg-cgws-parchment

Bloc succès :
  bg-cgws-parchment border-2 border-cgws-leather/40 rounded-[4px] p-8 text-center
  icône check : w-10 h-10 text-cgws-copper mx-auto mb-4
  titre : font-display text-3xl text-cgws-charcoal tracking-wide mb-2
  prénom : font-serif font-semibold text-xl text-cgws-charcoal mb-3
  corps : font-sans text-sm text-cgws-charcoal/70 leading-relaxed
  CTA row : flex flex-col sm:flex-row gap-3 justify-center mt-6

Erreur serveur / rate limit :
  bg-cgws-rust/10 border border-cgws-rust rounded-sm p-4 mb-5
  texte : font-sans text-sm text-cgws-rust font-medium

Honeypot :
  sr-only  (classe Tailwind officielle, équivalent à position:absolute;
            width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0))

Transition form→succès :
  .fade-contact-enter-active, .fade-contact-leave-active { transition: opacity 0.3s ease; }
  .fade-contact-enter-from, .fade-contact-leave-to { opacity: 0; }
```

---

## Animations GSAP

Toutes les animations sont initialisées dans `onMounted()`, nettoyées dans `onUnmounted()`, et désactivées si `window.matchMedia('(prefers-reduced-motion: reduce)').matches`.

### Hero — entrance staggerée (dans `contact.vue`)

```javascript
// Eyebrow → H1 → tagline, décalé
gsap.from(['.contact-hero-eyebrow', '.contact-hero-h1', '.contact-hero-tagline'], {
  opacity: 0,
  y: 20,
  duration: 0.6,
  stagger: 0.15,
  ease: 'power2.out',
  clearProps: 'all',
})
```

### Section contact — entrée au scroll (dans `contact.vue`)

Les deux colonnes s'animent depuis les côtés opposés, cohérent avec `OurStorySection.vue` :

```javascript
gsap.from('.contact-form-col', {
  opacity: 0,
  x: -30,
  duration: 0.7,
  ease: 'power2.out',
  clearProps: 'all',
  scrollTrigger: {
    trigger: '.contact-section',
    start: 'top 75%',
    once: true,
  }
})

gsap.from('.contact-info-col', {
  opacity: 0,
  x: 30,
  duration: 0.7,
  ease: 'power2.out',
  clearProps: 'all',
  scrollTrigger: {
    trigger: '.contact-section',
    start: 'top 75%',
    once: true,
  }
})
```

### Carte — fade in (dans `contact.vue` ou `ContactMap.vue`)

```javascript
gsap.from('.contact-map', {
  opacity: 0,
  duration: 0.5,
  ease: 'power2.out',
  scrollTrigger: {
    trigger: '.contact-map',
    start: 'top 85%',
    once: true,
  }
})
```

---

## Route API — `server/api/contact.post.ts`

Spécifiée ici pour valider le flux UX complet.

**Payload attendu (JSON body) :**

```typescript
interface ContactPayload {
  name: string      // min 2 caractères
  email: string     // format email valide
  subject: string   // l'une des 5 options du select
  message: string   // min 10 caractères
  website?: string  // honeypot — doit être vide
}
```

**Flux côté serveur :**

1. Validation Zod du payload
2. Si `website` est non vide → retourner `200 { success: true }` silencieusement (ne pas révéler au bot que le message a été ignoré)
3. Rate limiting : 5 requêtes / heure / IP (via un compteur en mémoire Nitro ou `unstorage`)
4. Si rate limit dépassé → `429 { error: 'RATE_LIMIT_EXCEEDED' }`
5. Envoi email via Resend :
   - Expéditeur : `CGWS <noreply@cgws.fr>`
   - Destinataire : email de Camille (depuis `runtimeConfig.private.camilleEmail`)
   - Sujet : `[CGWS Contact] ${subject} — ${name}`
   - Corps : nom, email de l'expéditeur, sujet, message (template HTML simple)
6. `200 { success: true }` ou `500 { error: 'SERVER_ERROR' }`

**Comportement UX selon réponse :**

| Réponse | Comportement |
|---------|-------------|
| `200` | `isSuccess = true`, transition vers le message de confirmation |
| `422` | Mapper les erreurs serveur sur les champs (`errors.name = '…'`), scroll vers le premier champ en erreur |
| `429` | Afficher message rate limit dans l'alerte serveur |
| `500` | Afficher l'alerte d'erreur générique + bouton redevient actif |

---

## Accessibilité

### Rôles et attributs ARIA

| Élément | Attribut | Valeur |
|---------|----------|--------|
| `<form>` | `aria-label` | `"Formulaire de contact CGWS"` |
| Champs requis | `aria-required` | `"true"` (géré par `CgwsInput`, `CgwsTextarea`, `CgwsSelect`) |
| Champs en erreur | `aria-invalid` | `"true"` (géré par les composants UI) |
| Messages d'erreur | `aria-describedby` | ID du `<p>` d'erreur (géré par les composants UI) |
| Messages d'erreur | `role` | `"alert"` (géré par les composants UI) |
| Honeypot | `aria-hidden` | `"true"`, `tabindex="-1"` |
| Message de succès | `role` | `"status"` |
| Message de succès | `aria-live` | `"polite"` |
| Message de succès | `aria-atomic` | `"true"` |
| Erreur serveur | `role` | `"alert"` |
| Carte OSM | `role` | `"application"` |
| Carte OSM | `aria-label` | `"Carte OpenStreetMap centrée sur Brèches"` |
| Icônes décoratives (infos) | `aria-hidden` | `"true"` |
| Lien OSM externe | `rel` | `"noopener noreferrer"` + sr-only "(ouvre un nouvel onglet)" |

### Navigation clavier

- `Tab` : Hero → ConchoDivider (aria-hidden, skippé) → Nom → Email → Sujet → Message → Bouton submit → (col droite) Téléphone lien → Email lien → Lien OSM externe
- `Enter` / `Space` : activate bouton submit
- `Escape` : aucun comportement particulier (pas de modal)
- Pas de piège de focus

### Ordre de focus logique

Sur mobile (colonne unique) : Form complet → ConchoDivider (skip) → InfoBlock (liens tel + mail) → Lien OSM externe.

Sur desktop (2 colonnes) : Le focus suit l'ordre DOM — form en premier (colonne gauche est en premier dans le DOM), puis les liens de la colonne droite. La colonne droite est `flex-shrink-0` positionné après en CSS mais en deuxième dans le DOM — cet ordre est correct et naturel.

### Contrastes (WCAG AA — ratio minimum 4.5:1 pour texte normal)

| Paire | Ratio estimé | Statut |
|-------|-------------|--------|
| `cgws-charcoal` (#1A0B03) sur `cgws-cream` (#FAF3E3) | ~16.6:1 | ✓ |
| `cgws-charcoal` sur `cgws-parchment` (#F0DDB8) | ~13.97:1 | ✓ |
| `cgws-copper` (#B8650A) sur `cgws-cream` | ~4.7:1 | ✓ |
| `cgws-copper` sur `cgws-parchment` | ~4.6:1 | ✓ |
| `cgws-leather` (#7B3B1C) sur `cgws-parchment` | ~5.88:1 | ✓ |
| `cgws-rope` (#C8AB82) sur `cgws-tack` (#3D1A06) | ~5.1:1 | ✓ |
| `cgws-rust` (#943218) sur `cgws-cream` | ~5.4:1 | ✓ |
| `cgws-rust` sur `cgws-rust/10` (bg alerte) | ~5.2:1 | ✓ |
| Focus ring `cgws-copper` sur `cgws-cream` | ~4.7:1 | ✓ |

---

## Composants nouveaux à créer

Aucun — tous les composants UI requis existent déjà :
- `CgwsInput` : `app/components/ui/CgwsInput.vue` ✓
- `CgwsTextarea` : `app/components/ui/CgwsTextarea.vue` ✓ (créé en US-020)
- `CgwsSelect` : `app/components/ui/CgwsSelect.vue` ✓ (créé en US-020)
- `CgwsButton` : `app/components/ui/CgwsButton.vue` ✓
- `ConchoDivider` : `app/components/ui/ConchoDivider.vue` ✓

Le composant `ContactMap.vue` est optionnel — la logique Leaflet peut être inline dans `contact.vue` dans `<ClientOnly>` si elle est courte.

---

## Notes pour le développeur

1. **Leaflet en Nuxt 4** : Utiliser `<ClientOnly>` obligatoirement. Importer Leaflet avec `const L = await import('leaflet')` dans `onMounted()`. Ajouter `leaflet/dist/leaflet.css` dans les assets ou via `nuxt.config.ts` `css: ['leaflet/dist/leaflet.css']`.

2. **Honeypot** : Le champ `name="website"` avec la classe `sr-only` et `tabindex="-1"` est invisible aux humains mais visible aux bots qui remplissent tous les champs. La vérification se fait côté serveur uniquement.

3. **Rate limiting** : Implémenter avec `useStorage()` de Nitro (stockage en mémoire, remis à zéro au redémarrage — suffisant pour la production Vercel avec Edge Functions). Clé : `ratelimit:contact:${clientIp}`.

4. **Contenu placeholder** : L'adresse exacte, le numéro de téléphone et les horaires sont des valeurs placeholder. Laisser des commentaires `<!-- TODO: confirmer avec Camille -->` sur chaque valeur avant la mise en production.

5. **`submittedName`** : Capturer le prénom (premier mot de `name`) au moment de la soumission pour personnaliser le message de succès : `submittedName.value = name.value.split(' ')[0]`.
