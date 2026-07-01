<script setup lang="ts">
import type { SelectOption } from '~/components/ui/CgwsSelect.vue'

// ---------------------------------------------------------------------------
// SEO
// ---------------------------------------------------------------------------

useSeoMeta({
  title: 'Contact — CGWS Western Shop à Brèches (37)',
  description:
    'Contactez la boutique CGWS à Brèches, Indre-et-Loire. Formulaire de contact, adresse, horaires et carte pour nous trouver facilement.',
  ogTitle: 'Contact — CGWS Western Shop',
  ogDescription:
    'Une question, un rendez-vous ou un projet de consignation ? Contactez Camille et l\'équipe CGWS à Brèches (37).',
})

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

const nameField = ref('')
const emailField = ref('')
const subjectField = ref('')
const messageField = ref('')
const honeypot = ref('')

const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)
const isSuccess = ref(false)
const submittedName = ref('')
const serverError = ref('')

const subjectOptions: SelectOption[] = [
  { value: 'question-produit', label: 'Question sur un produit' },
  { value: 'consignation', label: 'Service de consignation' },
  { value: 'rdv-boutique', label: 'Rendez-vous en boutique' },
  { value: 'commande', label: 'Commande / Livraison' },
  { value: 'autre', label: 'Autre' },
]

// ---------------------------------------------------------------------------
// Front-end validation
// ---------------------------------------------------------------------------

function validateField(field: string): boolean {
  switch (field) {
    case 'name':
      if (!nameField.value || nameField.value.trim().length < 2) {
        errors.value = { ...errors.value, name: 'Votre nom est requis' }
        return false
      }
      delete errors.value.name
      return true

    case 'email': {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailField.value || !emailRegex.test(emailField.value)) {
        errors.value = { ...errors.value, email: 'Adresse email invalide' }
        return false
      }
      delete errors.value.email
      return true
    }

    case 'subject':
      if (!subjectField.value) {
        errors.value = { ...errors.value, subject: 'Veuillez choisir un sujet' }
        return false
      }
      delete errors.value.subject
      return true

    case 'message':
      if (!messageField.value || messageField.value.trim().length < 10) {
        errors.value = {
          ...errors.value,
          message: 'Votre message doit faire au moins 10 caractères',
        }
        return false
      }
      delete errors.value.message
      return true

    default:
      return true
  }
}

function validateAll(): boolean {
  const fields = ['name', 'email', 'subject', 'message']
  let allValid = true
  for (const field of fields) {
    if (!validateField(field)) allValid = false
  }
  return allValid
}

// ---------------------------------------------------------------------------
// Form submission
// ---------------------------------------------------------------------------

async function handleSubmit() {
  if (!validateAll()) return

  isSubmitting.value = true
  serverError.value = ''
  submittedName.value = nameField.value.split(' ')[0] ?? nameField.value

  try {
    await $fetch('/api/contact', {
      method: 'POST',
      body: {
        name: nameField.value,
        email: emailField.value,
        subject: subjectField.value,
        message: messageField.value,
        website: honeypot.value,
      },
    })
    isSuccess.value = true
  } catch (err: unknown) {
    isSubmitting.value = false
    if (
      err !== null &&
      typeof err === 'object' &&
      'statusCode' in err &&
      (err as { statusCode: number }).statusCode === 429
    ) {
      serverError.value = 'Trop de messages envoyés. Veuillez patienter avant de réessayer.'
    } else {
      serverError.value =
        'Une erreur est survenue. Veuillez réessayer ou nous contacter directement par téléphone.'
    }
    return
  }

  isSubmitting.value = false
}

function resetForm() {
  nameField.value = ''
  emailField.value = ''
  subjectField.value = ''
  messageField.value = ''
  honeypot.value = ''
  errors.value = {}
  serverError.value = ''
  isSuccess.value = false
  submittedName.value = ''
}

// ---------------------------------------------------------------------------
// GSAP animations
// ---------------------------------------------------------------------------

let ctx: { revert: () => void } | undefined

onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const { gsap } = await import('gsap')
  const { ScrollTrigger } = await import('gsap/ScrollTrigger')
  gsap.registerPlugin(ScrollTrigger)

  ctx = gsap.context(() => {
    // Hero entrance — staggered
    gsap.from(
      ['.contact-hero-eyebrow', '.contact-hero-h1', '.contact-hero-tagline'],
      {
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power2.out',
        clearProps: 'all',
      },
    )

    // Form column slides from the left
    gsap.from('.contact-form-col', {
      opacity: 0,
      x: -30,
      duration: 0.7,
      ease: 'power2.out',
      clearProps: 'all',
      scrollTrigger: {
        trigger: '.contact-section',
        start: 'top 75%',
        once: true,
      },
    })

    // Info column slides from the right
    gsap.from('.contact-info-col', {
      opacity: 0,
      x: 30,
      duration: 0.7,
      ease: 'power2.out',
      clearProps: 'all',
      scrollTrigger: {
        trigger: '.contact-section',
        start: 'top 75%',
        once: true,
      },
    })

    // Map fades in on scroll
    gsap.from('.contact-map', {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out',
      clearProps: 'all',
      scrollTrigger: {
        trigger: '.contact-map',
        start: 'top 85%',
        once: true,
      },
    })
  })
})

