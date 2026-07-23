<script setup lang="ts">
import type { ProductCondition } from '~/types'
import type { SelectOption } from '~/components/ui/CgwsSelect.vue'
import type { PhotoCompressionResult } from '~/utils/consignmentPhotoUpload'
import {
  compressPhotos,
  CUMULATIVE_PHOTO_LIMIT_MESSAGE,
  exceedsCumulativeLimit,
  PHOTO_COMPRESSION_OPTIONS,
  totalFileSize,
} from '~/utils/consignmentPhotoUpload'

/** Type guards de discrimination — nécessaires pour que `.filter()` étroitise
 * réellement le type (un simple `r => r.status === 'success'` ne le fait pas). */
function isCompressionSuccess(
  result: PhotoCompressionResult,
): result is Extract<PhotoCompressionResult, { status: 'success' }> {
  return result.status === 'success'
}
function isCompressionFailure(
  result: PhotoCompressionResult,
): result is Extract<PhotoCompressionResult, { status: 'failure' }> {
  return result.status === 'failure'
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ApiErrorShape {
  data?: {
    statusCode?: number
    data?: {
      errors?: Record<string, string>
    }
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONDITION_OPTIONS: SelectOption[] = [
  { value: 'excellent', label: 'Excellent état' },
  { value: 'good', label: 'Bon état' },
  { value: 'fair', label: 'État correct' },
]

const MAX_FILES = 5
const MAX_FILE_SIZE_MB = 5
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// ---------------------------------------------------------------------------
// Reactive state
// ---------------------------------------------------------------------------

// Form fields
const prenom = ref('')
const nom = ref('')
const email = ref('')
const phone = ref('')
const description = ref('')
const brand = ref('')
const condition = ref<ProductCondition | ''>('')
const askingPrice = ref<string>('')

// File upload
const uploadedFiles = ref<File[]>([])
const previewUrls = ref<string[]>([])
const isDragOver = ref(false)
const uploadError = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

// Analytics (US-103) — capture inerte sans PostHog, n'échoue jamais.
const { capture } = useAnalytics()

// UI state
const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)
const isCompressing = ref(false)
const isSuccess = ref(false)
const submittedPrenom = ref('')
const serverError = ref('')
const uploadErrorRef = ref<HTMLParagraphElement | null>(null)

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRegex = /^[0-9+\s\-()]{7,20}$/

function validateField(field: string, value: string): string {
  switch (field) {
    case 'prenom':
      return value.trim().length < 2 ? 'Le prénom est requis' : ''
    case 'nom':
      return value.trim().length < 2 ? 'Le nom est requis' : ''
    case 'email':
      return !emailRegex.test(value.trim()) ? 'Adresse email invalide' : ''
    case 'phone':
      return !phoneRegex.test(value.trim()) ? 'Numéro de téléphone invalide' : ''
    case 'description':
      return value.trim().length < 20
        ? "Décrivez l'article en au moins 20 caractères"
        : ''
    case 'condition':
      return !['excellent', 'good', 'fair'].includes(value)
        ? "Veuillez indiquer l'état de l'article"
        : ''
    case 'askingPrice': {
      const num = parseFloat(value)
      return isNaN(num) || num <= 0 || num > 50000
        ? 'Veuillez indiquer un prix valide'
        : ''
    }
    default:
      return ''
  }
}

function onBlur(field: string, value: string): void {
  const msg = validateField(field, value)
  if (msg) {
    errors.value = { ...errors.value, [field]: msg }
  } else {
    const { [field]: _removed, ...rest } = errors.value
    errors.value = rest
  }
}

function validateAll(): boolean {
  const fieldsToValidate: Array<[string, string]> = [
    ['prenom', prenom.value],
    ['nom', nom.value],
    ['email', email.value],
    ['phone', phone.value],
    ['description', description.value],
    ['condition', condition.value],
    ['askingPrice', askingPrice.value],
  ]

  const newErrors: Record<string, string> = {}
  for (const [field, value] of fieldsToValidate) {
    const msg = validateField(field, value)
    if (msg) newErrors[field] = msg
  }

  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

// ---------------------------------------------------------------------------
// File upload handlers
// ---------------------------------------------------------------------------

function processFiles(fileList: FileList | null): void {
  if (!fileList || fileList.length === 0) return

  uploadError.value = ''
  const incoming = Array.from(fileList)
  const accepted: File[] = []
  let errorMsg = ''

  for (const file of incoming) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      errorMsg = 'Format non accepté — seuls JPEG, PNG et WEBP sont autorisés'
      continue
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      errorMsg = `« ${file.name} » dépasse ${MAX_FILE_SIZE_MB} MB — fichier ignoré`
      continue
    }
    accepted.push(file)
  }

  const remaining = MAX_FILES - uploadedFiles.value.length
  const toAdd = accepted.slice(0, remaining)

  if (accepted.length > remaining) {
    errorMsg = `Maximum ${MAX_FILES} photos — les fichiers supplémentaires ont été ignorés`
  }

  for (const file of toAdd) {
    uploadedFiles.value.push(file)
    previewUrls.value.push(URL.createObjectURL(file))
  }

  if (errorMsg) uploadError.value = errorMsg
}

function handleDrop(event: DragEvent): void {
  isDragOver.value = false
  processFiles(event.dataTransfer?.files ?? null)
}

function handleFileInput(event: Event): void {
  processFiles((event.target as HTMLInputElement).files)
  // Reset the input so the same file can be added again after removal
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function removeFile(index: number): void {
  const url = previewUrls.value[index]
  if (url) URL.revokeObjectURL(url)
  uploadedFiles.value.splice(index, 1)
  previewUrls.value.splice(index, 1)
  uploadError.value = ''
}

/**
 * Retire les fichiers (et leurs previews) dont la compression a échoué
 * (US-095) — `indices` réfère à la position dans `uploadedFiles`/`previewUrls`
 * AVANT filtrage, telle que renvoyée par `compressPhotos`.
 */
function removeFilesByIndices(indices: Set<number>): void {
  const keptFiles: File[] = []
  const keptUrls: string[] = []

  uploadedFiles.value.forEach((file, index) => {
    if (indices.has(index)) {
      const url = previewUrls.value[index]
      if (url) URL.revokeObjectURL(url)
    } else {
      keptFiles.push(file)
      keptUrls.push(previewUrls.value[index]!)
    }
  })

  uploadedFiles.value = keptFiles
  previewUrls.value = keptUrls
}

function openFilePicker(): void {
  fileInputRef.value?.click()
}

function handleUploadKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    openFilePicker()
  }
}

