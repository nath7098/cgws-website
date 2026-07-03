<script setup lang="ts">
import type { SelectOption } from '~/components/ui/CgwsSelect.vue'
import type { Product, ProductCategory, ProductCondition, ProductFormPayload } from '~/types'

interface Props {
  mode: 'create' | 'edit'
  initialData?: Product
  isSubmitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initialData: undefined,
  isSubmitting: false,
})

const emit = defineEmits<{
  submit: [payload: ProductFormPayload]
  cancel: []
}>()

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'selles', label: 'Selles' },
  { value: 'brides-licols', label: 'Brides & Licols' },
  { value: 'bottes-chaussures', label: 'Bottes & Chaussures' },
  { value: 'vetements', label: 'Vêtements' },
  { value: 'accessoires', label: 'Accessoires' },
  { value: 'protections', label: 'Protections' },
]

const CONDITION_OPTIONS: SelectOption[] = [
  { value: 'new', label: 'Neuf' },
  { value: 'excellent', label: 'Excellent état' },
  { value: 'good', label: 'Bon état' },
  { value: 'fair', label: 'État correct' },
]

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'active', label: 'Disponible' },
  { value: 'reserved', label: 'Réservé' },
  { value: 'sold', label: 'Vendu' },
  { value: 'inactive', label: 'Inactif' },
]

// ─── Form state ───────────────────────────────────────────────────────────────

const form = reactive({
  title: props.initialData?.title ?? '',
  category: props.initialData?.category ?? '' as ProductCategory | '',
  brand: props.initialData?.brand ?? '',
  description: props.initialData?.description ?? '',
  price: props.initialData?.price != null ? String(props.initialData.price) : '',
  condition: props.initialData?.condition ?? '' as ProductCondition | '',
  size: props.initialData?.size ?? '',
  stock: props.initialData?.stock != null ? String(props.initialData.stock) : '1',
  isConsignment: props.initialData?.isConsignment ?? false,
  consignmentId: props.initialData?.consignmentId ?? '' as string,
  status: props.initialData?.status ?? 'active',
  // Image management (v-model bound to ImageUploader)
  keptImages: props.initialData?.images ?? [] as string[],
  newFiles: [] as File[],
  removedImages: [] as string[],
})

const errors = reactive({
  title: '',
  category: '',
  price: '',
  condition: '',
  consignmentId: '',
})

const serverError = ref('')

// ─── Slug preview ─────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const slugPreview = computed(() => {
  const base = [form.title, form.brand].filter(Boolean).join(' ')
  return slugify(base)
})

// ─── Consignment options (accepted only) ──────────────────────────────────────

interface ConsignmentOption { id: string, depositor_name: string, item_description: string }
const acceptedConsignmentOptions = ref<SelectOption[]>([])

onMounted(async () => {
  try {
    const supabase = useSupabase()
    const { data } = await supabase
      .from('consignments')
      .select('id, depositor_name, item_description')
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })

    if (data) {
      acceptedConsignmentOptions.value = (data as ConsignmentOption[]).map(c => ({
        value: c.id,
        label: `${c.depositor_name} — ${c.item_description.slice(0, 40)}`,
      }))
    }
  }
  catch {
    // Non-fatal: consignment select remains empty
  }
})

// ─── Validation ───────────────────────────────────────────────────────────────

function validateField(field: keyof typeof errors): boolean {
  errors[field] = ''
  switch (field) {
    case 'title':
      if (!form.title.trim()) {
        errors.title = 'Le nom du produit est requis'
        return false
      }
      break
    case 'category':
      if (!form.category) {
        errors.category = 'La catégorie est requise'
        return false
      }
      break
    case 'price': {
      const p = Number(form.price)
      if (!form.price || isNaN(p) || p <= 0) {
        errors.price = 'Un prix valide et supérieur à 0 est requis'
        return false
      }
      break
    }
    case 'condition':
      if (!form.condition) {
        errors.condition = "L'état est requis"
        return false
      }
      break
    case 'consignmentId':
      if (form.isConsignment && !form.consignmentId) {
        errors.consignmentId = 'Veuillez sélectionner un dépôt associé'
        return false
      }
      break
  }
  return true
}

function validateAll(): boolean {
  const fields: Array<keyof typeof errors> = ['title', 'category', 'price', 'condition', 'consignmentId']
  return fields.map(f => validateField(f)).every(Boolean)
}

// ─── Submit ───────────────────────────────────────────────────────────────────

function handleSubmit() {
  serverError.value = ''
  if (!validateAll()) return

  const payload: ProductFormPayload = {
    fields: {
      title: form.title.trim(),
      category: form.category as ProductCategory,
      brand: form.brand.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      condition: form.condition as ProductCondition,
      size: form.size.trim(),
      stock: Math.max(0, Math.floor(Number(form.stock) || 0)),
      isConsignment: form.isConsignment,
      consignmentId: form.isConsignment && form.consignmentId ? form.consignmentId : null,
      slug: slugPreview.value,
      status: form.status as 'active' | 'sold' | 'reserved' | 'inactive',
    },
    newImages: [...form.newFiles],
    keptImages: [...form.keptImages],
    removedImages: [...form.removedImages],
  }

  emit('submit', payload)
}

// Expose setServerError so parent pages can set it after a failed API call
function setServerError(msg: string) {
  serverError.value = msg
}

defineExpose({ setServerError })
</script>

