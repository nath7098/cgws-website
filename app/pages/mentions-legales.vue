<script setup lang="ts">
useSeoMeta({
  title: 'Mentions légales — CGWS',
  description:
    'Mentions légales de CGWS — Camille Guignon Western Shop, boutique de sellerie équestre western à Brèches, Indre-et-Loire.',
  robots: 'noindex, nofollow',
})
</script>

<template>
  <div class="bg-cgws-ground min-h-screen">
    <!-- Lien retour — en dehors du container article centré -->
    <div class="max-w-[1280px] mx-auto px-[clamp(1rem,4vw,2rem)] pt-6 md:pt-8">
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-1.5 font-sans text-sm text-cgws-accent
               hover:text-cgws-ink-soft transition-colors duration-150
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent
               focus-visible:ring-offset-2 rounded-sm"
      >
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" aria-hidden="true" />
        Retour à l'accueil
      </NuxtLink>
    </div>

    <!-- Contenu légal -->
    <article
      class="max-w-3xl mx-auto px-[clamp(1rem,4vw,2rem)] py-8 md:py-16"
      aria-labelledby="legal-title"
    >
      <!-- En-tête -->
      <h1
        id="legal-title"
        class="font-display text-[40px] sm:text-[48px] md:text-[56px]
               text-cgws-ink tracking-wide uppercase leading-none mb-2"
      >
        Mentions Légales
      </h1>
      <p class="font-sans text-[12px] md:text-[13px] text-cgws-ink/50 mb-10">
        Dernière mise à jour : janvier 2025
      </p>
      <hr class="border-t border-cgws-hairline mb-10" aria-hidden="true">

      <!-- 1. Éditeur du site -->
      <section class="mb-10 md:mb-12" aria-labelledby="section-editeur">
        <h2
          id="section-editeur"
          class="font-serif font-bold text-[20px] sm:text-[22px] md:text-[24px]
                 text-cgws-ink leading-snug mb-4"
        >
          1. Éditeur du site
        </h2>
        <dl
          class="font-sans text-[14px] md:text-[15px] text-cgws-ink/80
                 leading-relaxed space-y-1"
        >
          <div class="flex flex-wrap gap-x-2">
            <dt class="font-semibold text-cgws-ink">Raison sociale :</dt>
            <dd>Camille Guignon — CGWS (Camille Guignon Western Shop)</dd>
          </div>
          <div class="flex flex-wrap gap-x-2">
            <dt class="font-semibold text-cgws-ink">Forme juridique :</dt>
            <dd>Entreprise individuelle</dd>
          </div>
          <div class="flex flex-wrap gap-x-2">
            <dt class="font-semibold text-cgws-ink">SIRET :</dt>
            <!-- TODO: confirmer SIRET avec Camille -->
            <dd>XXX XXX XXX XXXXX</dd>
          </div>
          <div class="flex flex-wrap gap-x-2">
            <dt class="font-semibold text-cgws-ink">Adresse :</dt>
            <!-- TODO: confirmer adresse exacte avec Camille -->
            <dd>Brèches, 37330 Indre-et-Loire, France</dd>
          </div>
          <div class="flex flex-wrap gap-x-2">
            <dt class="font-semibold text-cgws-ink">Email :</dt>
            <dd>
              <a
                href="mailto:contact@cgws.fr"
                class="text-cgws-accent hover:underline transition-colors duration-150"
              >contact@cgws.fr</a>
            </dd>
          </div>
          <div class="flex flex-wrap gap-x-2">
            <dt class="font-semibold text-cgws-ink">Téléphone :</dt>
            <!-- TODO: confirmer numéro de téléphone avec Camille -->
            <dd>
              <a
                href="tel:+33600000000"
                class="text-cgws-accent hover:underline transition-colors duration-150"
              >06 XX XX XX XX</a>
            </dd>
          </div>
          <div class="flex flex-wrap gap-x-2">
            <dt class="font-semibold text-cgws-ink">Directrice de la publication :</dt>
            <dd>Camille Guignon</dd>
          </div>
        </dl>
      </section>

      <!-- 2. Hébergeur -->
      <section class="mb-10 md:mb-12" aria-labelledby="section-hebergeur">
        <h2
          id="section-hebergeur"
          class="font-serif font-bold text-[20px] sm:text-[22px] md:text-[24px]
                 text-cgws-ink leading-snug mb-4"
        >
          2. Hébergeur
        </h2>
        <dl
          class="font-sans text-[14px] md:text-[15px] text-cgws-ink/80
                 leading-relaxed space-y-1"
        >
          <div class="flex flex-wrap gap-x-2">
            <dt class="font-semibold text-cgws-ink">Société :</dt>
            <dd>Vercel Inc.</dd>
          </div>
          <div class="flex flex-wrap gap-x-2">
            <dt class="font-semibold text-cgws-ink">Adresse :</dt>
            <dd>340 Pine Street, Suite 700, San Francisco, CA 94104, États-Unis</dd>
          </div>
          <div class="flex flex-wrap gap-x-2">
            <dt class="font-semibold text-cgws-ink">Site web :</dt>
            <dd>
              <a
                href="https://vercel.com"
                target="_blank"
                rel="noopener noreferrer"
                class="text-cgws-accent hover:underline transition-colors duration-150"
              >
                vercel.com
                <span class="sr-only">(ouvre un nouvel onglet)</span>
              </a>
            </dd>
          </div>
        </dl>
      </section>

      <!-- 3. Propriété intellectuelle -->
      <section class="mb-10 md:mb-12" aria-labelledby="section-propriete">
        <h2
          id="section-propriete"
          class="font-serif font-bold text-[20px] sm:text-[22px] md:text-[24px]
                 text-cgws-ink leading-snug mb-4"
        >
          3. Propriété intellectuelle
        </h2>
        <p
          class="font-sans text-[14px] md:text-[15px] text-cgws-ink/80 leading-relaxed"
        >
          Le contenu de ce site (textes, photographies, visuels) est la propriété exclusive
          de CGWS — Camille Guignon Western Shop, sauf mention contraire. Toute reproduction,
          même partielle, est interdite sans autorisation préalable écrite.
        </p>
      </section>

      <!-- 4. Données personnelles -->
      <section class="mb-10 md:mb-12" aria-labelledby="section-donnees">
        <h2
          id="section-donnees"
          class="font-serif font-bold text-[20px] sm:text-[22px] md:text-[24px]
                 text-cgws-ink leading-snug mb-4"
        >
          4. Données personnelles
        </h2>
        <p
          class="font-sans text-[14px] md:text-[15px] text-cgws-ink/80 leading-relaxed"
        >
          Conformément au Règlement Général sur la Protection des Données (RGPD, UE 2016/679)
          et à la loi Informatique et Libertés du 6 janvier 1978 modifiée, vous disposez d'un
          droit d'accès, de rectification, d'opposition et de suppression des données vous
          concernant. Pour exercer ce droit, contactez-nous à l'adresse :
          <a
            href="mailto:contact@cgws.fr"
            class="text-cgws-accent hover:underline transition-colors duration-150"
          >contact@cgws.fr</a>
        </p>
        <p
          class="font-sans text-[14px] md:text-[15px] text-cgws-ink/80 leading-relaxed mt-4"
        >
          Les données collectées via le formulaire de contact (nom, email, message) sont
          utilisées uniquement pour répondre à votre demande. Elles ne sont ni cédées ni
          vendues à des tiers. Durée de conservation : 12 mois.
        </p>
      </section>

      <!-- 5. Cookies -->
      <section class="mb-10 md:mb-12" aria-labelledby="section-cookies">
        <h2
          id="section-cookies"
          class="font-serif font-bold text-[20px] sm:text-[22px] md:text-[24px]
                 text-cgws-ink leading-snug mb-4"
        >
          5. Cookies
        </h2>
        <p
          class="font-sans text-[14px] md:text-[15px] text-cgws-ink/80 leading-relaxed"
        >
          Ce site utilise uniquement des cookies strictement nécessaires à son fonctionnement
          (préférences de session). Aucun cookie de tracking publicitaire ou analytique tiers
          n'est déposé sans votre consentement explicite.
        </p>
        <!-- TODO: formulation légale à valider par Nathan (transparence exemption CNIL mesure d'audience — US-102) -->
        <p
          class="font-sans text-[14px] md:text-[15px] text-cgws-ink/80 leading-relaxed mt-4"
        >
          Ce site utilise par ailleurs un outil de mesure d'audience (PostHog, hébergé dans
          l'Union européenne) configuré en mode strictement anonyme : aucun cookie ni traceur
          n'est déposé sur votre appareil, aucune donnée permettant de vous identifier n'est
          collectée et votre adresse IP n'est pas conservée. Ce dispositif, limité à la
          production de statistiques anonymes de fréquentation, est exempté de consentement
          conformément aux lignes directrices de la CNIL — c'est pourquoi aucun bandeau de
          consentement ne vous est présenté.
        </p>
      </section>

      <!-- 6. Conditions Générales de Vente -->
      <section class="mb-10 md:mb-12" aria-labelledby="section-cgv">
        <h2
          id="section-cgv"
          class="font-serif font-bold text-[20px] sm:text-[22px] md:text-[24px]
                 text-cgws-ink leading-snug mb-4"
        >
          6. Conditions Générales de Vente
        </h2>

        <!-- 6.1 -->
        <h3
          class="font-serif font-semibold text-[17px] md:text-[18px]
                 text-cgws-ink mb-2 mt-6"
        >
          6.1 Champ d'application
        </h3>
        <p
          class="font-sans text-[14px] md:text-[15px] text-cgws-ink/80 leading-relaxed"
        >
          Les présentes CGV s'appliquent à toute vente réalisée par CGWS, que ce soit
          en boutique physique ou via une demande de réservation en ligne.
        </p>

        <!-- 6.2 -->
        <h3
          class="font-serif font-semibold text-[17px] md:text-[18px]
                 text-cgws-ink mb-2 mt-6"
        >
          6.2 Prix
        </h3>
        <p
          class="font-sans text-[14px] md:text-[15px] text-cgws-ink/80 leading-relaxed"
        >
          Les prix sont indiqués en euros TTC. CGWS se réserve le droit de modifier ses
          prix à tout moment. Le prix facturé est celui en vigueur au moment de la commande.
        </p>

        <!-- 6.3 -->
        <h3
          class="font-serif font-semibold text-[17px] md:text-[18px]
                 text-cgws-ink mb-2 mt-6"
        >
          6.3 Droit de rétractation
        </h3>
        <p
          class="font-sans text-[14px] md:text-[15px] text-cgws-ink/80 leading-relaxed"
        >
          Conformément à l'article L221-18 du Code de la consommation, vous bénéficiez
          d'un délai de 14 jours pour exercer votre droit de rétractation sur les achats
          en ligne, à compter de la réception du bien. Ce droit ne s'applique pas aux
          articles personnalisés ou aux achats effectués directement en boutique.
        </p>

        <!-- 6.4 -->
        <h3
          class="font-serif font-semibold text-[17px] md:text-[18px]
                 text-cgws-ink mb-2 mt-6"
        >
          6.4 Service de consignation
        </h3>
        <p
          class="font-sans text-[14px] md:text-[15px] text-cgws-ink/80 leading-relaxed"
        >
          Le service de dépôt-vente est soumis à un accord écrit entre le déposant et CGWS.
          Les modalités (prix de vente, durée du dépôt, commission) sont définies lors de
          la prise en charge du matériel. CGWS n'est pas responsable des dommages survenus
          en dehors de son fait.
        </p>

        <!-- 6.5 -->
        <h3
          class="font-serif font-semibold text-[17px] md:text-[18px]
                 text-cgws-ink mb-2 mt-6"
        >
          6.5 Litiges
        </h3>
        <p
          class="font-sans text-[14px] md:text-[15px] text-cgws-ink/80 leading-relaxed"
        >
          En cas de litige, une solution amiable sera recherchée en priorité. À défaut,
          les tribunaux compétents de Tours (Indre-et-Loire) seront seuls habilités à
          trancher le différend. La présente clause s'applique même en cas de pluralité
          de défendeurs.
        </p>
      </section>
    </article>
  </div>
</template>
