<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
  layout: 'admin',
  title: 'Import CSV produits',
})

useSeoMeta({
  title: 'Import CSV produits — CGWS Administration',
  robots: 'noindex, nofollow',
})

const { initSession } = useAdminAuth()
await initSession()

const {
  selectedFile,
  isPreviewing,
  isConfirming,
  blockingError,
  confirmError,
  previewRows,
  summary,
  confirmResult,
  hasPreview,
  canConfirm,
  importedProductsLink,
  runPreview,
  runConfirm,
  resetResults,
  resetAll,
} = useProductImport()

// ─── Focus targets (a11y §8) ───────────────────────────────────────────────────
const summaryRef = ref<HTMLElement | null>(null)
const resultRef = ref<HTMLElement | null>(null)
const blockingAlertRef = ref<HTMLElement | null>(null)

// Reset any previous preview/result whenever the selected file changes
// (new file dropped, or file removed) — US-063 §6.4.
watch(selectedFile, () => {
  resetResults()
})

function onDropzoneError() {
  // The dropzone renders its own error; just clear stale preview state.
  resetResults()
}

async function handlePreview() {
  await runPreview()
  await nextTick()
  if (blockingError.value) blockingAlertRef.value?.focus()
  else if (summary.value) summaryRef.value?.focus()
}

