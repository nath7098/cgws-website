<script setup lang="ts">
import CgwsBadge from '~/components/ui/CgwsBadge.vue'
import CgwsButton from '~/components/ui/CgwsButton.vue'
import CgwsCard from '~/components/ui/CgwsCard.vue'
import CgwsInput from '~/components/ui/CgwsInput.vue'
import CgwsTextarea from '~/components/ui/CgwsTextarea.vue'
import CgwsSelect from '~/components/ui/CgwsSelect.vue'
import ConchoStat from '~/components/ui/ConchoStat.vue'
import TagCard from '~/components/ui/TagCard.vue'
import type { Product } from '~/types'
import type { SelectOption } from '~/components/ui/CgwsSelect.vue'

if (process.env.NODE_ENV === 'production') {
  throw createError({ statusCode: 404, message: 'Not Found' })
}

useSeoMeta({
  title: 'Design System — CGWS',
  description: 'Composants UI et tokens du design system CGWS v2',
  robots: 'noindex',
})

const inputValue = ref('')

const demoProducts: Product[] = [
  {
    id: 'demo-1',
    slug: 'selle-western-prestige',
    title: 'Selle western Prestige',
    description: 'Selle artisanale en cuir pleine fleur.',
    price: 850,
    category: 'selles',
    brand: 'Prestige',
    condition: 'excellent',
    isConsignment: true,
    status: 'active',
    images: [],
    stock: 1,
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'demo-2',
    slug: 'selle-billy-cook',
    title: 'Selle Billy Cook Occasion',
    description: 'Très bon état, cuir souple et entretenu.',
    price: 650,
    category: 'selles',
    brand: 'Billy Cook',
    condition: 'good',
    isConsignment: false,
    status: 'active',
    images: [],
    stock: 1,
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'demo-3',
    slug: 'selle-circle-y-vendue',
    title: 'Selle Circle Y Trail',
    description: 'Selle vendue.',
    price: 500,
    category: 'selles',
    brand: 'Circle Y',
    condition: 'fair',
    isConsignment: false,
    status: 'sold',
    images: [],
    stock: 0,
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'demo-4',
    slug: 'botte-western-neuve',
    title: 'Bottes western Ariat Neuves',
    description: 'Bottes cuir pleine fleur, taille 42.',
    price: 280,
    category: 'bottes-chaussures',
    brand: 'Ariat',
    size: '42',
    condition: 'new',
    isConsignment: false,
    status: 'active',
    images: [],
    stock: 2,
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
  },
]

const textareaValue = ref('')
const selectValue = ref('')
const selectOptions: SelectOption[] = [
  { value: 'excellent', label: 'Excellent état' },
  { value: 'good', label: 'Bon état' },
  { value: 'fair', label: 'État correct' },
]

const colors: Record<string, string> = {
  'cgws-tack': '#3D1A06',
  'cgws-leather': '#7B3B1C',
  'cgws-copper': '#B8650A',
  'cgws-rope': '#C8AB82',
  'cgws-parchment': '#F0DDB8',
  'cgws-cream': '#FAF3E3',
  'cgws-denim': '#2C4A72',
  'cgws-rust': '#943218',
  'cgws-charcoal': '#1A0B03',
}
</script>