// ---------------------------------------------------------------------------
// Form submission
// ---------------------------------------------------------------------------

/**
 * Compresse une photo via `browser-image-compression` — importée
 * DYNAMIQUEMENT (jamais en haut de fichier : la lib est browser-only et
 * casserait le rendu SSR du composant si elle était chargée au niveau
 * module). Voir app/utils/consignmentPhotoUpload.ts pour le détail des
 * options (~1600px de large max, qualité ~75%).
 */
async function compressOnePhoto(file: File): Promise<File> {
  const { default: imageCompression } = await import('browser-image-compression')
  return imageCompression(file, PHOTO_COMPRESSION_OPTIONS)
}

async function handleSubmit(): Promise<void> {
  serverError.value = ''

  if (!validateAll()) {
    await nextTick()
    const firstErrorEl = document.querySelector('[aria-invalid="true"]')
    firstErrorEl?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }

  isSubmitting.value = true
  uploadError.value = ''

  try {
    // ---------------------------------------------------------------------
    // US-095 — Compression client + garde de payload cumulé, AVANT tout
    // envoi réseau : évite un échec réseau opaque au-delà de la limite de
    // corps des fonctions serverless (voir app/utils/consignmentPhotoUpload.ts).
    // ---------------------------------------------------------------------
    let filesToUpload: File[] = uploadedFiles.value

    if (uploadedFiles.value.length > 0) {
      isCompressing.value = true
      const results = await compressPhotos(uploadedFiles.value, compressOnePhoto)
      isCompressing.value = false

      const successes = results.filter(isCompressionSuccess)
      const failures = results.filter(isCompressionFailure)

      if (failures.length > 0) {
        removeFilesByIndices(new Set(failures.map(f => f.index)))
        const names = failures.map(f => f.originalName).join(', ')
        uploadError.value = `Certaines photos n'ont pas pu être traitées et ont été retirées : ${names}`
      }

      filesToUpload = successes.map(s => s.file)

      const totalBytes = totalFileSize(filesToUpload)
      if (exceedsCumulativeLimit(totalBytes)) {
        uploadError.value = uploadError.value
          ? `${uploadError.value} ${CUMULATIVE_PHOTO_LIMIT_MESSAGE}`
          : CUMULATIVE_PHOTO_LIMIT_MESSAGE
        isSubmitting.value = false
        await nextTick()
        uploadErrorRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        uploadErrorRef.value?.focus()
        return
      }
    }

    const formData = new FormData()
    formData.append('prenom', prenom.value.trim())
    formData.append('nom', nom.value.trim())
    formData.append('email', email.value.trim())
    formData.append('phone', phone.value.trim())
    formData.append('description', description.value.trim())
    formData.append('brand', brand.value.trim())
    formData.append('condition', condition.value)
    formData.append('askingPrice', askingPrice.value)
    for (const file of filesToUpload) {
      formData.append('images', file, file.name)
    }

    await $fetch('/api/consignments/create', {
      method: 'POST',
      body: formData,
    })

    // US-103 — UNIQUEMENT dans la branche succès (le serveur a confirmé la
    // création ; un échec de validation ou serveur passe par le catch et ne
    // capture rien). `photos_count` est un COMPTE — jamais les fichiers ni
    // leurs noms. Pas de `category` : le formulaire n'en collecte pas.
    capture('consignment_submitted', { photos_count: filesToUpload.length })

    submittedPrenom.value = prenom.value.trim()
    isSuccess.value = true
    await nextTick()
    document
      .querySelector('[role="status"]')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } catch (err: unknown) {
    const apiErr = err as ApiErrorShape
    if (apiErr?.data?.statusCode === 422 && apiErr?.data?.data?.errors) {
      errors.value = apiErr.data.data.errors
      await nextTick()
      const firstErrorEl = document.querySelector('[aria-invalid="true"]')
      firstErrorEl?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      serverError.value =
        "Une erreur est survenue lors de l'envoi. Veuillez réessayer ou nous contacter directement."
    }
  } finally {
    isSubmitting.value = false
    isCompressing.value = false
  }
}