async function handleConfirm() {
  await runConfirm()
  await nextTick()
  if (confirmResult.value) resultRef.value?.focus()
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink
        to="/admin/produits"
        class="p-1.5 rounded-sm text-cgws-ink-soft hover:text-cgws-accent hover:bg-cgws-accent/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
        aria-label="Retour à la liste des produits"
      >
        <UIcon
          name="i-lucide-arrow-left"
          class="w-5 h-5"
          aria-hidden="true"
        />
      </NuxtLink>
      <div>
        <h2 class="font-serif font-bold text-2xl text-cgws-ink">
          Import CSV produits
        </h2>
        <p class="font-sans text-sm text-cgws-ink-soft mt-0.5">
          Créez plusieurs produits d'un coup. Un aperçu est toujours affiché avant tout enregistrement.
        </p>
      </div>
    </div>

    <!-- Format attendu (static) -->
    <section
      aria-labelledby="csv-format-heading"
      class="bg-cgws-surface border border-cgws-hairline rounded-[4px] p-4 mb-4"
    >
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3
            id="csv-format-heading"
            class="font-sans font-semibold text-xs uppercase tracking-widest text-cgws-accent mb-2"
          >
            Format de fichier attendu
          </h3>
          <p class="font-sans text-sm text-cgws-ink-soft">
            Fichier <strong class="text-cgws-ink font-medium">.csv</strong>, encodage
            <strong class="text-cgws-ink font-medium">UTF-8</strong>, séparateur
            <strong class="text-cgws-ink font-medium">virgule</strong>, en-tête en première ligne.
          </p>
          <dl class="mt-2 font-sans text-xs text-cgws-ink-soft grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
            <div><dt class="inline font-medium text-cgws-ink">titre</dt> <dd class="inline">— requis</dd></div>
            <div><dt class="inline font-medium text-cgws-ink">categorie</dt> <dd class="inline">— requis</dd></div>
            <div><dt class="inline font-medium text-cgws-ink">marque</dt> <dd class="inline">— optionnel</dd></div>
            <div><dt class="inline font-medium text-cgws-ink">description</dt> <dd class="inline">— optionnel</dd></div>
            <div><dt class="inline font-medium text-cgws-ink">prix</dt> <dd class="inline">— requis</dd></div>
            <div><dt class="inline font-medium text-cgws-ink">etat</dt> <dd class="inline">— requis</dd></div>
            <div><dt class="inline font-medium text-cgws-ink">taille</dt> <dd class="inline">— optionnel</dd></div>
            <div><dt class="inline font-medium text-cgws-ink">stock</dt> <dd class="inline">— défaut 1</dd></div>
          </dl>
          <p class="font-sans text-xs text-cgws-ink-soft mt-2 italic">
            Aucune colonne image — ajoutez les photos ensuite depuis la fiche produit.
          </p>
        </div>
        <a
          href="/templates/import-produits-modele.csv"
          download
          class="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-cgws-edge text-cgws-accent font-sans text-sm font-semibold hover:bg-cgws-accent/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent focus-visible:ring-offset-2 focus-visible:ring-offset-cgws-surface flex-shrink-0"
        >
          <UIcon
            name="i-lucide-download"
            class="w-4 h-4"
            aria-hidden="true"
          />
          Télécharger un modèle CSV
        </a>
      </div>
    </section>

    <!-- Dropzone -->
    <CsvDropzone
      v-model="selectedFile"
      :disabled="isPreviewing || isConfirming"
      @error="onDropzoneError"
    />

    <!-- Preview action -->
    <div>
      <CgwsButton
        variant="primary"
        size="md"
        :disabled="!selectedFile || isPreviewing"
        :loading="isPreviewing"
        @click="handlePreview()"
      >
        {{ isPreviewing ? 'Analyse en cours…' : "Prévisualiser l'import" }}
      </CgwsButton>
    </div>

    <!-- Loading preview -->
    <ImportPreviewTable
      v-if="isPreviewing"
      :rows="[]"
      loading
    />

    <!-- Blocking error (encoding / columns / empty / size / lines) -->
    <div
      v-else-if="blockingError"
      ref="blockingAlertRef"
      role="alert"
      aria-live="assertive"
      tabindex="-1"
      class="bg-cgws-danger/10 border border-cgws-danger rounded-[4px] p-4 flex items-start gap-3 focus:outline-none"
    >
      <UIcon
        name="i-lucide-triangle-alert"
        class="w-5 h-5 text-cgws-danger flex-shrink-0 mt-0.5"
        aria-hidden="true"
      />
      <div>
        <p class="font-sans text-sm font-semibold text-cgws-danger">
          Import impossible
        </p>
        <p class="font-sans text-sm text-cgws-ink-soft mt-0.5">
          {{ blockingError }}
        </p>
      </div>
    </div>

    <!-- Preview results -->
    <template v-else-if="hasPreview && summary">
      <!-- Summary banner -->
      <div
        ref="summaryRef"
        tabindex="-1"
        role="status"
        aria-live="polite"
        :aria-label="`${summary.valid} ligne(s) valide(s), ${summary.error} ligne(s) en erreur, ${summary.total} ligne(s) au total`"
        class="bg-cgws-surface border border-cgws-hairline rounded-[4px] flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-cgws-hairline focus:outline-none"
      >
        <div class="flex-1 p-4 flex items-center justify-between sm:flex-col sm:items-start sm:justify-center gap-1">
          <span class="font-sans text-xs uppercase tracking-widest text-cgws-ink-soft">Lignes valides</span>
          <span class="font-display text-3xl tabular-nums text-cgws-success">{{ summary.valid }}</span>
        </div>
        <div class="flex-1 p-4 flex items-center justify-between sm:flex-col sm:items-start sm:justify-center gap-1">
          <span class="font-sans text-xs uppercase tracking-widest text-cgws-ink-soft">Lignes en erreur</span>
          <span
            class="font-display text-3xl tabular-nums"
            :class="summary.error > 0 ? 'text-cgws-danger' : 'text-cgws-ink-soft'"
          >{{ summary.error }}</span>
        </div>
        <div class="flex-1 p-4 flex items-center justify-between sm:flex-col sm:items-start sm:justify-center gap-1">
          <span class="font-sans text-xs uppercase tracking-widest text-cgws-ink-soft">Total</span>
          <span class="font-display text-3xl tabular-nums text-cgws-ink">{{ summary.total }}</span>
        </div>
      </div>

      <!-- Preview table -->
      <ImportPreviewTable :rows="previewRows" />

      <!-- Actions (before confirm) -->
      <div
        v-if="!confirmResult"
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2"
      >
        <button
          type="button"
          class="font-sans text-sm text-cgws-ink-soft hover:text-cgws-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent rounded-sm self-start"
          @click="resetAll()"
        >
          Importer un autre fichier
        </button>
        <div class="sm:text-right">
          <CgwsButton
            variant="primary"
            size="md"
            class="w-full sm:w-auto"
            :disabled="!canConfirm || isConfirming"
            :aria-disabled="!canConfirm"
            :loading="isConfirming"
            @click="handleConfirm()"
          >
            {{ isConfirming ? 'Import en cours…' : "Valider l'import" }}
          </CgwsButton>
          <p
            v-if="!canConfirm && !isConfirming"
            class="font-sans text-xs text-cgws-ink-soft mt-1.5"
          >
            Aucune ligne valide à importer — corrigez le fichier et déposez-le à nouveau.
          </p>
        </div>
      </div>

      <!-- Confirm error (network / server) -->
      <div
        v-if="confirmError"
        role="alert"
        aria-live="assertive"
        class="bg-cgws-danger/10 border border-cgws-danger rounded-[4px] p-4 flex items-start gap-3"
      >
        <UIcon
          name="i-lucide-triangle-alert"
          class="w-5 h-5 text-cgws-danger flex-shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <p class="font-sans text-sm text-cgws-ink-soft">
          {{ confirmError }}
        </p>
      </div>

      <!-- Final result -->
      <div
        v-if="confirmResult"
        ref="resultRef"
        tabindex="-1"
        role="status"
        aria-live="polite"
        class="bg-cgws-surface border border-cgws-hairline rounded-[4px] p-5 focus:outline-none"
      >
        <div class="flex items-start gap-3">
          <div class="w-9 h-9 rounded-full bg-cgws-success/15 flex items-center justify-center flex-shrink-0">
            <UIcon
              name="i-lucide-circle-check"
              class="w-5 h-5 text-cgws-success"
              aria-hidden="true"
            />
          </div>
          <div>
            <p class="font-sans text-sm font-semibold text-cgws-ink">
              {{ confirmResult.created.length }} produit{{ confirmResult.created.length !== 1 ? 's' : '' }}
              créé{{ confirmResult.created.length !== 1 ? 's' : '' }} avec succès
            </p>
            <NuxtLink
              v-if="confirmResult.created.length > 0"
              :to="importedProductsLink"
              class="font-sans text-sm text-cgws-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent rounded-sm"
            >
              Voir les produits importés →
            </NuxtLink>
          </div>
        </div>

        <!-- Failures at confirm (concurrent slug conflict, etc.) -->
        <div
          v-if="confirmResult.failed.length > 0"
          class="mt-4 pt-4 border-t border-cgws-hairline"
        >
          <p class="font-sans text-sm font-semibold text-cgws-danger mb-2">
            {{ confirmResult.failed.length }} ligne{{ confirmResult.failed.length !== 1 ? 's' : '' }}
            n'{{ confirmResult.failed.length !== 1 ? 'ont' : 'a' }} pas pu être importée{{ confirmResult.failed.length !== 1 ? 's' : '' }}
          </p>
          <ul class="space-y-1">
            <li
              v-for="f in confirmResult.failed"
              :key="f.line"
              class="font-sans text-xs text-cgws-ink-soft"
            >
              <span class="text-cgws-danger font-medium">L.{{ f.line }}</span> — {{ f.reason }}
            </li>
          </ul>
        </div>

        <!-- Post-import: import another file -->
        <div class="mt-4 pt-4 border-t border-cgws-hairline">
          <button
            type="button"
            class="font-sans text-sm text-cgws-ink-soft hover:text-cgws-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent rounded-sm"
            @click="resetAll()"
          >
            Importer un autre fichier
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
