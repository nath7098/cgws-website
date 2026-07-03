<script setup lang="ts">
// ─── Page meta ────────────────────────────────────────────────────────────────

definePageMeta({
  middleware: 'admin',
  layout: 'admin',
  title: 'Rapports & Exports',
})

useSeoMeta({
  title: 'Rapports & Exports — CGWS Administration',
  robots: 'noindex, nofollow',
})

// ─── Auth ─────────────────────────────────────────────────────────────────────

const { initSession } = useAdminAuth()
await initSession()

const { getAccessToken, buildAuthHeaders } = useAdminApi()

// ─── Today's date (SSR-safe — set in onMounted) ───────────────────────────────

const todayLabel = ref('')

// ─── Export form state ────────────────────────────────────────────────────────

function getFirstDayOfMonth(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

const exportFrom = ref(getFirstDayOfMonth())
const exportTo = ref(getTodayISO())

type ExportState = 'idle' | 'loading' | 'success' | 'error' | 'empty'
const exportState = ref<ExportState>('idle')
const exportCount = ref(0)
const fromError = ref('')
const toError = ref('')

let successTimer: ReturnType<typeof setTimeout> | null = null

// ─── Export CSV ───────────────────────────────────────────────────────────────

function validateDates(): boolean {
  fromError.value = ''
  toError.value = ''
  let valid = true

  if (!exportFrom.value) {
    fromError.value = 'La date de début est requise.'
    valid = false
  }
  if (!exportTo.value) {
    toError.value = 'La date de fin est requise.'
    valid = false
  }
  if (valid && exportFrom.value > exportTo.value) {
    toError.value = 'La date de fin doit être postérieure ou égale à la date de début.'
    valid = false
  }
  return valid
}

async function handleExport(): Promise<void> {
  if (!validateDates()) return

  exportState.value = 'loading'
  if (successTimer) clearTimeout(successTimer)

  try {
    const token = await getAccessToken()

    const blob = await $fetch<Blob>('/api/admin/exports/sales', {
      query: { from: exportFrom.value, to: exportTo.value },
      headers: buildAuthHeaders(token),
      responseType: 'blob',
      onResponse({ response }) {
        const count = response.headers.get('x-record-count')
        exportCount.value = count ? parseInt(count, 10) : 0
      },
    })

    if (exportCount.value === 0) {
      exportState.value = 'empty'
      return
    }

    // Trigger browser download
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cgws-ventes-${exportFrom.value}-${exportTo.value}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    exportState.value = 'success'
    successTimer = setTimeout(() => {
      exportState.value = 'idle'
    }, 5000)
  }
  catch {
    exportState.value = 'error'
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
  todayLabel.value = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

onUnmounted(() => {
  if (successTimer) clearTimeout(successTimer)
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateFR(dateStr: string): string {
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}
</script>

<template>
  <div class="space-y-8">
    <!-- Page header -->
    <div class="flex items-baseline justify-between flex-wrap gap-2">
      <h2 class="font-serif font-bold text-2xl text-cgws-ink">
        Rapports &amp; Exports
      </h2>
      <span
        v-if="todayLabel"
        class="font-sans text-xs text-cgws-ink-soft"
        aria-label="Date du jour"
      >
        {{ todayLabel }}
      </span>
    </div>

    <!-- ═══════════════════════════════════════════════════════ EXPORT CSV -->
    <section
      aria-labelledby="export-csv-heading"
      class="bg-cgws-surface border border-cgws-hairline rounded-[4px] p-5 space-y-4"
    >
      <h3
        id="export-csv-heading"
        class="font-sans font-semibold text-xs uppercase tracking-widest text-cgws-accent"
      >
        Export Ventes CSV
      </h3>

      <!-- Controls -->
      <div class="flex flex-col sm:flex-row gap-3 items-end">
        <!-- From date -->
        <div class="flex-1">
          <label
            for="export-from"
            class="block font-sans text-xs font-semibold uppercase tracking-wider text-cgws-ink-soft mb-1.5"
          >
            Du
          </label>
          <input
            id="export-from"
            v-model="exportFrom"
            type="date"
            :max="exportTo || undefined"
            :disabled="exportState === 'loading'"
            class="w-full bg-cgws-ground text-cgws-ink border rounded-sm px-3 py-2 font-sans text-sm
                   transition-shadow transition-colors duration-150 outline-none
                   focus:ring-2 focus:ring-cgws-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
            :class="fromError
              ? 'border-cgws-danger focus:border-cgws-danger'
              : 'border-cgws-edge focus:border-cgws-accent'"
            aria-required="true"
            :aria-describedby="fromError ? 'export-from-error' : undefined"
            @change="fromError = ''"
          >
          <p
            v-if="fromError"
            id="export-from-error"
            role="alert"
            class="mt-1 font-sans text-xs text-cgws-danger"
          >
            {{ fromError }}
          </p>
        </div>

        <!-- To date -->
        <div class="flex-1">
          <label
            for="export-to"
            class="block font-sans text-xs font-semibold uppercase tracking-wider text-cgws-ink-soft mb-1.5"
          >
            Au
          </label>
          <input
            id="export-to"
            v-model="exportTo"
            type="date"
            :min="exportFrom || undefined"
            :disabled="exportState === 'loading'"
            class="w-full bg-cgws-ground text-cgws-ink border rounded-sm px-3 py-2 font-sans text-sm
                   transition-shadow transition-colors duration-150 outline-none
                   focus:ring-2 focus:ring-cgws-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
            :class="toError
              ? 'border-cgws-danger focus:border-cgws-danger'
              : 'border-cgws-edge focus:border-cgws-accent'"
            aria-required="true"
            :aria-describedby="toError ? 'export-to-error' : undefined"
            @change="toError = ''"
          >
          <p
            v-if="toError"
            id="export-to-error"
            role="alert"
            class="mt-1 font-sans text-xs text-cgws-danger"
          >
            {{ toError }}
          </p>
        </div>

        <!-- Export button -->
        <button
          type="button"
          :disabled="exportState === 'loading'"
          :aria-busy="exportState === 'loading' ? 'true' : undefined"
          class="sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 rounded-sm
                 bg-cgws-accent text-cgws-on-accent font-sans text-sm font-semibold
                 hover:bg-cgws-edge transition-colors duration-150
                 disabled:opacity-40 disabled:cursor-not-allowed
                 focus-visible:ring-2 focus-visible:ring-cgws-accent focus-visible:ring-offset-2 focus-visible:outline-none
                 whitespace-nowrap"
          aria-label="Exporter les ventes au format CSV"
          @click="handleExport"
        >
          <span
            v-if="exportState === 'loading'"
            class="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"
            aria-hidden="true"
          />
          <UIcon
            v-else
            name="i-lucide-download"
            class="w-4 h-4"
            aria-hidden="true"
          />
          {{ exportState === 'loading' ? 'Export en cours…' : 'Export CSV' }}
        </button>
      </div>

      <!-- Feedback zone -->
      <div
        v-if="exportState !== 'idle'"
        role="status"
        aria-live="polite"
        class="min-h-[20px]"
      >
        <!-- Loading -->
        <p
          v-if="exportState === 'loading'"
          class="font-sans text-xs text-cgws-ink-soft"
        >
          Génération en cours…
        </p>

        <!-- Success -->
        <span
          v-else-if="exportState === 'success'"
          class="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm bg-cgws-success/15 text-cgws-success font-sans text-xs"
        >
          <UIcon
            name="i-lucide-check"
            class="w-3.5 h-3.5 flex-shrink-0"
            aria-hidden="true"
          />
          Fichier téléchargé ({{ exportCount }} vente{{ exportCount !== 1 ? 's' : '' }},
          période du {{ formatDateFR(exportFrom) }} au {{ formatDateFR(exportTo) }})
        </span>

        <!-- Empty -->
        <p
          v-else-if="exportState === 'empty'"
          class="font-sans text-xs text-cgws-ink-soft/70"
        >
          Aucune vente sur cette période.
        </p>

        <!-- Error -->
        <p
          v-else-if="exportState === 'error'"
          role="alert"
          class="font-sans text-xs text-cgws-danger"
        >
          Erreur lors de l'export. Vérifiez la période sélectionnée.
        </p>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════ ÉVOLUTION DU CA -->
    <section
      aria-labelledby="ca-chart-heading"
      class="bg-cgws-surface border border-cgws-hairline rounded-[4px] p-5 space-y-4"
    >
      <h3
        id="ca-chart-heading"
        class="font-sans font-semibold text-xs uppercase tracking-widest text-cgws-accent"
      >
        Évolution du Chiffre d'Affaires — 12 derniers mois
      </h3>

      <!-- ClientOnly: chart.js uses canvas, incompatible with SSR -->
      <ClientOnly>
        <RevenueChart :height="280" />

        <template #fallback>
          <!-- SSR fallback: skeleton -->
          <div
            class="animate-pulse bg-cgws-hairline rounded h-[280px] w-full"
            aria-label="Chargement du graphique…"
          />
        </template>
      </ClientOnly>
    </section>
  </div>
</template>
