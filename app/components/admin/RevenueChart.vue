<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'
import type { MonthlyRevenue } from '~/types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  /** If provided, the component uses this data and skips its own fetch. */
  data?: MonthlyRevenue[]
  /** External loading flag — overrides internal loading when provided. */
  loading?: boolean
  /** Canvas height in px. Defaults to 280. */
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  data: undefined,
  loading: undefined,
  height: 280,
})

// ─── Auth (needed when we fetch internally) ───────────────────────────────────

const { getAccessToken, buildAuthHeaders } = useAdminApi()

// ─── Internal state ───────────────────────────────────────────────────────────

const internalData = ref<MonthlyRevenue[]>([])
const internalLoading = ref(false)
const fetchError = ref(false)

const effectiveData = computed<MonthlyRevenue[]>(() => props.data ?? internalData.value)
const effectiveLoading = computed<boolean>(() => props.loading ?? internalLoading.value)

// ─── Couleurs theme-aware (US-093) ────────────────────────────────────────────
// Chart.js ne sait pas lire les variables CSS : on résout les tokens --cgws-* au
// runtime via getComputedStyle, puis on les relit à chaque changement de peau
// (data-skin) ou de mode jour/nuit (.dark). Les computed chartData/chartOptions
// dépendant de `themeColors`, vue-chartjs re-rend le graphique automatiquement
// (data & options watchers intégrés depuis v4) — sans rechargement de page.

interface ChartThemeColors {
  /** Barres « CA propre » + carré de légende (bg-cgws-accent). */
  accent: string
  /** Barres « CA consignation » + carré de légende (bg-cgws-accent-deco). */
  accentDeco: string
  /** Ticks des deux axes. */
  inkSoft: string
  /** Grille horizontale. */
  surface: string
  /**
   * Délimiteur entre segments empilés (US-093 QA fix) — indépendant de la teinte
   * accent/accent-deco, dont le contraste mutuel est insuffisant en Nuit (1.10:1).
   * --cgws-ground contraste ≥ 3:1 (WCAG 1.4.11 non-text) contre accent ET
   * accent-deco dans les 3 rendus (jour/nuit/rugueux) — vérifié manuellement.
   */
  ground: string
}

// Fallback = Élégante Jour (valeurs de tokens.css :root) — utilisé uniquement si
// une variable est absente (ne devrait jamais arriver : les 5 tokens existent
// dans les 3 rendus).
const FALLBACK_COLORS: ChartThemeColors = {
  accent: '#8C4A56',
  accentDeco: '#B76E79',
  inkSoft: '#5B4436',
  surface: '#EFE1CC',
  ground: '#F6EDDF',
}

const themeColors = ref<ChartThemeColors>({ ...FALLBACK_COLORS })

