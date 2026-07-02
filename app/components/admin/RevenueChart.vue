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
      backgroundColor: '#B8650A', // cgws-copper
      borderRadius: 3,
      borderSkipped: false,
      stack: 'revenue',
    },
    {
      label: 'CA consignation',
      data: effectiveData.value.map(d => d.consignmentRevenue),
      backgroundColor: '#2C4A72', // cgws-denim
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
        color: '#7B3B1C', // cgws-leather
      },
    },
    y: {
      stacked: true,
      grid: { color: '#F0DDB8' }, // cgws-parchment
      border: { dash: [4, 4] },
      ticks: {
        font: { family: 'Inter', size: 11 },
        color: '#7B3B1C', // cgws-leather
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
  fetchRevenue()
})
</script>

<template>
  <div>
    <!-- Loading skeleton -->
    <div
      v-if="effectiveLoading"
      :style="{ height: `${height}px` }"
      class="animate-pulse bg-cgws-leather/10 rounded w-full"
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
      <p class="font-sans text-xs text-cgws-rust text-center">
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
          <span class="w-3 h-3 rounded-sm bg-cgws-copper inline-block flex-shrink-0" />
          <span class="font-sans text-xs text-cgws-leather">CA propre</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-sm bg-cgws-denim inline-block flex-shrink-0" />
          <span class="font-sans text-xs text-cgws-leather">CA consignation</span>
        </div>
      </div>
    </template>
  </div>
</template>
