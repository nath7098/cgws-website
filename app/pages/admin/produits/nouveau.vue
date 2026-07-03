<script setup lang="ts">
import type { ProductFormPayload } from '~/types'

definePageMeta({
  middleware: 'admin',
  layout: 'admin',
  title: 'Nouveau produit',
})

useSeoMeta({
  title: 'Nouveau produit — CGWS Administration',
  robots: 'noindex, nofollow',
})

const { initSession } = useAdminAuth()
await initSession()

const { getAccessToken, buildAuthHeaders } = useAdminApi()

const isSubmitting = ref(false)
const formRef = ref<{ setServerError: (msg: string) => void } | null>(null)


async function handleCreate(payload: ProductFormPayload) {
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

    // Images
    for (const file of payload.newImages) {
      formData.append('images', file, file.name)
    }

    await $fetch('/api/admin/products', {
      method: 'POST',
      body: formData,
      headers: buildAuthHeaders(token),
    })

    await navigateTo('/admin/produits?success=created')
  }
  catch (err: unknown) {
    const apiErr = err as { data?: { errors?: Record<string, string>, statusMessage?: string }, statusMessage?: string }
    const msg = apiErr?.data?.statusMessage
      ?? apiErr?.statusMessage
      ?? 'Erreur lors de la création. Veuillez réessayer.'
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
        class="p-1.5 rounded-sm text-cgws-ink-soft hover:text-cgws-accent hover:bg-cgws-accent/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
        aria-label="Retour à la liste des produits"
      >
        <UIcon
          name="i-lucide-arrow-left"
          class="w-5 h-5"
          aria-hidden="true"
        />
      </NuxtLink>
      <h2 class="font-serif font-bold text-2xl text-cgws-ink">
        Nouveau produit
      </h2>
    </div>

    <ProductForm
      ref="formRef"
      mode="create"
      :is-submitting="isSubmitting"
      @submit="handleCreate"
      @cancel="navigateTo('/admin/produits')"
    />

  </div>
</template>
