# Espace déposant — Suivi de consignation par magic link (US-066)

**Purpose** : donner au déposant (persona P3) un accès web autonome, sans mot de passe, à l'état de sa/ses consignation(s) — en attente, en vente, vendue, refusée, retournée — afin de réduire les appels/mails de suivi à Camille. Espace strictement **en lecture seule**, protégé par authentification Supabase OTP (magic link), avec anti-énumération d'email côté UX.

**Location** :
- `app/pages/espace-deposant/index.vue` — demande de lien
- `app/pages/espace-deposant/suivi.vue` — liste lecture seule (protégée)
- `app/middleware/depositor.ts` — protège `/espace-deposant/suivi`
- `app/composables/useDepositorAuth.ts` — mirror de `useAdminAuth.ts`, sans mot de passe
- `server/api/depositor/consignments.get.ts` — **seule** source de données de l'écran 2 (jamais de requête client directe sur `consignments`, cf. §6)
- `app/components/consignation/ConsignmentTrackingCard.vue` — carte lecture seule (nouveau composant)

**Types impliqués** (`app/types/index.ts`) : `Consignment`, `ConsignmentStatus` (`'pending' | 'accepted' | 'rejected' | 'sold' | 'returned'`), `ProductCondition`. Le payload retourné par `server/api/depositor/consignments.get.ts` est un **sous-ensemble mappé** de `Consignment` (voir §6 — jamais `notes`, jamais de champ commission brut).