// ---------------------------------------------------------------------------
// Reset form (after success)
// ---------------------------------------------------------------------------

function resetForm(): void {
  prenom.value = ''
  nom.value = ''
  email.value = ''
  phone.value = ''
  description.value = ''
  brand.value = ''
  condition.value = ''
  askingPrice.value = ''
  for (const url of previewUrls.value) URL.revokeObjectURL(url)
  uploadedFiles.value = []
  previewUrls.value = []
  errors.value = {}
  uploadError.value = ''
  serverError.value = ''
  isSuccess.value = false
  submittedPrenom.value = ''
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

// US-103 — consignment_form_viewed : affichage du formulaire de dépôt
// (onMounted = client only, une capture par visite de /consignation).
onMounted(() => {
  capture('consignment_form_viewed')
})

onUnmounted(() => {
  for (const url of previewUrls.value) URL.revokeObjectURL(url)
})
</script>

<template>
  <section
    id="consignment-form"
    class="bg-cgws-ground py-10 md:py-14 lg:py-16"
  >
    <div class="max-w-2xl mx-auto px-[clamp(1rem,4vw,2rem)]">

      <!-- Section heading -->
      <div class="text-center mb-10">
        <p class="font-eyebrow text-cgws-accent text-sm tracking-widest uppercase mb-2">
          VOTRE DEMANDE
        </p>
        <h2 class="font-serif font-bold text-cgws-ink text-3xl">
          Formulaire de Consignation
        </h2>
      </div>

      <!-- Form / Success transition -->
      <Transition name="fade-form" mode="out-in">

        <!-- ---- SUCCESS STATE ---- -->
        <div
          v-if="isSuccess"
          key="success"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div class="mx-auto max-w-xl border-[3px] border-cgws-ink bg-cgws-surface p-1.5">
            <div class="border border-cgws-ink p-8 text-center">
              <UIcon
                name="i-lucide-check-circle"
                class="w-12 h-12 text-cgws-accent mx-auto mb-4"
                aria-hidden="true"
              />
              <p class="font-display text-4xl text-cgws-ink tracking-wide mb-2 uppercase">
                Demande reçue !
              </p>
              <p class="font-serif font-semibold text-xl text-cgws-ink mb-4">
                Merci {{ submittedPrenom }}&nbsp;!
              </p>
              <p class="font-sans text-sm text-cgws-ink/70 leading-relaxed mb-2">
                Votre demande de consignation a bien été enregistrée.
              </p>
              <p class="font-sans text-sm text-cgws-ink/70 leading-relaxed mb-2">
                Camille vous contactera sous 48h pour valider les conditions.
              </p>
              <p class="font-sans text-xs text-cgws-ink/50 italic">
                Un email de confirmation vient d'être envoyé à votre adresse.
              </p>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <CgwsButton variant="secondary" as="NuxtLink" to="/catalogue">
              RETOUR AU CATALOGUE
            </CgwsButton>
            <CgwsButton variant="ghost" @click="resetForm">
              Faire une nouvelle demande
            </CgwsButton>
          </div>
        </div>

        <!-- ---- FORM STATE ---- -->
        <form
          v-else
          key="form"
          aria-label="Formulaire de demande de consignation"
          novalidate
          @submit.prevent="handleSubmit"
        >

          <!-- ================================================================
               Fieldset 1 — Vos coordonnées
          ================================================================ -->
          <fieldset
            class="bg-cgws-ground border border-cgws-hairline rounded-sm p-6 mb-6"
          >
            <legend class="font-sans font-semibold text-xs uppercase tracking-widest text-cgws-accent mb-4 block px-1">
              VOS COORDONNÉES
            </legend>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Prénom -->
              <CgwsInput
                id="field-prenom"
                v-model="prenom"
                label="Prénom"
                name="prenom"
                required
                :disabled="isSubmitting"
                :error="errors['prenom']"
                @blur="onBlur('prenom', prenom)"
              />
              <!-- Nom -->
              <CgwsInput
                id="field-nom"
                v-model="nom"
                label="Nom"
                name="nom"
                required
                :disabled="isSubmitting"
                :error="errors['nom']"
                @blur="onBlur('nom', nom)"
              />
              <!-- Email -->
              <CgwsInput
                id="field-email"
                v-model="email"
                label="Email"
                name="email"
                type="email"
                required
                :disabled="isSubmitting"
                :error="errors['email']"
                @blur="onBlur('email', email)"
              />
              <!-- Téléphone -->
              <CgwsInput
                id="field-phone"
                v-model="phone"
                label="Téléphone"
                name="phone"
                type="tel"
                required
                :disabled="isSubmitting"
                :error="errors['phone']"
                @blur="onBlur('phone', phone)"
              />
            </div>
          </fieldset>

          <!-- ================================================================
               Fieldset 2 — Votre article
          ================================================================ -->
          <fieldset
            class="bg-cgws-ground border border-cgws-hairline rounded-sm p-6 mb-6"
          >
            <legend class="font-sans font-semibold text-xs uppercase tracking-widest text-cgws-accent mb-4 block px-1">
              VOTRE ARTICLE
            </legend>

            <div class="grid grid-cols-1 gap-4">
              <!-- Description -->
              <CgwsTextarea
                id="field-description"
                v-model="description"
                label="Description de l'article"
                name="description"
                :rows="4"
                placeholder="Marque, taille, état général, accessoires inclus…"
                required
                :disabled="isSubmitting"
                :error="errors['description']"
                @blur="onBlur('description', description)"
              />

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Marque (optionnel) -->
                <CgwsInput
                  id="field-brand"
                  v-model="brand"
                  label="Marque"
                  name="brand"
                  placeholder="ex. Billy Cook, Circle Y…"
                  :disabled="isSubmitting"
                />
                <!-- État -->
                <CgwsSelect
                  id="field-condition"
                  v-model="condition"
                  label="État"
                  name="condition"
                  :options="CONDITION_OPTIONS"
                  required
                  :disabled="isSubmitting"
                  :error="errors['condition']"
                  @blur="onBlur('condition', condition)"
                />
              </div>

              <!-- Prix souhaité -->
              <div class="sm:w-1/2">
                <CgwsInput
                  id="field-price"
                  v-model="askingPrice"
                  label="Prix souhaité (€)"
                  name="askingPrice"
                  type="number"
                  placeholder="ex. 450"
                  required
                  :disabled="isSubmitting"
                  :error="errors['askingPrice']"
                  @blur="onBlur('askingPrice', askingPrice)"
                />
              </div>
            </div>
          </fieldset>

          <!-- ================================================================
               Fieldset 3 — Photos
          ================================================================ -->
          <fieldset
            class="bg-cgws-ground border border-cgws-hairline rounded-sm p-6 mb-6"
          >
            <legend class="font-sans font-semibold text-xs uppercase tracking-widest text-cgws-accent mb-4 block px-1">
              VOS PHOTOS <span class="font-sans font-normal normal-case tracking-normal text-cgws-ink-soft/70">— optionnel, {{ MAX_FILES }} photos max</span>
            </legend>

            <!-- Drop zone -->
            <div
              role="button"
              tabindex="0"
              :aria-label="isSubmitting
                ? 'Zone de dépôt de photos désactivée'
                : 'Zone de dépôt de photos — activez pour parcourir vos fichiers'"
              :aria-disabled="isSubmitting || uploadedFiles.length >= MAX_FILES ? 'true' : undefined"
              :class="[
                'border-2 border-dashed rounded-sm p-8 text-center',
                'transition-colors duration-200',
                isDragOver
                  ? 'border-cgws-accent bg-cgws-surface border-solid'
                  : 'border-cgws-accent/40 hover:border-cgws-accent hover:bg-cgws-surface/50',
                isSubmitting || uploadedFiles.length >= MAX_FILES
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer',
              ]"
              @click="!isSubmitting && uploadedFiles.length < MAX_FILES && openFilePicker()"
              @keydown="handleUploadKeydown"
              @dragenter.prevent="isDragOver = true"
              @dragover.prevent="isDragOver = true"
              @dragleave.prevent="isDragOver = false"
              @drop.prevent="handleDrop"
            >
              <UIcon
                name="i-lucide-cloud-upload"
                class="w-8 h-8 mx-auto mb-3 text-cgws-accent/60"
                aria-hidden="true"
              />
              <p class="font-sans font-medium text-cgws-ink mb-2">
                Glissez vos photos ici
              </p>
              <CgwsButton
                variant="ghost"
                size="sm"
                type="button"
                :disabled="isSubmitting || uploadedFiles.length >= MAX_FILES"
                @click.stop="openFilePicker"
              >
                Parcourir les fichiers
              </CgwsButton>
              <p class="font-sans text-xs text-cgws-ink-soft mt-3">
                JPEG, PNG ou WEBP · {{ MAX_FILES }} photos max · {{ MAX_FILE_SIZE_MB }} MB par fichier
              </p>
            </div>

            <!-- Hidden file input -->
            <input
              ref="fileInputRef"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              :disabled="isSubmitting || uploadedFiles.length >= MAX_FILES"
              class="sr-only"
              aria-hidden="true"
              @change="handleFileInput"
            >

            <!-- Compression in progress feedback (US-095) — explicite pour ne
                 pas laisser croire que le formulaire est planté pendant que
                 les photos se compressent avant l'envoi -->
            <p
              v-if="isCompressing"
              role="status"
              aria-live="polite"
              class="font-sans text-xs text-cgws-ink-soft mt-2 flex items-center gap-1.5"
            >
              <UIcon name="i-lucide-loader-circle" class="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              Compression de vos photos en cours, veuillez patienter…
            </p>

            <!-- Upload error -->
            <!-- `focus:` (et non `focus-visible:`) délibérément : cet élément
                 ne reçoit JAMAIS le focus par un clic/tab direct de
                 l'utilisateur — uniquement via un `.focus()` programmatique
                 (voir handleSubmit, seuil cumulé dépassé). L'heuristique
                 `:focus-visible` des navigateurs ne garantit pas le
                 déclenchement du ring sur un focus scripté (dépend de la
                 dernière modalité d'interaction détectée) ; `focus:` assure
                 un repère visuel fiable dans tous les cas, sans l'inconvénient
                 habituel (ring qui « traîne » après un clic souris) puisque
                 personne ne clique directement sur ce `<p>`. -->
            <p
              v-if="uploadError"
              ref="uploadErrorRef"
              role="alert"
              tabindex="-1"
              class="font-sans text-xs text-cgws-danger mt-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cgws-accent rounded-sm"
            >
              {{ uploadError }}
            </p>

            <!-- Preview grid -->
            <div
              v-if="uploadedFiles.length > 0"
              class="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-4"
              aria-label="Aperçu des photos sélectionnées"
            >
              <div
                v-for="(url, index) in previewUrls"
                :key="url"
                class="relative aspect-square rounded-sm overflow-hidden
                       bg-cgws-surface border border-cgws-hairline"
              >
                <img
                  :src="url"
                  :alt="`Aperçu photo ${index + 1}`"
                  class="w-full h-full object-cover"
                  loading="lazy"
                >
                <button
                  type="button"
                  :aria-label="`Supprimer la photo numéro ${index + 1}`"
                  :disabled="isSubmitting"
                  class="absolute top-1 right-1 w-5 h-5 rounded-full
                         bg-cgws-danger text-cgws-on-danger text-xs font-bold
                         flex items-center justify-center
                         hover:bg-cgws-brand-espresso transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
                  @click="removeFile(index)"
                >
                  ×
                </button>
              </div>
            </div>
          </fieldset>

          <!-- ================================================================
               Server error banner
          ================================================================ -->
          <div
            v-if="serverError"
            role="alert"
            class="bg-cgws-danger/10 border border-cgws-danger rounded-sm p-4 mb-6"
          >
            <p class="font-sans text-sm text-cgws-danger font-medium">
              {{ serverError }}
            </p>
          </div>

          <!-- ================================================================
               Submit button + alternate contact
          ================================================================ -->
          <div class="flex flex-col items-center gap-4">
            <CgwsButton
              type="submit"
              variant="primary"
              size="md"
              :loading="isSubmitting"
              class="w-full sm:w-auto min-w-[240px]"
            >
              {{ isCompressing ? 'COMPRESSION DES PHOTOS…' : isSubmitting ? 'ENVOI EN COURS…' : 'ENVOYER MA DEMANDE' }}
            </CgwsButton>

            <p class="font-sans text-sm text-cgws-ink/60 text-center">
              Ou contactez-nous directement :
              <!-- TODO: remplacer par le vrai numéro de Camille avant mise en ligne -->
              <a
                href="tel:+33200000000"
                class="text-cgws-accent hover:underline transition-colors font-medium"
              >
                02 XX XX XX XX
              </a>
            </p>
          </div>

        </form>
      </Transition>

    </div>
  </section>
</template>

<style scoped>
.fade-form-enter-active,
.fade-form-leave-active {
  transition: opacity 0.3s ease;
}
.fade-form-enter-from,
.fade-form-leave-to {
  opacity: 0;
}
</style>