function readToken(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

function refreshThemeColors(): void {
  if (import.meta.server) return
  themeColors.value = {
    accent: readToken('--cgws-accent', FALLBACK_COLORS.accent),
    accentDeco: readToken('--cgws-accent-deco', FALLBACK_COLORS.accentDeco),
    inkSoft: readToken('--cgws-ink-soft', FALLBACK_COLORS.inkSoft),
    surface: readToken('--cgws-surface', FALLBACK_COLORS.surface),
    ground: readToken('--cgws-ground', FALLBACK_COLORS.ground),
  }
}

const { skin } = useCgwsSkin()
const colorMode = useColorMode()

// nextTick : laisse le temps à data-skin / .dark d'être posés sur <html> avant
// de relire les valeurs calculées.
watch([skin, () => colorMode.value], async () => {
  await nextTick()
  refreshThemeColors()
})

// ─── Chart data ───────────────────────────────────────────────────────────────

function formatMonthLabel(month: string): string {
  const parts = month.split('-')
  const year = Number(parts[0])
  const m = Number(parts[1]) - 1
  return new Date(year, m, 1).toLocaleDateString('fr-FR', { month: 'short' })
}

const chartData = computed<ChartData<'bar'>>(() => ({
  labels: effectiveData.value.map(d => formatMonthLabel(d.month)),
  datasets: [
    {
      label: 'CA propre',
      data: effectiveData.value.map(d => d.ownRevenue),
      backgroundColor: themeColors.value.accent, // --cgws-accent (résolu au runtime, theme-aware)
      // Délimiteur teinte-indépendant (US-093 QA fix) : accent/accent-deco sont
      // trop proches en luminance (jusqu'à 1.10:1 en Nuit) pour rester lisibles
      // une fois empilés sans séparateur.
      borderColor: themeColors.value.ground, // --cgws-ground (résolu au runtime, theme-aware)
      borderWidth: 1,
      borderRadius: 3,
      borderSkipped: false,
      stack: 'revenue',
    },
    {
      label: 'CA dépôt-vente',
      data: effectiveData.value.map(d => d.consignmentRevenue),
      backgroundColor: themeColors.value.accentDeco, // --cgws-accent-deco — cgws-denim n'existe qu'en peau Rugueux, non réutilisable ici
      borderColor: themeColors.value.ground, // --cgws-ground (résolu au runtime, theme-aware)
      borderWidth: 1,
      borderRadius: 3,
      borderSkipped: false,
      stack: 'revenue',
    },
  ],
}))

const chartOptions = computed<ChartOptions<'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 800,
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => {
          const value = typeof context.parsed.y === 'number' ? context.parsed.y : 0
          return `${context.dataset.label} : ${value.toLocaleString('fr-FR', {
            style: 'currency',
            currency: 'EUR',
          })}`
        },
      },
    },
  },
  scales: {
    x: {
      stacked: true,
      grid: { display: false },
      ticks: {
        font: { family: 'Inter', size: 11 },
        color: themeColors.value.inkSoft, // --cgws-ink-soft (theme-aware)
      },
    },
    y: {
      stacked: true,
      grid: { color: themeColors.value.surface }, // --cgws-surface (theme-aware)
      border: { dash: [4, 4] },
      ticks: {
        font: { family: 'Inter', size: 11 },
        color: themeColors.value.inkSoft, // --cgws-ink-soft (theme-aware)
        callback: (value) => `${Number(value).toLocaleString('fr-FR')} €`,
      },
    },
  },
}))

// ─── Data fetch (when no external data is provided) ───────────────────────────

async function fetchRevenue(): Promise<void> {
  if (props.data !== undefined) return

  internalLoading.value = true
  fetchError.value = false

  try {
    const token = await getAccessToken()
    const result = await $fetch<MonthlyRevenue[]>('/api/admin/stats/revenue-monthly', {
      headers: buildAuthHeaders(token),
    })
    internalData.value = result
  }
  catch {
    fetchError.value = true
  }
  finally {
    internalLoading.value = false
  }
}

// Only fetch on client (component is rendered inside <ClientOnly>)
onMounted(() => {
  refreshThemeColors()
  fetchRevenue()
})
</script>

<template>
  <div>
    <!-- Loading skeleton -->
    <div
      v-if="effectiveLoading"
      :style="{ height: `${height}px` }"
      class="animate-pulse bg-cgws-hairline rounded w-full"
      aria-busy="true"
      aria-label="Chargement du graphique…"
    />

    <!-- Error state -->
    <div
      v-else-if="fetchError"
      :style="{ height: `${height}px` }"
      class="flex items-center justify-center"
      role="alert"
    >
      <p class="font-sans text-xs text-cgws-danger text-center">
        Impossible de charger les données. Actualisez la page.
      </p>
    </div>

    <!-- Chart (client only — canvas doesn't exist on server) -->
    <template v-else>
      <!-- Scroll wrapper for small viewports -->
      <div class="overflow-x-auto">
        <div
          class="min-w-[560px]"
          :style="{ height: `${height}px` }"
        >
          <Bar
            :data="chartData"
            :options="chartOptions"
            aria-label="Évolution du chiffre d'affaires sur les 12 derniers mois"
          />
        </div>
      </div>

      <!-- Custom legend -->
      <div
        class="flex items-center gap-6 mt-4 justify-center flex-wrap"
        aria-hidden="true"
      >
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-sm bg-cgws-accent inline-block flex-shrink-0" />
          <span class="font-sans text-xs text-cgws-ink-soft">CA propre</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-sm bg-cgws-accent-deco inline-block flex-shrink-0" />
          <span class="font-sans text-xs text-cgws-ink-soft">CA dépôt-vente</span>
        </div>
      </div>
    </template>
  </div>
</template>
