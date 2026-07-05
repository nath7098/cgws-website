<script setup lang="ts">
import type { PreviewRow } from '#shared/utils/csvImport'
import { CATEGORY_LABELS, CONDITION_LABELS } from '#shared/utils/csvImport'

interface Props {
  rows: PreviewRow[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

function formatPrice(price: number): string {
  return price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}
</script>

<template>
  <!-- Loading skeleton -->
  <div
    v-if="props.loading"
    class="bg-cgws-surface border border-cgws-hairline rounded-[4px] overflow-hidden"
    aria-hidden="true"
  >
    <div
      v-for="i in 5"
      :key="i"
      class="p-3 border-b border-cgws-hairline last:border-b-0"
    >
      <div class="h-4 w-24 bg-cgws-hairline rounded animate-pulse mb-2" />
      <div class="h-4 w-64 bg-cgws-hairline rounded animate-pulse" />
    </div>
  </div>

  <!-- Empty state (header-only file) -->
  <div
    v-else-if="props.rows.length === 0"
    class="bg-cgws-surface border border-cgws-hairline rounded-[4px] py-16 text-center"
  >
    <UIcon
      name="i-lucide-file-x"
      class="w-10 h-10 mx-auto mb-3 text-cgws-ink-soft/30"
      aria-hidden="true"
    />
    <p class="font-sans text-sm text-cgws-ink-soft italic">
      Aucune ligne de données trouvée dans le fichier.
    </p>
  </div>

  <template v-else>
    <!-- Desktop table (sm+) -->
    <div class="hidden sm:block bg-cgws-surface border border-cgws-hairline rounded-[4px] overflow-hidden">
      <div
        class="max-h-[560px] overflow-y-auto"
        tabindex="0"
        role="region"
        :aria-label="`Tableau d'aperçu défilant, ${props.rows.length} lignes`"
      >
        <table
          class="w-full text-sm font-sans"
          aria-describedby="preview-table-caption"
        >
          <caption
            id="preview-table-caption"
            class="sr-only"
          >
            Aperçu de l'import : {{ props.rows.length }} ligne(s) de données, triées par ordre d'apparition
            dans le fichier. Chaque ligne indique si elle sera créée ou si elle contient une erreur, avec
            le motif en cas d'erreur.
          </caption>
          <thead class="sticky top-0 z-10 bg-cgws-surface border-b border-cgws-hairline">
            <tr>
              <th
                scope="col"
                class="w-14 py-3 pl-4 pr-2 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft"
              >
                Ligne
              </th>
              <th
                scope="col"
                class="py-3 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft min-w-[220px]"
              >
                Statut
              </th>
              <th
                scope="col"
                class="py-3 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft"
              >
                Titre
              </th>
              <th
                scope="col"
                class="hidden md:table-cell py-3 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft"
              >
                Catégorie
              </th>
              <th
                scope="col"
                class="py-3 px-3 text-right font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft"
              >
                Prix
              </th>
              <th
                scope="col"
                class="hidden lg:table-cell py-3 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft"
              >
                État
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-cgws-hairline">
            <tr
              v-for="row in props.rows"
              :key="row.line"
              :class="[
                'transition-colors duration-100',
                row.status === 'error'
                  ? 'bg-cgws-danger/5 border-l-2 border-l-cgws-danger hover:bg-cgws-danger/10'
                  : 'hover:bg-cgws-surface-2/60',
              ]"
            >
              <!-- Line -->
              <td class="py-2.5 pl-4 pr-2 font-sans text-xs text-cgws-ink-soft whitespace-nowrap align-top">
                L.{{ row.line }}
              </td>

              <!-- Status + reason -->
              <td class="py-2.5 px-3 align-top">
                <span
                  v-if="row.status === 'valid'"
                  class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 bg-cgws-success/15 text-cgws-success border border-cgws-success/40 font-sans font-medium text-[11px] uppercase tracking-wider"
                >
                  <UIcon
                    name="i-lucide-circle-check"
                    class="w-3 h-3"
                    aria-hidden="true"
                  />
                  Sera créé
                </span>
                <template v-else>
                  <span
                    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 bg-cgws-danger text-cgws-on-danger font-sans font-medium text-[11px] uppercase tracking-wider"
                  >
                    <UIcon
                      name="i-lucide-circle-x"
                      class="w-3 h-3"
                      aria-hidden="true"
                    />
                    Erreur
                  </span>
                  <p class="font-sans text-xs text-cgws-danger mt-1 max-w-xs">
                    {{ row.reason }}
                  </p>
                </template>
              </td>

