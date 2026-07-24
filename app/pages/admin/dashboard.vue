<script setup lang="ts">
import type { ConsignmentStatus, PaymentMethod, RecentConsignment, RecentSale } from '~/types'

definePageMeta({
  middleware: 'admin',
  layout: 'admin',
  title: 'Dashboard',
})

useSeoMeta({
  title: 'Dashboard — CGWS Administration',
  robots: 'noindex, nofollow',
})

const { initSession } = useAdminAuth()
await initSession()

// ─── Supabase client ──────────────────────────────────────────────────────────
const supabase = useSupabase()

// ─── Loading states ───────────────────────────────────────────────────────────
const loadingKpis = ref(true)
const loadingActivity = ref(true)

// ─── KPI values ───────────────────────────────────────────────────────────────
const caMonth = ref<string>('—')
const produitsActifs = ref<number | string>('—')
const consignationsAttente = ref<number | string>('—')
const ventesMonth = ref<number | string>('—')

// ─── Activity data ────────────────────────────────────────────────────────────
const recentConsignments = ref<RecentConsignment[]>([])
const recentSales = ref<RecentSale[]>([])

// ─── Date label (SSR-safe) ────────────────────────────────────────────────────
const dateLabel = ref('')

// ─── KPI computed array ───────────────────────────────────────────────────────
interface KpiItem {
  id: string
  label: string
  value: string | number
  icon: string
  variant: 'default' | 'warning'
}

const kpis = computed<KpiItem[]>(() => [
  {
    id: 'ca',
    label: 'CA ce mois',
    value: caMonth.value,
    icon: 'i-lucide-euro',
    variant: 'default',
  },
  {
    id: 'produits',
    label: 'Produits actifs',
    value: produitsActifs.value,
    icon: 'i-lucide-package',
    variant: 'default',
  },
  {
    id: 'consignations',
    label: 'Dépôts-ventes en attente',
    value: consignationsAttente.value,
    icon: 'i-lucide-inbox',
    variant: typeof consignationsAttente.value === 'number' && consignationsAttente.value > 0
      ? 'warning'
      : 'default',
  },
  {
    id: 'ventes',
    label: 'Ventes ce mois',
    value: ventesMonth.value,
    icon: 'i-lucide-receipt',
    variant: 'default',
  },
])

