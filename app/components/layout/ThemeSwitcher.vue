<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import type { CgwsSkin } from '~/composables/useCgwsSkin'

const props = withDefaults(defineProps<{
  /**
   * 'inline'  — segment compact + toggle icône, pour AppHeader (desktop) et
   *             la topbar admin (≥640px).
   * 'stacked' — bloc pleine largeur avec eyebrow + toggle libellé, pour le
   *             menu mobile (MobileMenu).
   * 'compact' — icône-seule (un bouton bascule de peau + toggle jour/nuit),
   *             pour la topbar admin en mobile (<640px) où le segment libellé
   *             ne tient pas. Cf. US-075 §C.2.
   */
  layout?: 'inline' | 'stacked' | 'compact'
}>(), {
  layout: 'inline',
})

const { skin, setSkin } = useCgwsSkin()
const colorMode = useColorMode()

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (value: boolean) => {
    colorMode.preference = value ? 'dark' : 'light'
  },
})

interface SkinOption {
  value: CgwsSkin
  label: string
  icon: string
}

const skinOptions: SkinOption[] = [
  { value: 'elegante', label: 'Élégante', icon: 'i-lucide-compass' },
  { value: 'rugueux', label: 'Rugueux', icon: 'i-lucide-circle-dot' },
]

const skinButtonRefs = ref<(HTMLButtonElement | null)[]>([])

function setSkinButtonRef(el: Element | ComponentPublicInstance | null, index: number) {
  skinButtonRefs.value[index] = el instanceof HTMLButtonElement ? el : null
}

// Région sr-only annonçant les changements (aria-live) — reste vide au
// montage pour ne rien annoncer avant une interaction réelle de l'utilisateur.
const liveMessage = ref('')

function announce() {
  const skinLabel = skin.value === 'elegante' ? 'Élégante' : 'Rugueux'
  liveMessage.value = skin.value === 'elegante'
    ? `Apparence changée : ${skinLabel}, mode ${isDark.value ? 'sombre' : 'clair'}`
    : `Apparence changée : ${skinLabel}`
}

function selectSkin(value: CgwsSkin) {
  if (value === skin.value) return
  setSkin(value)
  announce()
}

// Bascule vers l'autre peau (layout="compact" — bouton toggle unique).
const nextSkin = computed<CgwsSkin>(() => (skin.value === 'elegante' ? 'rugueux' : 'elegante'))
const compactIcon = computed<string>(() => (skin.value === 'elegante' ? 'i-lucide-compass' : 'i-lucide-circle-dot'))
const compactLabel = computed<string>(() =>
  skin.value === 'elegante' ? "Basculer vers l'apparence Rugueux" : "Basculer vers l'apparence Élégante",
)

function toggleSkin() {
  selectSkin(nextSkin.value)
}

function toggleColorMode() {
  isDark.value = !isDark.value
  announce()
}

function onSkinKeydown(event: KeyboardEvent, index: number) {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  event.preventDefault()

  const direction = event.key === 'ArrowRight' ? 1 : -1
  const nextIndex = (index + direction + skinOptions.length) % skinOptions.length
  const nextOption = skinOptions[nextIndex]
  if (!nextOption) return

  selectSkin(nextOption.value)
  skinButtonRefs.value[nextIndex]?.focus()
}
</script>

<template>
  <div :class="props.layout === 'stacked' ? 'flex flex-col gap-2 w-full' : 'flex items-center gap-2'">
    <span
      v-if="props.layout === 'stacked'"
      class="font-eyebrow text-[11px] text-cgws-ink-soft"
    >
      Apparence
    </span>

    <!-- Compact (topbar admin mobile) : bouton icône-seule qui bascule la peau -->
    <button
      v-if="props.layout === 'compact'"
      type="button"
      class="inline-flex items-center justify-center w-9 h-9 rounded-full
             text-cgws-ink-soft hover:text-cgws-accent hover:bg-cgws-surface-2
             transition-colors duration-150
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent focus-visible:ring-offset-2"
      :aria-label="compactLabel"
      @click="toggleSkin"
    >
      <UIcon :name="compactIcon" class="w-4 h-4 flex-shrink-0" aria-hidden="true" />
    </button>

    <!-- Inline / Stacked : segment radiogroup à 2 boutons libellés -->
    <div
      v-else
      role="radiogroup"
      aria-label="Choix de l'apparence du site"
      :class="[
        'inline-flex items-center rounded-full border border-cgws-hairline bg-cgws-surface-2/50 p-0.5 gap-0.5',
        props.layout === 'stacked' ? 'grid grid-cols-2 gap-1 w-full' : '',
      ]"
    >
      <button
        v-for="(option, index) in skinOptions"
        :key="option.value"
        :ref="(el) => setSkinButtonRef(el, index)"
        type="button"
        role="radio"
        :aria-checked="skin === option.value"
        :tabindex="skin === option.value ? 0 : -1"
        :class="[
          'inline-flex items-center justify-center gap-1.5 rounded-full font-sans text-xs font-semibold uppercase tracking-wide',
          'transition-colors duration-150 hover:-translate-y-px',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent focus-visible:ring-offset-2',
          props.layout === 'stacked' ? 'px-3 py-2.5 min-h-11' : 'px-3 py-1.5',
          skin === option.value
            ? 'bg-cgws-accent text-cgws-on-accent'
            : 'text-cgws-ink-soft hover:text-cgws-ink hover:bg-cgws-surface-2',
        ]"
        @click="selectSkin(option.value)"
        @keydown="onSkinKeydown($event, index)"
      >
        <UIcon :name="option.icon" class="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
        {{ option.label }}
      </button>
    </div>

    <ClientOnly v-if="skin === 'elegante' && !colorMode?.forced">
      <button
        type="button"
        :class="[
          'inline-flex items-center justify-center gap-2 rounded-full text-cgws-ink-soft',
          'hover:text-cgws-accent hover:bg-cgws-surface-2 transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent focus-visible:ring-offset-2',
          props.layout === 'stacked'
            ? 'w-full px-3 py-2.5 min-h-11 font-sans text-sm font-medium border border-cgws-hairline'
            : 'w-9 h-9',
        ]"
        :aria-label="`Passer en mode ${isDark ? 'clair' : 'sombre'}`"
        @click="toggleColorMode"
      >
        <UIcon :name="isDark ? 'i-lucide-moon' : 'i-lucide-sun'" class="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <span v-if="props.layout === 'stacked'">{{ isDark ? 'Sombre' : 'Clair' }}</span>
      </button>

      <template #fallback>
        <div :class="props.layout === 'stacked' ? 'w-full h-11' : 'size-9'" />
      </template>
    </ClientOnly>

    <span class="sr-only" role="status" aria-live="polite">{{ liveMessage }}</span>
  </div>
</template>
