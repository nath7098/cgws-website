<script setup lang="ts">
import type { Product, ProductFormPayload } from '~/types'

definePageMeta({
  middleware: 'admin',
  layout: 'admin',
  title: 'Modifier le produit',
})

useSeoMeta({
  title: 'Modifier le produit — CGWS Administration',
  robots: 'noindex, nofollow',
})

const { initSession } = useAdminAuth()
await initSession()

const { getAccessToken, buildAuthHeaders } = useAdminApi()

const route = useRoute()
const productId = computed(() => route.params.id as string)

// ─── Load product ─────────────────────────────────────────────────────────────
const product = ref<Product | null>(null)
const loadError = ref('')

onMounted(async () => {
  try {
    const token = await getAccessToken()
    const data = await $fetch<{ product: Product }>(`/api/admin/products/${productId.value}`, {
      headers: buildAuthHeaders(token),
    })
    product.value = data.product
    useSeoMeta({ title: `Modifier : ${data.product.title} — CGWS Administration` })
  }
  catch {
    loadError.value = 'Produit introuvable ou erreur de chargement.'
  }
})

// ─── Submit ───────────────────────────────────────────────────────────────────
const isSubmitting = ref(false)
const formRef = ref<{ setServerError: (msg: string) => void } | null>(null)


async function handleUpdate(payload: ProductFormPayload) {
  isSubmitting.value = true
  try {
    const token = await getAccessToken()
    const formData = new FormData()

    // Text fields
    formData.append('title', payload.fields.title)
    formData.append('category', payload.fields.category)
    formData.append('brand', payload.fields.brand)
    formData.append('description', payload.fields.description)
    formData.append('price', String(payload.fields.price))
    formData.append('condition', payload.fields.condition)
    formData.append('size', payload.fields.size)
    formData.append('stock', String(payload.fields.stock))
    formData.append('isConsignment', String(payload.fields.isConsignment))
    if (payload.fields.consignmentId) {
      formData.append('consignmentId', payload.fields.consignmentId)
    }
    if (payload.fields.status) {
      formData.append('status', payload.fields.status)
    }

    // Image management
    for (const url of payload.keptImages) {
      formData.append('keptImages', url)
    }
    for (const url of payload.removedImages) {
      formData.append('removedImages', url)
    }
    for (const file of payload.newImages) {
      formData.append('newImages', file, file.name)
    }

    await $fetch(`/api/admin/products/${productId.value}`, {
      method: 'PUT',
      body: formData,
      headers: buildAuthHeaders(token),
    })

    await navigateTo('/admin/produits?success=updated')
  }
  catch (err: unknown) {
    const apiErr = err as { data?: { errors?: Record<string, string>, statusMessage?: string }, statusMessage?: string }
    const msg = apiErr?.data?.statusMessage
      ?? apiErr?.statusMessage
      ?? 'Erreur lors de la sauvegarde. Veuillez réessayer.'
    formRef.value?.setServerError(msg)
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div class="flex items-center gap-3">
      <NuxtLink
        to="/admin/produits"
        class="p-1.5 rounded-sm text-cgws-leather hover:text-cgws-copper hover:bg-cgws-copper/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper"
        aria-label="Retour à la liste des produits"
      >
        <UIcon
          name="i-lucide-arrow-left"
          class="w-5 h-5"
          aria-hidden="true"
        />
      </NuxtLink>
      <h2 class="font-serif font-bold text-2xl text-cgws-charcoal line-clamp-1">
        Modifier : {{ product?.title ?? '…' }}
      </h2>
    </div>

    <!-- Load error -->
    <div
      v-if="loadError"
      role="alert"
      class="bg-cgws-rust/10 border border-cgws-rust rounded-sm p-4 flex items-center gap-3"
    >
      <UIcon
        name="i-lucide-alert-circle"
        class="w-5 h-5 text-cgws-rust flex-shrink-0"
        aria-hidden="true"
      />
      <p class="font-sans text-sm text-cgws-rust">
        {{ loadError }}
      </p>
    </div>

    <!-- Form (rendered once product is loaded) -->
    <ProductForm
      v-if="product"
      ref="formRef"
      mode="edit"
      :initial-data="product"
      :is-submitting="isSubmitting"
      @submit="handleUpdate"
      @cancel="navigateTo('/admin/produits')"
    />

    <!-- Skeleton while loading -->
    <div
      v-else-if="!loadError"
      class="space-y-4 animate-pulse"
    >
      <div class="h-48 bg-cgws-leather/10 rounded-[4px]" />
      <div class="h-32 bg-cgws-leather/10 rounded-[4px]" />
      <div class="h-24 bg-cgws-leather/10 rounded-[4px]" />
    </div>

  </div>
</template>