// ─── Raw Supabase shape for sales with product join ───────────────────────────
interface RawSaleWithProduct {
  id: string
  sale_price: number
  payment_method: string
  sale_date: string
  products: { title: string } | null
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchKpis(): Promise<void> {
  try {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0]!
    const today = now.toISOString().split('T')[0]!

    const [
      salesRevenueResult,
      activeProductsResult,
      pendingConsignmentsResult,
      salesCountResult,
    ] = await Promise.all([
      supabase
        .from('sales')
        .select('sale_price')
        .gte('sale_date', firstDay)
        .lte('sale_date', today),
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabase
        .from('consignments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('sales')
        .select('id', { count: 'exact', head: true })
        .gte('sale_date', firstDay)
        .lte('sale_date', today),
    ])

    // CA ce mois — sum sale_price client-side
    if (!salesRevenueResult.error && salesRevenueResult.data) {
      const total = salesRevenueResult.data.reduce(
        (acc, row) => acc + row.sale_price,
        0,
      )
      caMonth.value = total.toLocaleString('fr-FR', {
        style: 'currency',
        currency: 'EUR',
      })
    }

    // Produits actifs
    if (!activeProductsResult.error) {
      produitsActifs.value = activeProductsResult.count ?? 0
    }

    // Consignations en attente
    if (!pendingConsignmentsResult.error) {
      consignationsAttente.value = pendingConsignmentsResult.count ?? 0
    }

    // Ventes ce mois
    if (!salesCountResult.error) {
      ventesMonth.value = salesCountResult.count ?? 0
    }
  }
  catch {
    // Non-fatal: individual KPIs already default to '—'
  }
  finally {
    loadingKpis.value = false
  }
}

async function fetchActivity(): Promise<void> {
  try {
    const [consignmentsResult, salesResult] = await Promise.all([
      supabase
        .from('consignments')
        .select('id, depositor_name, item_description, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('sales')
        .select('id, sale_price, payment_method, sale_date, products(title)')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    // Map consignments to camelCase domain shape
    if (!consignmentsResult.error && consignmentsResult.data) {
      recentConsignments.value = consignmentsResult.data.map(row => ({
        id: row.id,
        depositorName: row.depositor_name,
        itemDescription: row.item_description,
        status: (row.status ?? 'pending') as ConsignmentStatus,
        createdAt: row.created_at ?? '',
      }))
    }

    // Map sales to camelCase domain shape (with product join)
    if (!salesResult.error && salesResult.data) {
      const rawRows = salesResult.data as unknown as RawSaleWithProduct[]
      recentSales.value = rawRows.map(row => ({
        id: row.id,
        productTitle: row.products?.title ?? '—',
        salePrice: row.sale_price,
        paymentMethod: row.payment_method as PaymentMethod,
        saleDate: row.sale_date,
      }))
    }
  }
  catch {
    // Non-fatal: tables remain empty → empty state shown
  }
  finally {
    loadingActivity.value = false
  }
}

onMounted(() => {
  dateLabel.value = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Fire both groups simultaneously — independent loading states for progressive display
  void fetchKpis()
  void fetchActivity()
})
</script>

<template>
  <div class="space-y-8">
    <!-- Garde-fou expéditeur email de test (US-094) -->
    <EmailFallbackBanner />

    <!-- Page header -->
    <div class="flex items-baseline justify-between">
      <h2 class="font-serif font-bold text-2xl text-cgws-ink">
        Tableau de bord
      </h2>
      <span
        v-if="dateLabel"
        class="font-sans text-xs text-cgws-ink-soft capitalize"
      >
        {{ dateLabel }}
      </span>
    </div>

    <!-- KPI grid -->
    <section aria-label="Indicateurs clés">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          v-for="kpi in kpis"
          :key="kpi.id"
          :label="kpi.label"
          :value="kpi.value"
          :icon="kpi.icon"
          :variant="kpi.variant"
          :loading="loadingKpis"
        />
      </div>
    </section>

    <!-- Recent activity -->
    <section aria-label="Activité récente">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity
          type="consignments"
          :items="recentConsignments"
          :loading="loadingActivity"
        />
        <RecentActivity
          type="sales"
          :items="recentSales"
          :loading="loadingActivity"
        />
      </div>
    </section>

    <!-- Quick links -->
    <section aria-label="Accès rapides">
      <p class="font-serif font-semibold text-base text-cgws-ink mb-3">
        Accès rapides
      </p>
      <div class="flex flex-wrap gap-3">
        <CgwsButton
          variant="primary"
          size="sm"
          as="NuxtLink"
          to="/admin/produits/nouveau"
        >
          <UIcon
            name="i-lucide-plus"
            class="w-4 h-4 mr-1.5"
            aria-hidden="true"
          />
          Ajouter un produit
        </CgwsButton>

        <CgwsButton
          variant="secondary"
          size="sm"
          as="NuxtLink"
          to="/admin/consignations"
        >
          <UIcon
            name="i-lucide-arrow-left-right"
            class="w-4 h-4 mr-1.5"
            aria-hidden="true"
          />
          Gérer les dépôts-ventes
        </CgwsButton>

        <CgwsButton
          variant="ghost"
          size="sm"
          as="NuxtLink"
          to="/catalogue"
        >
          Voir le catalogue
          <UIcon
            name="i-lucide-external-link"
            class="w-4 h-4 ml-1.5"
            aria-hidden="true"
          />
        </CgwsButton>
      </div>
    </section>
  </div>
</template>
