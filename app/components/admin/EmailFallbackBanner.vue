<script setup lang="ts">
// ─── US-094 — Garde-fou expéditeur email de test ──────────────────────────────
// Reste `null` (donc invisible, v-if falsy) tant que le statut n'est pas connu
// — pas de skeleton, un flash "apparaît puis disparaît" serait plus perturbant
// qu'une absence momentanée (cf. docs/design-specs/US-094-email-fallback-banner.md).
// Fail-safe réseau : si l'appel échoue, on affiche le bandeau plutôt que de le
// masquer (mieux vaut un faux positif visible qu'un vrai problème silencieux).
// Pas de bouton fermer : critère Gherkin explicite, un vrai problème de
// production ne doit jamais pouvoir être masqué définitivement.

const { getAccessToken, buildAuthHeaders } = useAdminApi()

const isFallback = ref<boolean | null>(null)

onMounted(async () => {
  try {
    const token = await getAccessToken()
    const result = await $fetch<{ isFallback: boolean }>('/api/admin/email-status', {
      headers: buildAuthHeaders(token),
    })
    isFallback.value = result.isFallback
  }
  catch {
    isFallback.value = true
  }
})
</script>

<template>
  <div
    v-if="isFallback"
    role="alert"
    class="flex items-start gap-3 p-3 md:p-4 rounded-[4px]
           bg-cgws-surface border border-cgws-hairline border-l-4 border-l-cgws-danger"
  >
    <div class="flex-shrink-0 w-8 h-8 rounded-full bg-cgws-danger/10 flex items-center justify-center">
      <UIcon
        name="i-lucide-mail-warning"
        class="w-4 h-4 text-cgws-danger"
        aria-hidden="true"
      />
    </div>
    <p class="font-sans text-[13px] md:text-sm text-cgws-ink leading-relaxed">
      <strong class="font-semibold text-cgws-danger">Expéditeur email de test actif</strong> —
      vos emails de contact, consignation et vente ne partent qu'à l'adresse du compte Resend.
      Le domaine cgws.fr doit être vérifié dans Resend.
    </p>
  </div>
</template>
