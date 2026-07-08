import type {
  PreviewRow,
  PreviewRowValid,
  PreviewResult,
  ImportSummary,
  ConfirmResponse,
} from '#shared/utils/csvImport'

/**
 * Orchestrates the two-step CSV product import (US-063): preview (dry-run, no
 * DB write) then confirm (batch insert of the exact validated rows).
 *
 * State only — focus management and DOM refs stay in the page (`import.vue`),
 * which owns the summary/result elements the a11y spec focuses after each async
 * response.
 */
export function useProductImport() {
  const { getAccessToken, buildAuthHeaders } = useAdminApi()

  const selectedFile = ref<File | null>(null)

  const isPreviewing = ref(false)
  const isConfirming = ref(false)

  /** Blocking preview error (encoding / missing columns / empty / size / lines). */
  const blockingError = ref<string | null>(null)
  /** Unexpected confirm failure (network / server) — distinct from per-row failures. */
  const confirmError = ref<string | null>(null)

  /** Merged + line-sorted rows for the preview table. */
  const previewRows = ref<PreviewRow[]>([])
  /** Exact valid rows kept to POST to confirm. */
  const validRows = ref<PreviewRowValid[]>([])
  const summary = ref<ImportSummary | null>(null)
  const confirmResult = ref<ConfirmResponse | null>(null)

  const hasPreview = computed(() => summary.value !== null)
  const canConfirm = computed(() => (summary.value?.valid ?? 0) > 0)

  /** Link to the imported products, scoped by the created IDs (US-063 §6.5). */
  const importedProductsLink = computed(() => {
    const ids = confirmResult.value?.created.map(c => c.id) ?? []
    return ids.length > 0
      ? `/admin/produits?ids=${ids.join(',')}`
      : '/admin/produits'
  })

  /** Clears every trace of a previous preview/confirm (US-063 §6.4). */
  function resetResults() {
    previewRows.value = []
    validRows.value = []
    summary.value = null
    confirmResult.value = null
    blockingError.value = null
    confirmError.value = null
  }

  /** Full reset, including the selected file. */
  function resetAll() {
    resetResults()
    selectedFile.value = null
    isPreviewing.value = false
    isConfirming.value = false
  }

  async function runPreview() {
    if (!selectedFile.value || isPreviewing.value) return
    resetResults()
    isPreviewing.value = true

    try {
      const token = await getAccessToken()
      const form = new FormData()
      form.append('file', selectedFile.value)

      const res = await $fetch<PreviewResult>('/api/admin/products/import/preview', {
        method: 'POST',
        body: form,
        headers: buildAuthHeaders(token),
      })

      if (!res.ok) {
        blockingError.value = res.error
        return
      }

      validRows.value = res.validRows
      summary.value = res.summary
      previewRows.value = [...res.validRows, ...res.errorRows].sort((a, b) => a.line - b.line)
    }
    catch {
      blockingError.value = "Une erreur est survenue lors de l'analyse du fichier. Veuillez réessayer."
    }
    finally {
      isPreviewing.value = false
    }
  }

  async function runConfirm() {
    if (!canConfirm.value || isConfirming.value) return
    isConfirming.value = true
    confirmError.value = null

    try {
      const token = await getAccessToken()
      const res = await $fetch<ConfirmResponse>('/api/admin/products/import/confirm', {
        method: 'POST',
        body: { rows: validRows.value },
        headers: buildAuthHeaders(token),
      })
      confirmResult.value = res
    }
    catch {
      confirmError.value = "Une erreur est survenue lors de l'import. Veuillez réessayer."
    }
    finally {
      isConfirming.value = false
    }
  }

  return {
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
  }
}
