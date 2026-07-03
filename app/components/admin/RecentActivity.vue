<script setup lang="ts">
import type { ConsignmentStatus, PaymentMethod, RecentConsignment, RecentSale } from '~/types'

type ActivityType = 'consignments' | 'sales'

interface Props {
  type: ActivityType
  items: RecentConsignment[] | RecentSale[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

// ─── Type-narrowed computed accessors ────────────────────────────────────────

const consignmentItems = computed<RecentConsignment[]>(() =>
  props.type === 'consignments' ? (props.items as RecentConsignment[]) : [],
)

const saleItems = computed<RecentSale[]>(() =>
  props.type === 'sales' ? (props.items as RecentSale[]) : [],
)

const isEmpty = computed<boolean>(() =>
  !props.loading && props.items.length === 0,
)

// ─── Display helpers ─────────────────────────────────────────────────────────

const sectionTitle = computed<string>(() =>
  props.type === 'consignments' ? 'Consignations récentes' : 'Ventes récentes',
)

const captionText = computed<string>(() =>
  props.type === 'consignments' ? '5 dernières consignations' : '5 dernières ventes',
)

const viewAllHref = computed<string>(() =>
  props.type === 'consignments' ? '/admin/consignations' : '/admin/ventes',
)

// ─── Status pills ─────────────────────────────────────────────────────────────

interface StatusConfig {
  classes: string
  label: string
}

const STATUS_CONFIG: Record<ConsignmentStatus, StatusConfig> = {
  pending: { classes: 'bg-cgws-accent/15 text-cgws-accent', label: 'En attente' },
  accepted: { classes: 'bg-cgws-success/15 text-cgws-success border border-cgws-success/40', label: 'Acceptée' },
  rejected: { classes: 'bg-cgws-danger/15 text-cgws-danger', label: 'Refusée' },
  sold: { classes: 'bg-cgws-ink/10 text-cgws-ink', label: 'Vendue' },
  returned: { classes: 'bg-cgws-hairline text-cgws-ink-soft', label: 'Retournée' },
}

function statusConfig(status: ConsignmentStatus): StatusConfig {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
}

// ─── Payment labels ───────────────────────────────────────────────────────────

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Espèces',
  card: 'Carte',
  transfer: 'Virement',
  check: 'Chèque',
}

function paymentLabel(method: PaymentMethod): string {
  return PAYMENT_LABELS[method] ?? method
}

// ─── Date formatting ─────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
    })
  }
  catch {
    return dateStr
  }
}

// ─── Price formatting ─────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  return price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}
</script>

<template>
  <div class="bg-white border border-cgws-hairline rounded-[4px] shadow-sm p-5">
    <!-- Section title -->
    <h3 class="font-serif font-semibold text-base text-cgws-ink mb-4">
      {{ sectionTitle }}
    </h3>

    <!-- Skeleton state -->
    <template v-if="loading">
      <div
        v-for="n in 5"
        :key="n"
        class="h-4 bg-cgws-hairline rounded animate-pulse my-2"
      />
    </template>

    <!-- Empty state -->
    <p
      v-else-if="isEmpty"
      class="font-sans text-sm text-cgws-ink-soft italic text-center py-4"
    >
      Aucune activité récente.
    </p>

    <!-- Data table -->
    <template v-else>
      <!-- Consignments table -->
      <table
        v-if="type === 'consignments'"
        class="w-full text-sm font-sans"
      >
        <caption class="sr-only">
          {{ captionText }}
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              class="font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft pb-2 text-left"
            >
              Déposant
            </th>
            <th
              scope="col"
              class="font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft pb-2 text-left"
            >
              Article
            </th>
            <th
              scope="col"
              class="font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft pb-2 text-left"
            >
              Statut
            </th>
            <th
              scope="col"
              class="font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft pb-2 text-right"
            >
              Date
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in consignmentItems"
            :key="item.id"
          >
            <td class="py-2 border-t border-cgws-hairline text-cgws-ink align-middle">
              {{ item.depositorName }}
            </td>
            <td class="py-2 border-t border-cgws-hairline text-cgws-ink align-middle max-w-[160px]">
              <span class="block truncate max-w-[160px]">{{ item.itemDescription }}</span>
            </td>
            <td class="py-2 border-t border-cgws-hairline align-middle">
              <span
                :class="['inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-sans font-medium', statusConfig(item.status).classes]"
                :aria-label="`Statut : ${statusConfig(item.status).label}`"
              >
                {{ statusConfig(item.status).label }}
              </span>
            </td>
            <td class="py-2 border-t border-cgws-hairline text-cgws-ink-soft align-middle text-right text-xs">
              {{ formatDate(item.createdAt) }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Sales table -->
      <table
        v-else
        class="w-full text-sm font-sans"
      >
        <caption class="sr-only">
          {{ captionText }}
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              class="font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft pb-2 text-left"
            >
              Produit
            </th>
            <th
              scope="col"
              class="font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft pb-2 text-left"
            >
              Prix
            </th>
            <th
              scope="col"
              class="font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft pb-2 text-left"
            >
              Paiement
            </th>
            <th
              scope="col"
              class="font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft pb-2 text-right"
            >
              Date
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in saleItems"
            :key="item.id"
          >
            <td class="py-2 border-t border-cgws-hairline text-cgws-ink align-middle">
              <span class="block truncate max-w-[160px]">{{ item.productTitle }}</span>
            </td>
            <td class="py-2 border-t border-cgws-hairline align-middle">
              <span class="font-display text-cgws-accent">{{ formatPrice(item.salePrice) }}</span>
            </td>
            <td class="py-2 border-t border-cgws-hairline text-cgws-ink align-middle">
              {{ paymentLabel(item.paymentMethod) }}
            </td>
            <td class="py-2 border-t border-cgws-hairline text-cgws-ink-soft align-middle text-right text-xs">
              {{ formatDate(item.saleDate) }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- View all link -->
      <div class="flex justify-end mt-3">
        <CgwsButton
          variant="ghost"
          size="sm"
          as="NuxtLink"
          :to="viewAllHref"
        >
          Voir tout &rarr;
        </CgwsButton>
      </div>
    </template>
  </div>
</template>
