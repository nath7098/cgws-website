<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer
    class="bg-cgws-ground border-t-2 border-cgws-accent"
    aria-label="Pied de page CGWS"
  >
    <div
      class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)]
             pt-12 pb-6 md:pt-14 md:pb-8"
    >
      <!-- eslint-disable link-checker/valid-route link-checker/valid-sitemap-link -->
      <!--
        Grille principale :
        – Mobile  (base)  : 2 cols — Brand pleine largeur, Nav|Légal côte à côte, Contact pleine largeur
        – Tablet  (sm)    : 2 cols — Brand|Nav ligne 1, Contact|Légal ligne 2
        – Desktop (lg)    : 4 cols — Brand | Nav | Contact | Légal
        Les `order-*` et `col-span-*` responsive gèrent le réordonnancement entre breakpoints.
      -->
      <div
        class="grid grid-cols-2 gap-x-6 gap-y-8
               sm:gap-x-8 sm:gap-y-10
               lg:grid-cols-4 lg:gap-8"
      >
        <!-- ── Colonne 1 : Marque ─────────────────────────────────── -->
        <div class="col-span-2 sm:col-span-1 order-1 flex flex-col gap-3">
          <div>
            <span
              class="font-display text-[28px] text-cgws-heading tracking-widest
                     uppercase leading-none block"
            >
              CGWS
            </span>
            <span class="font-serif italic text-sm text-cgws-ink-soft leading-snug block mt-1">
              Sellerie de Brèches
            </span>
          </div>
          <p class="font-sans text-sm text-cgws-ink-soft/80 leading-relaxed max-w-[220px]">
            Équipements western authentiques —
            neuf, occasion &amp; consignation.
          </p>
          <!-- Réseaux sociaux — TODO: remplacer # par les URLs Instagram/Facebook de Camille -->
          <div class="flex items-center gap-4 mt-2">
            <a
              href="#"
              aria-label="CGWS sur Instagram"
              class="text-cgws-ink-soft hover:text-cgws-accent transition-colors duration-150
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent
                     focus-visible:ring-offset-2 focus-visible:ring-offset-cgws-ground rounded-sm"
            >
              <UIcon name="i-lucide-instagram" class="w-5 h-5" aria-hidden="true" />
            </a>
            <a
              href="#"
              aria-label="CGWS sur Facebook"
              class="text-cgws-ink-soft hover:text-cgws-accent transition-colors duration-150
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent
                     focus-visible:ring-offset-2 focus-visible:ring-offset-cgws-ground rounded-sm"
            >
              <UIcon name="i-lucide-facebook" class="w-5 h-5" aria-hidden="true" />
            </a>
          </div>
        </div>

        <!-- ── Colonne 2 : Navigation ─────────────────────────────── -->
        <!--
          Mobile  : order-2 → col 1 ligne 2. Séparateur via border-t (partagé avec Légal = ligne visuelle pleine largeur).
          Tablet+ : sm:border-t-0 sm:pt-0 retire le séparateur.
        -->
        <div
          class="col-span-1 order-2
                 border-t border-cgws-hairline pt-6
                 sm:border-t-0 sm:pt-0"
        >
          <p
            class="font-eyebrow text-cgws-accent text-[11px] uppercase tracking-[0.2em] mb-4"
            aria-hidden="true"
          >
            Navigation
          </p>
          <ul class="flex flex-col gap-3" role="list" aria-label="Navigation du site">
            <li>
              <NuxtLink
                to="/catalogue"
                active-class="text-cgws-accent"
                class="font-sans text-sm text-cgws-ink-soft hover:text-cgws-accent
                       transition-colors duration-150
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-cgws-accent focus-visible:ring-offset-2
                       focus-visible:ring-offset-cgws-ground rounded-sm"
              >
                Catalogue
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/consignation"
                active-class="text-cgws-accent"
                class="font-sans text-sm text-cgws-ink-soft hover:text-cgws-accent
                       transition-colors duration-150
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-cgws-accent focus-visible:ring-offset-2
                       focus-visible:ring-offset-cgws-ground rounded-sm"
              >
                Consignation
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/contact"
                active-class="text-cgws-accent"
                class="font-sans text-sm text-cgws-ink-soft hover:text-cgws-accent
                       transition-colors duration-150
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-cgws-accent focus-visible:ring-offset-2
                       focus-visible:ring-offset-cgws-ground rounded-sm"
              >
                Contact
              </NuxtLink>
            </li>
            <li>
              <!-- /a-propos n'est pas encore créé — redirigera vers 404 jusqu'à implémentation -->
              <NuxtLink
                to="/a-propos"
                active-class="text-cgws-accent"
                class="font-sans text-sm text-cgws-ink-soft hover:text-cgws-accent
                       transition-colors duration-150
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-cgws-accent focus-visible:ring-offset-2
                       focus-visible:ring-offset-cgws-ground rounded-sm"
              >
                À propos
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- ── Colonne 3 : Contact ────────────────────────────────── -->
        <!--
          Mobile  : order-4 → col 1+2 ligne 3 (col-span-2, après Nav+Légal). Séparateur border-t.
          Tablet+ : sm:order-3 → col 1 ligne 2. Séparateur retiré.
          Desktop : lg → col 3 ligne 1.
        -->
        <div
          class="col-span-2 sm:col-span-1 order-4 sm:order-3
                 border-t border-cgws-hairline pt-6
                 sm:border-t-0 sm:pt-0"
        >
          <p
            class="font-eyebrow text-cgws-accent text-[11px] uppercase tracking-[0.2em] mb-4"
            aria-hidden="true"
          >
            Boutique
          </p>
          <ul class="flex flex-col gap-3" role="list" aria-label="Informations de la boutique">
            <!-- Adresse -->
            <li class="flex items-start gap-2">
              <UIcon
                name="i-lucide-map-pin"
                class="w-4 h-4 text-cgws-accent flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <!-- TODO: confirmer adresse exacte avec Camille -->
              <span class="font-sans text-sm text-cgws-ink-soft/80 leading-snug">
                Brèches, 37320 Indre-et-Loire
              </span>
            </li>
            <!-- Téléphone -->
            <li class="flex items-center gap-2">
              <UIcon
                name="i-lucide-phone"
                class="w-4 h-4 text-cgws-accent flex-shrink-0"
                aria-hidden="true"
              />
              <!-- TODO: confirmer numéro de téléphone avec Camille -->
              <a
                href="tel:+33600000000"
                class="font-sans text-sm text-cgws-ink-soft/80 hover:text-cgws-accent
                       transition-colors duration-150
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-cgws-accent focus-visible:ring-offset-2
                       focus-visible:ring-offset-cgws-ground rounded-sm"
              >
                06 XX XX XX XX
              </a>
            </li>
            <!-- Horaires -->
            <li class="flex items-start gap-2">
              <UIcon
                name="i-lucide-clock"
                class="w-4 h-4 text-cgws-accent flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div class="font-sans text-sm text-cgws-ink-soft/80 leading-snug">
                <span class="block">Mar – Ven · 10h – 18h</span>
                <span class="block">Samedi · 9h – 17h</span>
                <span class="block">Dim – Lun · Fermé</span>
              </div>
            </li>
            <!-- Email -->
            <li class="flex items-center gap-2">
              <UIcon
                name="i-lucide-mail"
                class="w-4 h-4 text-cgws-accent flex-shrink-0"
                aria-hidden="true"
              />
              <a
                href="mailto:contact@cgws.fr"
                class="font-sans text-sm text-cgws-ink-soft/80 hover:text-cgws-accent
                       transition-colors duration-150
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-cgws-accent focus-visible:ring-offset-2
                       focus-visible:ring-offset-cgws-ground rounded-sm"
              >
                contact@cgws.fr
              </a>
            </li>
          </ul>
        </div>

        <!-- ── Colonne 4 : Légal ───────────────────────────────────── -->
        <!--
          Mobile  : order-3 → col 2 ligne 2 (aux côtés de Nav). Séparateur border-t.
          Tablet+ : sm:order-4 → col 2 ligne 2. Séparateur retiré.
          Desktop : lg → col 4 ligne 1.
        -->
        <div
          class="col-span-1 order-3 sm:order-4
                 border-t border-cgws-hairline pt-6
                 sm:border-t-0 sm:pt-0"
        >
          <p
            class="font-eyebrow text-cgws-accent text-[11px] uppercase tracking-[0.2em] mb-4"
            aria-hidden="true"
          >
            Informations
          </p>
          <ul class="flex flex-col gap-3" role="list" aria-label="Informations légales">
            <li>
              <NuxtLink
                to="/mentions-legales"
                active-class="text-cgws-accent"
                class="font-sans text-sm text-cgws-ink-soft hover:text-cgws-accent
                       transition-colors duration-150
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-cgws-accent focus-visible:ring-offset-2
                       focus-visible:ring-offset-cgws-ground rounded-sm"
              >
                Mentions légales
              </NuxtLink>
            </li>
            <li>
              <span
                class="font-sans text-sm text-cgws-ink-soft/40 cursor-not-allowed"
                aria-label="CGV — page à venir"
              >
                CGV (à venir)
              </span>
            </li>
            <li>
              <span
                class="font-sans text-sm text-cgws-ink-soft/40 cursor-not-allowed"
                aria-label="Politique de confidentialité — page à venir"
              >
                Politique de conf. (à venir)
              </span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Séparateur concho — ring-class adapté au fond sombre -->
      <ConchoDivider
        bg-class="bg-cgws-ground"
        ring-class="ring-cgws-ground"
        class="mt-8 mb-6"
      />

      <!-- Barre de bas -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-2">
        <p class="font-sans text-xs text-cgws-ink-soft/60 text-center sm:text-left">
          © {{ currentYear }} CGWS — Camille Guignon Western Shop
        </p>
        <p class="font-sans text-xs text-cgws-ink-soft/60 text-center sm:text-right">
          Fait avec ♥ en Indre-et-Loire
        </p>
      </div>
      <!-- eslint-enable link-checker/valid-route link-checker/valid-sitemap-link -->
    </div>
  </footer>
</template>
