<script setup lang="ts">
import type { DepositorConsignmentView } from '~/types'

// US-066 · Écran 2 — liste lecture seule des consignations du déposant connecté.
// Protégée par le middleware `depositor`. TOUTES les données proviennent
// exclusivement de GET /api/depositor/consignments — aucune requête client directe
// sur la table `consignments` (cf. spec §4).

definePageMeta({ middleware: 'depositor' })

useSeoMeta({
  title: 'Mes dépôts-ventes — Espace déposant — CGWS',
  robots: 'noindex, nofollow',
})

const { logout } = useDepositorAuth()
const supabase = useSupabase()

type ViewState = 'loading' | 'loaded' | 'empty' | 'error'

const state = ref<ViewState>('loading')
const consignments = ref<DepositorConsignmentView[]>([])

async function fetchConsignments(): Promise<void> {
  state.value = 'loading'

  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) {
    // Session perdue entre-temps — le middleware protège déjà l'accès direct.
    await navigateTo('/espace-deposant')
    return
  }

  try {
    const data = await $fetch<{ consignments: DepositorConsignmentView[] }>(
      '/api/depositor/consignments',
      { headers: { Authorization: `Bearer ${token}` } },
    )
    consignments.value = data.consignments
    state.value = data.consignments.length > 0 ? 'loaded' : 'empty'
  }
  catch {
    state.value = 'error'
  }
}

async function handleLogout(): Promise<void> {
  await logout()
}

onMounted(fetchConsignments)
</script>

<template>
  <section class="bg-cgws-ground py-8 md:py-10 min-h-[60vh]">
    <div class="max-w-[1000px] mx-auto px-[clamp(1rem,4vw,2rem)]">
      <!-- En-tête -->
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8 md:mb-10">
        <div>
          <h1 class="font-heading text-cgws-heading uppercase tracking-wide text-[28px] md:text-[32px] leading-none mb-2">
            Mes dépôts-ventes
          </h1>
          <p class="font-sans text-cgws-ink-soft text-[15px]">
            Voici l'état de votre dépôt chez CGWS.
          </p>
        </div>
        <CgwsButton variant="ghost" size="sm" type="button" @click="handleLogout">
          <UIcon name="i-lucide-log-out" class="w-4 h-4 mr-1.5" aria-hidden="true" />
          Se déconnecter
        </CgwsButton>
      </div>

      <!-- Loading — skeleton -->
      <div
        v-if="state === 'loading'"
        aria-busy="true"
        class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6"
      >
        <p class="sr-only" aria-live="polite">Chargement de vos dépôts-ventes…</p>
        <div
          v-for="n in 2"
          :key="n"
          class="bg-cgws-surface-2 animate-pulse rounded-[6px] h-[220px]"
        />
      </div>

      <!-- Peuplé -->
      <div
        v-else-if="state === 'loaded'"
        class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6"
      >
        <ConsignmentTrackingCard
          v-for="item in consignments"
          :key="item.id"
          :consignment="item"
        />
      </div>

      <!-- Vide -->
      <div
        v-else-if="state === 'empty'"
        class="flex flex-col items-center text-center py-16 px-4 max-w-md mx-auto"
      >
        <UIcon
          name="i-lucide-inbox"
          class="w-10 h-10 text-cgws-ink-soft/40 mb-4"
          aria-hidden="true"
        />
        <p class="font-sans text-cgws-ink-soft text-sm leading-relaxed">
          Aucun dépôt-vente trouvé pour cette adresse.
          Contactez CGWS si vous pensez qu'il s'agit d'une erreur.
        </p>
        <NuxtLink
          to="/contact"
          class="mt-4 font-sans text-sm text-cgws-accent hover:underline focus-visible:ring-2 focus-visible:ring-cgws-accent rounded-sm"
        >
          Nous contacter
        </NuxtLink>
      </div>

      <!-- Erreur -->
      <div
        v-else
        role="alert"
        class="flex flex-col items-center text-center py-12 px-4 max-w-md mx-auto bg-cgws-danger/10 border border-cgws-danger rounded-sm"
      >
        <UIcon
          name="i-lucide-alert-triangle"
          class="w-8 h-8 text-cgws-danger mb-3"
          aria-hidden="true"
        />
        <p class="font-sans text-cgws-danger text-sm mb-4">
          Impossible de charger vos dépôts-ventes pour le moment. Veuillez réessayer.
        </p>
        <CgwsButton variant="secondary" size="sm" type="button" @click="fetchConsignments">
          Réessayer
        </CgwsButton>
      </div>
    </div>
  </section>
</template>