**Dépend de** : `US-070` (tokens v3), `US-072` (`CgwsButton`, `CgwsInput`, `CgwsBadge`, `StarDivider`), `US-040` (réutilise `CONSIGNMENT_STATUS_LABELS`, confirmé ci-dessous §2.2), `US-021` (pattern formulaire public simple + état succès neutre, réutilisé pour l'écran 1).

**Vérification MCP effectuée avant rédaction** (règle absolue `CLAUDE.md`) : `mcp__nuxt-ui-remote__search-documentation` interrogé sur "color mode"/middleware/formulaires — confirme le pattern `useColorMode()`/`ClientOnly` déjà utilisé par le reste du site (le switcher de thème s'applique nativement à ces pages publiques, aucune divergence à spécifier ici). Le pattern de middleware protégé (`app/middleware/admin.ts`, lu intégralement) sert de référence directe et vérifiée pour `depositor.ts` : garde `import.meta.server` (validation de session déférée au client, cf. §4 pour l'implication UX). Le pattern `signInWithOtp` est un appel Supabase Auth JS documenté côté tâches techniques du Sprint Plan (hors périmètre `nuxt-ui-remote`/`nuxt-remote`, c'est de l'API `@supabase/supabase-js`, pas une API Nuxt/Nuxt UI) — signalé pour vérification par `nuxt-developer` au moment de l'implémentation, comme le fait déjà `US-070` pour des points hors couverture MCP disponible.

---

## 0. Vue d'ensemble du flux

```
/espace-deposant (formulaire email)
   │  soumission
   ▼
message neutre "si cette adresse est associée..." (identique, connu ou non)
   │  email reçu (si adresse connue) → clic sur le lien magique
   ▼
callback OTP Supabase (échange token) ──┬── succès ──► /espace-deposant/suivi (session posée)
                                         └── expiré/déjà utilisé ──► /espace-deposant
                                                                      + message "lien non valide"

/espace-deposant/suivi (protégée par app/middleware/depositor.ts)
   │  pas de session ──► redirect /espace-deposant (silencieux, pas de flash de contenu)
   │  session valide ──► fetch server/api/depositor/consignments.get.ts
   ▼
liste de cartes lecture seule (par consignation) OU état vide OU erreur

[Se déconnecter] ──► supabase.auth.signOut() ──► redirect /espace-deposant
```

Les deux pages sont publiques dans leur **thème** (suivent le switcher `elegante-jour` / `elegante-nuit` / `rugueux` comme le reste du site public) mais `/suivi` est protégée fonctionnellement par session.

---

## 1. Écran 1 — `/espace-deposant` (demande de lien)

### 1.1 Décision — traitement visuel sobre, pas le hero photo de la homepage

Contrairement au Hero plein écran de la homepage (`US-073`), cet écran est **utilitaire** : un visiteur y arrive généralement via un lien direct (email de Camille, footer, page consignation) pour vérifier un statut, pas pour être séduit. Décision : section courte, fond plat `bg-cgws-ground` (pas de photo/scrim), cohérente avec le traitement de `/contact` (`US-021`) plutôt qu'avec le Hero homepage. Une arche fine optionnelle (`accent-deco`, cf. `US-072` §4) peut encadrer le titre pour garder la signature graphique du site sans surcharge.

### 1.2 Titre — Rye retenu

**« Espace déposant »** = 2 mots → respecte la règle §3 du doc maître (Rye ≤ ~4 mots, titre de section court, fixe, non dynamique). Utilise donc `font-heading` (Rye), **pas** `font-serif` (Playfair). C'est un titre de page fixe défini par CGWS, jamais un contenu utilisateur/CMS qui pourrait dépasser la limite — le cas d'usage exact que la règle Rye autorise.

### 1.3 Layout (ASCII wireframe)

**Desktop 1440px**

```
┌──────────────────────────────────────────────────────────────────┐
│  bg-cgws-ground · py-16 md:py-20 · text-center                    │
│  max-w-[640px] mx-auto px-[clamp(1rem,4vw,2rem)]                  │
│                                                                    │
│              ╭──── arche fine (accent-deco, optionnelle) ────╮    │
│  SUIVI DE CONSIGNATION            ← eyebrow, font-eyebrow,        │
│                                       text-cgws-ink-soft           │
│  ESPACE DÉPOSANT                  ← H1, font-heading (Rye),       │
│                                       text-cgws-heading, 40px      │
│                                                                    │
│  Suivez l'état de votre dépôt (en attente, en vente, vendu…)      │
│  sans avoir à nous appeler.       ← font-serif italic, ink-soft   │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  bg-cgws-surface border border-cgws-hairline rounded-[6px]│    │
│  │  p-6 md:p-8                                                │    │
│  │                                                             │    │
│  │  [ CgwsInput label="Adresse email" type="email" req ]      │    │
│  │                                                             │    │
│  │  [ Recevoir mon lien de connexion ]  ← CgwsButton primary  │    │
│  │  w-full sm:w-auto                                          │    │
│  │                                                             │    │
│  │  [ zone message — succès/erreur, aria-live="polite" ]      │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  Une consignation en cours ? Retrouvez nos conditions             │
│  → lien vers /consignation                                        │
└──────────────────────────────────────────────────────────────────┘
```

**Tablet 768px** : identique, `max-w-[540px]`, `p-6`, titre `32px`.
**Mobile 375px** : `py-12`, `max-w-full` avec `px-4`, carte formulaire `p-5`, bouton `w-full`, titre `28px` (H1 sur 1 à 2 lignes max, "Espace déposant" tient sur une ligne à cette taille).

### 1.4 Structure HTML / classes

```html
<section class="bg-cgws-ground py-12 md:py-16 lg:py-20 text-center" aria-labelledby="depositor-heading">
  <div class="max-w-[640px] mx-auto px-[clamp(1rem,4vw,2rem)]">

    <!-- Arche fine optionnelle, cf. US-072 §4 -->
    <div class="relative inline-block">
      <svg class="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 w-[220px] h-auto"
           viewBox="0 0 220 70" fill="none" aria-hidden="true">
        <path d="M10 70 C10 24 60 6 110 6 C160 6 210 24 210 70"
              stroke="var(--cgws-accent-deco)" stroke-width="1.5" stroke-linecap="round" />
      </svg>

      <p class="font-eyebrow text-cgws-ink-soft text-[12px] uppercase tracking-[0.3em] mb-3 mt-6">
        Suivi de consignation
      </p>
      <h1 id="depositor-heading"
          class="font-heading text-cgws-heading uppercase tracking-wide leading-none
                 text-[28px] md:text-[32px] lg:text-[40px] mb-4">
        Espace déposant
      </h1>
    </div>

    <p class="font-serif italic text-cgws-ink-soft text-base md:text-lg max-w-prose mx-auto mb-8 md:mb-10">
      Suivez l'état de votre dépôt — en attente, en vente, vendu — sans avoir à nous appeler.
    </p>

    <div class="bg-cgws-surface border border-cgws-hairline rounded-[6px] p-6 md:p-8 text-left">
      <form aria-label="Demande de lien de connexion déposant" novalidate @submit.prevent="handleSubmit">
        <div class="flex flex-col gap-5">
          <CgwsInput
            v-model="email"
            label="Adresse email"
            type="email"
            required
            name="email"
            autocomplete="email"
            :error="errors.email"
            :disabled="isSubmitting || isSuccess"
            hint="L'adresse que vous avez communiquée lors de votre dépôt."
            @blur="validateEmail"
          />

          <CgwsButton
            type="submit"
            variant="primary"
            :loading="isSubmitting"
            :disabled="isSubmitting || isSuccess"
            class="w-full sm:w-auto"
          >
            Recevoir mon lien de connexion
          </CgwsButton>

          <!-- Zone de message — succès neutre OU erreur de validation format -->
          <div ref="messageRef" tabindex="-1" aria-live="polite" aria-atomic="true">
            <p v-if="isSuccess"
               role="status"
               class="flex items-start gap-2 font-sans text-sm text-cgws-ink
                      bg-cgws-success/15 border border-cgws-success/40 rounded-sm p-3">
              <UIcon name="i-lucide-mail-check" class="w-4 h-4 mt-0.5 text-cgws-success flex-shrink-0" aria-hidden="true" />
              Si cette adresse est associée à une consignation, un lien de connexion
              vient de vous être envoyé. Vérifiez votre boîte de réception (et vos spams).
            </p>
          </div>
        </div>
      </form>
    </div>

    <p class="font-sans text-sm text-cgws-ink-soft mt-6">
      Une consignation en cours ?
      <NuxtLink to="/consignation" class="text-cgws-accent hover:underline focus-visible:ring-2 focus-visible:ring-cgws-accent rounded-sm">
        Découvrez nos conditions de dépôt
      </NuxtLink>
    </p>

  </div>
</section>
```

### 1.5 États

| État | Comportement visuel |
|---|---|
| **Idle** | Champ vide, bouton actif, aucune erreur/message |
| **Erreur de validation format** (blur ou submit) | `CgwsInput` reçoit `error="Adresse email invalide"` → bordure `border-cgws-danger`, message `text-cgws-danger` sous le champ (pattern déjà géré nativement par `CgwsInput`, cf. `US-072` §6.1). **Aucun appel réseau déclenché tant que le format est invalide** — l'anti-énumération ne concerne que les emails syntaxiquement valides. |
| **Loading (soumission)** | `isSubmitting = true` → `CgwsButton :loading="true"` (spinner interne), champ `disabled`, bouton désactivé visuellement (`opacity-40`, géré par le composant) |
| **Succès (neutre, anti-énumération)** | `isSuccess = true` → message affiché dans la zone `aria-live="polite"` (voir texte exact en §1.4). **Ce message s'affiche systématiquement après une soumission valide, que l'email corresponde ou non à un déposant connu** — c'est la seule branche observable côté client, conformément au critère Gherkin du Sprint Plan. Le formulaire reste affiché (champ + bouton passent en `disabled`) plutôt que d'être remplacé, pour permettre une nouvelle demande sans recharger la page si l'utilisateur s'est trompé d'adresse — un bouton discret "Utiliser une autre adresse" (`CgwsButton variant="ghost"`) réinitialise `isSuccess`/`email`. |
| **Erreur serveur/réseau** (500, timeout) | Bloc `role="alert"` distinct au-dessus du bouton : `bg-cgws-danger/10 border border-cgws-danger rounded-sm p-4`, texte `text-cgws-danger` — *"Une erreur est survenue. Veuillez réessayer dans un instant."* Ce cas est différent du succès neutre : il s'agit d'un échec technique réel (ex. Supabase indisponible), pas d'une non-existence d'email — la distinction reste invisible du point de vue "l'email existe-t-il", seulement du point de vue "la requête a-t-elle abouti techniquement". |

### 1.6 Anti-énumération — détail UX

- Le composant/API ne différencie **jamais** la réponse selon que l'email existe dans `consignments.depositor_email` ou non : `signInWithOtp` est appelé dans tous les cas où le format est valide, et le message affiché est strictement identique.
- Pas de variation de timing perceptible ne doit être introduite côté front (ex. ne pas ajouter de délai artificiel différent selon le cas — le Sprint Plan précise "aucune différence observable... dans les temps de réponse", point qui relève de l'implémentation serveur/Supabase, non du rendu visuel, mais à rappeler ici pour que `nuxt-developer` n'introduise pas de `setTimeout` conditionnel côté client qui romprait cette garantie).
- Le focus est déplacé sur la zone de message (`messageRef.value?.focus()`) après succès, pour que les utilisateurs de lecteur d'écran perçoivent immédiatement la confirmation sans devoir chercher la région `aria-live` (qui de toute façon serait annoncée, mais le déplacement de focus renforce la clarté sur ordinateur avec navigation clavier).

### 1.7 Tailwind classes — récapitulatif

```
Section : bg-cgws-ground py-12 md:py-16 lg:py-20 text-center
Container : max-w-[640px] mx-auto px-[clamp(1rem,4vw,2rem)]
Arche (optionnelle) : pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 w-[220px] h-auto — stroke var(--cgws-accent-deco)
Eyebrow : font-eyebrow text-cgws-ink-soft text-[12px] uppercase tracking-[0.3em] mb-3
H1 : font-heading text-cgws-heading uppercase tracking-wide leading-none text-[28px] md:text-[32px] lg:text-[40px] mb-4
Tagline : font-serif italic text-cgws-ink-soft text-base md:text-lg max-w-prose mx-auto mb-8 md:mb-10
Carte formulaire : bg-cgws-surface border border-cgws-hairline rounded-[6px] p-6 md:p-8 text-left
Message succès : bg-cgws-success/15 border border-cgws-success/40 text-cgws-ink rounded-sm p-3 (icône text-cgws-success)
Message erreur serveur : bg-cgws-danger/10 border border-cgws-danger text-cgws-danger rounded-sm p-4
Lien secondaire : text-cgws-accent hover:underline
```

---

## 2. Transverse — flux d'authentification, redirections, transitions

### 2.1 Callback OTP (lien cliqué)

Pas d'écran dédié visible : la route de callback Supabase échange le token puis redirige immédiatement. Deux issues :

| Issue | Comportement UX |
|---|---|
| Lien valide, non expiré, non déjà utilisé | Session posée → redirection directe vers `/espace-deposant/suivi`. Pendant l'échange (généralement < 1s), afficher un état de transition minimal plutôt qu'un écran blanc : fond `bg-cgws-ground` plein écran avec un simple indicateur de chargement centré (`StarDivider`-like spinner ou icône `i-lucide-loader-circle animate-spin text-cgws-accent`, `aria-live="polite"` avec texte `sr-only` *"Connexion en cours…"*). |
| Lien expiré ou déjà utilisé | Redirection vers `/espace-deposant` avec un message d'erreur affiché **dans la même zone `aria-live`** que le formulaire (§1.4), au chargement de la page : *"Ce lien n'est plus valide, veuillez en redemander un."* — rendu identique au bloc erreur serveur (`bg-cgws-danger/10 border-cgws-danger text-cgws-danger`), mais déclenché par un paramètre de requête (ex. `?error=expired_link`) lu au montage de `index.vue`, **pas** par une erreur de soumission. Le focus est posé sur ce message au montage (`messageRef.value?.focus()`), pour qu'un lecteur d'écran l'annonce immédiatement même si l'utilisateur arrive directement sur la page sans interaction. |

### 2.2 Protection de `/espace-deposant/suivi` — `app/middleware/depositor.ts`

Mirror exact du pattern vérifié dans `app/middleware/admin.ts` (lu intégralement pour cette spec) :

```
Si rendu serveur (import.meta.server) → ne rien faire, la validation de session est déférée au client
Sinon (client) → lire la session Supabase active
  Si absente → navigateTo('/espace-deposant')
```

**Implication UX importante à documenter (déjà présente et acceptée pour l'admin, reconduite ici)** : comme la vérification de session n'a lieu que côté client, la page `/suivi` peut être brièvement server-rendue dans son état "chargement" avant que le middleware ne redirige un visiteur non authentifié. Pour éviter tout **flash de contenu protégé** :
- La page `/suivi.vue` ne doit **jamais** rendre la liste de consignations avant confirmation explicite de session ET récupération réussie des données — l'état par défaut au montage est un **état de chargement (skeleton)**, jamais un tableau vide ou un contenu placeholder qui pourrait laisser croire à une fuite de données.
- Le middleware s'exécute avant le rendu du composant de page (comportement standard Nuxt route middleware) — la redirection intervient donc avant que l'utilisateur non connecté ne voie quoi que ce soit d'autre que la coquille de layout (fond `bg-cgws-ground`), pas les cartes de consignation elles-mêmes. Le risque de "flash" concerne le temps de la vérification de session (généralement quelques dizaines de ms), pas une exposition de données réelles.

### 2.3 Déconnexion

Bouton "Se déconnecter" (`CgwsButton variant="ghost"`) dans l'en-tête de `/suivi` (§3.1) → `supabase.auth.signOut()` → `navigateTo('/espace-deposant')`. Aucune confirmation modale nécessaire (action non destructive, réversible en redemandant un lien).

---

## 3. Écran 2 — `/espace-deposant/suivi` (liste lecture seule, protégée)

### 3.1 En-tête

```
┌──────────────────────────────────────────────────────────────────┐
│  bg-cgws-ground · py-8 md:py-10                                   │
│  max-w-[1000px] mx-auto px-[clamp(1rem,4vw,2rem)]                 │
│                                                                    │
│  MES CONSIGNATIONS                    [ Se déconnecter ]          │
│  (H1, font-heading, Rye, 32px)          CgwsButton ghost           │
│                                                                    │
│  Bonjour — voici l'état de votre dépôt chez CGWS.                 │
│  (font-sans text-cgws-ink-soft, 15px)                              │
└──────────────────────────────────────────────────────────────────┘
```

**Titre Rye confirmé** : "Mes consignations" = 2 mots → `font-heading`. La salutation ("Bonjour — voici l'état de votre dépôt chez CGWS.") est un texte courant, `font-sans`, **jamais** le H1 lui-même — évite tout risque de dépasser la limite de mots si le texte évolue (ex. personnalisation future avec le nom du déposant).

> Décision : **pas d'email affiché en clair dans le H1 ou la salutation** (ex. pas de "Bonjour marie@example.com"). L'email du déposant est déjà connu de lui (il vient de le saisir), l'afficher ne apporte pas d'information utile et présente un risque cosmétique mineur de capture d'écran/partage involontaire. Simple salutation générique.

```html
<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8 md:mb-10">
  <div>
    <h1 class="font-heading text-cgws-heading uppercase tracking-wide text-[28px] md:text-[32px] leading-none mb-2">
      Mes consignations
    </h1>
    <p class="font-sans text-cgws-ink-soft text-[15px]">
      Voici l'état de votre dépôt chez CGWS.
    </p>
  </div>
  <CgwsButton variant="ghost" size="sm" @click="handleLogout">
    <UIcon name="i-lucide-log-out" class="w-4 h-4 mr-1.5" aria-hidden="true" />
    Se déconnecter
  </CgwsButton>
</div>
```

### 3.2 Carte de consignation — `ConsignmentTrackingCard.vue` (nouveau)

**Décision de conception — esthétique TagCard/certificat, sans aucune action.** La carte reprend le langage visuel du `TagCard`/"Certificat élégant" (bordure structurelle, bloc à couture pointillée, badge statut, prix en `font-display`) car c'est la grammaire visuelle "documentaire" du site pour présenter un article — cohérente avec ce que le déposant a déjà vu sur `/consignation`. Différences volontaires par rapport à `TagCard` :
- **Pas d'image produit obligatoire** (une consignation n'a pas toujours de photo principale exploitable de la même façon qu'un produit catalogué) → un bandeau d'en-tête textuel remplace la zone image, pas de `aspect-[4/3]`.
- **Aucun élément cliquable/hover d'action** : pas de `cursor-pointer`, pas de `hover:-translate-y-1`, pas de `role="article"` avec `tabindex="0"` déclenchant un clic — la carte n'émet aucun événement. Seuls les éléments naturellement focusables (aucun ici, tout est statique) le seraient. `role="group"` (pas `"article"` au sens interactif) avec un `aria-label` récapitulatif.
- **Pas de perforation ni de couture décorative surchargée** : une seule bordure `edge` + un bloc interne à bordure `hairline` (pas `accent-deco` pointillé) — la couture pointillée `accent-deco` de `TagCard` signale un article **en vente active**, cette carte est un **relevé de statut**, un registre plus sobre est préférable pour ne pas laisser croire à une action possible (achat, clic).

#### Layout (ASCII, ~360px de large en mobile / dans une grille 2 colonnes en desktop)

```
┌──────────────────────────────────────────────┐  ← bg-cgws-surface border border-cgws-edge rounded-[6px] p-5
│  [Badge statut]                    12/06/2026 │  ← CgwsBadge + date dépôt, text-cgws-ink-soft text-xs
│                                                │
│  Selle Bob Lee Trail 15" western               │  ← font-serif font-semibold text-cgws-ink text-lg
│  Bob Lee · Bon état                            │  ← font-sans text-cgws-ink-soft text-sm
│                                                │
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │  ← hairline
│                                                │
│  Prix demandé              480,00 €            │  ← dt/dd, font-display tabular-nums
│  Prix accordé              450,00 €            │  ← si agreedPrice défini
│                                                │
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │  ← uniquement si status === 'sold'
│                                                │
│  Prix de vente              430,00 €           │  ← font-display, text-cgws-ink
│  Montant à vous reverser    344,00 €           │  ← font-display text-2xl text-cgws-accent (mise en avant)
│                                                │
└──────────────────────────────────────────────┘
```

#### Props

```ts
// Sous-ensemble exposé par server/api/depositor/consignments.get.ts — voir §6
interface DepositorConsignmentView {
  id: string
  itemDescription: string
  brand: string
  condition: ProductCondition
  status: ConsignmentStatus
  askingPrice: number
  agreedPrice?: number
  salePrice?: number        // uniquement si status === 'sold'
  depositorAmount?: number  // montant net à reverser, uniquement si status === 'sold' — voir §3.3
  createdAt: string
}

interface Props {
  consignment: DepositorConsignmentView
}
```

#### Structure HTML

```html
<div
  role="group"
  :aria-label="`Consignation : ${consignment.itemDescription}, statut ${CONSIGNMENT_STATUS_LABELS[consignment.status]}`"
  class="bg-cgws-surface border border-cgws-edge rounded-[6px] p-5 flex flex-col gap-3"
>
  <!-- En-tête : badge + date -->
  <div class="flex items-start justify-between gap-3">
    <CgwsBadge :variant="STATUS_BADGE_VARIANT[consignment.status]" :label="CONSIGNMENT_STATUS_LABELS[consignment.status]" />
    <span class="font-sans text-xs text-cgws-ink-soft whitespace-nowrap mt-0.5">
      Déposée le {{ formatDate(consignment.createdAt) }}
    </span>
  </div>

  <!-- Article -->
  <div>
    <h2 class="font-serif font-semibold text-cgws-ink text-lg leading-snug">
      {{ consignment.itemDescription }}
    </h2>
    <p class="font-sans text-cgws-ink-soft text-sm mt-0.5">
      {{ consignment.brand }} · {{ CONDITION_LABELS[consignment.condition] }}
    </p>
  </div>

  <hr class="border-t border-cgws-hairline my-1">

  <!-- Prix -->
  <dl class="flex flex-col gap-1.5">
    <div class="flex items-center justify-between">
      <dt class="font-sans text-sm text-cgws-ink-soft">Prix demandé</dt>
      <dd class="font-display tabular-nums text-cgws-ink text-base">{{ formatPrice(consignment.askingPrice) }}</dd>
    </div>
    <div v-if="consignment.agreedPrice" class="flex items-center justify-between">
      <dt class="font-sans text-sm text-cgws-ink-soft">Prix accordé</dt>
      <dd class="font-display tabular-nums text-cgws-ink text-base">{{ formatPrice(consignment.agreedPrice) }}</dd>
    </div>
  </dl>

  <!-- Bloc vente — uniquement si sold -->
  <template v-if="consignment.status === 'sold'">
    <hr class="border-t border-cgws-hairline my-1">
    <dl class="flex flex-col gap-1.5">
      <div class="flex items-center justify-between">
        <dt class="font-sans text-sm text-cgws-ink-soft">Prix de vente</dt>
        <dd class="font-display tabular-nums text-cgws-ink text-base">{{ formatPrice(consignment.salePrice!) }}</dd>
      </div>
      <div class="flex items-center justify-between pt-1">
        <dt class="font-sans text-sm font-semibold text-cgws-ink">Montant à vous reverser</dt>
        <dd class="font-display tabular-nums text-cgws-accent text-2xl">{{ formatPrice(consignment.depositorAmount!) }}</dd>
      </div>
    </dl>
  </template>
</div>
```

`STATUS_BADGE_VARIANT` — mapping statut consignation → variant `CgwsBadge` (couleur), le **libellé** étant systématiquement fourni via la prop `label` (voir §3.4, extension nécessaire de `CgwsBadge`) plutôt que le libellé interne par défaut du composant, qui n'est pas toujours accordé au féminin pour "consignation"/"demande" :

```ts
const STATUS_BADGE_VARIANT: Record<ConsignmentStatus, BadgeVariant> = {
  pending:  'pending',   // neutre — surface-2/ink-soft, cf. §4.1 doc maître
  accepted: 'accepted',  // success pilule translucide
  rejected: 'rejected',  // danger plein (déjà existant)
  sold:     'sold',      // accent plein (déjà existant)
  returned: 'rejected',  // même traitement visuel que "rejected" (§4.1 doc maître : "différenciation par le libellé, pas par une nuance supplémentaire non testée")
}
```

### 3.3 Décision de conception — montant net et absence de ligne "commission"

**Contexte (décision tranchée par Nathan)** : quand `status === 'sold'`, le déposant doit voir le **prix de vente effectif** et le **montant net à lui reverser**. La ligne de commission séparée est explicitement qualifiée d'*optionnelle*.

**Décision retenue ici : ne pas afficher de ligne "Commission" séparée sur cette carte.** Justification :
1. L'objectif produit énoncé est la **transparence rassurante sur le montant net** — c'est la ligne qui compte pour le déposant ("combien vais-je recevoir"), pas le détail du calcul intermédiaire.
2. Afficher une ligne "Commission CGWS − X €" à côté du montant net (comme le fait l'admin en `US-040`, à raison, car Camille a besoin du détail de calcul pour son suivi comptable) ajoute une information *business* que le déposant n'a pas besoin de scruter ligne à ligne — le taux de commission (20 %) est déjà annoncé publiquement sur `/consignation` (poster "conditions"), donc aucune opacité n'est créée en ne le répétant pas ici.
3. Cela réduit le risque de confusion visuelle : deux montants en `font-display` de tailles proches ("prix de vente" et "commission") à côté d'un troisième ("montant net") peut donner une impression de tableau comptable, alors que l'écran déposant doit rester un **relevé de statut simple et rassurant**, pas un extrait de compte.
4. **Réversibilité explicitement documentée** : si `product-owner`/Camille souhaite finalement afficher la ligne commission (elle est qualifiée d'optionnelle et non tranchée définitivement), il suffit d'ajouter une troisième ligne `<dt>Commission CGWS<span class="text-xs">(20 %)</span></dt><dd class="text-cgws-danger">− {{ formatPrice(commission) }}</dd>` entre "Prix de vente" et "Montant à vous reverser", en reprenant le pattern déjà écrit dans `US-040` §"Variante sold". Ce n'est pas ajouté par défaut dans cette spec, mais la structure `<dl>` s'y prête sans refonte.

Le montant net (`depositorAmount`) est **calculé et fourni par le serveur** (`server/api/depositor/consignments.get.ts`), jamais recalculé côté client à partir d'un taux en dur — évite toute divergence si le taux de commission changeait ou si une vente avait une commission négociée différente de 20 % (le modèle `Sale.commissionAmount` existe déjà et peut différer du taux standard, cf. `app/types/index.ts`).

### 3.4 Extension requise — `CgwsBadge.vue` (prop `label` + variants `pending`/`accepted`)

`CgwsBadge` actuel (`app/components/ui/CgwsBadge.vue`, lu intégralement pour cette spec) expose les variants `'new' | 'occasion' | 'consignment' | 'sold' | 'rejected' | 'reserved'`, chacun avec un **libellé interne fixe** (pas de prop d'override) et **sans** variant dédié pour `pending`/`accepted` côté consignation (`'reserved'` existe mais porte le libellé produit "Réservé", pas "En attente" ; aucun variant `success` n'existe encore dans ce composant alors que `DESIGN_SYSTEM_v3.md` §4.1 prescrit la pilule `success/15` pour `accepted`).

**Deux extensions minimales requises**, cohérentes avec la façon dont `US-072` avait déjà étendu ce composant (ajout du variant `rejected`) :

```ts
// Nouveau : prop optionnelle d'override du libellé affiché ET de l'aria-label,
// nécessaire ici car les statuts consignation s'accordent au féminin
// ("Refusée", "Retournée", "Vendue", "En vente") alors que les libellés
// internes actuels du composant sont accordés pour un contexte produit
// ("Refusé", "Vendu"). Réutilise CONSIGNMENT_STATUS_LABELS (US-040) tel quel.
interface Props {
  variant: BadgeVariant
  label?: string   // NOUVEAU — si fourni, remplace labels[variant] pour le texte ET l'aria-label
}

// Nouveaux variants ajoutés à variantClasses (couleur uniquement, le libellé
// vient de la prop `label` pour l'usage consignation) :
const variantClasses: Record<BadgeVariant, string> = {
  // ...variants existants inchangés...
  pending:  'bg-cgws-surface-2 text-cgws-ink-soft border border-cgws-hairline', // identique à 'occasion'/'reserved' — statut neutre, cf. §4.1 doc maître
  accepted: 'bg-cgws-success/15 text-cgws-success border border-cgws-success/40', // pilule success, cf. §4.1 doc maître
}
```

`labels` (record interne par défaut) reste inchangé pour la rétrocompatibilité des usages existants (`TagCard`, admin) qui n'utilisent pas la nouvelle prop. Sur `ConsignmentTrackingCard`, l'appel devient systématiquement :

```html
<CgwsBadge :variant="STATUS_BADGE_VARIANT[status]" :label="CONSIGNMENT_STATUS_LABELS[status]" />
```

**Contraste** : `pending` reprend une paire déjà mesurée (`ink-soft` sur `surface-2`, §2.6 doc maître, 6.34:1/6.13:1/4.94:1 selon rendu). `accepted` reprend la paire `success/15` déjà mesurée à l'usage réel pilule (§2.6, 5.38:1 à 6.38:1 selon rendu/fond). Aucune nouvelle valeur de couleur n'est introduite — uniquement une réutilisation de rôles déjà validés.

### 3.5 États de l'écran

| État | Rendu |
|---|---|
| **Loading** | Grille de 2 à 3 cartes squelettes : `bg-cgws-surface-2 animate-pulse rounded-[6px]` reproduisant la structure (badge, titre, lignes de prix) en blocs gris, hauteur ≈ celle d'une carte réelle. Pas de spinner isolé — le skeleton communique déjà "en cours de chargement" sans texte additionnel nécessaire (`aria-busy="true"` sur le conteneur de grille). |
| **Peuplé** | Grille de `ConsignmentTrackingCard`, cf. §3.6 pour les breakpoints. |
| **Vide** (email connu, aucune consignation retournée) | Bloc centré, cohérent avec les autres états vides du site (`i-lucide-inbox`, cf. `US-040`) : icône `text-cgws-ink-soft/40`, texte *"Aucune consignation trouvée pour cette adresse. Contactez CGWS si vous pensez qu'il s'agit d'une erreur."* — lien `mailto:`/`tel:` vers le contact CGWS en dessous (réutilise les coordonnées de `/contact`, `US-021`). |
| **Erreur de chargement** (échec réseau/serveur sur `server/api/depositor/consignments.get.ts`) | Bloc `role="alert"` : *"Impossible de charger vos consignations pour le moment. Veuillez réessayer."* + bouton `CgwsButton variant="secondary" size="sm"` "Réessayer" qui relance le fetch. Distinct de l'état vide : celui-ci signale un échec technique, pas une absence de données. |

```html
<!-- État vide -->
<div class="flex flex-col items-center text-center py-16 px-4 max-w-md mx-auto">
  <UIcon name="i-lucide-inbox" class="w-10 h-10 text-cgws-ink-soft/40 mb-4" aria-hidden="true" />
  <p class="font-sans text-cgws-ink-soft text-sm leading-relaxed">
    Aucune consignation trouvée pour cette adresse.
    Contactez CGWS si vous pensez qu'il s'agit d'une erreur.
  </p>
  <NuxtLink to="/contact" class="mt-4 font-sans text-sm text-cgws-accent hover:underline">
    Nous contacter
  </NuxtLink>
</div>

<!-- État erreur -->
<div role="alert" class="flex flex-col items-center text-center py-12 px-4 max-w-md mx-auto
                          bg-cgws-danger/10 border border-cgws-danger rounded-sm">
  <UIcon name="i-lucide-alert-triangle" class="w-8 h-8 text-cgws-danger mb-3" aria-hidden="true" />
  <p class="font-sans text-cgws-danger text-sm mb-4">
    Impossible de charger vos consignations pour le moment. Veuillez réessayer.
  </p>
  <CgwsButton variant="secondary" size="sm" @click="retryFetch">Réessayer</CgwsButton>
</div>
```

### 3.6 Breakpoints (grille de cartes)

- **Mobile 375px** : cartes empilées, 1 colonne, `flex flex-col gap-4`.
- **Tablet 768px** : grille `sm:grid-cols-2 gap-5`.
- **Desktop 1440px** : grille `lg:grid-cols-2 gap-6`, `max-w-[1000px] mx-auto` — volontairement **2 colonnes maximum**, pas 3-4 comme `TagCard`/catalogue : un déposant a rarement plus de 2-3 consignations simultanées, une grille dense type catalogue serait disproportionnée et donnerait une impression de "boutique" plutôt que de "relevé personnel".

```
Mobile 375px          Tablet/Desktop 768px+
┌────────────┐        ┌──────────┐ ┌──────────┐
│  Carte 1   │        │ Carte 1  │ │ Carte 2  │
├────────────┤        └──────────┘ └──────────┘
│  Carte 2   │        ┌──────────┐
└────────────┘        │ Carte 3  │
                       └──────────┘
```

---

## 4. Sécurité — rappel pour le développeur (contrainte, pas une option de design)

`ConsignmentTrackingCard.vue` et `suivi.vue` ne doivent **jamais** interroger `consignments` directement via `useSupabase()` côté client — même authentifié en OTP, le déposant obtient le rôle `authenticated`, qui a accès à **toutes** les consignations via la policy RLS actuelle (`consignments_select_admin`, cf. Sprint Plan §US-066). Toute donnée affichée sur `/suivi` provient exclusivement de :

```
GET /api/depositor/consignments  →  server/api/depositor/consignments.get.ts
```

qui (1) vérifie le JWT via `supabase.auth.getUser(token)`, (2) interroge `consignments` **côté serveur** via `getAdminSupabase()` (service role, bypass RLS) filtré strictement par `depositor_email` (comparaison exacte insensible à la casse), (3) ne retourne **jamais** `notes`, ni de champ de commission brut, ni les données d'un autre déposant. Ce point est un rappel de contrainte serveur déjà détaillé dans le Sprint Plan — il conditionne directement ce que `ConsignmentTrackingCard` peut afficher (aucune prop `notes` n'existe dans `DepositorConsignmentView`, §3.2, précisément pour rendre l'oubli impossible côté composant : **la donnée n'est structurellement pas là**, pas seulement cachée par le template).

---

## 5. Composants — récapitulatif nouveaux vs existants

| Composant | Statut | Note |
|---|---|---|
| `CgwsInput` | Existant, réutilisé tel quel | Champ email écran 1 |
| `CgwsButton` | Existant, réutilisé tel quel (`primary`, `ghost`, `secondary`) | CTA formulaire, déconnexion, réessai |
| `CgwsBadge` | **Extension requise** | Prop `label` + variants `pending`/`accepted`, cf. §3.4 |
| `StarDivider` | Existant, non utilisé sur ces 2 écrans | Pas de diviseur de section nécessaire — pages courtes à une seule section principale chacune |
| `ConsignmentTrackingCard` | **Nouveau** | `app/components/consignation/ConsignmentTrackingCard.vue`, cf. §3.2 |
| `useDepositorAuth` | **Nouveau composable** | Mirror de `useAdminAuth.ts`, expose `email`, `isSubmitting`, `isSuccess`, `authError`, `requestMagicLink(email)`, `logout()` — pas de `login(email, password)` (aucun mot de passe) |
| `app/middleware/depositor.ts` | **Nouveau** | Mirror de `app/middleware/admin.ts`, cf. §2.2 |

---

## 6. Accessibilité — récapitulatif transversal

- **Formulaire écran 1** : `aria-label` sur le `<form>`, `CgwsInput` gère nativement `aria-required`/`aria-invalid`/`aria-describedby` (cf. `US-072` §6.1). Zone de message `aria-live="polite" aria-atomic="true"`, focus programmatique sur cette zone après soumission réussie et après affichage d'un message "lien invalide" au chargement (§1.6, §2.1).
- **Le badge de statut n'est jamais le seul véhicule d'information** : le libellé texte (`CONSIGNMENT_STATUS_LABELS`) est toujours rendu dans le badge lui-même (pas seulement une couleur), et la date de dépôt/les prix accompagnent le statut en texte brut à proximité — un utilisateur en niveaux de gris ou avec `prefers-contrast` perçoit l'information complète.
- **Navigation clavier** : écran 1 — email → bouton submit → lien "Découvrir nos conditions" ; écran 2 — bouton déconnexion → (grille de cartes, aucun élément interactif à l'intérieur puisque lecture seule, donc pas de piège de focus ni d'ordre de tabulation complexe) → lien "Nous contacter" (état vide) / bouton "Réessayer" (état erreur).
- **Pas de flash de contenu protégé** : cf. §2.2 — état de chargement/skeleton systématique avant tout rendu de données réelles sur `/suivi`.
- **Contrastes** :
  - `ink`/`ink-soft` sur `ground`/`surface` : ≥6:1 dans les 3 rendus (doc maître §2.6, larges marges).
  - `accent` (montant net, liens) sur `ground`/`surface` : ≥5.6:1 dans les 3 rendus (doc maître §2.6).
  - `success/15` + `text-success` (badge `accepted`, message succès formulaire) : ≥4.89:1 sur `surface`/15 dans les 3 rendus (doc maître §2.6 — **à revérifier précisément sur `bg-cgws-surface` utilisé ici pour le message succès de l'écran 1**, la mesure de référence porte sur `ground`/`surface` génériques, cohérent avec la carte formulaire qui est elle-même en `surface`).
  - `danger`/`on-danger` (badges `rejected`/`returned`, messages d'erreur) : ≥4.72:1 sur `surface` dans les 3 rendus (doc maître §2.6).
  - `ink-soft` sur `surface-2` (badge `pending`) : ≥4.94:1 dans les 3 rendus (doc maître §2.6, mesure déjà validée pour le badge "en attente/réservé").
- **`prefers-reduced-motion`** : aucune animation GSAP indispensable sur ces deux écrans (pas de scroll-reveal — pages courtes, contenu utilitaire visible immédiatement). Si une entrée en fondu légère est ajoutée en implémentation (ex. apparition des cartes), elle doit suivre le garde-fou standard déjà en place ailleurs (`window.matchMedia('(prefers-reduced-motion: reduce)')`).

---

## 7. Vérification dans les 3 rendus — points d'attention

| Élément | Point de vigilance |
|---|---|
| Carte formulaire (écran 1) | `bg-cgws-surface` doit rester visuellement distincte de `bg-cgws-ground` dans les 3 rendus (contraste de repère visuel, pas une mesure de texte) — en Rugueux notamment, `surface` (`#2C1F15`) sur `ground` (`#1E140D`) reste un ton plus clair mais proche, à confirmer visuellement. |
| Badge `pending` | Vérifier que `surface-2`/`hairline` restent perceptibles comme "neutre/en attente" dans les 3 rendus, cohérent avec le même badge déjà utilisé en admin (`US-075`). |
| Badge `accepted` | Pilule `success/15` — vérifier absence de confusion avec le badge `sold` (`accent` plein) dans les 3 rendus, deux couleurs sémantiquement différentes (positif en cours vs. transaction terminée) qui doivent rester visuellement distinctes. |
| Montant net (`accent`, `text-2xl`) | Doit rester l'élément le plus visuellement saillant de la carte "vendue" (hiérarchie : prix demandé/accordé en `ink` neutre, montant net en `accent` + taille supérieure) dans les 3 rendus — vérifier que ce contraste hiérarchique (couleur + taille) reste net y compris en Rugueux où `accent` (laiton) peut être visuellement proche d'`ink`/`heading` sur certains fonds. |
| Message succès formulaire (`success/15`) | À vérifier particulièrement en Élégante Nuit où `accent-deco`/`heading` sont des tons rose proches — s'assurer que le vert sauge de `success` reste clairement différencié de la palette rose ambiante de la peau, pas seulement en contraste texte mais en distinction de teinte perçue. |
| Arche fine décorative (écran 1) | `accent-deco` — vérifier lisibilité décorative sur fond `ground` clair (Élégante Jour, où le trait rose clair sur fond crème peut manquer de présence) — ajuster l'opacité ou l'épaisseur du trait si jugé trop discret en implémentation, point esthétique non bloquant. |

**Cohérence bi-thème** : ces deux pages sont publiques et suivent le `ThemeSwitcher` exactement comme le reste du site (`US-071`) — aucun comportement de bascule dédié à spécifier ici, le mécanisme `data-skin`/`.dark` s'applique nativement via les rôles sémantiques utilisés dans tout ce document (`ground`, `surface`, `ink`, `accent`, `danger`, `success`…).

---

## 8. Critères d'acceptation Gherkin (UX)

```gherkin
Fonctionnalité : Espace déposant — suivi de consignation par magic link

  Scénario : Formulaire de demande de lien
    Étant donné que je visite "/espace-deposant"
    Alors un unique champ "Adresse email" et un bouton
      "Recevoir mon lien de connexion" sont visibles
    Et le titre de la page utilise "font-heading" (Rye, "Espace déposant", 2 mots)

  Scénario : Message neutre identique quelle que soit l'existence de l'email
    Étant donné que je saisis un email au format valide
    Quand je soumets le formulaire
    Alors le message affiché est exactement :
      "Si cette adresse est associée à une consignation, un lien de
       connexion vient de vous être envoyé. Vérifiez votre boîte de
       réception (et vos spams)."
    Et ce message est strictement identique que l'adresse corresponde
      ou non à un déposant connu
    Et la zone de message porte "aria-live=polite" et reçoit le focus
      après affichage

  Scénario : Erreur de format bloque l'envoi avant toute requête
    Étant donné que je saisis un texte qui n'est pas un email valide
    Quand je soumets le formulaire
    Alors un message d'erreur de validation s'affiche sous le champ
      ("border-cgws-danger", "text-cgws-danger")
    Et aucune tentative d'envoi de lien magique n'est déclenchée

  Scénario : Suivi lecture seule après connexion
    Étant donné que je suis authentifié(e) via un lien magique valide
    Quand j'accède à "/espace-deposant/suivi"
    Alors je vois une carte par consignation m'appartenant
    Et chaque carte affiche : statut (libellé + couleur), article,
      marque, état, prix demandé, prix accordé (si applicable),
      date de dépôt
    Et aucun bouton d'action (modification, suppression, changement
      de statut) n'est présent sur ces cartes
    Et aucune note interne n'est jamais affichée

  Scénario : Montant net affiché si la consignation est vendue
    Étant donné qu'une consignation a le statut "sold"
    Alors la carte affiche le prix de vente effectif
    Et la carte affiche "Montant à vous reverser" avec le montant net
      calculé côté serveur, mis en évidence ("text-cgws-accent",
      taille supérieure aux autres montants de la carte)

  Scénario : État vide
    Étant donné que mon email est connu mais qu'aucune consignation
      ne lui est associée
    Quand j'accède à "/espace-deposant/suivi"
    Alors le message "Aucune consignation trouvée pour cette adresse.
      Contactez CGWS si vous pensez qu'il s'agit d'une erreur."
      s'affiche avec un lien vers le contact

  Scénario : Protection de la page de suivi
    Étant donné que je ne suis pas authentifié(e)
    Quand je tente d'accéder directement à "/espace-deposant/suivi"
    Alors je suis redirigé(e) vers "/espace-deposant"
    Et aucune carte de consignation n'est jamais rendue avant cette
      redirection (pas de flash de contenu protégé)

  Scénario : Lien expiré ou déjà utilisé
    Étant donné que je clique sur un lien magique expiré ou déjà utilisé
    Alors je suis redirigé(e) vers "/espace-deposant"
    Et le message "Ce lien n'est plus valide, veuillez en redemander
      un." s'affiche et reçoit le focus au chargement

  Scénario : Déconnexion
    Étant donné que je suis connecté(e) sur "/espace-deposant/suivi"
    Quand je clique sur "Se déconnecter"
    Alors ma session est détruite et je suis redirigé(e) vers
      "/espace-deposant"

  Scénario : Toute donnée provient de la route serveur dédiée
    Alors aucune requête client directe vers la table "consignments"
      n'est présente dans "suivi.vue" ou "ConsignmentTrackingCard.vue"
    Et toutes les données affichées transitent exclusivement par
      "GET /api/depositor/consignments"

  Plan du scénario : Responsive
    Étant donné que j'affiche "/espace-deposant/suivi" à la largeur <largeur>
    Alors la grille de cartes affiche <colonnes>

    Exemples :
      | largeur | colonnes    |
      | 375px   | 1 colonne   |
      | 768px   | 2 colonnes  |
      | 1440px  | 2 colonnes  |

  Scénario : Rendu correct dans les 3 peaux
    Quand j'active successivement "Élégante Jour", "Élégante Nuit" et "Rugueux"
      sur "/espace-deposant" et "/espace-deposant/suivi"
    Alors les couleurs de rôle (ground/surface/ink/accent/danger/success)
      restent cohérentes avec la peau active
    Et le badge "accepted" (success) reste visuellement distinct du
      badge "sold" (accent) dans les 3 rendus
```