              <!-- Title / brand -->
              <td class="py-2.5 px-3 align-top">
                <span class="font-sans text-sm font-medium text-cgws-ink line-clamp-1 block">
                  {{ row.status === 'valid' ? row.fields.title : (row.columns.titre || '—') }}
                </span>
                <span
                  v-if="(row.status === 'valid' ? row.fields.brand : row.columns.marque)"
                  class="font-sans text-xs text-cgws-ink-soft"
                >
                  {{ row.status === 'valid' ? row.fields.brand : row.columns.marque }}
                </span>
              </td>

              <!-- Category (md+) -->
              <td class="hidden md:table-cell py-2.5 px-3 font-sans text-sm text-cgws-ink-soft align-top">
                {{ row.status === 'valid' ? CATEGORY_LABELS[row.fields.category] : (row.columns.categorie || '—') }}
              </td>

              <!-- Price -->
              <td
                class="py-2.5 px-3 text-right font-display text-base tabular-nums whitespace-nowrap align-top"
                :class="row.status === 'valid' ? 'text-cgws-accent' : 'text-cgws-ink-soft'"
              >
                {{ row.status === 'valid' ? formatPrice(row.fields.price) : (row.columns.prix || '—') }}
              </td>

              <!-- Condition (lg+) -->
              <td class="hidden lg:table-cell py-2.5 px-3 font-sans text-sm text-cgws-ink-soft align-top">
                {{ row.status === 'valid' ? CONDITION_LABELS[row.fields.condition] : (row.columns.etat || '—') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Mobile cards (< sm) -->
    <div
      class="block sm:hidden max-h-[560px] overflow-y-auto space-y-2 pr-1"
      role="region"
      :aria-label="`Aperçu de l'import, ${props.rows.length} lignes`"
      tabindex="0"
    >
      <div
        v-for="row in props.rows"
        :key="row.line"
        :class="[
          'rounded-[4px] p-3 border',
          row.status === 'error'
            ? 'bg-cgws-danger/5 border-cgws-danger/40'
            : 'bg-cgws-surface border-cgws-hairline',
        ]"
      >
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="font-sans text-xs text-cgws-ink-soft">L.{{ row.line }}</span>
          <span
            v-if="row.status === 'valid'"
            class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 bg-cgws-success/15 text-cgws-success border border-cgws-success/40 font-sans font-medium text-[11px] uppercase tracking-wider"
          >
            <UIcon
              name="i-lucide-circle-check"
              class="w-3 h-3"
              aria-hidden="true"
            />
            Sera créé
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 bg-cgws-danger text-cgws-on-danger font-sans font-medium text-[11px] uppercase tracking-wider"
          >
            <UIcon
              name="i-lucide-circle-x"
              class="w-3 h-3"
              aria-hidden="true"
            />
            Erreur
          </span>
        </div>

        <p class="font-sans text-sm font-medium text-cgws-ink line-clamp-1">
          {{ row.status === 'valid' ? row.fields.title : (row.columns.titre || '—') }}
        </p>
        <p
          v-if="row.status === 'valid' && row.fields.brand"
          class="font-sans text-xs text-cgws-ink-soft"
        >
          {{ row.fields.brand }}
        </p>

        <div
          v-if="row.status === 'valid'"
          class="flex items-center gap-3 mt-1.5 flex-wrap font-sans text-xs text-cgws-ink-soft"
        >
          <span>{{ CATEGORY_LABELS[row.fields.category] }}</span>
          <span class="font-display text-sm tabular-nums text-cgws-accent">{{ formatPrice(row.fields.price) }}</span>
          <span>{{ CONDITION_LABELS[row.fields.condition] }}</span>
        </div>

        <p
          v-else
          class="font-sans text-xs text-cgws-danger mt-1.5"
        >
          {{ row.reason }}
        </p>
      </div>
    </div>
  </template>
</template>
