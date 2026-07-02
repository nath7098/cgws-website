<script setup lang="ts">
import type { Swiper as SwiperInstance } from 'swiper'

interface Props {
  images: string[]
  alt: string
  sold?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  sold: false,
})

const { imageProps } = useProductImage()

const currentIndex = ref(0)
const swiperEl = ref<HTMLElement | null>(null)
let swiperInstance: SwiperInstance | null = null
let ctx: { revert: () => void } | undefined

// Resolved image data for the first slide (single-image case)
const firstImageData = computed(() => {
  const first = props.images[0]
  return first !== undefined ? imageProps(first) : { src: '' }
})

const hasImages = computed(() => props.images.length > 0)
const hasMultipleImages = computed(() => props.images.length > 1)

function goPrev() {
  swiperInstance?.slidePrev()
}

function goNext() {
  swiperInstance?.slideNext()
}

function goToSlide(index: number) {
  if (swiperInstance) {
    swiperInstance.slideTo(index)
  }
  else {
    currentIndex.value = index
  }
}

onMounted(async () => {
  if (swiperEl.value && props.images.length > 1) {
    const { Swiper } = await import('swiper')
    const { Keyboard, A11y } = await import('swiper/modules')

    swiperInstance = new Swiper(swiperEl.value, {
      modules: [Keyboard, A11y],
      slidesPerView: 1,
      spaceBetween: 0,
      loop: false,
      keyboard: { enabled: true },
      a11y: {
        prevSlideMessage: 'Photo précédente',
        nextSlideMessage: 'Photo suivante',
      },
      on: {
        slideChange: (swiper) => {
          currentIndex.value = swiper.activeIndex
        },
      },
    })
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const { gsap } = await import('gsap')

  ctx = gsap.context(() => {
    gsap.from('.product-gallery-main', {
      opacity: 0,
      scale: 0.98,
      duration: 0.6,
      ease: 'power2.out',
      clearProps: 'all',
    })

    if (props.images.length > 1) {
      gsap.from('.product-gallery-thumb', {
        opacity: 0,
        y: 8,
        duration: 0.3,
        ease: 'power2.out',
        stagger: 0.06,
        delay: 0.3,
        clearProps: 'all',
      })
    }
  })
})

onUnmounted(() => {
  swiperInstance?.destroy(true, true)
  ctx?.revert()
})
</script>

<template>
  <div class="group relative w-full">
    <!-- Main gallery container -->
    <div
      class="product-gallery-main relative overflow-hidden rounded-[6px] bg-cgws-leather/10 aspect-[4/3]"
      :class="sold ? 'grayscale' : ''"
      role="region"
      :aria-label="`Galerie photos : ${alt}`"
    >
      <!-- Swiper container (multiple images) -->
      <div
        v-if="hasImages && hasMultipleImages"
        ref="swiperEl"
        class="swiper h-full"
      >
        <div class="swiper-wrapper h-full">
          <div
            v-for="(img, idx) in images"
            :key="`${img}-${idx}`"
            class="swiper-slide"
            :aria-label="`Photo ${idx + 1} sur ${images.length} — ${alt}`"
          >
            <NuxtImg
              v-bind="imageProps(img)"
              :alt="`${alt}, photo ${idx + 1}`"
              :loading="idx === 0 ? 'eager' : 'lazy'"
              :fetch-priority="idx === 0 ? 'high' : 'auto'"
              format="webp"
              sizes="xs:100vw sm:100vw md:60vw lg:50vw"
              class="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      <!-- Single image (no swiper) -->
      <div
        v-else-if="hasImages"
        class="h-full"
        :aria-label="`Photo 1 sur 1 — ${alt}`"
      >
        <NuxtImg
          v-bind="firstImageData"
          :alt="alt"
          loading="eager"
          fetch-priority="high"
          format="webp"
          sizes="xs:100vw sm:100vw md:60vw lg:50vw"
          class="w-full h-full object-cover"
        />
      </div>

      <!-- Placeholder when no images -->
      <div
        v-else
        class="w-full h-full flex items-center justify-center"
        aria-label="Aucune photo disponible"
      >
        <svg
          class="w-20 h-20 text-cgws-leather/20"
          viewBox="0 0 48 48"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M8 20c0-7 7-13 16-13s16 6 16 13c0 4-2 7.5-6 9.5V36H14v-6.5C10 27.5 8 24 8 20zm14 18h4v2h-4v-2z"
            opacity="0.5"
          />
        </svg>
      </div>

      <!-- Sold overlay -->
      <div
        v-if="sold"
        class="absolute inset-0 bg-cgws-charcoal/30 flex items-center justify-center pointer-events-none z-10"
        role="img"
        aria-label="Produit vendu"
      >
        <span
          class="font-display text-[40px] md:text-[56px] text-cgws-rope uppercase tracking-[0.15em] border-4 border-cgws-rope/60 px-6 py-2 rotate-[-8deg]"
          aria-hidden="true"
        >
          VENDU
        </span>
      </div>

      <!-- Image counter badge -->
      <span
        v-if="hasMultipleImages"
        class="absolute bottom-3 right-3 z-20 bg-cgws-charcoal/60 backdrop-blur-sm font-sans text-xs text-cgws-rope px-2.5 py-1 rounded-sm"
        aria-hidden="true"
      >
        {{ currentIndex + 1 }} / {{ images.length }}
      </span>

      <!-- Prev button -->
      <button
        v-if="hasMultipleImages"
        type="button"
        class="absolute top-1/2 -translate-y-1/2 left-3 z-20 w-10 h-10 rounded-full bg-cgws-tack/60 backdrop-blur-sm hover:bg-cgws-copper/80 flex items-center justify-center transition-all duration-150 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper"
        aria-label="Photo précédente"
        @click="goPrev"
      >
        <UIcon name="i-lucide-chevron-left" class="w-5 h-5 text-cgws-rope" aria-hidden="true" />
      </button>

      <!-- Next button -->
      <button
        v-if="hasMultipleImages"
        type="button"
        class="absolute top-1/2 -translate-y-1/2 right-3 z-20 w-10 h-10 rounded-full bg-cgws-tack/60 backdrop-blur-sm hover:bg-cgws-copper/80 flex items-center justify-center transition-all duration-150 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper"
        aria-label="Photo suivante"
        @click="goNext"
      >
        <UIcon name="i-lucide-chevron-right" class="w-5 h-5 text-cgws-rope" aria-hidden="true" />
      </button>
    </div>

    <!-- Screen reader live region for slide changes -->
    <span class="sr-only" aria-live="polite" aria-atomic="true">
      Photo {{ currentIndex + 1 }} sur {{ images.length }}
    </span>

    <!-- Thumbnail strip -->
    <div
      v-if="hasMultipleImages"
      class="mt-3 overflow-x-auto pb-1 flex gap-2 snap-x snap-mandatory"
      :class="sold ? 'grayscale opacity-50' : ''"
    >
      <button
        v-for="(img, idx) in images"
        :key="`thumb-${img}-${idx}`"
        type="button"
        class="product-gallery-thumb flex-shrink-0 snap-start w-[72px] h-[54px] md:w-[80px] md:h-[60px] rounded-[4px] overflow-hidden cursor-pointer border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-copper"
        :class="currentIndex === idx
          ? 'border-cgws-copper ring-1 ring-cgws-copper/30 opacity-100'
          : 'border-transparent opacity-60 hover:opacity-90 hover:border-cgws-leather/50'"
        :aria-label="`Voir photo ${idx + 1}`"
        :aria-pressed="currentIndex === idx"
        @click="goToSlide(idx)"
      >
        <NuxtImg
          v-bind="imageProps(img)"
          :alt="`${alt}, miniature ${idx + 1}`"
          loading="lazy"
          format="webp"
          sizes="xs:80px"
          class="w-full h-full object-cover"
        />
      </button>
    </div>
  </div>
</template>

<style>
@import 'swiper/css';
</style>
