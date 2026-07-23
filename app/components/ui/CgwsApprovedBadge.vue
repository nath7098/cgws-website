<script setup lang="ts">
// CgwsApprovedBadge — « Testé et approuvé par Camille » (US-110).
// Spec : docs/design-specs/US-110-badge-curation.md.
//
// Sceau de maître-sellier : disque `accent` + anneau poinçonné pointillé
// (`accent-deco`, décoratif) + note de juge reining « +1½ » (glyphe FIXE,
// identique sur tous les articles approuvés — un emblème, jamais une note
// variable par produit). Composant PUREMENT présentationnel et sans état :
// il ne reçoit pas le `Product`, ne lit aucun store, ne fait aucune requête.
// Le parent le monte conditionnellement (`v-if="product.camilleApproved"`) —
// le badge n'est JAMAIS rendu par défaut.
//
// Consommation des rôles de token v3 (theme-aware, skins public/admin) :
// tous les gestes de couleur passent par des rôles sémantiques
// (`accent`, `on-accent`, `ink`, `ink-soft`, `surface`, `accent-deco`) et
// jamais par un littéral cuir/cuivre — le badge se ré-habille donc dans
// Élégante Jour / Nuit et Rugueux. `accent-deco` reste décoratif (anneau,
// couture) ; tout texte porteur d'information utilise `accent`/`ink`/`on-accent`
// (règle de contraste US-072).

interface Props {
  /** Échelle contextuelle. Défaut 'md' (fiche produit). */
  size?: 'sm' | 'md' | 'lg'
  /** Affiche l'argumentaire de curation sous le lockup (non-sm uniquement). */
  withArgument?: boolean
  /** Override du micro-argumentaire. Défaut = placeholder « à valider par Camille ». */
  argument?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  withArgument: false,
  argument: undefined,
})

// Placeholder de curation (spec §8) — texte définitif = validation Camille.
// Tant que non surchargé via la prop `argument`, la mention « à valider par
// Camille » est affichée (même pattern que US-011/US-099).
const DEFAULT_ARGUMENT
  = 'Je l’ai monté et testé, en concours comme à l’entraînement. S’il est dans ma sélection, c’est qu’il tient ses promesses.'

const argumentText = computed(() => props.argument ?? DEFAULT_ARGUMENT)
const isPlaceholder = computed(() => props.argument === undefined)

// Argumentaire réservé à la fiche produit (jamais sur le sceau `sm` de carte).
const showArgument = computed(() => props.withArgument && props.size !== 'sm')

const showLockup = computed(() => props.size !== 'sm')

// ─── Classes pilotées par la taille ────────────────────────────────────────

const sealClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'size-8'
    case 'lg': return 'size-14 md:size-15'
    default: return 'size-11'
  }
})

const scoreClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'text-[13px]'
    case 'lg': return 'text-xl'
    default: return 'text-base'
  }
})

const rowClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'relative inline-flex'
    case 'lg': return 'inline-flex flex-col items-center text-center gap-2'
    default: return 'inline-flex items-center gap-3'
  }
})

// Rye (`font-heading`) réservé au `lg` (lisible seulement en grand corps,
// règle typo v3). En `sm`/`md`, l'eyebrow reste en `font-eyebrow` (Playfair).
const eyebrowClass = computed(() =>
  props.size === 'lg'
    ? 'font-heading text-sm normal-case tracking-wide text-cgws-accent'
    : 'font-eyebrow uppercase tracking-wider text-[11px] text-cgws-accent',
)

const parapheClass = computed(() =>
  props.size === 'lg'
    ? 'font-serif italic text-base text-cgws-ink'
    : 'font-serif italic text-sm text-cgws-ink',
)

// Encart signature (couture pointillée) quand `withArgument` ; sinon le row
// EST la racine. Le sceau `sm` est non-interactif (`pointer-events-none`) pour
// ne pas gêner le clic vers la fiche depuis la carte parente (spec §4).
const rootClass = computed(() => {
  if (showArgument.value) {
    return 'inline-flex flex-col rounded-[6px] bg-cgws-surface p-4 border border-dashed border-cgws-accent-deco max-w-md'
  }
  return props.size === 'sm' ? 'inline-flex pointer-events-none' : 'inline-flex'
})
</script>

<template>
  <span
    role="img"
    aria-label="Sélection Camille — testé et approuvé"
    :class="rootClass"
  >
    <!-- Sceau + lockup (arrangement piloté par la taille) -->
    <span :class="rowClass" aria-hidden="true">
      <!-- Sceau frappé : disque accent + anneau poinçonné + note +1½ -->
      <span
        :class="[
          'relative inline-flex flex-shrink-0 items-center justify-center rounded-full bg-cgws-accent',
          sealClass,
        ]"
      >
        <!-- Anneau poinçonné pointillé — décoratif pur (accent-deco / on-accent) -->
        <span
          class="absolute inset-[3px] rounded-full border border-dashed border-cgws-on-accent/40"
        />
        <!-- Note de juge reining — glyphe fixe, ½ en U+00BD pour un alignement propre -->
        <span
          :class="[
            'relative z-10 font-display font-bold tabular-nums leading-none text-cgws-on-accent',
            scoreClass,
          ]"
        >+1½</span>
      </span>

      <!-- Lockup texte (md/lg) — visuel uniquement, le sens est porté par l'aria-label racine -->
      <span
        v-if="showLockup"
        :class="props.size === 'lg' ? 'flex flex-col items-center gap-0.5' : 'flex flex-col'"
      >
        <span :class="eyebrowClass">Testé &amp; approuvé</span>
        <span :class="parapheClass">par Camille</span>
      </span>
    </span>

    <!-- Argumentaire de curation (fiche produit, non-sm) -->
    <template v-if="showArgument">
      <!-- Filet séparateur pointillé — décoratif -->
      <span
        class="my-3 border-t border-dashed border-cgws-accent-deco/50"
        aria-hidden="true"
      />
      <span
        class="font-sans text-[13px] leading-relaxed text-cgws-ink-soft"
        aria-hidden="true"
      >{{ argumentText }}</span>
      <!-- Mention placeholder — retirée quand un argument validé est fourni -->
      <span
        v-if="isPlaceholder"
        class="mt-2 block font-sans text-[11px] italic text-cgws-ink-soft/70 text-right"
        aria-hidden="true"
      >— à valider par Camille</span>
    </template>
  </span>
</template>