onUnmounted(() => {
  ctx?.revert()
})
</script>

<template>
  <main>
    <!-- ================================================================
         HERO
    ================================================================ -->
    <section class="bg-cgws-tack py-10 md:py-16 text-center" aria-labelledby="contact-page-heading">
      <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">
        <p class="contact-hero-eyebrow font-eyebrow text-cgws-copper text-[12px] uppercase tracking-[0.2em] mb-3">
          Sellerie de Brèches
        </p>
        <h1
          id="contact-page-heading"
          class="contact-hero-h1 font-display text-[48px] sm:text-[56px] md:text-[64px] text-cgws-cream leading-none uppercase mb-4"
        >
          Contactez-nous
        </h1>
        <p class="contact-hero-tagline font-serif italic text-cgws-rope text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Une question sur un article, un rendez-vous en boutique,
          un projet de consignation — nous sommes à votre écoute.
        </p>
      </div>
    </section>

    <!-- Transition divider -->
    <ConchoDivider bg-class="bg-cgws-cream" />

    <!-- ================================================================
         MAIN SECTION — 2-column layout
    ================================================================ -->
    <section class="contact-section bg-cgws-cream py-10 md:py-16">
      <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]">
        <div class="flex flex-col md:flex-row gap-10 md:gap-8 lg:gap-12 items-start">

          <!-- ============================================================
               LEFT COLUMN — Contact form
          ============================================================ -->
          <div class="contact-form-col flex-1 min-w-0">
            <p class="font-eyebrow text-cgws-copper text-[11px] uppercase tracking-[0.2em] mb-2">
              Nous écrire
            </p>
            <h2 class="font-serif font-bold text-[24px] md:text-[28px] text-cgws-charcoal leading-snug mb-8">
              Envoyez-nous un message
            </h2>

            <!-- Form / Success transition -->
            <Transition name="fade-contact" mode="out-in">
              <!-- ── FORM ── -->
              <form
                v-if="!isSuccess"
                key="contact-form"
                aria-label="Formulaire de contact CGWS"
                novalidate
                @submit.prevent="handleSubmit"
              >
                <!-- Honeypot — invisible to users, visible to bots -->
                <input
                  v-model="honeypot"
                  type="text"
                  name="website"
                  class="sr-only"
                  tabindex="-1"
                  autocomplete="off"
                  aria-hidden="true"
                >

                <div class="flex flex-col gap-5">
                  <CgwsInput
                    v-model="nameField"
                    label="Nom"
                    name="name"
                    :required="true"
                    :disabled="isSubmitting"
                    autocomplete="name"
                    :error="errors.name"
                    @blur="validateField('name')"
                  />

                  <CgwsInput
                    v-model="emailField"
                    label="Email"
                    type="email"
                    name="email"
                    :required="true"
                    :disabled="isSubmitting"
                    autocomplete="email"
                    :error="errors.email"
                    @blur="validateField('email')"
                  />

                  <CgwsSelect
                    v-model="subjectField"
                    label="Sujet"
                    name="subject"
                    :required="true"
                    :disabled="isSubmitting"
                    :options="subjectOptions"
                    placeholder="— Choisissez un sujet —"
                    :error="errors.subject"
                    @blur="validateField('subject')"
                  />

                  <CgwsTextarea
                    v-model="messageField"
                    label="Message"
                    name="message"
                    :required="true"
                    :disabled="isSubmitting"
                    :rows="5"
                    placeholder="Décrivez votre demande en quelques mots…"
                    :error="errors.message"
                    @blur="validateField('message')"
                  />

                  <!-- Server error alert -->
                  <div
                    v-if="serverError"
                    role="alert"
                    class="bg-cgws-rust/10 border border-cgws-rust rounded-sm p-4"
                  >
                    <p class="font-sans text-sm text-cgws-rust font-medium">
                      {{ serverError }}
                    </p>
                  </div>

                  <CgwsButton
                    type="submit"
                    variant="primary"
                    :loading="isSubmitting"
                    :disabled="isSubmitting"
                    class="w-full sm:w-auto"
                  >
                    Envoyer mon message
                  </CgwsButton>
                </div>
              </form>

              <!-- ── SUCCESS STATE ── -->
              <div
                v-else
                key="contact-success"
                role="status"
                aria-live="polite"
                aria-atomic="true"
                class="bg-cgws-parchment border-2 border-cgws-leather/40 rounded-[4px] p-8 text-center"
              >
                <UIcon
                  name="i-lucide-check-circle"
                  class="w-10 h-10 text-cgws-copper mx-auto mb-4"
                  aria-hidden="true"
                />
                <p class="font-display text-3xl text-cgws-charcoal tracking-wide mb-2 uppercase">
                  Message envoyé
                </p>
                <p class="font-serif font-semibold text-xl text-cgws-charcoal mb-3">
                  Merci, {{ submittedName }}&nbsp;!
                </p>
                <p class="font-sans text-sm text-cgws-charcoal/70 leading-relaxed mb-6">
                  Camille vous répondra dans les meilleurs délais.
                </p>
                <div class="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                  <CgwsButton as="NuxtLink" to="/catalogue" variant="secondary" size="sm">
                    Retour au catalogue
                  </CgwsButton>
                  <CgwsButton variant="ghost" size="sm" @click="resetForm">
                    Envoyer un nouveau message
                  </CgwsButton>
                </div>
              </div>
            </Transition>
          </div>

          <!-- ============================================================
               RIGHT COLUMN — Info block + Map
          ============================================================ -->
          <div class="contact-info-col w-full md:w-[280px] lg:w-[400px] flex-shrink-0">
            <p class="font-eyebrow text-cgws-copper text-[11px] uppercase tracking-[0.2em] mb-4">
              Nous trouver
            </p>

            <!-- Info block -->
            <!-- TODO: confirmer adresse exacte, téléphone, horaires et email avec Camille avant mise en ligne -->
            <div class="bg-cgws-parchment border-2 border-cgws-leather/40 rounded-[4px] p-6 mb-6">

              <!-- Address -->
              <div class="flex items-start gap-3 mb-5">
                <UIcon
                  name="i-lucide-map-pin"
                  class="w-5 h-5 text-cgws-copper flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <p class="font-sans font-semibold text-[13px] text-cgws-leather uppercase tracking-wide mb-0.5">
                    Adresse
                  </p>
                  <p class="font-sans text-sm text-cgws-charcoal leading-relaxed">
                    CGWS<br>
                    Brèches<br>
                    37320 Indre-et-Loire
                  </p>
                </div>
              </div>

              <!-- Phone -->
              <div class="flex items-start gap-3 mb-5">
                <UIcon
                  name="i-lucide-phone"
                  class="w-5 h-5 text-cgws-copper flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <p class="font-sans font-semibold text-[13px] text-cgws-leather uppercase tracking-wide mb-0.5">
                    Téléphone
                  </p>
                  <a
                    href="tel:+33600000000"
                    class="font-sans text-sm text-cgws-copper hover:underline transition-colors duration-150"
                  >
                    06 XX XX XX XX
                  </a>
                </div>
              </div>

              <!-- Hours -->
              <div class="flex items-start gap-3 mb-5">
                <UIcon
                  name="i-lucide-clock"
                  class="w-5 h-5 text-cgws-copper flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <p class="font-sans font-semibold text-[13px] text-cgws-leather uppercase tracking-wide mb-0.5">
                    Horaires
                  </p>
                  <p class="font-sans text-sm text-cgws-charcoal leading-relaxed">
                    Mardi – Vendredi&ensp;10h – 18h<br>
                    Samedi&ensp;9h – 17h<br>
                    Dimanche – Lundi&ensp;Fermé
                  </p>
                </div>
              </div>

              <!-- Email -->
              <div class="flex items-start gap-3">
                <UIcon
                  name="i-lucide-mail"
                  class="w-5 h-5 text-cgws-copper flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <p class="font-sans font-semibold text-[13px] text-cgws-leather uppercase tracking-wide mb-0.5">
                    Email
                  </p>
                  <a
                    href="mailto:contact@cgws.fr"
                    class="font-sans text-sm text-cgws-copper hover:underline transition-colors duration-150"
                  >
                    contact@cgws.fr
                  </a>
                </div>
              </div>
            </div>

            <!-- Divider between info and map -->
            <ConchoDivider aria-hidden="true" />

            <!-- OSM Map container -->
            <div
              class="contact-map w-full h-[220px] sm:h-[240px] md:h-[200px] lg:h-[280px]
                     border border-cgws-leather/40 rounded-[4px] overflow-hidden bg-cgws-parchment"
            >
              <ClientOnly>
                <ContactMap />
                <template #fallback>
                  <div class="w-full h-full bg-cgws-parchment animate-pulse flex items-center justify-center">
                    <UIcon
                      name="i-lucide-map"
                      class="w-8 h-8 text-cgws-leather/30"
                      aria-hidden="true"
                    />
                  </div>
                </template>
              </ClientOnly>
            </div>

            <!-- External OSM link for accessibility bypass -->
            <a
              href="https://www.openstreetmap.org/?mlat=47.4833&mlon=0.5167#map=14/47.4833/0.5167"
              target="_blank"
              rel="noopener noreferrer"
              class="font-sans text-xs text-cgws-copper hover:underline mt-2 inline-block"
            >
              Ouvrir dans OpenStreetMap
              <span class="sr-only">(ouvre un nouvel onglet)</span>
            </a>
          </div>

        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.fade-contact-enter-active,
.fade-contact-leave-active {
  transition: opacity 0.3s ease;
}

.fade-contact-enter-from,
.fade-contact-leave-to {
  opacity: 0;
}
</style>