<template>
  <div class="mx-auto max-w-[1280px] px-[var(--container-px)] py-12 space-y-16">
    <!-- Page header -->
    <div>
      <p class="font-eyebrow text-xs text-cgws-leather uppercase tracking-widest mb-2">
        Sellerie de Brèches
      </p>
      <h1 class="font-display text-5xl text-cgws-charcoal">
        CGWS — Design System v2
      </h1>
    </div>

    <!-- Concho divider component (reusable inline) -->

    <!-- Section: Couleurs -->
    <section aria-labelledby="section-colors">
      <h2
        id="section-colors"
        class="font-eyebrow text-xs text-cgws-leather uppercase tracking-widest mb-6"
      >
        Couleurs
      </h2>
      <div class="grid grid-cols-3 gap-4 sm:grid-cols-5 md:grid-cols-9">
        <div
          v-for="(hex, name) in colors"
          :key="name"
          class="flex flex-col gap-1"
        >
          <div
            class="h-16 rounded border border-cgws-leather/20"
            :style="{ backgroundColor: hex }"
          />
          <span class="text-xs font-sans text-cgws-charcoal break-all">{{ name }}</span>
          <span class="text-xs font-mono text-cgws-rope">{{ hex }}</span>
        </div>
      </div>
    </section>

    <!-- Section: Typographie -->
    <section aria-labelledby="section-typo">
      <h2
        id="section-typo"
        class="font-eyebrow text-xs text-cgws-leather uppercase tracking-widest mb-6"
      >
        Typographie
      </h2>
      <div class="space-y-3">
        <p class="font-display text-5xl text-cgws-charcoal">Bebas Neue — Hero H1, Prix</p>
        <p class="font-eyebrow text-lg text-cgws-leather">Rye — Eyebrow label section</p>
        <p class="font-serif text-3xl font-semibold text-cgws-charcoal">Playfair Display — Titre section</p>
        <p class="font-serif italic text-xl text-cgws-leather">Playfair Display Italic — Tagline, citation</p>
        <p class="font-sans text-base text-cgws-charcoal">Inter 400 — Corps de texte principal</p>
        <p class="font-sans font-semibold text-base text-cgws-charcoal">Inter 600 — Labels CTA, emphasis</p>
      </div>
    </section>

    <!-- Section: Boutons -->
    <section aria-labelledby="section-buttons">
      <h2
        id="section-buttons"
        class="font-eyebrow text-xs text-cgws-leather uppercase tracking-widest mb-6"
      >
        Boutons
      </h2>
      <div class="flex flex-wrap gap-4 items-center">
        <CgwsButton variant="primary">Découvrir le catalogue</CgwsButton>
        <CgwsButton variant="primary" size="sm">Primary sm</CgwsButton>
        <CgwsButton variant="secondary">Service consignation</CgwsButton>
        <CgwsButton variant="secondary" size="sm">Secondary sm</CgwsButton>
        <CgwsButton variant="ghost">En savoir plus</CgwsButton>
        <CgwsButton variant="primary" loading>Chargement...</CgwsButton>
        <CgwsButton variant="primary" disabled>Désactivé</CgwsButton>
        <CgwsButton variant="secondary" disabled>Désactivé</CgwsButton>
      </div>
    </section>

    <!-- Section: Badges -->
    <section aria-labelledby="section-badges">
      <h2
        id="section-badges"
        class="font-eyebrow text-xs text-cgws-leather uppercase tracking-widest mb-6"
      >
        Badges
      </h2>
      <div class="flex flex-wrap gap-3">
        <CgwsBadge variant="new" />
        <CgwsBadge variant="occasion" />
        <CgwsBadge variant="consignment" />
        <CgwsBadge variant="sold" />
      </div>
    </section>

    <!-- Section: Inputs -->
    <section aria-labelledby="section-inputs">
      <h2
        id="section-inputs"
        class="font-eyebrow text-xs text-cgws-leather uppercase tracking-widest mb-6"
      >
        Inputs
      </h2>
      <div class="max-w-sm space-y-4">
        <CgwsInput
          v-model="inputValue"
          label="Votre nom"
          placeholder="ex: Jean Dupont"
        />
        <CgwsInput
          label="Email (avec hint)"
          placeholder="ex: jean@example.fr"
          type="email"
          hint="Nous ne partagerons jamais votre email."
        />
        <CgwsInput
          label="Champ requis"
          placeholder="Obligatoire"
          required
          error="Ce champ est obligatoire"
        />
        <CgwsInput
          label="Champ désactivé"
          placeholder="Non modifiable"
          disabled
          model-value="Valeur fixe"
        />
      </div>
    </section>

    <!-- Section: CgwsTextarea -->
    <section aria-labelledby="section-textarea">
      <h2
        id="section-textarea"
        class="font-eyebrow text-xs text-cgws-leather uppercase tracking-widest mb-6"
      >
        Textarea
      </h2>
      <div class="max-w-sm space-y-4">
        <CgwsTextarea
          v-model="textareaValue"
          label="Description de l'article"
          placeholder="Marque, taille, état général…"
          :rows="4"
        />
        <CgwsTextarea
          label="Requis avec erreur"
          placeholder="Champ requis"
          required
          error="Décrivez l'article en au moins 20 caractères"
        />
        <CgwsTextarea
          label="Désactivé"
          model-value="Valeur non modifiable"
          disabled
        />
      </div>
    </section>

    <!-- Section: CgwsSelect -->
    <section aria-labelledby="section-select">
      <h2
        id="section-select"
        class="font-eyebrow text-xs text-cgws-leather uppercase tracking-widest mb-6"
      >
        Select
      </h2>
      <div class="max-w-sm space-y-4">
        <CgwsSelect
          v-model="selectValue"
          label="État de l'article"
          :options="selectOptions"
          required
        />
        <CgwsSelect
          label="Avec erreur"
          :options="selectOptions"
          required
          error="Veuillez indiquer l'état de l'article"
        />
        <CgwsSelect
          label="Désactivé"
          :options="selectOptions"
          model-value="good"
          disabled
        />
      </div>
    </section>

    <!-- Section: CgwsCard -->
    <section aria-labelledby="section-cards">
      <h2
        id="section-cards"
        class="font-eyebrow text-xs text-cgws-leather uppercase tracking-widest mb-6"
      >
        Card générique
      </h2>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-2xl">
        <CgwsCard>
          <p class="font-sans text-sm text-cgws-charcoal">Card sans titre — slot par défaut.</p>
        </CgwsCard>
        <CgwsCard title="À propos de CGWS">
          <p class="font-sans text-sm text-cgws-charcoal">
            Boutique d'équipements western à Brèches, Indre-et-Loire. Sellerie artisanale depuis 2015.
          </p>
        </CgwsCard>
        <CgwsCard title="Padding sm" padding="sm">
          <p class="font-sans text-sm text-cgws-charcoal">Variant padding compact.</p>
        </CgwsCard>
      </div>
    </section>

    <!-- Section: TagCards -->
    <section aria-labelledby="section-tagcards">
      <h2
        id="section-tagcards"
        class="font-eyebrow text-xs text-cgws-leather uppercase tracking-widest mb-6"
      >
        TagCard — Produits
      </h2>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-4xl">
        <TagCard
          v-for="product in demoProducts"
          :key="product.id"
          :product="product"
        />
      </div>
    </section>

    <!-- Section: ConchoStat -->
    <section aria-labelledby="section-concho">
      <h2
        id="section-concho"
        class="font-eyebrow text-xs text-cgws-leather uppercase tracking-widest mb-6"
      >
        ConchoStat
      </h2>
      <div class="flex flex-wrap gap-8">
        <ConchoStat value="250" suffix="+" label="Articles disponibles" :animate-on-visible="true" />
        <ConchoStat value="15" suffix="+" label="Marques western" :animate-on-visible="true" />
        <ConchoStat value="100" suffix="%" label="Passion équestre" :animate-on-visible="true" />
        <ConchoStat value="Brèches" label="Indre-et-Loire" />
      </div>
    </section>
  </div>
</template>