<template>
  <form
    novalidate
    class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start"
    @submit.prevent="handleSubmit"
  >
    <!-- ── Left column: fields (2/3) ─────────────────────────────────────────── -->
    <div class="lg:col-span-2 space-y-5">

      <!-- Fieldset 1: Informations générales -->
      <fieldset class="bg-cgws-surface border border-cgws-hairline rounded-[4px] p-5 space-y-4">
        <legend class="font-sans font-semibold text-xs uppercase tracking-widest text-cgws-accent px-1 mb-1">
          Informations générales
        </legend>

        <CgwsInput
          v-model="form.title"
          label="Nom du produit"
          name="title"
          required
          :error="errors.title"
          placeholder="ex. Selle de Trail Billy Cook"
          @blur="validateField('title')"
        />

        <p class="font-sans text-xs text-cgws-ink-soft -mt-2">
          URL :
          <code class="text-cgws-accent font-mono">/catalogue/{{ slugPreview || '…' }}</code>
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CgwsSelect
            v-model="form.category"
            label="Catégorie"
            name="category"
            required
            :options="CATEGORY_OPTIONS"
            :error="errors.category"
            placeholder="— Sélectionnez —"
            @change="validateField('category')"
          />
          <CgwsInput
            v-model="form.brand"
            label="Marque"
            name="brand"
            placeholder="ex. Billy Cook, Wintec…"
          />
        </div>

        <CgwsTextarea
          v-model="form.description"
          label="Description"
          name="description"
          :rows="4"
          placeholder="Décrivez le produit en détail…"
        />
      </fieldset>

      <!-- Fieldset 2: Prix & Stock -->
      <fieldset class="bg-cgws-surface border border-cgws-hairline rounded-[4px] p-5 space-y-4">
        <legend class="font-sans font-semibold text-xs uppercase tracking-widest text-cgws-accent px-1 mb-1">
          Prix &amp; Stock
        </legend>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <CgwsInput
            v-model="form.price"
            label="Prix (€)"
            name="price"
            type="number"
            required
            :error="errors.price"
            placeholder="0.00"
            @blur="validateField('price')"
          />
          <CgwsSelect
            v-model="form.condition"
            label="État"
            name="condition"
            required
            :options="CONDITION_OPTIONS"
            :error="errors.condition"
            placeholder="— État —"
            @change="validateField('condition')"
          />
          <CgwsInput
            v-model="form.size"
            label="Taille / Dimensions"
            name="size"
            placeholder='ex. 16.5" W'
          />
          <CgwsInput
            v-model="form.stock"
            label="Stock"
            name="stock"
            type="number"
            hint="Défaut : 1"
          />
        </div>

        <!-- Status (edit mode only) -->
        <div v-if="mode === 'edit'">
          <CgwsSelect
            v-model="form.status"
            label="Statut"
            name="status"
            :options="STATUS_OPTIONS"
            placeholder="— Statut —"
          />
        </div>
      </fieldset>

      <!-- Fieldset 3: Consignation -->
      <fieldset class="bg-cgws-surface border border-cgws-hairline rounded-[4px] p-5">
        <legend class="font-sans font-semibold text-xs uppercase tracking-widest text-cgws-accent px-1 mb-3">
          Consignation
        </legend>

        <label
          class="flex items-center gap-3 cursor-pointer group"
          for="field-is-consignment"
        >
          <input
            id="field-is-consignment"
            v-model="form.isConsignment"
            type="checkbox"
            class="w-4 h-4 rounded-sm border-cgws-edge accent-cgws-accent focus-visible:ring-2 focus-visible:ring-cgws-accent focus-visible:ring-offset-2"
          >
          <span class="font-sans text-sm font-medium text-cgws-ink group-hover:text-cgws-accent transition-colors">
            Article en consignation
          </span>
        </label>
        <p class="font-sans text-xs text-cgws-ink-soft mt-1 ml-7">
          Cochez si cet article a été déposé par un particulier via le service de consignation.
        </p>

        <Transition name="expand">
          <div
            v-if="form.isConsignment"
            class="mt-4"
          >
            <CgwsSelect
              v-model="form.consignmentId"
              label="Dépôt associé"
              name="consignmentId"
              :options="acceptedConsignmentOptions"
              placeholder="— Sélectionnez un dépôt accepté —"
              hint="Seuls les dépôts au statut « Acceptée » sont listés"
              :error="errors.consignmentId"
              @change="validateField('consignmentId')"
            />
          </div>
        </Transition>
      </fieldset>

      <!-- Server error banner -->
      <div
        v-if="serverError"
        role="alert"
        class="bg-cgws-danger/10 border border-cgws-danger rounded-sm p-4 flex items-start gap-3"
      >
        <UIcon
          name="i-lucide-alert-circle"
          class="w-5 h-5 text-cgws-danger flex-shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <p class="font-sans text-sm text-cgws-danger">
          {{ serverError }}
        </p>
      </div>

      <!-- Footer buttons -->
      <div class="flex items-center justify-between pt-4 border-t border-cgws-hairline">
        <CgwsButton
          variant="ghost"
          type="button"
          :disabled="isSubmitting"
          @click="$emit('cancel')"
        >
          Annuler
        </CgwsButton>
        <CgwsButton
          variant="primary"
          type="submit"
          size="md"
          :loading="isSubmitting"
          :disabled="isSubmitting"
        >
          {{ isSubmitting
            ? (mode === 'create' ? 'CRÉATION…' : 'ENREGISTREMENT…')
            : (mode === 'create' ? 'CRÉER LE PRODUIT' : 'ENREGISTRER') }}
        </CgwsButton>
      </div>
    </div>

    <!-- ── Right column: images (1/3, sticky) ────────────────────────────────── -->
    <div class="lg:col-span-1 lg:sticky lg:top-24">
      <ImageUploader
        v-model:kept-images="form.keptImages"
        v-model:new-files="form.newFiles"
        v-model:removed-images="form.removedImages"
        :disabled="isSubmitting"
      />
    </div>
  </form>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 120px;
}
</style>
