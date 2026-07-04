<script setup lang="ts">
let ctx: { revert: () => void } | undefined

onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const { gsap } = await import('gsap')

  ctx = gsap.context(() => {
    gsap.to('.saddle-group', {
      y: -10,
      duration: 3,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    })

    gsap.to('.saddle-horn', {
      rotationZ: 1.5,
      transformOrigin: '50% 100%',
      duration: 4.5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: 0.5,
    })

    gsap.to('.saddle-stirrups', {
      rotationZ: 2,
      transformOrigin: '50% 0%',
      duration: 2.8,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: 0.8,
    })
  })
})

onUnmounted(() => {
  ctx?.revert()
})
</script>

<template>
  <svg
    viewBox="0 0 220 310"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    class="w-full h-auto"
  >
    <defs>
      <radialGradient id="seat-highlight" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stop-color="var(--cgws-surface-2)" />
        <stop offset="100%" stop-color="var(--cgws-edge)" />
      </radialGradient>
    </defs>

    <g class="saddle-group">
      <!-- Right skirt (background, slightly darker) -->
      <path
        d="M 55 175 Q 60 145 90 135 Q 140 125 175 135 Q 195 145 200 175 Q 202 205 190 220 Q 170 235 130 235 Q 90 235 68 220 Q 52 205 55 175 Z"
        class="fill-cgws-edge stroke-cgws-ink"
        stroke-width="1"
      />

      <!-- Left skirt (foreground) -->
      <path
        d="M 25 172 Q 30 140 65 130 Q 118 118 162 130 Q 188 140 192 172 Q 195 205 180 222 Q 158 240 105 240 Q 58 240 38 222 Q 20 205 25 172 Z"
        class="fill-cgws-edge stroke-cgws-ink"
        stroke-width="1.5"
      />

      <!-- Skirt medallion / concho decoration (left skirt) -->
      <circle cx="105" cy="183" r="14" fill="none" class="stroke-cgws-accent-deco" stroke-width="1" />
      <circle cx="105" cy="183" r="9" fill="none" class="stroke-cgws-accent-deco" stroke-width="0.5" stroke-dasharray="2 2" />
      <!-- Tooling dots around medallion -->
      <circle cx="105" cy="167" r="1.5" class="fill-cgws-accent-deco" />
      <circle cx="105" cy="199" r="1.5" class="fill-cgws-accent-deco" />
      <circle cx="89" cy="183" r="1.5" class="fill-cgws-accent-deco" />
      <circle cx="121" cy="183" r="1.5" class="fill-cgws-accent-deco" />
      <circle cx="93" cy="171" r="1" class="fill-cgws-accent-deco" />
      <circle cx="117" cy="171" r="1" class="fill-cgws-accent-deco" />
      <circle cx="93" cy="195" r="1" class="fill-cgws-accent-deco" />
      <circle cx="117" cy="195" r="1" class="fill-cgws-accent-deco" />

      <!-- Cantle (rear raised back) -->
      <path
        d="M 62 138 Q 75 115 105 110 Q 140 115 155 138"
        class="fill-cgws-edge stroke-cgws-ink"
        stroke-width="1.5"
        stroke-linecap="round"
      />

      <!-- Seat body (main ellipse with radial gradient) -->
      <ellipse
        cx="108"
        cy="142"
        rx="68"
        ry="30"
        fill="url(#seat-highlight)"
        class="stroke-cgws-ink"
        stroke-width="1.5"
      />

      <!-- Pommel / front arch -->
      <path
        d="M 62 140 Q 68 118 88 112 Q 105 106 108 104 Q 112 106 128 112 Q 148 118 155 140"
        class="fill-cgws-edge stroke-cgws-ink"
        stroke-width="1.5"
        stroke-linejoin="round"
      />

      <!-- Horn stem -->
      <g class="saddle-horn">
        <rect
          x="100"
          y="64"
          width="16"
          height="42"
          rx="5"
          class="fill-cgws-edge stroke-cgws-ink"
          stroke-width="1.5"
        />
        <!-- Horn cap -->
        <ellipse
          cx="108"
          cy="64"
          rx="14"
          ry="8"
          class="fill-cgws-accent-deco stroke-cgws-ink"
          stroke-width="1.5"
        />
      </g>

      <!-- Stirrup fenders (straps) -->
      <g class="saddle-stirrups">
        <!-- Left fender -->
        <rect
          x="44"
          y="195"
          width="14"
          height="48"
          rx="3"
          class="fill-cgws-edge stroke-cgws-ink"
          stroke-width="1.5"
        />
        <!-- Left stirrup (oxbow) -->
        <rect
          x="28"
          y="240"
          width="42"
          height="30"
          rx="10"
          class="fill-cgws-accent-deco stroke-cgws-ink"
          stroke-width="1.5"
        />
        <!-- Left stirrup inner opening -->
        <rect
          x="36"
          y="248"
          width="26"
          height="16"
          rx="5"
          class="fill-cgws-brand-tack"
        />

        <!-- Right fender -->
        <rect
          x="158"
          y="195"
          width="14"
          height="48"
          rx="3"
          class="fill-cgws-edge stroke-cgws-ink"
          stroke-width="1.5"
        />
        <!-- Right stirrup (oxbow) -->
        <rect
          x="146"
          y="240"
          width="42"
          height="30"
          rx="10"
          class="fill-cgws-accent-deco stroke-cgws-ink"
          stroke-width="1.5"
        />
        <!-- Right stirrup inner opening -->
        <rect
          x="154"
          y="248"
          width="26"
          height="16"
          rx="5"
          class="fill-cgws-brand-tack"
        />
      </g>
    </g>
  </svg>
</template>
