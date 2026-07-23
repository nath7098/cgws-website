# CGWS — Plan Scrum Détaillé
## Camille Guignon Western Shop · 9 semaines · 6 sprints

---

## Vue d'ensemble

| Sprint | Durée | Épic | Points | Objectif |
|--------|-------|------|--------|----------|
| Sprint 0 | 1 sem | Fondations | 13 | Socle technique + design system |
| Sprint 1 | 2 sem | Site public | 27 | Vitrine complète consultable |
| Sprint 2 | 1 sem | Services + SEO | 13 | Consignation + référencement |
| Sprint 3 | 2 sem | Backoffice Produits | 26 | Gestion catalogue admin |
| Sprint 4 | 2 sem | Backoffice Commerce | 23 | Ventes + consignations + clients |
| Sprint 5 | 1 sem | Polish & Go-live | 21 | Animations + perf + tests E2E |
| Sprint 6 | — | Refonte v3 bi-thème | — | Rebrand design system + skin switcher public/admin |
| Sprint 7 | 1 sem | Features post-refonte | 16 | Import CSV produits + espace déposant (magic link) |
| Sprint 8 | 1 sem | Qualité & Dette technique | 20 | Typecheck réel à 0 erreur, CI verte, tests chemin de paiement, emails unifiés, nettoyage |
| **TOTAL** | **9 sem** | **6 épics** | **123 pts** | *(hors Sprint 6/7/8, ajoutés après le pivot refonte et la recette US-082)* |

**Velocity cible** : 13–27 pts/sprint selon durée
**Capacité** : projet solo/micro-team, sessions de travail le soir + weekends
**Outil de suivi** : GitHub Issues (labels: `epic/*`, `sprint/*`, `type/*`, `priority/*`)

---

## Personas CGWS

| ID | Persona | Description |
|----|---------|-------------|
| P1 | Camille (Gérante) | Gère le stock, saisit les produits, suit les ventes depuis mobile ou PC |
| P2 | Cavalier(e) amateur | Cherche équipements western abordables, pas expert en ligne |
| P3 | Déposant consignation | Veut vendre son matériel d'occasion facilement |
| P4 | Cavalier(e) confirmé(e) | Connaît les marques, compare, cherche qualité et authenticité |

---

## Épic E1 — Fondations Techniques

**Sprint 0 · 1 semaine · 13 points**
**Objectif** : Projet Nuxt 4 initialisé, déployé sur Vercel preview, design system fonctionnel.

---

### US-001 · Initialisation du projet Nuxt 4 · 3 pts

**En tant que** développeur,
**Je veux** un projet Nuxt 4 initialisé avec toute la configuration technique,
**Afin de** démarrer le développement sur une base solide et cohérente.

**Critères d'acceptation :**

```gherkin
Given  un terminal dans le dossier de travail
When   je lance le setup du projet
Then   la structure cgws-website/ est créée avec Nuxt 4, TypeScript strict, ESLint, Prettier
And    Nuxt UI v3, TailwindCSS v4, Pinia, Nuxt Image, GSAP sont installés
And    la structure app/ server/ supabase/ tests/ docs/ est en place
And    `nuxt dev` démarre sans erreur sur localhost:3000
And    un déploiement Vercel preview est accessible via URL partageable
And    le fichier CLAUDE.md est à la racine du projet
```

**Tâches techniques :**
- `npx nuxi@latest init cgws-website --template ui`
- Config `nuxt.config.ts` : modules, runtimeConfig, i18n FR
- `tsconfig.json` : strict mode, paths aliases `~/*`
- `.eslintrc` + `.prettierrc` selon conventions CLAUDE.md
- GitHub repo + branch strategy (main/develop/feature/*)
- Vercel project link + env vars staging

**Commit** : `feat(init): scaffold Nuxt 4 project with full toolchain [US-001]`

---

### US-002 · Configuration Supabase · 5 pts

**En tant que** gérante (P1),
**Je veux** une base de données configurée avec tous les schémas nécessaires,
**Afin de** pouvoir stocker produits, consignations, ventes et clients dès le début.

**Critères d'acceptation :**

```gherkin
Given  un projet Supabase créé sur supabase.com
When   les migrations sont appliquées
Then   les tables products, categories, consignments, sales, clients existent avec leurs colonnes
And    les RLS policies protègent les données (admin only pour écriture)
And    un bucket storage "product-images" existe avec accès public en lecture
And    un utilisateur admin test est créé via Supabase Auth
And    les variables SUPABASE_URL et SUPABASE_ANON_KEY sont dans .env.local
And    le composable useSupabase() fonctionne et retourne le client typé
```

**Schéma SQL :**
```sql
-- products, categories, consignments, sales, clients
-- (voir CLAUDE.md §Supabase Schema pour le DDL complet)
```

**Tâches techniques :**
- Créer projet Supabase CGWS (région eu-west-3 Paris)
- Écrire migrations dans `supabase/migrations/`
- Configurer RLS : SELECT public, INSERT/UPDATE/DELETE admin uniquement
- Storage bucket + CORS policy pour Vercel
- `useSupabase.ts` composable avec types générés
- Seed data : 3 catégories + 5 produits de démo

**Commit** : `feat(db): setup Supabase schema, RLS policies and storage [US-002]`

---

### US-003 · Design System CGWS · 5 pts

**En tant que** visiteur (P2, P4),
**Je veux** une identité visuelle cohérente western premium sur toutes les pages,
**Afin de** ressentir l'authenticité et la qualité de la boutique dès ma première visite.

**Critères d'acceptation :**

```gherkin
Given  la page de développement des composants est ouverte
When   j'inspecte les tokens de couleur
Then   les variables CSS cgws-tack, cgws-leather, cgws-copper, cgws-rope, cgws-parchment, cgws-cream, cgws-denim, cgws-rust, cgws-charcoal sont définies
And    les fonts Bebas Neue (hero), Playfair Display (titres), Inter (corps), Rye (eyebrows) sont chargées
And    les composants CgwsButton, CgwsCard, CgwsBadge, CgwsInput, TagCard sont disponibles
And    CgwsButton a les variants "primary" (copper), "secondary" (outline denim), "ghost" (texte)
And    la page /dev-components affiche tous les composants avec leurs states
And    le layout de base (header placeholder + footer placeholder + slot) est fonctionnel
```

**Tokens TailwindCSS v4 :**
```css
/* app/assets/css/tokens.css */
:root {
  --cgws-brown:    #8B4513;
  --cgws-amber:    #D4A017;
  --cgws-parchment:#F5F0E8;
  --cgws-dark:     #1C1208;
  --cgws-rust:     #C4501A;
  --cgws-sand:     #E8D5B7;
  --cgws-cream:    #FBF8F3;
}
```

**Tâches techniques :**
- `app/assets/css/main.css` + `tokens.css` + `typography.css`
- `tailwind.config.ts` : extend avec tokens cgws-*
- Composants UI : `CgwsButton.vue`, `CgwsCard.vue`, `CgwsBadge.vue`, `CgwsInput.vue`, `CgwsSelect.vue`
- Layout `default.vue` (header + main + footer slots)
- Page `/dev-components` pour preview (désactivée en prod)

**Commit** : `feat(design): implement CGWS design system and base components [US-003]`

---

## Épic E2 — Site Public Vitrine

**Sprint 1 · 2 semaines · 27 points**
**Objectif** : Un visiteur peut découvrir CGWS, naviguer dans le catalogue et consulter les fiches produits.

---

### US-010 · Hero Section Homepage · 8 pts

**En tant que** cavalier(e) (P2, P4),
**Je veux** une page d'accueil immersive et mémorable,
**Afin de** comprendre immédiatement l'univers et la proposition de valeur de CGWS.

**Critères d'acceptation :**

```gherkin
Given  je visite cgws.fr pour la première fois
When   la page se charge
Then   un hero plein-écran s'affiche avec une image/vidéo de qualité en arrière-plan
And    le titre "L'AUTHENTIQUE WESTERN À VOTRE PORTÉE" apparaît en Bebas Neue 72px avec animation GSAP
And    un sous-titre en Playfair Display italic est visible
And    deux CTA sont présents : "Découvrir le catalogue" (amber) et "Service consignation" (outline)
And    une illustration SVG selle western est intégrée avec animation subtile
And    le LCP est inférieur à 2.5 secondes mesuré par Lighthouse
And    la section stats (250+ articles, 15+ marques, 100% passion, Brèches 37) est visible en-dessous

Given  je suis sur mobile
When   je charge la page d'accueil
Then   le hero s'adapte avec une image portrait et les CTA en colonne
```

**Animations GSAP requises :**
- Titre : stagger letter-by-letter reveal depuis opacity 0 + y: 30
- Sous-titre : fade in avec délai 0.8s
- CTA : slide up avec délai 1.2s
- Stats bar : counter animation au scroll (0 → valeur finale)

**Tâches techniques :**
- `app/pages/index.vue` + `app/components/home/HeroSection.vue`
- `app/components/home/StatsBar.vue`
- `app/components/home/SaddleIllustration.vue` (SVG natif)
- GSAP ScrollTrigger pour stats + NuxtImg pour image hero (WebP, priority: true)
- Variante mobile (image portrait dans `app/assets/img/hero-mobile.webp`)

**Commit** : `feat(home): immersive hero section with GSAP animations and stats bar [US-010]`

---

### US-011 · Section "Notre Histoire" · 3 pts

**En tant que** visiteur (P2),
**Je veux** comprendre qui est derrière CGWS et leur passion,
**Afin de** créer un lien de confiance avant d'acheter.

**Critères d'acceptation :**

```gherkin
Given  je fais défiler la page d'accueil
When   j'atteins la section "Notre Histoire"
Then   une photo de Camille avec son cheval est visible (ou placeholder professionnel)
And    un texte storytelling (~150 mots) présente la passion western et la boutique à Brèches
And    un lien "En savoir plus" pointe vers /a-propos
And    la section respecte les critères WCAG AA (contraste, alt text)
And    une animation GSAP fade-in-left (texte) + fade-in-right (image) se déclenche au scroll
```

**Tâches techniques :**
- `app/components/home/OurStorySection.vue`
- Texte placeholder en français (à personnaliser par Camille)
- GSAP ScrollTrigger : split animation texte/image

**Commit** : `feat(home): our story section with scroll animations [US-011]`

---

### US-012 · Catalogue — Liste Produits · 8 pts

**En tant que** cavalier(e) (P2, P4),
**Je veux** parcourir tous les produits avec des filtres efficaces,
**Afin de** trouver rapidement ce qui correspond à mes besoins et mon budget.

**Critères d'acceptation :**

```gherkin
Given  je navigue vers /catalogue
When   la page se charge
Then   une grille de produits s'affiche (4 colonnes desktop, 2 tablet, 1 mobile)
And    chaque carte affiche : image, nom, marque, prix, état (Neuf/Occasion), badge "Consignation" si applicable
And    un panneau de filtres permet de filtrer par catégorie, marque, prix min/max, disponibilité, type (neuf/occasion)
And    un sélecteur de tri permet : Prix ↑, Prix ↓, Nouveautés, Pertinence
And    les filtres actifs sont reflétés dans l'URL (?categorie=selles&prix_max=500)
And    le scroll infini charge 12 produits supplémentaires automatiquement
And    des skeletons s'affichent pendant le chargement

Given  aucun produit ne correspond aux filtres
When   j'applique des filtres restrictifs
Then   un message "Aucun résultat — modifiez vos critères" s'affiche avec bouton reset

Given  je suis sur mobile
When   j'ouvre les filtres
Then   un drawer bottom apparaît avec les filtres complets
```

**Tâches techniques :**
- `app/pages/catalogue/index.vue`
- `app/components/catalogue/ProductGrid.vue`
- `app/components/catalogue/ProductCard.vue`
- `app/components/catalogue/FilterPanel.vue` + `FilterDrawer.vue` (mobile)
- `app/composables/useCatalogue.ts` : gestion state filtres + Supabase query builder
- `app/composables/useInfiniteScroll.ts` : Intersection Observer
- Skeleton loader : `app/components/ui/ProductCardSkeleton.vue`

**Commit** : `feat(catalogue): product grid with filters, sort and infinite scroll [US-012]`

---

### US-013 · Fiche Produit · 5 pts

**En tant que** cavalier(e) (P4),
**Je veux** voir tous les détails d'un produit avec de bonnes photos,
**Afin de** prendre une décision d'achat éclairée.

**Critères d'acceptation :**

```gherkin
Given  je clique sur un produit dans le catalogue
When   la fiche produit se charge
Then   une galerie d'images avec Swiper (miniatures en bas) est affichée
And    le nom, la marque, le prix, l'état et la description complète sont visibles
And    si le produit est en consignation, un badge "Article consignation" + explication courte apparaît
And    les dimensions/taille sont affichées si renseignées
And    4 produits similaires (même catégorie) sont affichés en bas de page
And    les meta SEO (title, description, OG) sont générés dynamiquement avec le nom du produit
And    l'URL est /catalogue/[slug-produit]

Given  le produit est "Vendu"
When   j'accède à la fiche
Then   un badge "Vendu" rouge s'affiche et le CTA est désactivé
```

**Tâches techniques :**
- `app/pages/catalogue/[slug].vue` + `useRoute().params.slug`
- `app/components/product/ProductGallery.vue` (Swiper + NuxtImg)
- `app/components/product/ProductInfo.vue`
- `app/components/product/RelatedProducts.vue`
- `useSeoMeta()` dynamique avec données Supabase
- Gestion 404 si slug introuvable

**Commit** : `feat(product): product detail page with gallery, SEO and related items [US-013]`

---

### US-014 · Navigation Responsive · 3 pts

**En tant que** visiteur (P2),
**Je veux** naviguer facilement sur mobile comme sur desktop,
**Afin de** trouver ce que je cherche sans friction.

**Critères d'acceptation :**

```gherkin
Given  je suis sur desktop (>1024px)
When   je charge n'importe quelle page
Then   un header sticky affiche le logo CGWS (amber), les liens Nav (Catalogue, Consignation, À Propos, Contact) et l'icône téléphone
And    le header devient légèrement opaque (backdrop-blur) au scroll

Given  je suis sur mobile (<768px)
When   je tape l'icône hamburger
Then   un menu drawer s'ouvre depuis la droite avec tous les liens + info contact
And    une animation slide-in accompagne l'ouverture/fermeture
And    le menu se ferme quand je clique sur un lien ou en dehors
```

**Tâches techniques :**
- `app/components/layout/AppHeader.vue`
- `app/components/layout/MobileMenu.vue`
- `app/composables/useScrollHeader.ts` : scroll detection pour opacité
- Transition CSS + GSAP pour menu mobile

**Commit** : `feat(nav): responsive sticky header with mobile drawer menu [US-014]`

---

## Épic E3 — Services & SEO

**Sprint 2 · 1 semaine · 13 points**
**Objectif** : La page consignation est opérationnelle, le SEO fondations est en place.

---

### US-020 · Page Consignation · 5 pts

**En tant que** déposant (P3),
**Je veux** comprendre le service de consignation et déposer ma demande en ligne,
**Afin de** vendre mon matériel sans effort.

**Critères d'acceptation :**

```gherkin
Given  je visite /consignation
When   la page se charge
Then   le fonctionnement en 3 étapes est clairement présenté (Déposer → Exposer → Vendre)
And    les conditions de consignation sont affichées (commission, durée, état requis)

When   je remplis le formulaire de dépôt
Then   je peux saisir mes coordonnées, décrire l'article, indiquer le prix souhaité
And    je peux uploader jusqu'à 5 photos (JPEG/PNG < 5MB chacune)
And    une validation front-end s'affiche en temps réel (champs requis, format email, taille fichier)

When   je soumets le formulaire valide
Then   une demande est créée en base avec statut "pending"
And    je reçois un email de confirmation via Resend avec récapitulatif
And    un message de succès s'affiche sur la page

Given  le formulaire a des erreurs
When   je tente de soumettre
Then   les champs en erreur sont mis en évidence avec messages explicites
```

**Tâches techniques :**
- `app/pages/consignation.vue`
- `app/components/consignation/HowItWorks.vue` (3 steps visuels)
- `app/components/consignation/ConsignmentForm.vue`
- `server/api/consignments/create.post.ts` : validation Zod + insert Supabase + upload Storage
- `server/services/email.ts` : template Resend confirmation déposant
- Compression images côté client avant upload (browser-image-compression)

**Commit** : `feat(consignment): public consignment page with form and email confirmation [US-020]`

---

### US-021 · Page Contact · 3 pts

**En tant que** visiteur (P2),
**Je veux** pouvoir contacter CGWS facilement,
**Afin d'** obtenir une réponse à ma question avant d'acheter.

**Critères d'acceptation :**

```gherkin
Given  je visite /contact
When   la page se charge
Then   un formulaire (Nom, Email, Sujet, Message) est affiché
And    une carte OpenStreetMap centrée sur Brèches (37) est intégrée sans tracking Google
And    les infos pratiques sont visibles (adresse, téléphone, horaires, email)

When   je soumets le formulaire correctement rempli
Then   un email est envoyé à Camille via Resend avec les informations
And    un message de succès s'affiche sans rechargement de page
And    un honeypot anti-spam est actif (champ caché, rate limiting côté serveur)
```

**Tâches techniques :**
- `app/pages/contact.vue`
- Carte : Leaflet.js avec tuiles OpenStreetMap (pas Google Maps)
- `server/api/contact.post.ts` : Zod validation + rate limit (5 req/hour/IP) + Resend
- Honeypot field : `<input name="website" class="sr-only" tabindex="-1">`

**Commit** : `feat(contact): contact page with OSM map, form and spam protection [US-021]`

---

### US-022 · Footer & Mentions Légales · 2 pts

**En tant que** visiteur,
**Je veux** accéder aux informations légales et aux liens utiles depuis le bas de page,
**Afin de** naviguer facilement et respecter mes droits.

**Critères d'acceptation :**

```gherkin
Given  je suis sur n'importe quelle page
When   je fais défiler jusqu'en bas
Then   un footer sombre (cgws-dark) s'affiche avec : logo, liens de navigation, infos contact, liens légaux
And    une bordure top amber (#D4A017) le distingue du contenu

Given  je clique sur "Mentions légales"
When   la page /mentions-legales se charge
Then   les informations légales complètes sont présentes (éditeur, hébergeur, SIRET, CGV basiques)
```

**Tâches techniques :**
- `app/components/layout/AppFooter.vue`
- `app/pages/mentions-legales.vue`
- Contenu mentions légales placeholder (à valider avec Camille)

**Commit** : `feat(layout): footer with legal links and mentions légales page [US-022]`

---

### US-023 · SEO Fondations · 3 pts

**En tant que** gérante (P1),
**Je veux** que le site soit bien référencé sur Google pour "équipements western Indre-et-Loire",
**Afin d'** attirer des clients sans publicité payante.

**Critères d'acceptation :**

```gherkin
Given  le site est en production
When   Google crawle le site
Then   un sitemap.xml généré dynamiquement liste toutes les pages et produits
And    un robots.txt autorise le crawl sauf /admin/*
And    chaque page a des balises <title> et <meta description> uniques et pertinentes
And    les balises Open Graph (og:title, og:description, og:image) sont présentes
And    un Schema.org LocalBusiness est présent sur la homepage
And    un Schema.org Product est présent sur chaque fiche produit
And    Google Search Console peut valider le site sans erreurs

Given  je partage un lien produit sur les réseaux sociaux
When   l'aperçu se génère
Then   l'image og:image du produit s'affiche correctement
```

**Tâches techniques :**
- `app/composables/useSeo.ts` : wrapper `useSeoMeta()` + `useSchemaOrg()`
- `server/routes/sitemap.xml.ts` : génération dynamique depuis Supabase
- `public/robots.txt`
- Schema.org : `LocalBusiness` (homepage), `Product` (fiches), `BreadcrumbList`
- OG image : image produit ou fallback CGWS branded

**Commit** : `feat(seo): sitemap, robots, meta tags, OpenGraph and schema.org [US-023]`

---

## Épic E4 — Backoffice Produits

**Sprint 3 · 2 semaines · 26 points**
**Objectif** : Camille peut gérer le catalogue complet depuis l'interface admin.

---

### US-030 · Authentification Admin · 5 pts

**En tant que** gérante (P1),
**Je veux** accéder à l'administration de façon sécurisée,
**Afin d'** être la seule à pouvoir modifier le catalogue et gérer les ventes.

**Critères d'acceptation :**

```gherkin
Given  je navigue vers /admin
When   je ne suis pas connectée
Then   je suis redirigée vers /admin/login

Given  je suis sur /admin/login
When   je saisis mes identifiants Supabase Auth corrects
Then   je suis connectée et redirigée vers /admin/dashboard
And    ma session persiste même après refresh (localStorage token Supabase)

Given  je suis connectée
When   je clique sur "Déconnexion"
Then   ma session est détruite et je suis redirigée vers /admin/login

Given  quelqu'un tente d'accéder à /admin/* sans être connecté
When   la route est chargée
Then   le middleware admin redirige systématiquement vers /admin/login
```

**Tâches techniques :**
- `app/pages/admin/login.vue`
- `app/middleware/admin.ts` : vérifie `supabase.auth.getUser()` + redirect
- `app/layouts/admin.vue` : sidebar + topbar dédiées
- `app/composables/useAdminAuth.ts`

**Commit** : `feat(admin): authentication with Supabase Auth and admin middleware [US-030]`

---

### US-031 · Dashboard Admin · 3 pts

**En tant que** gérante (P1),
**Je veux** voir un tableau de bord synthétique à l'ouverture de l'admin,
**Afin d'** avoir une vue d'ensemble immédiate de l'activité.

**Critères d'acceptation :**

```gherkin
Given  je suis connectée à l'admin
When   j'accède à /admin/dashboard
Then   4 KPI cards s'affichent : "CA ce mois" (€), "Produits actifs" (nb), "Consignations en attente" (nb en orange si >0), "Ventes ce mois" (nb)
And    les 5 dernières consignations reçues sont listées avec leur statut
And    les 5 dernières ventes enregistrées sont listées
And    des liens rapides mènent vers "Ajouter un produit", "Gérer les consignations", "Voir le catalogue"
```

**Tâches techniques :**
- `app/pages/admin/dashboard.vue`
- `app/components/admin/KpiCard.vue`
- `app/components/admin/RecentActivity.vue`
- Queries Supabase parallèles via `Promise.all()`

**Commit** : `feat(admin): dashboard with KPIs and recent activity feed [US-031]`

---

### US-032 · CRUD Produits · 13 pts

**En tant que** gérante (P1),
**Je veux** ajouter, modifier et supprimer des produits facilement,
**Afin de** maintenir le catalogue à jour sans intervention technique.

**Critères d'acceptation :**

```gherkin
Given  je suis sur /admin/produits
When   la page se charge
Then   la liste de tous les produits s'affiche (nom, catégorie, prix, statut, date ajout)
And    une barre de recherche filtre en temps réel par nom ou marque
And    des filtres permettent de filtrer par catégorie, statut (Disponible/Vendu/Réservé)
And    la liste est paginée (20 produits/page)

Given  je clique sur "Ajouter un produit"
When   le formulaire s'ouvre
Then   je peux renseigner : nom*, catégorie*, marque, description, prix*, état (Neuf/Occasion)*, dimensions/taille, poids
And    je peux uploader jusqu'à 8 images (drag & drop + bouton), visualiser et réordonner
And    je peux cocher "Article en consignation" + référencer un dépôt existant
And    une prévisualisation du slug URL est affichée en temps réel

When   je soumets le formulaire avec tous les champs requis
Then   le produit est créé en base avec statut "Disponible"
And    les images sont uploadées dans Supabase Storage
And    je suis redirigé vers la liste avec un message de succès

Given  je clique sur "Modifier" sur un produit existant
When   le formulaire s'ouvre
Then   toutes les données existantes sont pré-remplies
And    je peux modifier n'importe quel champ et sauvegarder

Given  je clique sur "Supprimer" sur un produit
When   je confirme dans la modale
Then   le produit est supprimé ainsi que ses images du Storage
And    un message de confirmation s'affiche
```

**Tâches techniques :**
- `app/pages/admin/produits/index.vue` + `[id].vue` (form add/edit)
- `app/components/admin/ProductForm.vue`
- `app/components/admin/ImageUploader.vue` (drag & drop, preview, réordonnement)
- `server/api/admin/products/[id].get.ts|put.ts|delete.ts`
- `server/api/admin/products/index.get.ts|post.ts`
- Validation Zod côté server + côté client (VeeValidate ou custom)
- Génération slug : `nom-marque` slugifié + unicité
- Upload images : Supabase Storage + URL publiques stockées en JSONB

**Commit** : `feat(admin): full CRUD for products with image upload and management [US-032]`

---

### US-033 · Gestion des Catégories · 3 pts

**En tant que** gérante (P1),
**Je veux** gérer mes catégories de produits,
**Afin d'** organiser le catalogue de façon logique pour mes clients.

**Critères d'acceptation :**

```gherkin
Given  je suis sur /admin/categories
When   la page se charge
Then   l'arborescence des catégories s'affiche (niveau 1 : Selles, Harnachements, Vêtements, Accessoires)
And    les sous-catégories apparaissent en retrait sous leur parent

Given  je clique sur "Ajouter une catégorie"
When   je remplis le formulaire (nom, parent optionnel, slug, ordre d'affichage)
Then   la catégorie est créée et apparaît immédiatement dans l'arborescence

Given  je drag & drop une catégorie
When   je la dépose à un nouvel emplacement
Then   l'ordre est sauvegardé en base et reflété sur le catalogue public
```

**Tâches techniques :**
- `app/pages/admin/categories.vue`
- `app/components/admin/CategoryTree.vue` (vue draggable)
- CRUD complet catégories (2 niveaux max)

**Commit** : `feat(admin): category management with drag-and-drop reordering [US-033]`

---

### US-034 · Gestion Stock & Statuts · 5 pts

**En tant que** gérante (P1),
**Je veux** marquer un produit comme "Vendu" ou "Réservé" rapidement,
**Afin d'** éviter de vendre deux fois le même article.

**Critères d'acceptation :**

```gherkin
Given  je suis sur la liste des produits
When   je clique sur le statut d'un produit
Then   un dropdown apparaît avec les options : Disponible (vert), Réservé (orange), Vendu (rouge)
And    le changement de statut est sauvegardé immédiatement sans rechargement complet

Given  je marque un produit comme "Vendu"
When   le statut est sauvegardé
Then   le produit n'apparaît plus dans le catalogue public ou affiche un badge "Vendu" selon config
And    un enregistrement de vente est proposé (modale rapide : date, prix final, client optionnel)

Given  je consulte l'historique d'un produit
When   j'ouvre son détail admin
Then   un historique de statuts (Disponible → Réservé → Vendu) avec dates est affiché
```

**Tâches techniques :**
- `app/components/admin/StatusDropdown.vue`
- `server/api/admin/products/[id]/status.patch.ts`
- Historique statuts : table `product_status_history` en Supabase

**Commit** : `feat(admin): product status management with quick edit and history [US-034]`

---

## Épic E5 — Backoffice Commerce

**Sprint 4 · 2 semaines · 23 points**
**Objectif** : Camille peut gérer tout le cycle de vie d'une consignation et suivre ses ventes.

---

### US-040 · Gestion des Consignations · 8 pts

**En tant que** gérante (P1),
**Je veux** traiter les demandes de consignation reçues en ligne,
**Afin d'** accepter ou refuser les dépôts et maintenir un suivi précis.

**Critères d'acceptation :**

```gherkin
Given  je suis sur /admin/consignations
When   la page se charge
Then   toutes les demandes sont listées avec : déposant, article décrit, prix demandé, date, statut
And    les demandes "En attente" sont mises en évidence (badge orange, ordre prioritaire)

Given  j'ouvre le détail d'une demande
When   je clique sur "Voir"
Then   toutes les informations du déposant et de l'article s'affichent
And    les photos uploadées par le déposant sont visibles
And    je peux modifier le prix de mise en vente (négociation)
And    deux boutons s'affichent : "Accepter" et "Refuser"

When   je clique sur "Accepter"
Then   un email est envoyé au déposant avec les conditions validées
And    un produit est automatiquement créé dans le catalogue avec statut "Disponible"
And    la consignation passe au statut "En vente"

When   je clique sur "Refuser"
Then   je saisis une raison (motif) dans une modale
And    un email de refus est envoyé au déposant avec le motif
And    la consignation passe au statut "Refusée"

Given  un article consigné est vendu
When   j'enregistre la vente
Then   la commission CGWS est calculée automatiquement
And    le montant à reverser au déposant est affiché clairement
```

**Workflow complet :**
`pending` → `accepted/rejected` → `for_sale` → `sold` | `returned`

**Tâches techniques :**
- `app/pages/admin/consignations/index.vue` + `[id].vue`
- `app/components/admin/ConsignmentDetail.vue`
- `app/components/admin/ConsignmentWorkflow.vue`
- `server/api/admin/consignments/[id]/accept.post.ts` : create product + send email
- `server/api/admin/consignments/[id]/reject.post.ts` : send email + update status
- Templates email Resend : acceptation + refus (HTML branded CGWS)

**Commit** : `feat(admin): consignment management with full workflow and email notifications [US-040]`

---

### US-041 · Suivi des Ventes · 5 pts

**En tant que** gérante (P1),
**Je veux** enregistrer et consulter mes ventes,
**Afin de** suivre mon chiffre d'affaires et calculer mes commissions.

**Critères d'acceptation :**

```gherkin
Given  je suis sur /admin/ventes
When   la page se charge
Then   la liste de toutes les ventes s'affiche : article, date, prix de vente, type (propre/consignation), client
And    un résumé en haut affiche le CA du mois et le CA total

Given  je clique sur "Enregistrer une vente"
When   le formulaire s'ouvre
Then   je sélectionne un produit dans la liste des "Disponibles"
And    je saisis le prix final, la date de vente, et optionnellement le client
And    si l'article est en consignation, la commission (%) est calculée automatiquement
And    le montant net à reverser est affiché avant validation

When   je valide la vente
Then   le produit passe au statut "Vendu"
And    la vente est enregistrée en base
And    si consignation, une notification email de vente est envoyée au déposant

Given  je filtre les ventes par mois
When   je sélectionne une période
Then   seules les ventes de cette période s'affichent avec leur CA cumulé
```

**Tâches techniques :**
- `app/pages/admin/ventes/index.vue` + form modal
- `app/components/admin/SaleForm.vue`
- `server/api/admin/sales/index.get.ts|post.ts`
- Calcul commission : `prix_vente * (commission_rate / 100)`

**Commit** : `feat(admin): sales tracking with commission calculation and consignment notifications [US-041]`

---

### US-042 · Gestion des Clients · 5 pts

**En tant que** gérante (P1),
**Je veux** conserver un historique de mes clients,
**Afin de** personnaliser le service et les fidéliser.

**Critères d'acceptation :**

```gherkin
Given  je suis sur /admin/clients
When   la page se charge
Then   la liste des clients s'affiche (nom, email, téléphone, nb achats, date dernier achat)
And    une recherche full-text fonctionne sur nom et email

Given  je clique sur un client
When   sa fiche s'ouvre
Then   ses coordonnées complètes, ses achats passés et ses consignations déposées sont listés
And    je peux ajouter/modifier des notes libres sur ce client

Given  je saisis un client lors d'une vente
When   j'entre les 3 premières lettres de son nom
Then   l'autocomplete propose les clients existants correspondants
And    je peux créer un nouveau client à la volée
```

**Tâches techniques :**
- `app/pages/admin/clients/index.vue` + `[id].vue`
- `app/components/admin/ClientCard.vue`
- `app/components/admin/ClientAutocomplete.vue`
- `server/api/admin/clients/[id].get.ts|put.ts`

**Commit** : `feat(admin): client management with history and notes [US-042]`

---

### US-043 · Exports & Reporting · 5 pts

**En tant que** gérante (P1),
**Je veux** exporter mes données et générer des documents,
**Afin de** faire ma comptabilité et remettre des bons de dépôt aux consignataires.

**Critères d'acceptation :**

```gherkin
Given  je suis sur /admin/rapports
When   je sélectionne "Export ventes CSV" pour une période
Then   un fichier CSV est téléchargé avec : date, produit, prix, type, client, commission

Given  je consulte une consignation acceptée
When   je clique sur "Bon de dépôt PDF"
Then   un PDF est généré avec : infos CGWS, infos déposant, description article, prix, date, durée consignation, signature zone

Given  je suis sur le dashboard
When   je consulte le tableau de CA mensuel
Then   un graphique (recharts ou similar) affiche l'évolution du CA sur les 12 derniers mois
And    la distinction CA propre vs CA consignation est visuellement marquée
```

**Tâches techniques :**
- `app/pages/admin/rapports.vue`
- `server/api/admin/exports/sales.get.ts` : génération CSV
- `server/api/admin/exports/consignment-receipt.get.ts` : PDF via `@vercel/og` ou `puppeteer`
- Graphique CA : Recharts (LineChart ou BarChart)

**Commit** : `feat(admin): reports with CSV export, PDF receipts and revenue chart [US-043]`

---

## Épic E6 — Polish & Go-live

**Sprint 5 · 1 semaine · 21 points**
**Objectif** : Site immersif, performant, testé, prêt pour la mise en production.

---

### US-050 · Animations Immersives · 8 pts

**En tant que** visiteur (P2, P4),
**Je veux** vivre une expérience visuelle mémorable en naviguant sur le site,
**Afin de** ressentir l'univers western et avoir envie de revenir.

**Critères d'acceptation :**

```gherkin
Given  je fais défiler la homepage
When   j'atteins chaque section
Then   les éléments s'animent de façon fluide et non intrusive via GSAP ScrollTrigger
And    les product cards ont un effet hover (scale + shadow + amber border reveal)
And    les transitions entre pages sont fluides (fade out → fade in, <300ms)
And    la sidebar admin a une animation slide-in à l'ouverture

Given  un utilisateur a activé "prefers-reduced-motion"
When   il navigue sur le site
Then   toutes les animations non essentielles sont désactivées
```

**Animations cibles :**
- Homepage : stagger reveal sections au scroll
- Catalogue : product cards hover (scale 1.03, shadow xl, border amber 2px)
- Page transitions : `app.vue` `<NuxtPage>` avec Transition
- Hero parallax : background image scroll à 0.5x vitesse
- Stats counter : 0 → valeur finale en 1.5s easeOut quand visible

**Tâches techniques :**
- `app/plugins/gsap.client.ts` : registration ScrollTrigger
- `app/composables/useAnimation.ts` : helpers reveal, stagger, counter
- CSS transitions globales dans `main.css`
- `@media (prefers-reduced-motion: reduce)` : désactive GSAP + transitions CSS

**Commit** : `feat(animations): immersive GSAP ScrollTrigger animations and page transitions [US-050]`

---

### US-051 · Optimisation Images · 3 pts

**En tant que** visiteur (P2),
**Je veux** que les images se chargent rapidement même sur mobile 4G,
**Afin de** ne pas quitter le site par impatience.

**Critères d'acceptation :**

```gherkin
Given  je charge la page catalogue sur mobile 4G simulé (Chrome DevTools)
When   la page s'affiche
Then   toutes les images utilisent le composant NuxtImg avec provider Supabase
And    les images hors viewport sont lazy-loaded (loading="lazy")
And    les images hero sont eager-loaded (loading="eager", fetchpriority="high")
And    le format WebP est utilisé partout (fallback JPEG)
And    les srcset couvrent au minimum 400w, 800w, 1200w, 1600w
```

**Tâches techniques :**
- Remplacer tous les `<img>` par `<NuxtImg>` ou `<NuxtPicture>`
- Config `nuxt.config.ts` : `image.provider` = Supabase Storage URL
- Audit via Lighthouse "Properly size images" → 0 issues

**Commit** : `feat(perf): NuxtImg optimization with WebP, lazy loading and responsive srcset [US-051]`

---

### US-052 · Performance Lighthouse · 5 pts

**En tant que** gérante (P1),
**Je veux** un site rapide et performant,
**Afin d'** améliorer mon référencement Google et l'expérience de mes clients.

**Critères d'acceptation :**

```gherkin
Given  le site est déployé en production sur Vercel
When   j'exécute un audit Lighthouse sur la homepage et une fiche produit
Then   le score Performance est ≥ 90
And    le score Accessibilité est ≥ 90
And    le score SEO est ≥ 95
And    le score Best Practices est ≥ 90
And    le LCP (Largest Contentful Paint) est < 2.5s
And    le CLS (Cumulative Layout Shift) est < 0.1
And    le INP (Interaction to Next Paint) est < 200ms
```

**Tâches techniques :**
- `nuxt.config.ts` : compression (nitro minify), font preloading, CSS critical
- Audit et correction des issues Lighthouse une par une
- Vercel Edge Network : headers cache-control pour assets statiques
- `app/components/` : audit re-renders inutiles avec Vue DevTools

**Commit** : `feat(perf): Lighthouse ≥90 all metrics with Core Web Vitals optimization [US-052]`

---

### US-053 · Tests E2E & CI · 5 pts

**En tant que** développeur,
**Je veux** des tests automatisés sur les parcours critiques,
**Afin de** détecter les régressions avant chaque déploiement.

**Critères d'acceptation :**

```gherkin
Given  le pipeline CI GitHub Actions se déclenche sur push
When   les tests E2E Playwright s'exécutent
Then   le parcours "Catalogue → Fiche produit" passe sans erreur
And    le parcours "Page consignation → Soumission formulaire" passe
And    le parcours "Admin login → Ajout produit → Vérification catalogue" passe
And    le pipeline échoue et bloque le merge si un test E2E échoue
```

**Tâches techniques :**
- `tests/e2e/catalogue.spec.ts` + `consignment.spec.ts` + `admin-product.spec.ts`
- `.github/workflows/e2e.yml` : Node.js 20, `npx playwright install`, `nuxt build && playwright test`
- Fixtures : base de données test isolée (Supabase projet de staging)
- Screenshots on failure dans les artifacts GitHub Actions

**Commit** : `feat(tests): E2E Playwright tests with GitHub Actions CI pipeline [US-053]`

---

## Backlog & Stories Bonus

Ces US peuvent être ajoutées selon la vélocité et les besoins :

| ID | US | Estimation |
|----|-----|-----------|
| US-060 | Newsletter (email capture + Resend list) | 3 pts |
| US-061 | Galerie Instagram embed (widget derniers posts) | 2 pts |
| US-062 | Système de favoris (localStorage sans compte) | 3 pts |
| US-063 | ~~Import CSV produits en masse (admin)~~ → **promu Sprint 7**, voir détail ci-dessous | 8 pts |
| US-064 | Mode sombre (dark/light toggle) | 3 pts |
| US-065 | PWA offline (service worker, splash screen) | 5 pts |
| US-066 | ~~Espace déposant (suivi consignation avec code)~~ → **promu Sprint 7**, voir détail ci-dessous (magic link plutôt que code) | 8 pts |
| US-067 | Analytics dashboard (vue sessions, produits vus) | 5 pts |

---

## Conventions Git & Labels GitHub

### Branches
```
main          ← production
develop       ← intégration
feature/US-XXX ← développement US
hotfix/XXX    ← correction urgente prod
```

### Labels GitHub Issues
```
epic/fondations   epic/site-public   epic/services   epic/admin-produits   epic/admin-commerce   epic/polish
sprint/0   sprint/1   sprint/2   sprint/3   sprint/4   sprint/5
type/feature   type/bugfix   type/tech   type/design
priority/high   priority/medium   priority/low
status/todo   status/in-progress   status/in-review   status/done
```

### Format commit
```
feat(scope): description courte [US-XXX]
fix(scope): description courte [US-XXX]
test(scope): description courte [US-XXX]
docs(scope): description courte [US-XXX]
refactor(scope): description courte [US-XXX]
```

---

## Définition of Done (rappel)

- [ ] Critères Gherkin tous verts
- [ ] Aucune erreur TypeScript strict
- [ ] ESLint/Prettier 0 warnings
- [ ] Responsive vérifié (375px, 768px, 1280px, 1920px)
- [ ] Lighthouse ≥ 85 (sprint 1-4) / ≥ 90 (sprint 5)
- [ ] WCAG AA : contraste ≥ 4.5:1, navigation clavier
- [ ] 1 commit signé format conventionnel avec référence US-XXX
- [ ] PR sur develop avec description et screenshots
- [ ] `/qa` exécuté et rapport vert
- [ ] Pas de `console.log` ni `TODO` actifs

---

## Épic E7 — Fonctionnalités Post-Refonte

**Sprint 7 · 1 semaine · 16 points**
**Objectif** : Livrer les deux fonctionnalités repoussées après le pivot refonte v3 (Sprint 6) : l'import CSV en masse pour Camille, et l'espace de suivi en ligne pour les déposants.

**Dépendance transverse** : les deux US ci-dessous supposent un projet Supabase actif (US-002, ouvert depuis Sprint 0 — voir blocage documenté dans `docs/PROGRESS.md`). Le code peut être écrit et testé contre le schéma et les composables existants, comme le reste du projet à ce jour, mais la **validation end-to-end réelle** (upload effectif, envoi effectif d'un magic link) et le **go-live** dépendent d'une décision de Nathan sur le projet Supabase à utiliser. Ne bloque pas l'implémentation, mais bloque la validation `/qa` complète et la mise en production.

---

### US-063 · Import CSV produits en masse · 8 pts

**En tant que** gérante (P1),
**Je veux** importer plusieurs produits d'un coup depuis un fichier CSV, avec un aperçu obligatoire de ce qui sera créé avant toute écriture en base,
**Afin de** cataloguer rapidement un lot de produits sans ressaisir chaque fiche une par une, tout en gardant le contrôle avant validation.

**Critères d'acceptation :**

```gherkin
Given  je suis sur /admin/produits/import
When   la page se charge
Then   une zone de dépôt de fichier CSV (drag & drop + bouton parcourir) est affichée
And    le format attendu (colonnes, séparateur, encodage) est documenté avec un lien "Télécharger un modèle CSV"

Given  je dépose un fichier CSV valide et bien formé
When   je clique sur "Prévisualiser l'import"
Then   aucune écriture n'est faite en base de données à ce stade
And    un tableau d'aperçu affiche chaque ligne du fichier avec son statut : "Sera créé" (vert) ou "Erreur" (rouge)
And    un résumé chiffré est visible : "X ligne(s) valide(s) / Y ligne(s) en erreur / Z ligne(s) au total"
And    chaque ligne en erreur affiche le motif précis à côté (ex. "Catégorie inconnue : bottes", "Prix non numérique : 'à définir'", "Champ requis manquant : titre", "Doublon de slug avec la ligne 4", "Doublon de slug avec un produit existant : selle-bob-lee-15")
And    le bouton "Valider l'import" n'est actif que si au moins une ligne valide existe

Given  l'aperçu affiche des lignes valides et des lignes en erreur
When   je clique sur "Valider l'import"
Then   seules les lignes valides sont créées en base, avec le statut "Disponible" (active) par défaut
And    chaque produit créé a un slug généré automatiquement (titre + marque, slugifié, unicité garantie)
And    chaque produit créé a isConsignment = false et images = [] (tableau vide — aucune image n'est importée par ce flux)
And    un message de fin d'import récapitule "X produit(s) créé(s) avec succès" avec lien vers /admin/produits filtré sur les produits importés
And    les lignes qui étaient en erreur lors de l'aperçu ne sont pas créées et restent listées comme non importées

Given  le fichier déposé n'est pas un CSV valide (mauvaise extension, encodage non-UTF-8 détecté, colonnes obligatoires manquantes dans l'en-tête)
When   je clique sur "Prévisualiser l'import"
Then   aucun tableau d'aperçu ne s'affiche
And    un message d'erreur bloquant explique la cause précise ("Encodage non reconnu, veuillez exporter en UTF-8", "Colonnes manquantes : prix, categorie", ou "Format de fichier non supporté, un fichier .csv est attendu")

Given  le fichier dépasse la taille maximale autorisée (2 Mo) ou contient plus de 500 lignes de données
When   je le dépose
Then   un message d'erreur explicite bloque l'import avant tout traitement ("Fichier trop volumineux (max 2 Mo)" ou "Trop de lignes (max 500 par import)")

Given  le fichier CSV ne contient que l'en-tête, sans aucune ligne de donnée
When   je clique sur "Prévisualiser l'import"
Then   un message "Aucune ligne de données trouvée dans le fichier" s'affiche, et le bouton "Valider l'import" reste désactivé

Given  j'ai validé un import et que je reviens sur la page
When   je dépose un nouveau fichier CSV
Then   l'aperçu précédent est intégralement réinitialisé (aucun état résiduel de l'import précédent)

Given  entre l'aperçu et la validation, un produit a été créé entre-temps avec un slug identique à une ligne du CSV (situation de concurrence)
When   je clique sur "Valider l'import"
Then   le serveur revalide l'unicité des slugs au moment de l'insertion
And    si un conflit apparaît, cette ligne spécifique est rapportée en échec dans le résultat final au lieu d'écraser ou de dupliquer un produit existant
And    les autres lignes valides sont tout de même créées (l'import n'échoue pas globalement pour un seul conflit)
```

**Format CSV canonique proposé (provisoire — à valider par Nathan, voir « Questions pour Nathan »)** :

| Colonne | Requis | Exemple | Validation |
|---|---|---|---|
| `titre` | oui | Selle Bob Lee Trail 15" | non vide |
| `categorie` | oui | selles | doit être une valeur de `ProductCategory` |
| `marque` | non | Bob Lee | — |
| `description` | non | Selle western trail, cuir pleine fleur… | — |
| `prix` | oui | 890.00 | nombre > 0, séparateur décimal point |
| `etat` | oui | excellent | doit être une valeur de `ProductCondition` (`new`, `excellent`, `good`, `fair`) — ou libellés FR mappés (`neuf`, `excellent`, `bon`, `correct`) |
| `taille` | non | 15" | — |
| `stock` | non (défaut 1) | 1 | entier ≥ 0 |

Encodage UTF-8, séparateur virgule `,`, en-tête en première ligne. **Aucune colonne image** — les photos sont ajoutées ensuite par Camille via le formulaire d'édition produit existant (US-032, `/admin/produits/[id]`).

**Tâches techniques :**
- Réutilise `getAdminSupabase()`, `generateUniqueSlug()`, `slugify()` (`server/utils/adminSupabase.ts`) et `requireAdminAuth(event)`.
- Nouveau `server/api/admin/products/import/preview.post.ts` : multipart upload, parsing + validation Zod ligne par ligne, **aucune écriture DB**, retourne `{ validRows, errorRows: { line, raw, reason }[], summary }`.
- Nouveau `server/api/admin/products/import/confirm.post.ts` : reçoit en JSON le tableau `validRows` **exact** retourné par l'étape preview (pas le CSV brut re-uploadé), revalide l'unicité des slugs à l'insertion (protection contre création concurrente entre preview et confirm), insère par lot, retourne `{ created, failed: { row, reason }[] }`. Ce design (preview → renvoi du JSON validé) évite toute session serveur avec état, incompatible avec l'architecture serverless Nitro/Vercel.
- Parsing CSV : `papaparse` (à ajouter en dépendance) — gère quoting et détection d'encodage.
- `app/pages/admin/produits/import.vue` + `app/components/admin/ImportPreviewTable.vue`
- `app/composables/useProductImport.ts` : orchestration preview → confirm côté client
- Limites : 2 Mo, 500 lignes (constantes partagées front/back)

**Commit** : `feat(admin): bulk CSV product import with mandatory dry-run preview [US-063]`

---

### US-066 · Espace déposant — suivi consignation par magic link · 8 pts

**En tant que** déposant (P3),
**Je veux** suivre l'état de ma/mes consignation(s) en ligne sans créer de mot de passe,
**Afin de** savoir où en est mon dépôt (en attente, en vente, vendu…) sans avoir à appeler ou écrire à la boutique.

**Critères d'acceptation :**

```gherkin
Given  je visite /espace-deposant
When   la page se charge
Then   un formulaire me demande uniquement mon adresse email
And    un bouton "Recevoir mon lien de connexion" est présent

Given  je saisis une adresse email correspondant à un déposant connu (présente dans consignments.depositor_email)
When   je soumets le formulaire
Then   un email contenant un lien magique m'est envoyé via Supabase Auth (signInWithOtp)
And    un message de confirmation neutre s'affiche : "Si cette adresse est associée à une consignation, un lien de connexion vient de vous être envoyé."

Given  je saisis une adresse email qui ne correspond à aucun déposant connu
When   je soumets le formulaire
Then   le même message de confirmation neutre s'affiche (aucune différence observable côté client ou dans les temps de réponse)
And    aucun email n'est effectivement envoyé et aucune information sur l'existence ou non de l'adresse ne fuite

Given  j'ai reçu l'email et je clique sur le lien magique dans les délais de validité
When   le lien est ouvert
Then   une session déposant est créée et je suis redirigé vers /espace-deposant/suivi
And    je vois la liste de mes consignations : article décrit, marque, état, statut (libellés FR identiques à l'admin), prix demandé, prix accordé (si applicable), date de dépôt
And    si ma consignation est "sold", je vois également le prix de vente effectif — mais jamais le montant de la commission ni les notes internes de Camille
And    aucune action de modification (édition, suppression, changement de statut) n'est proposée — l'espace est strictement en lecture seule

Given  le lien magique a expiré ou a déjà été utilisé
When   je clique dessus
Then   je suis redirigé vers /espace-deposant avec un message "Ce lien n'est plus valide, veuillez en redemander un"

Given  je suis connecté(e) à mon espace déposant
When   je clique sur "Se déconnecter"
Then   ma session est détruite et je suis redirigé(e) vers /espace-deposant

Given  je suis un déposant authentifié avec l'email marie@example.com
When   ma session est active et que j'accède à /espace-deposant/suivi
Then   je ne vois QUE les consignations dont depositor_email correspond exactement à marie@example.com
And    il m'est impossible d'accéder, par manipulation d'URL ou de requête API, aux consignations d'un autre déposant — la vérification est systématiquement effectuée côté serveur, jamais uniquement par un filtre côté client

Given  je n'ai aucune consignation associée à mon email (email connu mais consignations supprimées, ou cas limite)
When   j'accède à /espace-deposant/suivi
Then   un état vide s'affiche : "Aucune consignation trouvée pour cette adresse. Contactez CGWS si vous pensez qu'il s'agit d'une erreur."

Given  je ne suis pas connecté(e)
When   je tente d'accéder directement à /espace-deposant/suivi
Then   je suis redirigé(e) vers /espace-deposant
```

**Champs exposés côté déposant (proposition — à confirmer, voir « Questions pour Nathan »)** : article décrit, marque, état, statut, prix demandé, prix accordé, prix de vente effectif (si vendu), date de dépôt. **Explicitement exclus** : notes internes admin, montant de la commission, informations sur d'autres déposants ou d'autres produits du catalogue.

**Tâches techniques :**
- Auth : `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } })` côté client, dans un nouveau composable `app/composables/useDepositorAuth.ts` (miroir de `useAdminAuth.ts` mais sans mot de passe).
- Anti-énumération : ne jamais différencier la réponse front selon que l'email existe ou non dans `consignments`. Le message de succès s'affiche systématiquement après soumission valide du formulaire, indépendamment du résultat réel côté serveur.
- **Point de sécurité critique** : la policy RLS actuelle `consignments_select_admin` (`supabase/migrations/002_rls_policies.sql`) autorise TOUT utilisateur `authenticated` à lire TOUTES les consignations. Un déposant authentifié via OTP obtient le rôle `authenticated` — il ne doit donc **jamais** interroger `consignments` directement depuis le client. Toute lecture passe par une nouvelle route serveur dédiée `server/api/depositor/consignments.get.ts` qui : (1) vérifie le JWT du déposant via `supabase.auth.getUser(token)`, (2) utilise `getAdminSupabase()` (service role, bypass RLS) pour interroger `consignments` filtré strictement par `depositor_email = user.email` (comparaison exacte, insensible à la casse), (3) ne retourne que les champs listés ci-dessus via un mapping dédié (jamais `notes`, jamais de calcul de commission brut). Ne pas ouvrir de nouvelle policy RLS publique sur `consignments` pour ce besoin.
- Nouveau middleware `app/middleware/depositor.ts` (distinct de `app/middleware/admin.ts`) protégeant `/espace-deposant/suivi`.
- Nouvelles pages : `app/pages/espace-deposant/index.vue` (demande de lien), `app/pages/espace-deposant/suivi.vue` (liste lecture seule), route de callback qui échange le token OTP puis redirige vers `/espace-deposant/suivi`.
- Réutilise `CONSIGNMENT_STATUS_LABELS` déjà défini côté admin (`docs/design-specs/US-040-consignations.md`) pour la cohérence des libellés, adapté au thème public.
- Email du magic link : template Supabase Auth par défaut, personnalisable ultérieurement — envoi réel dépendant de US-002 (Supabase live).

**Commit** : `feat(depositor): read-only consignment tracking space via magic link auth [US-066]`

---

## Épic E9 — Qualité & Dette Technique

**Sprint 8 · 1 semaine · 20 points**
**Objectif** : Résorber la dette révélée par la recette US-082 (voir `docs/PROGRESS.md` § « US-082 — Recette prod & correctifs ») : le gate TypeScript ne vérifiait rien depuis le début du projet, la CI e2e est rouge en permanence, le chemin de l'argent (fulfillment/réservation/webhook) n'a aucun test, l'expéditeur email est incohérent, et plusieurs items de code mort/dupliqué se sont accumulés. À la fin du sprint : `npm run typecheck && npm run lint && npm run test:unit && npm run build` passe en EXIT 0, la CI n'est plus jamais rouge par défaut, et la logique de paiement est couverte par des tests unitaires.

| US | Titre | Points |
|----|-------|--------|
| US-090 | Gate TypeScript réel à zéro erreur | 5 |
| US-091 | CI verte + tests du chemin de paiement | 8 |
| US-092 | Emails : expéditeur centralisé et configurable | 2 |
| US-093 | Nettoyage code mort et duplications | 5 |
| **Total** | | **20** |

**Ordre impératif** : US-090 d'abord (les autres US se valident contre un typecheck qui vérifie réellement), puis US-091, US-092, US-093.

---

### US-090 · Gate TypeScript réel à zéro erreur · 5 pts

**En tant que** développeur,
**Je veux** un `npm run typecheck` qui vérifie réellement tout le code (app + server + .vue) et passe à zéro erreur,
**Afin de** ne plus jamais valider une US sur un faux positif — tous les « typecheck ✅ » historiques étaient illusoires (tsconfig « solution » racine avec `files:[]`).

**Contexte dette** : le script a déjà été basculé sur `nuxi typecheck` (commit `7c4dfac`), ce qui a révélé **11 erreurs préexistantes**. Cette US les corrige toutes à la source et fiabilise `database.types.ts` (aujourd'hui maintenu à la main, désaligné à chaque migration).

**Critères d'acceptation :**

```gherkin
Given  le dépôt à jour sur la branche de travail
When   je lance `npm run typecheck`
Then   la commande exécute `nuxi typecheck` (jamais vue-tsc sur le tsconfig « solution » racine)
And    elle se termine en EXIT 0 avec zéro erreur TypeScript

Given  j'introduis volontairement une erreur de type dans un composant .vue (ex. const x: number = 'a')
When   je relance `npm run typecheck`
Then   la commande échoue (EXIT ≠ 0) et rapporte l'erreur avec fichier et ligne
And    l'erreur volontaire est ensuite retirée — preuve que le gate vérifie réellement les fichiers .vue

Given  les 11 erreurs préexistantes listées dans le tableau ci-dessous
When   `npm run typecheck` passe en EXIT 0
Then   chaque erreur est corrigée à la source (typage correct ou API correcte)
And    aucune erreur n'a été masquée : `git diff` de l'US n'introduit AUCUN `any`, `as any`, `@ts-ignore` ni `@ts-expect-error`

Given  le fichier app/types/database.types.ts (maintenu à la main jusqu'ici)
When   je le régénère via `supabase gen types typescript` (CLI) ou le MCP supabase (generate_typescript_types)
Then   le fichier commité est identique à la sortie générée (diff vide entre le fichier et la génération)
And    il reflète l'intégralité des migrations appliquées en prod (001 → 006, dont orders.email/customer_name/fulfillment_method nullable, products.reserved_until/reserved_order_id)
And    la procédure de régénération est documentée dans docs/DEV_GUIDE.md (commande exacte, prérequis, et la règle « à relancer après CHAQUE nouvelle migration, dans le même commit »)

Given  toutes les corrections appliquées
When   je lance `npm run lint` puis `npm run build` puis `npm run test:unit`
Then   les trois commandes se terminent en EXIT 0 (les fixes de types ne changent aucun comportement runtime)
```

**Les 11 corrections attendues** (fichier:ligne au moment du constat — les lignes peuvent avoir bougé) :

| # | Fichier | Erreur | Correction attendue |
|---|---------|--------|---------------------|
| 1 | `app/components/cart/CartDrawer.vue:43` | `'aria-label'` non accepté par les props du `:close` de USlideover/UButton | Utiliser la forme supportée par Nuxt UI v3 (vérifier via MCP nuxt-ui-remote) sans perdre l'accessibilité du bouton fermer |
| 2 | `app/composables/useSeo.ts:48` | `ogType: 'product'` absent de l'union unhead | Typage conforme unhead v2 (og:type product via la clé/cast documenté unhead, pas de `as any`) |
| 3 | `app/pages/catalogue/[slug].vue:72` | idem ogType | idem #2 |
| 4 | `app/pages/catalogue/[slug].vue:81` | `children` dans `useHead` script | API unhead v2 : `innerHTML` |
| 5 | `app/pages/index.vue:27` | idem `children` | `innerHTML` |
| 6 | `app/pages/admin/ventes/index.vue:304` | `visibleOnce` inconnu des Options @vueuse/motion | Typage/usage conforme à la doc @vueuse/motion (directive `v-motion` avec `visible-once` ou typage des options) |
| 7 | `app/providers/supabase-provider.ts:10` | `useRuntimeConfig` non auto-importé dans un provider Nuxt Image | Import explicite (`#imports` ou API prévue pour les providers — vérifier via MCP nuxt-remote) |
| 8 | `server/api/admin/categories/[id].put.ts:121` | `.update(Record<string, unknown>)` rejeté | Payload typé sur le type `Update` généré de la table (issu de database.types.ts régénéré) |
| 9 | `server/api/admin/consignments/[id].patch.ts:61` | idem | idem #8 |
| 10 | `server/api/admin/clients/[id].get.ts:82` | `mapConsignmentRow` retourne `condition: string` au lieu de l'union `ProductCondition` | Narrowing/validation vers l'union (pas de cast aveugle) |
| 11 | `server/api/admin/exports/consignment-receipt.get.ts:350` | `setResponseHeader('Content-Length', String(...))` attend un number | Passer un `number` |

**Tâches techniques :**
- Corriger les 11 erreurs une à une, en consultant les MCP `nuxt-remote`/`nuxt-ui-remote`/`context7` pour les APIs unhead v2, Nuxt UI v3 et @vueuse/motion (règle absolue CLAUDE.md)
- Régénérer `app/types/database.types.ts` via `supabase gen types typescript` ou MCP supabase, comparer au schéma prod (migrations 001→006)
- Répercuter les éventuels désalignements révélés par les types régénérés (les erreurs supplémentaires révélées font partie du périmètre : l'objectif est zéro erreur, pas « les 11 »)
- Documenter la procédure de régénération dans `docs/DEV_GUIDE.md`

**Commit** : `fix(types): real typecheck gate at zero errors with generated DB types [US-090]`

---

### US-091 · CI verte + tests du chemin de paiement · 8 pts

**En tant que** développeur,
**Je veux** une CI qui n'est plus jamais rouge par défaut et des tests unitaires sur toute la logique de paiement (fulfillment, réservation, webhook),
**Afin de** détecter les régressions sur le chemin de l'argent — aujourd'hui couvert par ZÉRO test alors que c'est le code le plus critique du site.

**Contexte dette** : la CI e2e (`.github/workflows/e2e.yml`) est rouge en permanence pour deux raisons indépendantes : `npm ci` cassé (package-lock, dépendance crossws sous npm 10) et secrets GitHub `SUPABASE_URL`/`SUPABASE_ANON_KEY` absents. Les seuls tests existants sont les 18 tests unitaires panier (`tests/unit/cart.spec.ts`) ; rien sur `server/utils/fulfillment.ts` ni sur la réservation/release ni sur le routage du webhook.

**Critères d'acceptation :**

```gherkin
# --- Bloc A : réparation npm ci ---

Given  un environnement vierge (CI ubuntu-latest Node 20, ou clone frais local avec node_modules supprimé)
When   `npm ci` s'exécute
Then   l'installation se termine en EXIT 0 (package-lock.json réparé/régénéré, résolution crossws fonctionnelle sous npm 10)
And    `npm run build` passe ensuite en EXIT 0 sur ce node_modules issu de `npm ci` (aucun `npm install` de rattrapage)

# --- Bloc B : workflow e2e jamais rouge par défaut ---

Given  le workflow .github/workflows/e2e.yml déclenché sur push
When   les secrets GitHub SUPABASE_URL / SUPABASE_ANON_KEY sont ABSENTS du dépôt
Then   le job e2e est explicitement SKIPPED (pas exécuté, pas échoué) avec une justification visible dans le run
       ("Secrets Supabase absents — e2e skippés, voir docs/DEV_GUIDE.md § CI")
And    le run global du workflow se termine au VERT — plus jamais rouge à cause des secrets manquants

Given  les secrets GitHub sont renseignés
When   le workflow s'exécute
Then   les tests e2e Playwright tournent réellement (build + `playwright test`) et le résultat reflète les vrais tests

Given  Nathan veut activer les e2e en CI
When   il consulte docs/DEV_GUIDE.md
Then   une section « CI » liste les noms EXACTS des secrets GitHub à créer, où trouver chaque valeur,
       et la commande pour vérifier localement (`npm ci && npm run build`)

# --- Bloc C : tests unitaires fulfillment (mock Supabase + mock Resend, aucun réseau) ---

Given  une commande "pending" et une session Stripe payée (payment_status "paid")
When   fulfillOrder (server/utils/fulfillment.ts) est invoqué
Then   la commande passe "pending" → "paid" via update CONDITIONNEL (filtre eq status pending)
And    chaque produit de la commande est marqué "sold" via le mécanisme de verrou (cf. bloc D)
And    une ligne sales est créée par produit et les emails de confirmation sont déclenchés (mocks appelés)

Given  la même commande déjà passée à "paid" (l'update conditionnel pending→paid ne matche aucune ligne)
When   fulfillOrder est rejoué (rejeu de webhook OU double appel webhook + session-status — cas réel documenté)
Then   AUCUNE écriture supplémentaire : zéro update produit, zéro nouvelle ligne sales, zéro email
And    l'appel se termine sans erreur (idempotence totale, le webhook doit toujours pouvoir répondre 200)

Given  une session Stripe avec un shipping choisi dont le coût est > 0
When   le fulfillment persiste la commande
Then   fulfillment_method enregistré = "shipping"

Given  une session Stripe avec l'option retrait Brèches à 0 €
When   le fulfillment persiste la commande
Then   fulfillment_method enregistré = "pickup"

Given  un événement checkout.session.completed avec payment_status "unpaid" (paiement asynchrone en cours)
When   le webhook le traite
Then   AUCUN fulfillment n'est déclenché (la commande reste "pending", les produits restent réservés)

# --- Bloc D : tests unitaires réservation / release (RPC reserve_product_unit / release_product_unit mockées) ---

Given  la création de session checkout sur des produits disponibles
When   la réservation réussit pour tous les produits (RPC reserve_product_unit renvoie succès)
Then   la session est créée et la commande référence les produits réservés

Given  la réservation échoue sur UN produit (course perdue : RPC renvoie échec/0 ligne)
When   la création de session se poursuit
Then   TOUTES les réservations déjà acquises pour cette commande sont restituées (rollback complet)
And    l'API répond 409 sans créer de session Stripe

Given  un produit "sold" au paiement
When   fulfillOrder marque les produits vendus
Then   le passage à "sold" n'est effectué QUE si la commande détient le verrou (reserved_order_id = commande courante)
And    une commande qui ne détient pas/plus le verrou ne marque PAS le produit "sold"

Given  une commande abandonnée déjà libérée (barrière pending→cancelled déjà franchie)
When   la release est rejouée (webhook expired + retour checkout avec previousOrderId, ou double événement)
Then   la restitution n'est PAS appliquée une seconde fois (aucun double incrément de stock)

Given  un événement checkout.session.expired ou async_payment_failed
When   le webhook le traite
Then   la release des produits de la commande est déclenchée (et elle seule — pas de fulfillment)

# --- Bloc E : exécution ---

Given  la suite complète
When   je lance `npm run test:unit`
Then   tous les tests passent (les 18 tests panier existants + les nouveaux blocs C/D), EXIT 0
And    aucun test n'effectue d'appel réseau réel (Supabase, Stripe et Resend intégralement mockés)
```

**Périmètre explicitement exclu** (à consigner en commentaire de tête des specs de test) : l'atomicité SQL réelle des fonctions `reserve_product_unit`/`release_product_unit` (migration 006) ne se teste pas en unitaire avec des mocks — elle relève de la recette e2e contre une vraie base. Les tests unitaires couvrent l'ORCHESTRATION serveur (appels, ordres, rollbacks, idempotence applicative, routage des événements webhook).

**Tâches techniques :**
- Réparer `package-lock.json` (régénération contrôlée) et vérifier `npm ci` sur environnement propre
- `e2e.yml` : condition de skip sur présence des secrets (mécanisme au choix, résultat exigé : run vert + skip visible et justifié)
- `tests/unit/fulfillment.spec.ts` + `tests/unit/reservation.spec.ts` (ou découpage équivalent) — vitest, mock du client Supabase (chaînage `from().update().eq()…` et `rpc()`), mock Resend/`sendViaResend`, fixtures de sessions Stripe (completed paid/unpaid, expired, async_payment_failed)
- Si `server/utils/fulfillment.ts` ou les handlers webhook nécessitent une injection de dépendances pour être testables, le refactor minimal fait partie de l'US (sans changement de comportement — couvert par les tests eux-mêmes)
- Documenter les secrets CI dans `docs/DEV_GUIDE.md` § CI

**Commit** : `test(payments): green CI and unit coverage for fulfillment, reservation and webhook routing [US-091]`

---

### US-092 · Emails — expéditeur centralisé et configurable · 2 pts

**En tant que** gérante (P1),
**Je veux** que tous les emails du site partent d'un expéditeur unique, configurable sans toucher au code,
**Afin de** basculer proprement sur `noreply@cgws.fr` le jour où le domaine sera vérifié dans Resend — aujourd'hui 5 templates sur 6 pointent un domaine non vérifié et échouent systématiquement.

**Contexte dette** : dans `server/services/email.ts`, 5 templates ont `from: 'CGWS <noreply@cgws.fr>'` (domaine NON vérifié dans Resend → échec garanti) et seul order-confirmation utilise `onboarding@resend.dev`.

**⚠️ Prérequis externe HORS US** : la vérification DNS du domaine `cgws.fr` dans Resend est une action manuelle de Nathan (enregistrements DNS chez le registrar). Cette US ne la couvre PAS et n'en dépend pas : elle livre le mécanisme de bascule, pas la bascule elle-même.

**Critères d'acceptation :**

```gherkin
Given  la variable d'environnement CGWS_EMAIL_FROM n'est PAS définie
When   n'importe lequel des 6 templates de server/services/email.ts construit un email
Then   l'expéditeur utilisé est le fallback 'CGWS <onboarding@resend.dev>' (seul expéditeur qui fonctionne aujourd'hui)

Given  CGWS_EMAIL_FROM='CGWS <noreply@cgws.fr>' est définie dans l'environnement (Vercel ou .env local)
When   le serveur (re)démarre et qu'un email est envoyé par n'importe quel template
Then   l'expéditeur utilisé est la valeur de la variable
And    la bascule complète des 6 templates s'est faite par ce SEUL changement d'env var — zéro modification de code, zéro redéploiement de code

Given  le code de server/services/email.ts
When   je cherche les expéditeurs codés en dur : `rg "noreply@cgws.fr|onboarding@resend.dev" server/`
Then   il ne reste qu'UNE occurrence : le fallback dans la résolution centralisée de l'expéditeur
And    les 6 templates (consignation reçue, consignation acceptée, consignation refusée, notification vente déposant, contact, confirmation commande) référencent tous cette source unique

Given  les logs d'envoi existants (helper sendViaResend, commit f46cd12)
When   un email part avec l'un ou l'autre expéditeur
Then   le comportement de log (id Resend ou erreur) est inchangé
```

**Tâches techniques :**
- Résolution centralisée dans `server/services/email.ts` (une fonction/constante unique), lue depuis `runtimeConfig` avec mapping explicite sur `process.env.CGWS_EMAIL_FROM` (nom exact demandé par Nathan), fallback `'CGWS <onboarding@resend.dev>'`
- Remplacer les 6 `from:` (lignes ~163, 296, 415, 516, 654, 823 au moment du constat)
- Documenter `CGWS_EMAIL_FROM` dans la section variables d'environnement de `docs/DEV_GUIDE.md` (avec la note « nécessite domaine vérifié Resend avant de pointer cgws.fr »)

**Commit** : `refactor(email): centralize configurable sender with safe fallback [US-092]`

---

### US-093 · Nettoyage code mort et duplications · 5 pts

**En tant que** développeur,
**Je veux** purger le code mort et les duplications actés lors des QA des sprints 6/7 et de la recette US-082,
**Afin de** réduire la surface de maintenance et les risques de divergence (libellés, couleurs, sécurité déposant).

**Critères d'acceptation** (chaque item de dette = un scénario, la QA les déroule tous) :

```gherkin
# Item 1 — endpoint orphelin
Given  server/api/orders/[id].get.ts (plus consommé — la page success utilise /api/checkout/session-status)
When   le fichier est supprimé
Then   `rg "orders/\[id\]|/api/orders/" app server tests` ne retourne plus AUCUNE référence à cet endpoint
And    le parcours checkout success reste fonctionnel (session-status inchangé)

# Item 2 — duplication des libellés de statut consignation
Given  les 3 redéfinitions locales de CONSIGNMENT_STATUS_LABELS dans l'admin
       (app/pages/admin/clients/[id].vue, app/pages/admin/consignations/[id].vue, app/pages/admin/consignations/index.vue)
When   elles sont remplacées par l'import de la source canonique app/utils/consignment.ts
Then   `rg "CONSIGNMENT_STATUS_LABELS.*=" app` ne montre qu'UNE définition (app/utils/consignment.ts)
And    les libellés FR affichés dans l'admin sont strictement identiques à avant

# Item 3 — code mort espace déposant
Given  app/composables/useDepositorAuth.ts et ses 2 entrées ERROR_MESSAGES rate-limit inatteignables
       (over_email_send_rate_limit, over_request_rate_limit — jamais atteintes par design anti-énumération, acté QA US-066)
When   le code mort est supprimé (et resolveErrorMessage simplifié si la map devient vide)
Then   le message neutre affiché au déposant est STRICTEMENT inchangé dans tous les cas
And    le comportement anti-énumération est préservé (aucune différence email connu/inconnu)

# Item 4 — boutons bruts hors design system
Given  la modale de suppression produit (app/pages/admin/produits/index.vue) et SaleModal/SaleForm
When   les <button> stylés à la main sont remplacés par CgwsButton
       (variant "destructive" pour « Supprimer définitivement », variant "primary" pour « Enregistrer la vente »)
Then   plus aucun <button> avec classes de style ad hoc ne subsiste dans ces fichiers pour ces actions
And    les états loading/disabled et les spinners existants sont conservés à l'identique

# Item 5 — RevenueChart non theme-aware
Given  RevenueChart.vue et ses couleurs Chart.js en hex figés
When   les couleurs sont résolues depuis les tokens CSS de peau (lecture des variables --cgws-* au runtime)
Then   le graphique respecte les 3 rendus (elegante-jour, elegante-nuit, rugueux)
And    un changement de peau via le switcher met le graphique à jour sans rechargement de page
And    la distinction visuelle CA propre vs CA consignation reste lisible (contraste vérifié dans les 3 rendus)

# Item 6 — N+1 espace déposant
Given  server/api/depositor/consignments.get.ts et son N+1 (requêtes products + sales PAR consignation vendue)
When   la route est refactorée en requêtes par lot (.in() sur les ids collectés)
Then   le nombre de requêtes Supabase est CONSTANT (borné, indépendant du nombre de consignations)
And    la réponse JSON est strictement identique champ à champ (dont le net à reverser calculé serveur)
And    AUCUNE fuite nouvelle : toujours zéro notes internes, zéro commission brute, filtre depositor_email
       toujours dérivé exclusivement du JWT (les barrières de sécurité US-066 sont intouchées)

# Gate final
Given  l'ensemble des nettoyages appliqués
When   je lance `npm run typecheck && npm run lint && npm run test:unit && npm run build`
Then   les quatre commandes passent en EXIT 0
```

**Dépendances** : US-090 (le gate typecheck doit être réel pour que le nettoyage soit validé dessus) ; l'item 6 gagne à être couvert par un test unitaire si l'infrastructure de mock d'US-091 est disponible (souhaitable, non exigé).

**Tâches techniques :**
- Suppressions : `server/api/orders/[id].get.ts`, entrées mortes `ERROR_MESSAGES`
- Factorisation : imports depuis `app/utils/consignment.ts` (3 fichiers admin)
- `CgwsButton` : vérifier les variants existants (`destructive` livré en US-072) avant remplacement
- `RevenueChart.vue` : `getComputedStyle(document.documentElement).getPropertyValue('--cgws-…')` + réactivité au changement de `data-skin` (watch sur `useCgwsSkin()` / re-render du chart)
- `depositor/consignments.get.ts` : collecte des `consignment_id`/`product_id` puis `.in()` groupé, mapping inchangé

**Commit** : `refactor(cleanup): remove dead code, dedupe labels, theme-aware chart, fix depositor N+1 [US-093]`

---

## Priorisation du backlog GitHub (15 issues ouvertes, relevé 2026-07-22) — Sprints 9 & 10

**Méthode** : chaque issue a été confrontée au code réellement livré (pas seulement au journal) avant estimation — cf. raisonnement détaillé sous chaque US. Trois issues se sont révélées **obsolètes ou déjà résolues côté code** (§ « Issues à fermer »), une intuition de recoupement de Nathan s'est révélée **fausse à l'usage** (#26 n'est probablement PAS la même cause que #27/#24 — un vrai bug distinct a été localisé dans le code), et une estimation a pu être **fortement revue à la baisse** grâce à la lecture du code existant (#25 PayPal).

**Complément (2e passe)** : deux issues absentes de ma première itération — #29 (page À propos) et #18 (hero) — ont été ajoutées ci-dessous après vérification code, avec la même rigueur. #29 en particulier n'est pas qu'une demande de contenu : la navigation (`AppHeader.vue`, `MobileMenu.vue`) et le footer (`AppFooter.vue`) pointent déjà vers `/a-propos` — un commentaire explicite dans `AppFooter.vue` (« /a-propos n'est pas encore créé — redirigera vers 404 ») confirme que **le lien est déjà cassé en production sur tout le site**, ce qui change sa nature : ce n'est pas seulement une amélioration de confiance/SEO, c'est un défaut visible déjà en ligne.

**Priorisation retenue, du plus au moins urgent** :
1. **Les 2 bugs email/consignation qui cassent la conversion en silence** (US-094, US-095) passent devant tout — un prospect qui pense avoir contacté CGWS ou déposé sa selle, sans retour, ne revient pas. Conforme à l'avis de Nathan.
2. **Le lien mort `/a-propos` déjà en production (US-099)** monte juste derrière : contrairement aux autres features, ce n'est pas un choix d'ajouter de la valeur, c'est corriger un défaut déjà visible par tout visiteur qui clique sur ce lien de nav — et Nathan a demandé explicitement que cette issue soit priorisée dans cette session. La partie structure/SEO/design est livrable immédiatement avec du contenu placeholder clairement marqué (même pattern déjà validé en US-011/US-022) ; le contenu définitif (bio + photos réelles de Camille) reste un blocage de contenu isolé, pas un blocage de sprint.
3. **PayPal (US-098)** est promu ensuite car son coût réel, une fois vérifié dans le code, est quasi nul (moyen de paiement piloté par le Dashboard Stripe depuis le rework US-082) — un gain rapide ne doit pas attendre.
4. **Le hero de la homepage (US-100, #18)** est un correctif UI trivial et bien cadré (un seul fichier, aucun risque LCP vérifié) — il complète le sprint sans le déséquilibrer.
5. **Quantité/stock multi-unités (US-096)** vient ensuite : feature commerciale réelle (les produits consommables comme l'huile de sabot ne peuvent aujourd'hui être achetés qu'à l'unité), et l'investigation montre que le socle bas-niveau (RPC `reserve_product_unit`/`release_product_unit`) supporte déjà la décrémentation par unité — le travail restant est surtout applicatif (UI, boucle serveur, Stripe `quantity`), ce qui contient le risque.
6. **Retour en stock + notification (US-097)** ferme la marche : elle dépend du modèle de stock retravaillé en US-096 ET du domaine Resend vérifié (US-094) pour être utile en production — la planifier avant ses dépendances n'aurait aucun sens.
7. **Les 5 issues « Products »** ne sont volontairement PAS transformées en US : ce sont des saisies de contenu catalogue, pas du développement (détail § dédiée ci-dessous).

### Vue d'ensemble Sprints 9-11

| Sprint | Épic | Points | Objectif |
|--------|------|--------|----------|
| Sprint 9 | E10 — Fiabilité & confiance du site public | 18 | Stopper la perte silencieuse de prospects (email, dépôt de selle), corriger le lien mort `/a-propos` déjà en production, activer PayPal, nettoyer le hero |
| Sprint 10 | E11 — Stock multi-unités & rupture | 16 | Achat de plusieurs exemplaires + gestion de la rupture de stock avec alerte email |
| Sprint 11 | E12 — Sécurité & Analytics produit | 18 | Fermer la faille RLS « tout authentifié = admin » (#34), puis instrumenter le comportement visiteur avec PostHog cookieless : funnels achat, consignation, contact (#31) |
| **Total** | | **52** | |

**Note vélocité** : le Sprint 9 se rapproche maintenant de la vélocité observée (~20 pts) grâce à l'ajout de US-099 et US-100, sans avoir été gonflé artificiellement — les deux items s'ajoutent naturellement au même objectif de sprint (fiabilité et confiance perçue du site public) et étaient déjà, pour #18, cadrés comme triviaux avant chiffrage. Le Sprint 10 reste à 16 pts, une fois le terrain déblayé.

---

## Épic E10 — Fiabilité & confiance du site public

**Sprint 9 · ~1-2 semaines · 18 points**
**Objectif** : un visiteur qui contacte CGWS ou dépose une selle reçoit toujours une confirmation, Camille a une visibilité opérationnelle si l'envoi d'email casse à nouveau, PayPal est disponible comme moyen de paiement, le lien de navigation `/a-propos` (déjà visible sur tout le site) ne mène plus à une 404, et le hero de la homepage est nettoyé de ses éléments jugés superflus par Nathan.

| US | Titre | Priorité | Points | Issue(s) |
|----|-------|----------|--------|----------|
| US-094 | Recette emails + garde-fou expéditeur de test visible en admin | Must Have | 3 | #27, #24 |
| US-095 | Fiabiliser la soumission du formulaire de dépôt de selle | Must Have | 5 | #26 |
| US-099 | Page À propos — structure, SEO et confiance consignation | Must Have | 5 | #29 |
| US-098 | Activer PayPal comme moyen de paiement (checkout embarqué) | Should Have | 3 | #25 |
| US-100 | Hero homepage — retirer l'arche décorative et l'eyebrow | Should Have | 2 | #18 |
| **Total** | | | **18** | |

---

### US-094 · Recette emails + garde-fou expéditeur de test visible en admin · 3 pts

**Issue** : #27 (formulaire de contact), #24 (mail d'achat non reçu sur d'autres adresses que la mienne)

**En tant que** gérante (P1),
**Je veux** être visuellement alertée dans mon backoffice quand les emails du site partent encore depuis l'adresse de test Resend,
**Afin de** ne plus jamais découvrir après-coup — via un client mécontent — que mes emails de contact, consignation ou vente ne sont jamais arrivés.

**Contexte / diagnostic (confirmé dans le code, pas supposé)** : `server/services/email.ts` centralise déjà l'expéditeur depuis Sprint 8 (US-092, commit `3531e86`), avec fallback `CGWS <onboarding@resend.dev>` — un domaine de test Resend qui **ne délivre qu'à l'adresse du titulaire du compte Resend**. Le domaine `cgws.fr` n'étant pas vérifié dans Resend, TOUS les emails (contact compris) partent aujourd'hui depuis ce fallback, et `sendViaResend()` **avale l'erreur en cas d'échec API** (`console.error`, pas de throw) pour que l'UI ne bloque jamais l'utilisateur — ce qui explique exactement #27 (« le formulaire de contact n'envoie pas le mail » : le visiteur voit un succès, l'email ne part jamais) et #24 (« mail d'achat non reçu sur d'autres mails que le mien » : c'est littéralement le comportement du domaine de test). **Le code est prêt** ; il ne manque que l'action infra de Nathan (vérification DNS `cgws.fr` chez le registrar + variable Vercel `CGWS_EMAIL_FROM`). Cette US ne couvre pas cette action, mais élimine le risque que le problème redevienne invisible une fois « réglé ».

**Critères d'acceptation :**

```gherkin
Given  CGWS_EMAIL_FROM n'est pas définie (ou vide) en production
When   Camille se connecte à /admin/dashboard
Then   un bandeau d'alerte visible (non intrusif mais impossible à manquer) indique :
       "Expéditeur email de test actif — vos emails de contact, consignation et vente ne partent qu'à l'adresse du compte Resend. Le domaine cgws.fr doit être vérifié dans Resend."
And    le bandeau reste visible tant que la condition n'est pas corrigée (pas de bouton "fermer définitivement" qui masquerait un vrai problème de production)

Given  CGWS_EMAIL_FROM est configurée sur un domaine vérifié (ex. 'CGWS <noreply@cgws.fr>')
When   Camille se connecte à /admin/dashboard
Then   le bandeau n'apparaît pas

Given  un visiteur non authentifié
When   il consulte n'importe quelle page publique
Then   aucune information sur l'état de configuration email n'est exposée (le statut n'est lisible que par l'admin authentifiée)

Given  le domaine cgws.fr vient d'être vérifié dans Resend et CGWS_EMAIL_FROM positionnée en production par Nathan
When   chacun des 6 déclencheurs d'email est rejoué manuellement une fois (contact, consignation — confirmation dépôt, consignation — acceptation, consignation — refus, consignation — vente au déposant, commande — confirmation acheteur)
Then   chaque email est effectivement reçu sur une adresse de test hors compte Resend — preuve que le problème n'est plus circonscrit au domaine de test
And    le résultat de cette recette (checklist des 6 templates) est consigné dans docs/PROGRESS.md par l'orchestrateur
```

**Notes techniques** :
- Nouvelle route `server/api/admin/email-status.get.ts` (auth admin requise) qui retourne `{ isFallback: boolean }` en comparant `resolveEmailFrom()` (ou une fonction exportée équivalente) au fallback connu — ne PAS exposer `runtimeConfig` brut côté client.
- Composant `app/components/admin/EmailFallbackBanner.vue`, monté dans `app/pages/admin/dashboard.vue` (ou `layouts/admin.vue` si on veut la visibilité sur tout le backoffice — à trancher en design, le dashboard suffit pour couvrir le besoin).
- Aucune modification de `server/services/email.ts` au-delà d'exporter la fonction de détection nécessaire au endpoint (pas de nouveau comportement d'envoi).
- La checklist de recette manuelle des 6 templates est un **livrable documentaire** de cette US (à ajouter dans `docs/DEV_GUIDE.md` § emails), pas un test automatisé — l'envoi réel dépend d'une action Nathan hors périmètre code.

**Fichiers impactés (estimés)** :
- `server/api/admin/email-status.get.ts`
- `app/components/admin/EmailFallbackBanner.vue`
- `app/pages/admin/dashboard.vue`
- `docs/DEV_GUIDE.md`

**Commit** : `feat(admin): visible fallback-sender warning banner and email recette checklist [US-094]`

---

### US-095 · Fiabiliser la soumission du formulaire de dépôt de selle · 5 pts

**Issue** : #26 (« à la validation de la demande de dépôt de selle une erreur survient »)

**En tant que** déposant (P3),
**Je veux** que ma demande de consignation aboutisse même quand j'ajoute plusieurs photos prises avec mon téléphone,
**Afin de** ne pas être bloqué(e) par une erreur technique opaque au moment de proposer ma selle à la vente.

**Contexte / diagnostic (hypothèse la plus solide trouvée dans le code, à confirmer par Nathan via les logs Vercel avant clôture)** : contrairement à ce que suggérait le recoupement initial avec #27/#24, `server/api/consignments/create.post.ts` gère déjà correctement l'échec d'email (`try/catch` silencieux autour de `sendConsignmentConfirmation`, la demande est sauvegardée même si l'email casse) — **ce n'est donc probablement pas la même cause racine**. En revanche, `ConsignmentForm.vue` ne valide QUE la taille par fichier (`MAX_FILE_SIZE_MB = 5`), jamais la taille CUMULÉE, et **aucune compression côté client n'est implémentée** alors que c'était une tâche technique prévue dès l'US-020 originale (`browser-image-compression`, jamais livrée). Un déposant qui ajoute 5 photos de selle prises au smartphone (couramment 3 à 5 Mo chacune en 2026) peut soumettre un payload multipart de 15 à 25 Mo — largement au-dessus de la limite par défaut d'une fonction serverless Vercel (4,5 Mo). La requête échoue alors AVANT d'atteindre la validation Zod, avec une erreur réseau générique que le déposant perçoit exactement comme « une erreur survient » sans plus de détail.

**Critères d'acceptation :**

```gherkin
Given  je sélectionne 5 photos dont le total dépasse la limite de payload supportée par le serveur
When   je clique sur "Soumettre ma demande" (avant tout envoi réseau)
Then   une compression côté client (viser ~1600px de large max, qualité ~75%) est appliquée à chaque photo avant l'ajout au FormData
And    si le total compressé dépasse malgré tout un seuil sûr (ex. 4 Mo cumulés), un message bloquant explicite s'affiche AVANT la tentative d'envoi ("Vos photos sont trop volumineuses au total, réduisez leur nombre ou leur résolution") plutôt qu'un échec réseau opaque après coup

Given  la compression échoue pour un fichier isolé (format inattendu, fichier corrompu)
When   je soumets le formulaire
Then   ce fichier précis est signalé en erreur sans bloquer les autres photos valides ni faire échouer toute la soumission

Given  le serveur reçoit malgré tout une requête dont le traitement échoue de façon inattendue (upload Storage, parsing multipart)
When   `server/api/consignments/create.post.ts` rencontre cette erreur
Then   un message d'erreur clair et actionnable est renvoyé au front (jamais une erreur brute/stack) — défense en profondeur même si la compression réduit le risque sans l'éliminer à 100%

Given  la demande est soumise avec des photos compressées valides
When   le traitement serveur aboutit
Then   le comportement existant est inchangé : consignation créée en base, email de confirmation tenté (échec non bloquant), succès affiché au déposant
```

**Notes techniques** :
- Ajout de `browser-image-compression` (dépendance déjà anticipée dans la US-020 d'origine, jamais installée) dans `ConsignmentForm.vue`, appliqué à chaque fichier avant `formData.append`.
- Nouvelle constante partagée (front) : seuil de payload cumulé sûr, avec marge sous la limite Vercel par défaut (documenter la valeur retenue et sa justification dans un commentaire).
- `server/api/consignments/create.post.ts` : envelopper `readMultipartFormData` et la boucle d'upload Storage dans un try/catch renvoyant un message utilisateur clair (`createError` avec message actionnable) au lieu de laisser remonter une erreur non gérée.
- **Action de confirmation recommandée à Nathan (hors code)** : consulter les logs de fonction Vercel (Vercel Dashboard → Functions → `consignments/create`) sur les dernières semaines pour confirmer la signature d'erreur exacte (413 / `FUNCTION_PAYLOAD_TOO_LARGE` / timeout) et valider définitivement cette hypothèse avant de considérer #26 close.

**Fichiers impactés (estimés)** :
- `app/components/consignation/ConsignmentForm.vue`
- `server/api/consignments/create.post.ts`
- `package.json` (nouvelle dépendance `browser-image-compression`)

**Commit** : `fix(consignment): client-side image compression and payload size guard to prevent silent submission failures [US-095]`

---

### US-099 · Page À propos — structure, SEO et confiance consignation · 5 pts

**Issue** : #29 (« page À propos » — présenter Camille, l'atelier de Brèches, le service de consignation, le positionnement)

**En tant que** visiteur (P2, P4) et déposant potentiel (P3),
**Je veux** trouver une page À propos qui présente Camille, l'atelier et le service de consignation,
**Afin de** avoir confiance dans la personne et la structure à qui je confie ma selle ou mon achat — et, plus immédiatement, ne plus tomber sur une page introuvable en cliquant sur le lien "À Propos" du menu.

**Contexte / diagnostic (confirmé dans le code)** : `app/components/layout/AppHeader.vue`, `app/components/layout/MobileMenu.vue` et `app/components/layout/AppFooter.vue` référencent déjà `to="/a-propos"` — le commentaire `<!-- /a-propos n'est pas encore créé — redirigera vers 404 jusqu'à implémentation -->` dans `AppFooter.vue` confirme que **ce lien est un défaut déjà visible en production sur toutes les pages du site**, pas une simple absence de fonctionnalité. Par ailleurs, `app/components/home/OurStorySection.vue` (US-011) contient déjà un texte de présentation de Camille marqué `<!-- PLACEHOLDER — texte à personnaliser par Camille avant mise en ligne -->` et une photo Unsplash provisoire marquée de la même façon, avec un CTA "En savoir plus" qui pointe déjà vers `/a-propos` : cette US réutilise et étend ce texte existant plutôt que d'en inventer un nouveau, pour rester cohérente avec ce qui a déjà été écrit et validé dans le pipeline.

**Découpage retenu (US unique, conformément à la convention déjà en place sur ce projet — voir US-011, US-022 — où le contenu placeholder est un TASK noté, pas une US séparée)** : la structure, le design, le SEO technique et les données structurées sont livrés maintenant avec du contenu de remplacement explicitement marqué ; le remplacement par le contenu définitif (bio complète + 3-4 photos réelles de l'atelier) est un swap de constantes de contenu, sans changement de code, et reste un blocage de contenu isolé (même famille que les autres "vrais contenus Camille" déjà loggés) — il ne bloque pas le Done de cette US.

**Critères d'acceptation :**

```gherkin
Given  je clique sur le lien "À Propos" dans le header (desktop), le menu mobile, ou le footer
When   la page /a-propos se charge
Then   je n'obtiens plus une 404 — la page s'affiche avec un contenu structuré et complet

Given  la page /a-propos se charge
When   je la parcours
Then   une section présente Camille (bio, photo — contenu réutilisé/étendu depuis OurStorySection.vue, marqué comme placeholder tant que le texte définitif n'est pas fourni)
And    une section présente l'atelier/la boutique à Brèches (37) : lieu, accueil, modalités de retrait
And    une section présente les activités de CGWS dont le service de consignation, avec un lien explicite vers /consignation
And    un lien vers /contact est présent pour aller plus loin
And    le positionnement (western authentique et premium, pas kitsch) transparaît dans le ton du texte, cohérent avec le reste du site

Given  je suis sur mobile (375px), tablette (768px) ou desktop (1440px)
When   j'affiche la page
Then   la mise en page s'adapte sans rupture visuelle ni chevauchement

Given  un moteur de recherche crawle la page /a-propos
When   il lit le <head>
Then   un <title> et une <meta description> uniques et pertinents sont présents (via usePageSeo, cohérent avec le reste du site)
And    un balisage JSON-LD Person (Camille) est présent
And    un balisage JSON-LD LocalBusiness est présent (réutilisation du schéma déjà défini sur la homepage dans app/pages/index.vue, mêmes coordonnées Brèches/37)
And    les balises Open Graph (og:title, og:description, og:image) sont générées

Given  la page utilise des images
When   elles sont affichées
Then   elles passent toutes par <NuxtImg> (format WebP, lazy loading hors LCP), aucune balise <img> brute

Given  la page est testée à la souris et au clavier
When   je navigue avec Tab
Then   tous les liens et éléments interactifs sont atteignables dans un ordre logique, avec un focus visible (WCAG AA)

Given  le texte de présentation de Camille et les photos de l'atelier sont aujourd'hui des placeholders explicitement marqués
When   Camille fournit sa bio définitive et 3-4 photos réelles de l'atelier
Then   leur intégration est un remplacement de constantes de contenu (texte + chemins d'image), sans modification de la structure de page, du SEO ou des composants — prouvant que le découpage "structure maintenant / contenu ensuite" ne crée pas de dette
```

**Notes techniques** :
- `app/pages/a-propos.vue` : nouvelle page, structure inspirée de `app/pages/mentions-legales.vue` (container centré, lien retour) mais avec plusieurs sections illustrées façon `OurStorySection.vue` (grille texte/image, arche décorative accent-deco — cohérence design system) plutôt qu'un simple article textuel.
- Contenu texte de départ : reprendre tel quel puis étendre le paragraphe déjà écrit dans `app/components/home/OurStorySection.vue` (bio Camille) — ne pas réinventer un nouveau texte from scratch. Ajouter les paragraphes atelier/Brèches et positionnement en conservant le même marquage `<!-- PLACEHOLDER — à personnaliser par Camille -->`.
- SEO : `usePageSeo()` (`app/composables/useSeo.ts`) pour title/description/OG, cohérent avec `contact.vue`/`consignation.vue`. Ajouter un JSON-LD `Person` (name: "Camille Guignon", éventuellement `worksFor` pointant vers l'entité LocalBusiness) via `useHead({ script: [...] })` avec `innerHTML` (API unhead v2, cf. fix US-090) — jamais `children`.
- Réutiliser le JSON-LD `LocalBusiness` déjà écrit dans `app/pages/index.vue` (mêmes coordonnées) plutôt que de le dupliquer avec des valeurs qui pourraient diverger — envisager de le factoriser dans un helper partagé si le temps le permet (nice-to-have, pas bloquant pour le Done).
- Photos : réutiliser en placeholder la même image Unsplash que `OurStorySection.vue` (déjà validée comme placeholder temporaire) pour la photo de Camille, et sélectionner 2-3 images Unsplash cohérentes (sellerie, atelier) pour illustrer la boutique — toutes clairement commentées `<!-- Placeholder Unsplash — à remplacer par la vraie photo -->`.
- Aucune modification requise de `AppHeader.vue` / `MobileMenu.vue` / `AppFooter.vue` : les liens existent déjà et fonctionneront dès que la page existe. Retirer uniquement le commentaire de garde dans `AppFooter.vue` une fois la page livrée.

**Fichiers impactés (estimés)** :
- `app/pages/a-propos.vue`
- `app/components/layout/AppFooter.vue` (retrait du commentaire de garde uniquement)
- `docs/DEV_GUIDE.md` ou `docs/PROGRESS.md` (note de blocage contenu réel, à la charge de l'orchestrateur)

**Commit** : `feat(public): about page with Camille/atelier/consignment content, SEO and structured data [US-099]`

---

### US-098 · Activer PayPal comme moyen de paiement · 3 pts

**Issue** : #25 (corps vide — « ajouter PayPal en moyen de paiement »)

**En tant qu'**acheteur (P2, P4),
**Je veux** pouvoir payer via PayPal en plus de la carte bancaire,
**Afin de** finaliser mon achat avec le moyen de paiement que j'utilise déjà au quotidien, sans ressaisir de coordonnées bancaires.

**⚠️ Point à vérifier avant de considérer cette estimation acquise (arbitrage paiement — je ne tranche pas seule, voir note ci-dessous)** : `server/api/checkout/session.post.ts` crée la session en `ui_mode: 'embedded_page'` sans `payment_method_types` figé — un commentaire du code (`E8 rework`) confirme explicitement que « les moyens de paiement (CB, Apple Pay, Google Pay, Link…) sont pilotés par le Dashboard ». Un `return_url` est déjà configuré (`/checkout/success?session_id=...`), ce qui est le prérequis technique pour les moyens de paiement à redirection comme PayPal. **Sur cette seule base de code, l'activation semble ne nécessiter aucune modification côté CGWS** — juste une activation dans le Dashboard Stripe (action Nathan). **Cependant** : le support de PayPal spécifiquement en mode Checkout **embarqué** (par opposition au Checkout hébergé classique) a historiquement été plus restreint chez Stripe selon les périodes ; je n'ai pas de moyen de vérifier l'état actuel de cette compatibilité depuis ce dépôt. **Ne pas activer PayPal en production sur la seule foi de cette US** — une vérification dans le Dashboard Stripe (l'liste des moyens de paiement proposés s'adapte automatiquement à `ui_mode` et n'affichera PayPal comme activable que si c'est réellement supporté) doit précéder toute communication à Camille sur la disponibilité de PayPal.

**Critères d'acceptation :**

```gherkin
Given  le Dashboard Stripe (Paramètres → Moyens de paiement)
When   Nathan tente d'activer PayPal
Then   si PayPal apparaît disponible pour la configuration Checkout actuelle (ui_mode embarqué), il l'active — sinon cette US est bloquée et remontée en arbitrage (bascule éventuelle en Checkout hébergé à évaluer séparément, hors périmètre de cette US)

Given  PayPal est activé côté Dashboard Stripe
When   un acheteur arrive sur /checkout
Then   PayPal apparaît comme option de paiement dans le formulaire Stripe embarqué, sans aucune modification de `server/api/checkout/session.post.ts`

Given  un acheteur choisit PayPal et complète le paiement (redirection PayPal puis retour)
When   il revient sur /checkout/success?session_id=...
Then   le parcours de confirmation fonctionne à l'identique d'un paiement carte (webhook `checkout.session.completed`, `fulfillOrder`, email de confirmation) — aucune branche de code spécifique à PayPal n'est nécessaire car le webhook ne distingue pas le moyen de paiement utilisé

Given  un acheteur commence un paiement PayPal puis l'abandonne (retour sans compléter)
When   la session expire ou est annulée
Then   le comportement de libération de stock existant (release_product_unit) s'applique à l'identique, sans distinction de moyen de paiement
```

**Notes techniques** :
- Étape 1 (spike, quelques minutes) : vérifier dans le Dashboard Stripe si PayPal est proposable pour une configuration `ui_mode: embedded_page`. Si non, cette US se transforme en question d'arbitrage produit (bascule Checkout hébergé) — ne pas coder à l'aveugle.
- Si disponible : aucune tâche de développement CGWS n'est requise (le routage `checkout.session.completed` / `fulfillOrder` est déjà agnostique du moyen de paiement).
- Test manuel de recette obligatoire en mode test Stripe (carte PayPal sandbox) avant mise en avant du moyen de paiement auprès des clients.

**Fichiers impactés (estimés)** :
- Aucun a priori côté code si la vérification est positive — configuration Stripe Dashboard uniquement.
- `docs/DEV_GUIDE.md` (documenter que les moyens de paiement sont Dashboard-driven, pour éviter qu'un futur ticket similaire soit sur-estimé)

**Commit** : `docs(payments): document Dashboard-driven payment methods after PayPal activation check [US-098]`

---

### US-100 · Hero homepage — retirer l'arche décorative et l'eyebrow · 2 pts

**Issue** : #18 (« hero not good » — « Remove the hero-title-block's svg + hero-eyebrow »)

**En tant que** gérante (P1),
**Je veux** un hero de homepage plus épuré, sans l'arche décorative ni la ligne eyebrow au-dessus du titre,
**Afin de** simplifier la composition visuelle selon le retour de Nathan.

**Contexte / diagnostic (confirmé dans le code — correctif effectivement trivial)** : dans `app/components/home/HeroSection.vue`, `.hero-title-block` (ligne ~144) contient exactement deux éléments à retirer : (1) un `<svg>` décoratif (`aria-hidden="true"`, arche ornementale en `--cgws-accent-deco`, lignes ~146-159) et (2) `.hero-eyebrow` (ligne ~162-172, la ligne "Sellerie Équestre Western · Brèches, 37" avec sa barre décorative). Le H1 (titre principal animé lettre par lettre) et son animation GSAP restent inchangés. **Aucun risque LCP** : l'élément LCP de la section est l'image de fond (`NuxtPicture` avec `fetchpriority: high`, ligne ~116), totalement indépendante de `.hero-title-block` — sa suppression réduit même légèrement le DOM et ne peut pas dégrader le LCP. Deux points d'attention mineurs identifiés dans le code, pas dans l'issue : la timeline GSAP référence `.hero-eyebrow` (`tl.from('.hero-eyebrow', {...}, 0)`, ligne 38) — un sélecteur qui ne matchera plus rien une fois l'élément supprimé (sans erreur, mais code mort à nettoyer) ; et le titre H1 s'appuyait sur la marge `mt-6` de l'eyebrow pour son espacement vertical dans `.hero-title-block` — un ajustement de spacing est nécessaire pour que le titre garde une position cohérente une fois l'eyebrow retiré.

**Critères d'acceptation :**

```gherkin
Given  la homepage se charge
When   j'inspecte la section hero
Then   l'arche SVG décorative et le bloc "Sellerie Équestre Western · Brèches, 37" (eyebrow) ne sont plus présents dans le DOM
And    le titre H1 "L'AUTHENTIQUE WESTERN À VOTRE PORTÉE" reste affiché, animé lettre par lettre comme avant (aucune régression sur l'animation GSAP du titre)
And    l'espacement vertical du bloc titre est ajusté pour rester visuellement cohérent (pas de titre "collé" en haut de la zone de contenu)

Given  la timeline GSAP de la homepage
When   le hero se monte
Then   l'appel `tl.from('.hero-eyebrow', ...)` mort est retiré du script (pas seulement laissé en sélecteur orphelin)

Given  un audit Lighthouse LCP sur la homepage avant/après ce correctif
When   il est mesuré
Then   le LCP n'est pas dégradé (l'élément LCP reste l'image de fond, non affectée par ce changement)

Given  je suis sur mobile (375px), tablette (768px) et desktop (1440px)
When   j'affiche le hero
Then   la composition reste équilibrée aux trois largeurs sans l'eyebrow ni l'arche
```

**Notes techniques** :
- `app/components/home/HeroSection.vue` : retirer le bloc `<svg>` (lignes ~146-159) et le bloc `.hero-eyebrow` (lignes ~162-172) du template ; retirer l'entrée `tl.from('.hero-eyebrow', ...)` du script (ligne ~38-42).
- Ajuster la classe du H1 ou de `.hero-title-block` pour restaurer un espacement top cohérent (ex. `pt-*` sur `.hero-title-block` en remplacement du `mt-6` perdu de l'eyebrow) — à valider visuellement aux 3 breakpoints du DoD.
- Aucun changement attendu sur `app/pages/index.vue`, l'image de fond, ou les autres sections de la homepage.

**Fichiers impactés (estimés)** :
- `app/components/home/HeroSection.vue`

**Commit** : `fix(home): remove decorative hero arch and eyebrow per design feedback [US-100]`

---

## Épic E11 — Stock multi-unités & rupture

**Sprint 10 · ~1-2 semaines · 16 points**
**Objectif** : un produit non-consigné peut être vendu en plusieurs exemplaires avec une quantité restante visible, et un produit en rupture reste consultable avec une option d'alerte email au retour en stock.

**Dépendance transverse** : US-097 nécessite le modèle de stock consolidé en US-096 ET le domaine Resend vérifié (US-094) pour être utile en production — coder-tester est possible avant, mais la validation réelle de l'envoi d'alerte est bloquée par les mêmes prérequis externes que US-063/US-066 (voir Sprint 7).

| US | Titre | Priorité | Points | Issue(s) |
|----|-------|----------|--------|----------|
| US-096 | Quantité restante affichée + achat multiple | Should Have | 8 | #23 |
| US-097 | Rupture de stock : parcage catalogue + alerte email retour en stock | Should Have | 8 | #22 |
| **Total** | | | **16** | |

---

### US-096 · Quantité restante affichée + achat multiple · 8 pts

**Issue** : #23 (« afficher quantité restante des articles et permettre d'en acheter plusieurs »)

**En tant qu'**acheteur (P2, P4),
**Je veux** voir combien d'exemplaires restent d'un produit non-consigné et pouvoir en commander plusieurs en une fois,
**Afin de** acheter, par exemple, plusieurs bidons d'huile de sabot ou plusieurs paires de bas de contention sans repasser cinq fois par le tunnel de paiement.

**Contexte / diagnostic (confirmé dans le code)** : le socle bas-niveau supporte déjà partiellement le multi-unités depuis le rework E8 (`supabase/migrations/006_stock_reservation_functions.sql`) — `reserve_product_unit` décrémente `stock` d'une unité par appel et ne verrouille (`status = 'reserved'`) QUE sur la toute dernière unité ; les unités intermédiaires restent `active` avec un stock réduit. **Ce qui manque n'est donc pas l'atomicité SQL (déjà là) mais la couche applicative** : `server/api/checkout/session.post.ts` dé-duplique aujourd'hui les IDs produit (`[...new Set(rawIds)]`) et réserve toujours exactement 1 unité par produit, avec `quantity: 1` figé côté Stripe `line_items` ; `app/stores/cart.ts` n'a aucun champ quantité (« 1 ligne = 1 exemplaire », commentaire explicite) ; aucun composant n'affiche `products.stock` (colonne existante, gérée côté admin depuis US-032, jamais exposée côté public).

**Critères d'acceptation :**

```gherkin
Given  un produit non-consigné (isConsignment=false) avec un stock de 5
When   j'affiche sa fiche produit
Then   la quantité restante est visible ("5 en stock")
And    si le stock est ≤ 3, un message d'urgence discret s'affiche ("Plus que 3 en stock")
And    un sélecteur de quantité (de 1 au minimum(stock, 10)) est disponible avant "Ajouter au panier"

Given  un produit en consignation (isConsignment=true — pièce unique par nature)
When   j'affiche sa fiche produit
Then   aucun sélecteur de quantité n'est proposé et le comportement actuel (pièce unique) reste strictement inchangé

Given  un produit non-consigné en stock 0
When   j'affiche sa fiche produit
Then   "Épuisé" s'affiche et l'ajout au panier est désactivé (préparation du terrain pour US-097, sans implémenter la notification dans cette US)

Given  je choisis une quantité de 3 pour un produit non-consigné en stock 5, et je l'ajoute au panier
When   je vais au checkout
Then   la réservation appelle `reserve_product_unit` 3 fois pour ce produit (réutilisation de la RPC atomique existante, aucune nouvelle fonction SQL nécessaire) et la ligne Stripe correspondante a `quantity: 3`

Given  ma quantité demandée dépasse le stock réellement disponible au moment du paiement (stock modifié entre-temps par une autre vente)
When   la réservation échoue sur l'une des unités demandées
Then   TOUTES les unités déjà réservées pour cette tentative — pour ce produit ET pour les autres produits du panier — sont restituées (extension du rollback existant, déjà éprouvé en US-091, au cas multi-unités)
And    l'API répond 409 sans créer de session Stripe, avec un message indiquant la quantité réellement disponible

Given  l'edge case déjà documenté en fin de Sprint 8 (release d'une unité pendant qu'une autre commande détient le verrou dernière-unité, qui paie ensuite → produit "sold" avec stock résiduel)
When   ce scénario de course se reproduit avec le modèle quantité étendu
Then   un log serveur explicite et distinctif est émis pour permettre à Camille/Nathan de repérer et réactiver le produit rapidement en admin — le correctif de l'atomicité SQL sous-jacente reste hors périmètre (acté non-bloquant en US-091), mais l'invisibilité opérationnelle actuelle, elle, est corrigée par cette US

Given  un produit déjà présent dans mon panier avec une quantité N
When   je retourne sur sa fiche et modifie la quantité désirée
Then   le panier reflète la nouvelle quantité totale sans dupliquer la ligne produit (toujours 1 ligne par produit, mais avec un champ quantité)
```

**Notes techniques** :
- `app/types/index.ts` : ajouter `quantity: number` à `CartItem`.
- `app/stores/cart.ts` + `#shared/utils/checkout.ts` (`addCartLine`, `computeSubtotal`) : gérer la quantité par ligne (tests unitaires `tests/unit/cart.spec.ts` à étendre en conséquence).
- `server/api/checkout/session.post.ts` : le payload `productIds` (array d'UUID dédupliqués) devient un array de `{ productId, quantity }` (schéma Zod à adapter, `max(30)` à revoir en fonction du total d'unités plutôt que du nombre de lignes) ; la boucle de réservation appelle `reserve_product_unit` `quantity` fois par produit (séquentiel, chaque appel restant atomique) ; `line_items[].quantity` reflète la quantité réelle au lieu de `1` figé.
- Nouveau composant `app/components/product/QuantitySelector.vue`, utilisé dans `ProductInfo.vue` (masqué si `isConsignment`).
- `app/components/catalogue/ProductCard.vue` : badge stock bas si pertinent (cohérent avec le badge "Vendu"/"Consignation" existant).
- Tests unitaires : extension de `tests/unit/reservation.spec.ts` (US-091) pour la boucle multi-quantité et son rollback partiel.

**Fichiers impactés (estimés)** :
- `app/types/index.ts`
- `app/stores/cart.ts`
- `app/shared/utils/checkout.ts` (ou équivalent selon l'emplacement réel de `computeSubtotal`)
- `server/api/checkout/session.post.ts`
- `app/components/product/QuantitySelector.vue`
- `app/components/product/ProductInfo.vue`
- `app/components/catalogue/ProductCard.vue`
- `tests/unit/cart.spec.ts`, `tests/unit/reservation.spec.ts`

**Commit** : `feat(catalog): remaining stock display and multi-unit purchase for non-consignment products [US-096]`

---

### US-097 · Rupture de stock : parcage catalogue + alerte email retour en stock · 8 pts

**Issue** : #22 (« quand un article hors dépôt-vente est en rupture, ne pas le retirer du catalogue mais le parquer en rupture, et permettre d'être averti par mail »)

**En tant que** cavalier(e) (P2, P4),
**Je veux** pouvoir demander à être prévenu(e) par email quand un article épuisé revient en stock,
**Afin de** ne pas avoir à revenir vérifier régulièrement le site pour un article qui m'intéresse.

**Dépendances** : US-096 (modèle de stock consolidé, notion de rupture affichée) ; US-094 (domaine Resend vérifié) pour que l'email d'alerte parte réellement en production — le code peut être écrit et testé avec mocks avant, comme le reste du projet à ce jour (cf. pattern acté Sprint 7 pour US-063/US-066), mais la validation end-to-end réelle est bloquée par le même prérequis externe.

**Critères d'acceptation :**

```gherkin
Given  un produit non-consigné (isConsignment=false) dont le stock passe à 0
When   ce changement se produit (vente, ajustement admin)
Then   le produit N'EST PAS retiré du catalogue public — il reste consultable via /catalogue et sa fiche produit
And    son statut affiché passe à "Épuisé" (distinct de "Vendu", qui reste réservé aux pièces de consignation uniques)

Given  un produit en consignation (isConsignment=true) vendu
When   son statut passe à "sold"
Then   le comportement actuel est strictement inchangé (retiré ou badgé "Vendu" selon la config existante — cette US ne touche PAS aux articles de consignation)

Given  je consulte la fiche d'un produit "Épuisé"
When   la page se charge
Then   le bouton "Ajouter au panier" est remplacé par un formulaire "M'avertir du retour en stock" (email uniquement)
And    après soumission, un message de confirmation neutre s'affiche ("Vous serez averti(e) par email dès que cet article sera de nouveau disponible")

Given  je me suis déjà inscrit(e) pour ce produit avec la même adresse email
When   je soumets à nouveau le formulaire pour le même produit
Then   aucune deuxième inscription n'est créée (idempotence sur le couple produit + email) et le même message de confirmation s'affiche

Given  Camille réapprovisionne un produit "Épuisé" via l'admin (stock remonté au-dessus de 0)
When   le changement est enregistré
Then   le statut du produit repasse automatiquement à "Disponible"
And    un email est envoyé à chaque adresse inscrite pour ce produit, avec un lien direct vers la fiche produit
And    les inscriptions notifiées sont marquées comme traitées (pas de rappel en boucle à chaque nouvel ajustement de stock ultérieur)

Given  un produit "Épuisé" pour lequel personne ne s'est inscrit
When   il est réapprovisionné
Then   aucun email n'est envoyé (pas d'inscription à notifier) et aucune erreur ne survient
```

**Notes techniques** :
- Nouveau statut produit distinct : soit une valeur `out_of_stock` ajoutée à `ProductStatus` (migration + CHECK constraint à étendre), soit une dérivation UI pure basée sur `status='active' AND stock=0` sans nouvelle valeur DB — **à trancher en design/dev selon ce qui minimise le risque de régression sur les requêtes existantes** (`useCatalogue.ts` filtre aujourd'hui sur `['active', 'reserved']` ; un statut dérivé évite de toucher ce filtre mais complexifie l'affichage, une vraie valeur DB simplifie l'affichage mais impose d'auditer chaque requête filtrant par statut).
- Nouvelle table `stock_notifications (id uuid, product_id uuid references products, email text, created_at timestamptz, notified_at timestamptz nullable)`, contrainte unique `(product_id, email)`.
- Nouvelle route publique `server/api/products/[id]/notify-restock.post.ts` (validation Zod email, upsert idempotent).
- Détection du réapprovisionnement : trigger SQL sur `products` (transition stock 0 → >0) OU vérification applicative dans la route admin de mise à jour produit (`server/api/admin/products/[id].put.ts`) — préférer le trigger SQL pour couvrir tous les chemins d'écriture (admin direct, futur import CSV avec mise à jour de stock) sans dépendre d'un seul point d'entrée applicatif.
- Nouveau template email `sendRestockNotification` dans `server/services/email.ts` (`resolveEmailFrom()` réutilisé — aucune nouvelle logique d'expéditeur).
- `app/components/product/RestockNotifyForm.vue`, affiché dans `ProductInfo.vue` en lieu et place du CTA d'achat quand `status === 'out_of_stock'` (ou équivalent dérivé).

**Fichiers impactés (estimés)** :
- `supabase/migrations/007_stock_notifications.sql` (nouvelle table + éventuel statut + trigger)
- `app/types/index.ts`, `app/types/database.types.ts` (régénération, cf. procédure US-090)
- `server/api/products/[id]/notify-restock.post.ts`
- `server/services/email.ts`
- `app/components/product/RestockNotifyForm.vue`
- `app/components/product/ProductInfo.vue`

**Commit** : `feat(catalog): out-of-stock parking with email restock notifications [US-097]`

---

## Issues « Products » (#21, #10, #9, #8, #7) — hors périmètre sprint

Les 5 issues suivantes sont des **fiches produits à saisir** (Kevin's Bacon huile sabot, boho street, Cura Natural 1, Bob's saddles, Horshair), pas du développement :

- **#21, #10, #9, #8, #7** : saisie de contenu catalogue (titre, description, prix, marque, état, photos). L'outillage existe déjà et est suffisant : saisie unitaire via `/admin/produits/nouveau` (US-032) ou import en masse via `/admin/produits/import` (US-063, Sprint 7). Aucune US de développement n'est nécessaire.

**Recommandation à Nathan** : reclassifier ces 5 issues hors du board d'ingénierie (label `type/content` plutôt que `type/feature`/`type/bugfix`, ou déplacement vers un outil de suivi contenu séparé) pour ne pas polluer la vélocité de sprint avec des tâches qui ne sont pas du développement. Note utile pour Camille : #21 (huile de sabot) est justement le type de produit consommable multi-exemplaires directement concerné par US-096/US-097 — à saisir avec un `stock` réaliste (>1) une fois ces US livrées pour que la fonctionnalité ait un cas d'usage réel dès le lancement.

---

## Issues recommandées à la fermeture (justification par le code)

- **#11 · e2e tests failing** — **résolu** par US-091 (Sprint 8, commit `8d8cf97`) : `npm ci` réparé, workflow `.github/workflows/e2e.yml` restructuré en 3 jobs (`quality` bloquant sans secret requis, `e2e-secrets-check` toujours vert, `e2e` explicitement SKIPPED et jamais rouge si les secrets manquent). Il ne reste qu'une action Nathan (créer les secrets GitHub `SUPABASE_URL`/`SUPABASE_ANON_KEY`, procédure documentée dans `docs/DEV_GUIDE.md` § CI) pour que les e2e tournent réellement — ce n'est plus un bug, c'est une case à cocher en dehors du code.
- **#16 · chore(config) nettoyer les variables d'env Supabase (BOM)** — **résolu côté code**. `sanitizeCredential()` est appliqué symétriquement côté client public (`app/composables/useSupabase.ts`) ET côté service role (`server/utils/adminSupabase.ts`), avec le même correctif répliqué pour Resend (`server/services/email.ts`, commentaire explicite « voir issue #16 »). Il ne reste qu'une hygiène de saisie des variables d'environnement dans le dashboard Vercel (re-coller sans caractères invisibles) — action Nathan, pas de développement.

**Non recommandé à la fermeture sans action** : #27, #26, #24, #25, #23, #22, #29, #18 (traités en US-094 à US-100 ci-dessus).

---

## Statut des 15 issues — récapitulatif exhaustif

Pour qu'aucune issue de l'inventaire ne reste sans statut explicite :

| Issue | Titre | Statut | Détail |
|-------|-------|--------|--------|
| #27 | Formulaire de contact ko | Planifiée | US-094 (Sprint 9) |
| #26 | Erreur au dépôt de selle | Planifiée | US-095 (Sprint 9) |
| #24 | Mail d'achat non reçu | Planifiée | US-094 (Sprint 9) |
| #18 | Hero not good | Planifiée | US-100 (Sprint 9) |
| #11 | E2e tests failing | **À fermer** | Résolu par US-091 (Sprint 8) — reste une action Nathan (secrets GitHub), voir § dédiée |
| #16 | BOM env Supabase | **À fermer** | Résolu par le code (`sanitizeCredential`) — reste une action Nathan (hygiène Vercel), voir § dédiée |
| #29 | Page À propos | Planifiée | US-099 (Sprint 9) |
| #25 | PayPal | Planifiée | US-098 (Sprint 9) |
| #23 | Quantité restante + achat multiple | Planifiée | US-096 (Sprint 10) |
| #22 | Abonnement retour en stock | Planifiée | US-097 (Sprint 10, dépend de US-096 et US-094) |
| #21 | Produit — Kevin's Bacon huile sabot | Hors périmètre sprint | Saisie catalogue, voir § « Issues Products » |
| #10 | Produit — boho street | Hors périmètre sprint | Saisie catalogue, voir § « Issues Products » |
| #9 | Produit — Cura Natural 1 | Hors périmètre sprint | Saisie catalogue, voir § « Issues Products » |
| #8 | Produit — Bob's saddles | Hors périmètre sprint | Saisie catalogue, voir § « Issues Products » |
| #7 | Produit — Horshair | Hors périmètre sprint | Saisie catalogue, voir § « Issues Products » |

**15/15 issues couvertes** : 8 planifiées en US (Sprint 9 : US-094, US-095, US-098, US-099, US-100 · Sprint 10 : US-096, US-097), 2 recommandées à la fermeture (#11, #16), 5 hors périmètre sprint (saisie catalogue).

---

## Planification Sprint 11 (interview Nathan, 2026-07-23) — Sécurité & Analytics produit

**Périmètre acté en interview** : deux issues, dans cet ordre strict de priorité — **#34** (faille RLS admin, sécurité haute, à traiter EN PREMIER) puis **#31** (intégration PostHog). Les décisions de cadrage ci-dessous prévalent sur le texte de l'issue #31 : **pas de bandeau de consentement** — PostHog est configuré en mode **cookieless/anonyme** (persistence mémoire, aucun cookie, aucune identification utilisateur, IP écartée, hébergement UE) pour s'inscrire dans l'exemption CNIL de mesure d'audience. Conséquence directe et assumée : **pas de session replay ni de heatmaps dans ce sprint** (incompatibles avec l'anonyme sans consentement) — le critère « bandeau bloquant » de l'issue est explicitement abandonné. Consommateur unique des données : **Nathan**, pour objectiver la priorisation du backlog (où perd-on les acheteurs ? le funnel consignation convertit-il ?). Pas de dashboard vulgarisé pour Camille dans ce sprint.

**Découpage PostHog** : 4 US livrables indépendamment (socle SDK → taxonomie client → capture serveur Stripe → funnels/doc), pour que le sprint puisse s'arrêter proprement à n'importe quelle frontière si la sécurité (US-101) consomme plus que prévu.

**Vélocité** : 18 pts, dans la fourchette observée (Sprint 9 = 18, Sprint 10 = 16).

---

## Épic E12 — Sécurité & Analytics produit

**Sprint 11 · ~1-2 semaines · 18 points**
**Objectif** : un déposant connecté ne peut plus lire les PII des autres ni écrire dans le catalogue (rôle admin réel vérifié en RLS), et le comportement réel des visiteurs (parcours catalogue, tunnel de dépôt, tunnel de paiement) devient mesurable dans PostHog sans cookie ni consentement, avec des funnels lisibles et documentés pour Nathan.

**Prérequis externes (actions Nathan, hors code)** : création d'un compte/projet PostHog **Cloud EU** + saisie des clés `NUXT_PUBLIC_POSTHOG_KEY` / `NUXT_PUBLIC_POSTHOG_HOST` dans Vercel (US-102) ; attribution du claim admin aux comptes de Camille et Nathan AVANT le déploiement de la migration RLS en production (US-101 — procédure détaillée dans la US, l'ordre est critique sous peine de verrouiller le backoffice).

| US | Titre | Priorité | Points | Issue(s) |
|----|-------|----------|--------|----------|
| US-101 | RLS admin réel — rôle admin vérifié dans les policies | Must Have | 5 | #34 |
| US-102 | Socle PostHog cookieless — plugin client SSR-safe et différé | Should Have | 3 | #31 |
| US-103 | Taxonomie d'événements produit — funnels achat, consignation, contact | Should Have | 5 | #31 |
| US-104 | Capture serveur fiable « commande payée » via webhook Stripe | Should Have | 2 | #31 |
| US-105 | Funnels & dashboards PostHog + guide de lecture pour Nathan | Could Have | 3 | #31 |
| **Total** | | | **18** | |

---

### US-101 · RLS admin réel — rôle admin vérifié dans les policies · 5 pts

**Issue** : #34 (« RLS admin reposant sur auth.role()='authenticated' : lecture PII + écriture catalogue accessibles à tout déposant connecté »)

**En tant que** gérante (P1),
**Je veux** que seuls les comptes explicitement admin puissent lire les données personnelles (consignations, clients, ventes, commandes) et écrire dans le catalogue,
**Afin de** protéger les PII de mes clients et déposants — un particulier qui a déposé sa selle ne doit jamais pouvoir lire les coordonnées des autres déposants ni modifier mes produits.

**Contexte / diagnostic (confirmé dans le code)** : `supabase/migrations/002_rls_policies.sql` (lignes 10-29) et `004_orders.sql` (lignes 55-56) utilisent `auth.role() = 'authenticated'` comme critère « admin » sur `products` (INSERT/UPDATE/DELETE), `categories`, `consignments` (SELECT/UPDATE), `sales`, `clients`, `orders`, `order_items`. Or depuis l'espace déposant (US-066, Sprint 7), **tout déposant obtient une session `authenticated` via magic link** : avec la clé anon publique + son propre JWT, il peut donc interroger PostgREST directement et lire les PII de TOUS les déposants/clients, ou écrire dans le catalogue. La faille est même **déjà documentée en commentaire dans la migration `007_stock_notifications.sql`** (lignes 20-39), qui a explicitement évité de reproduire le pattern — cette US généralise cette prise de conscience à toutes les tables. Point d'attention majeur : le backoffice interroge Supabase **directement avec le JWT de l'admin** (`app/pages/admin/dashboard.vue`, `app/components/admin/ProductForm.vue`) — le durcissement RLS DOIT donc s'accompagner de l'attribution effective du rôle admin au compte de Camille, sinon le backoffice se verrouille lui-même.

**Critères d'acceptation :**

```gherkin
# Rôle admin réel
Given  la migration RLS dédiée est appliquée
When   les policies « admin » de products, categories, consignments, sales, clients, orders, order_items sont inspectées
Then   AUCUNE ne repose sur auth.role() = 'authenticated' seul — toutes vérifient un rôle admin réel
       via une fonction helper is_admin() lisant le claim app_metadata (jamais user_metadata, modifiable par l'utilisateur)

# Non-régression sécurité : le déposant authentifié est confiné
Given  un déposant connecté via magic link (session authenticated valide, compte SANS claim admin)
When   il interroge PostgREST directement avec la clé anon + son JWT
Then   SELECT sur consignments retourne zéro ligne (aucune PII d'autres déposants)
And    SELECT sur clients, sales, orders, order_items est refusé ou retourne zéro ligne
And    INSERT/UPDATE/DELETE sur products et categories est rejeté (violation RLS)

# Tentative d'élévation par user_metadata
Given  ce même déposant modifie son propre user_metadata via l'API auth publique (updateUser)
       pour y écrire role: 'admin'
When   il rejoue les requêtes ci-dessus
Then   tous les accès restent refusés à l'identique — la vérification ne lit QUE app_metadata,
       que seul le service role peut modifier

# Non-régression backoffice
Given  le compte de Camille porte le claim admin (attribué via la procédure documentée)
When   elle utilise le backoffice de bout en bout (dashboard + stats, CRUD produit, workflow
       consignation, ventes, clients)
Then   tout fonctionne strictement comme avant la migration

# Non-régression site public
Given  un visiteur anonyme (clé anon, pas de session)
When   il consulte le catalogue et une fiche produit
Then   la lecture des produits actifs fonctionne comme avant, et rien de plus n'est lisible qu'avant

# Non-régression espace déposant
Given  un déposant connecté via magic link
When   il consulte son espace déposant
Then   il voit ses propres consignations comme avant (les routes server/api/depositor/* passent par
       le service role avec filtre dérivé du JWT — barrières US-066 intouchées)

# Ordre de déploiement sûr
Given  la procédure d'attribution du claim admin (SQL ou dashboard Supabase) documentée dans DEV_GUIDE
When   la migration est déployée en production
Then   le claim a été attribué AVANT aux comptes de Camille et Nathan (étape explicite et ordonnée
       de la checklist de déploiement — un déploiement sans cette étape verrouillerait le backoffice)
```

**Notes techniques** :
- Migration dédiée `supabase/migrations/008_admin_role_rls.sql` : fonction `is_admin()` (STABLE, lisant `auth.jwt() -> 'app_metadata' ->> 'cgws_role'` — ou clé équivalente — comparé à `'admin'`), puis `DROP POLICY` / `CREATE POLICY` de remplacement pour chaque policy fautive de 002 et 004. Alternative acceptable si le dev la juge plus robuste : table `admin_users` + fonction SECURITY DEFINER — mais le claim `app_metadata` est privilégié (zéro table, zéro jointure par requête, non modifiable côté client).
- **JAMAIS `user_metadata`** : modifiable par l'utilisateur lui-même via `supabase.auth.updateUser()` — ce serait recréer la faille sous une autre forme. Seul `app_metadata` (service role only) est acceptable.
- Attribution du claim : `UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"cgws_role":"admin"}'::jsonb WHERE email = ...` (ou Supabase Dashboard → Auth → user → app_metadata). À documenter dans `docs/DEV_GUIDE.md` § sécurité, avec l'avertissement d'ordre de déploiement. Note : le claim n'entre dans le JWT qu'à la prochaine émission de token — Camille devra se reconnecter (ou attendre le refresh) après attribution.
- Tests de non-régression : script SQL rejouable (`psql` / SQL editor) simulant les claims via `SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claims = '{"role":"authenticated","app_metadata":{}}'` (déposant) puis avec `"app_metadata":{"cgws_role":"admin"}` (admin), vérifiant chaque table ; livré dans le repo (ex. `supabase/tests/rls_admin.sql`) pour être rejoué à chaque évolution de schéma. Les secrets CI étant toujours absents (cf. #11), l'exécution est locale/manuelle et son résultat consigné dans `docs/PROGRESS.md`.
- Vérifier au passage qu'aucune route `server/api/depositor/*` ni aucun composable public ne dépendait accidentellement de la permissivité actuelle (grep `from('consignments'|'clients'|'sales')` côté `app/` — seuls les fichiers admin listés en contexte le font aujourd'hui).

**Fichiers impactés (estimés)** :
- `supabase/migrations/008_admin_role_rls.sql`
- `supabase/tests/rls_admin.sql` (nouveau, script de non-régression rejouable)
- `docs/DEV_GUIDE.md` (procédure claim admin + ordre de déploiement)

**Commit** : `fix(security): real admin role in RLS policies, depositors locked out of PII and catalog writes [US-101]`

---

### US-102 · Socle PostHog cookieless — plugin client SSR-safe et différé · 3 pts

**Issue** : #31 (intégration PostHog — périmètre recadré en interview : cookieless, sans consentement, sans replay/heatmaps)

**En tant que** product owner (Nathan),
**Je veux** un socle PostHog chargé côté client de façon différée, anonyme et sans cookie,
**Afin de** pouvoir mesurer l'audience et les parcours sans bandeau de consentement (exemption CNIL mesure d'audience) et sans dégrader les Core Web Vitals du site.

**Contexte / cadrage** : décision d'interview NON négociable — pas de bandeau de consentement, donc une configuration strictement anonyme : `persistence: 'memory'` (aucun cookie ni localStorage, identité éphémère par session de navigation), aucun appel `identify()` jamais, session recording et heatmaps désactivés, hébergement UE (`https://eu.i.posthog.com`), IP écartée côté projet PostHog. Le plugin suit le pattern client-only déjà en place (`app/plugins/gsap.client.ts`, `chart.client.ts`).

**Critères d'acceptation :**

```gherkin
# Chargement différé, hors chemin critique
Given  la homepage se charge avec les clés PostHog configurées
When   le plugin s'initialise
Then   l'init PostHog est différée après l'hydratation (onNuxtReady + idle), jamais bloquante
And    un audit Lighthouse avant/après ne montre AUCUNE dégradation du LCP ni du TBT

# Mode strictement anonyme
Given  PostHog est initialisé
When   j'inspecte le stockage du navigateur (cookies, localStorage, sessionStorage)
Then   AUCUN cookie ni entrée de stockage persistant n'est créé par PostHog (persistence memory)
And    aucun appel identify() n'existe dans le codebase (l'identité reste l'id anonyme éphémère)
And    session recording et heatmaps sont explicitement désactivés dans la config du plugin

# Pageviews SPA
Given  je navigue de la homepage vers /catalogue puis une fiche produit (navigation client Nuxt)
When   chaque route change
Then   un événement $pageview est capturé pour chaque page vue (capture manuelle sur le router,
       la capture automatique ne couvrant pas les navigations SPA)

# Absence de clés = no-op silencieux
Given  NUXT_PUBLIC_POSTHOG_KEY est absente (dev local, preview sans secret)
When   le site tourne
Then   aucun script PostHog n'est chargé, useAnalytics() expose des fonctions inertes,
       et AUCUNE erreur console n'apparaît

# SSR-safe
Given  le rendu serveur d'une page quelconque
When   le HTML est généré
Then   aucune référence à posthog-js n'est évaluée côté serveur (plugin .client.ts strict,
       aucun warning SSR ni hydration mismatch)

# Transparence RGPD
Given  la page des mentions légales
When   je la consulte
Then   un court paragraphe informe de la mesure d'audience anonyme sans cookie (obligation de
       transparence de l'exemption CNIL), marqué pour validation de formulation par Nathan
```

**Notes techniques** :
- `app/plugins/posthog.client.ts` : `posthog.init(key, { api_host, persistence: 'memory', autocapture: false, capture_pageview: false, disable_session_recording: true })` — capture des `$pageview` manuelle via `router.afterEach` (SSR-safe car plugin client). Consulter la doc via MCP (`mcp__nuxt-remote__*`) pour le pattern plugin + router officiel Nuxt 4 avant implémentation (règle CLAUDE.md).
- `autocapture: false` volontaire : la taxonomie est exclusivement explicite (US-103) pour rester propre et sans PII accidentelle (l'autocapture peut aspirer des contenus de champs/labels).
- Composable `app/composables/useAnalytics.ts` : expose `capture(event, properties)` inerte si PostHog absent/non initialisé — c'est LE point d'entrée unique pour US-103/US-104 (côté client).
- Clés : `runtimeConfig.public.posthogKey` / `posthogHost` ← `NUXT_PUBLIC_POSTHOG_KEY` / `NUXT_PUBLIC_POSTHOG_HOST` (défaut `https://eu.i.posthog.com`). Jamais commitées ; ajoutées à `.env.example` et documentées dans `docs/DEV_GUIDE.md`.
- Config projet PostHog (action Nathan, à documenter) : projet sur PostHog Cloud **EU**, option « Discard client IP data » activée.
- Mentions légales : formulation courte type « mesure d'audience anonyme exemptée de consentement (CNIL) » — **la formulation exacte est à valider par Nathan** (sujet légal, on ne l'invente pas définitivement), marquage placeholder cohérent avec la convention du projet.

**Fichiers impactés (estimés)** :
- `app/plugins/posthog.client.ts`
- `app/composables/useAnalytics.ts`
- `nuxt.config.ts` (runtimeConfig public)
- `.env.example`, `docs/DEV_GUIDE.md`
- `app/pages/mentions-legales.vue` (paragraphe mesure d'audience)
- `package.json` (dépendance `posthog-js`)

**Commit** : `feat(analytics): cookieless PostHog client plugin, SSR-safe and deferred [US-102]`

---

### US-103 · Taxonomie d'événements produit — funnels achat, consignation, contact · 5 pts

**Issue** : #31

**Dépendances** : US-102 (composable `useAnalytics` et plugin initialisé).

**En tant que** product owner (Nathan),
**Je veux** une taxonomie d'événements minimale, nommée proprement et sans PII, couvrant le funnel achat, le funnel consignation et le contact,
**Afin de** répondre à des questions produit précises — où perd-on les acheteurs entre la fiche produit et le paiement ? le tunnel de dépôt de selle convertit-il ? — plutôt que d'accumuler des données inutilisables.

**Taxonomie retenue (exhaustive pour ce sprint — tout événement hors de cette liste est refusé en review)** :

| Événement | Déclencheur | Propriétés (JAMAIS de PII) |
|-----------|-------------|----------------------------|
| `product_viewed` | Affichage d'une fiche produit | `product_id`, `product_slug`, `category`, `price`, `is_consignment` |
| `cart_item_added` | Ajout au panier réussi | `product_id`, `quantity`, `price` |
| `checkout_opened` | Affichage du checkout embarqué Stripe | `cart_value`, `items_count` |
| `consignment_form_viewed` | Affichage du formulaire de dépôt sur /consignation | — |
| `consignment_submitted` | Soumission de dépôt RÉUSSIE (réponse serveur OK) | `photos_count`, `category` si disponible |
| `contact_submitted` | Soumission de contact RÉUSSIE | — |

(L'événement « commande payée » est volontairement côté serveur — US-104 — car seul le webhook Stripe fait foi.)

**Critères d'acceptation :**

```gherkin
# Funnel achat côté client
Given  PostHog initialisé, je consulte une fiche produit, j'ajoute au panier puis j'ouvre le checkout
When   chaque étape se produit
Then   product_viewed, cart_item_added et checkout_opened sont capturés dans cet ordre,
       avec exactement les propriétés de la taxonomie
And    les trois événements partagent le même distinct_id anonyme (même session de navigation),
       rendant le funnel constructible dans PostHog

# Funnel consignation
Given  j'ouvre /consignation puis je soumets une demande de dépôt valide
When   le serveur confirme la création
Then   consignment_form_viewed puis consignment_submitted sont capturés
And    une soumission en ÉCHEC (erreur serveur, validation) ne capture PAS consignment_submitted

# Contact
Given  je soumets le formulaire de contact avec succès
When   la confirmation s'affiche
Then   contact_submitted est capturé (échec serveur → rien)

# Zéro PII, zéro sur-instrumentation
Given  l'ensemble des captures du codebase
When   les propriétés envoyées sont auditées (grep sur les appels capture)
Then   AUCUNE propriété ne contient email, nom, téléphone, adresse, contenu de message ou prix
       demandé du déposant — uniquement les propriétés de la taxonomie ci-dessus
And    aucun événement hors taxonomie n'est capturé

# Résilience
Given  PostHog est bloqué par un adblocker ou les clés sont absentes
When   je déroule les mêmes parcours
Then   les parcours fonctionnent à l'identique, aucune erreur visible ni console — la mesure
       échoue en silence, jamais l'expérience utilisateur
```

**Notes techniques** :
- Tous les appels passent par `useAnalytics().capture()` (US-102) — aucun import direct de `posthog-js` dans les composants.
- Points d'accroche : `product_viewed` dans `app/pages/catalogue/[slug].vue` (onMounted, après résolution du produit) ; `cart_item_added` dans le store `app/stores/cart.ts` ou le composant CTA (au succès de l'ajout, avec la quantité US-096) ; `checkout_opened` au montage effectif du checkout embarqué ; `consignment_form_viewed`/`consignment_submitted` dans `ConsignmentForm.vue` (submitted UNIQUEMENT dans la branche succès) ; `contact_submitted` dans le formulaire de contact (idem).
- Centraliser les noms d'événements dans une constante typée (ex. `app/utils/analytics-events.ts`, union type des 6 noms) pour empêcher les fautes de frappe et rendre l'audit « zéro événement hors taxonomie » mécanique.
- `consignment_submitted.photos_count` : un COMPTE, jamais les fichiers ni leurs noms.

**Fichiers impactés (estimés)** :
- `app/utils/analytics-events.ts` (nouveau)
- `app/pages/catalogue/[slug].vue`
- `app/stores/cart.ts` (ou composant CTA d'ajout panier)
- `app/pages/checkout.vue` (ou composant du checkout embarqué)
- `app/components/consignation/ConsignmentForm.vue`
- `app/pages/contact.vue`

**Commit** : `feat(analytics): product event taxonomy for purchase, consignment and contact funnels [US-103]`

---

### US-104 · Capture serveur fiable « commande payée » via webhook Stripe · 2 pts

**Issue** : #31

**Dépendances** : US-102 (clés/env et convention de nommage) ; US-103 souhaitable pour que le funnel complet ait un sens dès la livraison.

**En tant que** product owner (Nathan),
**Je veux** que l'événement « commande payée » soit capturé côté serveur dans le webhook Stripe,
**Afin de** disposer d'un compteur de conversion FIABLE (non soumis aux adblockers, aux fermetures d'onglet ni au retour raté depuis le paiement) — seul le webhook `checkout.session.completed` fait foi qu'une commande est réellement payée.

**Critères d'acceptation :**

```gherkin
# Capture fiable au paiement
Given  un paiement aboutit (webhook checkout.session.completed reçu et vérifié)
When   fulfillOrder s'exécute avec succès
Then   un événement order_paid est capturé via posthog-node avec : montant total, nombre d'articles,
       devise, et le type de moyen de paiement si disponible — AUCUNE PII (ni email ni nom
       de l'acheteur, pourtant présents dans la session Stripe)

# Jonction anonyme avec le funnel client
Given  la session Stripe a été créée depuis un navigateur où PostHog était actif
When   le client a transmis son distinct_id anonyme éphémère à la création de session
       (metadata Stripe), et que le webhook le retrouve
Then   order_paid est capturé avec CE distinct_id — le funnel checkout_opened → order_paid
       se raccorde pour cette session de navigation
And    si le metadata est absent (PostHog bloqué/désactivé côté client), order_paid est capturé
       quand même avec un id aléatoire — le comptage global reste exhaustif

# L'analytics ne casse JAMAIS le fulfillment
Given  PostHog est indisponible (réseau, clé invalide, quota)
When   le webhook traite un paiement
Then   fulfillOrder, la confirmation de commande et l'email acheteur aboutissent normalement —
       l'échec de capture est loggé et avalé (try/catch), jamais propagé
And    la capture intervient APRÈS le fulfillment, jamais avant

# Environnement serverless
Given  l'exécution en fonction serverless Vercel
When   order_paid est capturé
Then   l'envoi est flushé avant la fin de la fonction (pas d'événement perdu dans un buffer
       tué avec la lambda)
```

**Notes techniques** :
- Dépendance `posthog-node`, utilisée uniquement dans `server/api/checkout/webhook.post.ts` (et/ou un petit service `server/services/analytics.ts` si la lisibilité le justifie). Réutilise la même clé projet (`NUXT_PUBLIC_POSTHOG_KEY`) et le host EU — la clé de capture PostHog est publique par nature, pas de secret supplémentaire.
- Serverless : instancier avec `flushAt: 1` et/ou `await posthog.shutdown()` après capture — vérifier le pattern recommandé dans la doc posthog-node (via context7) au moment de l'implémentation.
- Jonction funnel : côté client, à la création de la session checkout (`server/api/checkout/session.post.ts` reçoit le body du front), ajouter un champ optionnel `analyticsId` = distinct_id anonyme PostHog courant, propagé dans `metadata` de la session Stripe. C'est un identifiant ALÉATOIRE ÉPHÉMÈRE (persistence memory — il meurt avec l'onglet), pas un identifiant utilisateur : aucune donnée personnelle, cohérent avec le cadrage RGPD. Validation Zod : chaîne optionnelle, longueur bornée.
- Propriétés depuis l'objet session Stripe : `amount_total` (converti en euros), `currency`, nombre de `line_items` (ou somme des quantités, cohérent avec US-096), `payment_method_types[0]` ou le type effectif si exposé. Ne JAMAIS lire `customer_details` pour l'analytics.

**Fichiers impactés (estimés)** :
- `server/api/checkout/webhook.post.ts`
- `server/api/checkout/session.post.ts` (champ metadata `analyticsId` optionnel)
- `app/pages/checkout.vue` (ou l'appelant de la création de session — transmission du distinct_id)
- `package.json` (dépendance `posthog-node`)

**Commit** : `feat(analytics): reliable server-side order_paid capture in Stripe webhook [US-104]`

---

### US-105 · Funnels & dashboards PostHog + guide de lecture pour Nathan · 3 pts

**Issue** : #31

**Dépendances** : US-102, US-103, US-104 (les funnels ne se construisent que sur des événements existants et alimentés).

**En tant que** product owner (Nathan),
**Je veux** des funnels et un dashboard configurés dans PostHog, accompagnés d'un guide de lecture versionné dans le repo,
**Afin de** que l'outil ne reste pas une coquille vide : je dois pouvoir répondre en quelques clics à « où perd-on les acheteurs ? » et « le funnel consignation convertit-il ? », et savoir interpréter les chiffres (et leurs limites) sans redécouvrir la taxonomie à chaque fois.

**Critères d'acceptation :**

```gherkin
# Funnel achat
Given  le projet PostHog EU alimenté par les événements des US-102/103/104
When   le funnel « Achat » est consulté
Then   il enchaîne product_viewed → cart_item_added → checkout_opened → order_paid
And    un parcours de test complet (achat en mode test Stripe sur preview/prod) apparaît
       dans le funnel de bout en bout, prouvant la jonction client → serveur (US-104)

# Funnel consignation
Given  le même projet
When   le funnel « Consignation » est consulté
Then   il enchaîne consignment_form_viewed → consignment_submitted
And    un dépôt de test soumis apparaît dans le funnel

# Dashboard unique
Given  un dashboard « CGWS — Produit » créé dans PostHog
When   Nathan l'ouvre
Then   il regroupe au minimum : les 2 funnels, la tendance contact_submitted,
       la tendance order_paid (volume + montant), et le top des produits vus (product_viewed
       par product_slug) — le tout SANS configuration supplémentaire à faire

# Guide de lecture versionné
Given  le fichier docs/ANALYTICS.md
When   un nouveau venu (ou Nathan dans 6 mois) le lit
Then   il contient : la table de taxonomie complète (événement, déclencheur, propriétés, US d'origine),
       le lien de chaque funnel/dashboard, la question produit à laquelle chaque vue répond,
       et les LIMITES du dispositif explicitées (mode anonyme : funnels valides uniquement
       intra-session de navigation, pas de suivi cross-session/cross-device ; sous-comptage
       adblockers côté client vs order_paid serveur exhaustif ; pas de replay ni heatmaps, et pourquoi)
And    la règle de gouvernance est écrite : tout NOUVEL événement exige une mise à jour de ce fichier
       et de app/utils/analytics-events.ts dans la même PR
```

**Notes techniques** :
- La configuration des funnels/dashboards se fait dans l'UI PostHog (pas de code) — prérequis : accès au projet PostHog EU (action Nathan si le compte n'est pas partagé). Si l'API PostHog le permet simplement, un export JSON des définitions d'insights peut être joint à `docs/ANALYTICS.md` pour reproductibilité — nice-to-have, pas exigé pour le Done.
- Le parcours de recette (achat test Stripe + dépôt test) est un **livrable de cette US** : il valide en une passe toute la chaîne 102 → 103 → 104. Résultat consigné dans `docs/PROGRESS.md` par l'orchestrateur.
- `docs/ANALYTICS.md` : nouveau fichier, référencé depuis `docs/DEV_GUIDE.md`.

**Fichiers impactés (estimés)** :
- `docs/ANALYTICS.md` (nouveau)
- `docs/DEV_GUIDE.md` (renvoi)
- Configuration PostHog (hors repo)

**Commit** : `docs(analytics): PostHog funnels, dashboard and reading guide with taxonomy governance [US-105]`

---

## Mapping issues GitHub — Sprint 11

| Issue | Titre | Statut | Détail |
|-------|-------|--------|--------|
| #34 | RLS admin reposant sur auth.role()='authenticated' — PII lisibles et catalogue inscriptible par tout déposant connecté | Planifiée | US-101 (Sprint 11, Must Have, en premier dans le sprint) |
| #31 | Intégration PostHog (analytics produit + funnels) | Planifiée | US-102, US-103, US-104, US-105 (Sprint 11) — périmètre recadré en interview : cookieless sans consentement, PAS de session replay ni heatmaps, le critère « bandeau bloquant » de l'issue est abandonné |

**Arbitrages de cadrage actés (rappel pour la clôture des issues)** : la fermeture de #31 en fin de sprint doit mentionner explicitement l'abandon du bandeau de consentement au profit du mode anonyme exempté (décision d'interview du 2026-07-23), pour que l'issue ne soit pas rouverte sur ce critère obsolète. La fermeture de #34 doit référencer la migration `008_admin_role_rls.sql` et le script de non-régression `supabase/tests/rls_admin.sql`.

---

## Épic E13 — Repositionnement « Spin & Slide » (rebranding & recentrage reining)

**Sprint 12 · ~2 semaines · 31 points**
**Objectif** : matérialiser dans le produit le repositionnement acté le 2026-07-23 (`docs/BRAND_DIRECTION.md`) : CGWS devient **la boutique de la spécialiste reining** sous la marque commerciale **Spin & Slide** (endossement « CGWS — Spin & Slide Shop »). À la fin du sprint : la marque Spin & Slide est visible partout sur le site sans perdre l'endossement CGWS ni le signal SEO « western » ; la homepage met l'expertise reining et le catalogue en avant, la consignation reste un pilier mais après la boutique ; la taxonomie de catégories reflète le nouveau périmètre catalogue ; la promesse de curation « Testé et approuvé par Camille » est incarnée par un badge ; le modèle de vente hybride est explicite en fiche produit (livraison + politique de retour des selles) ; et le ton éditorial abandonne le registre « maroquinerie de luxe » au profit de la « spécialiste passionnée ». Le design system v2 (cuir, cuivre, denim, étiquettes, conchos) est **conservé** — c'est l'éditorial et le positionnement qui bougent, pas la direction artistique.

> **Source de vérité** : `docs/BRAND_DIRECTION.md` (positionnement, architecture de marque, modèle de vente, questions arbitrées). Aucune US de ce sprint ne ré-arbitre ce qui y est déjà tranché.

| US | Titre | Priorité | Points | Dépendance / Blocage |
|----|-------|----------|--------|----------------------|
| US-106 | Rebranding vitrine — lockup « CGWS — Spin & Slide Shop », header, footer, favicon, métadonnées SEO/OG | Must Have | 5 | Blocage design : logo/lockup définitif |
| US-107 | Domaine canonique, URL de site & expéditeur email Spin & Slide + redirection `cgws.fr` | Must Have | 2 | Dép. US-106 · **Blocage humain** : achat domaines + DNS + vérif. Resend (Nathan) |
| US-108 | Refonte homepage — expertise reining d'abord, catalogue en tête, consignation pilier secondaire | Must Have | 5 | Dép. US-106 (soft : US-109, US-110) · Blocage contenu : copy hero (Camille) |
| US-109 | Refonte de la taxonomie catégories (données Supabase + filtres) | Must Have | 8 | — (migration de données) |
| US-110 | Badge « Testé et approuvé par Camille » — composant, fiche produit, champ admin | Must Have | 5 | Blocage design : visuel du badge (clin d'œil « +1½ ») |
| US-111 | Politique de retour des selles expédiées + clarté du mode de livraison en fiche produit | Must Have | 3 | **Blocage juridique** : texte de rétractation/retour (Camille + comptable/juriste) |
| US-112 | Révision du ton éditorial des pages existantes | Should Have | 3 | Dép. US-106, US-108 · Blocage contenu : copy définitif (Camille) |
| **Total** | | | **31** | |

**Note de capacité** : 31 pts dépassent la vélocité observée (~18-20 pts/sprint sur les Sprints 9-11). Ce sprint est volontairement cadré comme un chantier de repositionnement complet ; si la fenêtre est d'une seule itération, US-112 (Should Have) et US-107 (bloqué tant que les domaines ne sont pas achetés) sont les deux candidats naturels au report sur un Sprint 12bis, sans casser la cohérence du reste. L'ordre d'exécution recommandé figure en fin de section.

**Personas** (mis à jour selon `docs/BRAND_DIRECTION.md`) : `Compétiteur` (cavalier reining/western exigeant, persona n°1), `Randonneur`, `Déposant`, `Admin` (Camille).

---

### US-106 · Rebranding vitrine — lockup « CGWS — Spin & Slide Shop », header, footer, favicon, métadonnées SEO/OG · 5 pts

**En tant que** Admin (Camille),
**Je veux** que la marque commerciale **Spin & Slide** soit affichée de façon cohérente sur tout le site public (identité, header, footer, favicon, métadonnées),
**Afin de** matérialiser le repositionnement dès le premier contact, tout en conservant l'endossement CGWS et le signal métier « sellerie western & reining » indispensable au SEO.

**Contexte** : la marque « Spin & Slide » est actée (`docs/BRAND_DIRECTION.md` § Architecture de marque). Usage courant « Spin & Slide Shop » (sans « western » dans le nom), CGWS conservé en endossement (lockup « CGWS — Spin & Slide Shop »). Le nom « Camille Guignon Western Shop » ne subsiste plus comme label de façade — uniquement là où CGWS est le nom d'entreprise obligatoire (mentions légales, factures). Références actuelles à recenser : `AppHeader.vue`, `AppFooter.vue`, `MobileMenu.vue`, `useSeo.ts`, `app/utils/localBusinessSchema.ts`, `nuxt.config.ts`, `app/pages/index.vue`.

**Critères d'acceptation :**

```gherkin
Given  je charge n'importe quelle page publique
When   le header s'affiche
Then   le lockup de marque « Spin & Slide » est visible en façade avec l'endossement CGWS
       (forme recommandée « Spin & Slide Shop — by CGWS », cf. BRAND_DIRECTION § Architecture de marque)
And    le monogramme CGWS du design system est conservé comme marque d'entreprise

Given  je fais défiler jusqu'au footer
When   le footer s'affiche
Then   la baseline descriptive « Sellerie western & reining — vente et dépôt-vente de selles » est présente
And    la raison sociale complète « CGWS — Camille Guignon Western Shop » figure dans le bloc légal/entreprise

Given  j'inspecte l'onglet du navigateur et le partage social d'une page
When   les métadonnées se chargent
Then   le favicon reflète la nouvelle identité (icône Spin & Slide)
And    le titleTemplate inclut la marque « Spin & Slide » ET conserve le signal « Sellerie western & reining » (baseline SEO préservée malgré le retrait de « western » du nom)
And    og:site_name = « Spin & Slide Shop » et l'image OG par défaut porte la nouvelle identité
And    le Schema.org LocalBusiness (app/utils/localBusinessSchema.ts) porte le nom commercial « Spin & Slide Shop » et, en champ alternateName/legalName, « CGWS — Camille Guignon Western Shop »

Given  le code du site public après rebranding
When   je lance `rg -i "camille guignon western shop|western shop" app/ --glob '!**/mentions-legales*'`
Then   aucune occurrence ne subsiste comme label de façade (hors mentions légales / raison sociale documentée)

Given  je suis sur mobile (<768px)
When   j'ouvre le menu (MobileMenu.vue)
Then   le lockup de marque s'affiche correctement sans troncature ni perte d'accessibilité (aria-label à jour)
```

**⚠️ Blocage design (partiel, non bloquant pour démarrer)** : le logo/lockup vectoriel définitif « CGWS — Spin & Slide Shop », le favicon et l'image OG sont des **livrables de design** (spec `ux-designer` puis validation Camille). L'US se livre avec un wordmark typographique propre (Bebas Neue / Rye du design system) marqué comme provisoire ; le remplacement par l'asset final est une itération isolée, pas un blocage de sprint.

**Notes techniques :**
- Centraliser le nom de marque et la baseline dans une source unique (constante/config ou `runtimeConfig.public`) pour éviter la re-dispersion des libellés (leçon US-092/US-093).
- `useSeo.ts` : ajuster `titleTemplate` et `og:site_name` ; conserver la baseline dans le suffixe de titre.
- Ne PAS toucher aux tokens/couleurs/fonts du design system v2 (conservé).

**Fichiers impactés (estimés) :**
- `app/components/layout/AppHeader.vue`, `AppFooter.vue`, `MobileMenu.vue`
- `app/composables/useSeo.ts`, `app/utils/localBusinessSchema.ts`
- `nuxt.config.ts` (site name / OG defaults), `public/` (favicon, image OG)

**Commit** : `feat(brand): Spin & Slide lockup across header, footer, favicon and SEO metadata [US-106]`

---

### US-107 · Domaine canonique, URL de site & expéditeur email Spin & Slide + redirection `cgws.fr` · 2 pts

**En tant que** Admin (Camille),
**Je veux** que le site serve sous le domaine canonique `spinandslide.fr`, que les emails partent de `noreply@spinandslide.fr`, et que `cgws.fr` redirige proprement,
**Afin de** que l'ensemble de la présence en ligne (URLs, emails, partages) soit cohérent avec la nouvelle marque, sans perdre le trafic ni la confiance liés à l'ancien domaine.

**⚠️ Blocage humain (bloquant pour le Done)** : l'achat des domaines (`spinandslide.fr` canonique, `spinslide.fr` / `spin-slide.fr` en 301, `cgws.fr` défensif), la configuration DNS et la **vérification du domaine dans Resend** sont des actions manuelles de Nathan (registrar + Resend). En amont de l'officialisation : recherche INPI (classes 18 & 35) et réservation des handles Instagram/Facebook (cf. `docs/BRAND_DIRECTION.md` § Questions ouvertes). Cette US livre le **code piloté par configuration** ; la bascule effective attend ces actions.

**Critères d'acceptation :**

```gherkin
Given  la variable NUXT_PUBLIC_SITE_URL est renseignée à https://spinandslide.fr
When   le site génère canonical, sitemap.xml, OG url et liens absolus
Then   toutes ces URL utilisent la valeur de l'environnement (aucun domaine canonique codé en dur)

Given  je recherche les domaines codés en dur : `rg -n "cgws\.fr|spinandslide\.fr" app/ server/ nuxt.config.ts`
When   j'inspecte les occurrences restantes
Then   il ne subsiste que des usages DÉFENSIFS documentés (ex. liste des domaines redirigés) — jamais dans la logique de génération d'URL canonique/OG

Given  la variable CGWS_EMAIL_FROM (mécanisme centralisé livré en US-092) est mise à 'Spin & Slide <noreply@spinandslide.fr>'
When   un des 6 templates envoie un email après vérification du domaine dans Resend
Then   l'expéditeur affiché est « Spin & Slide <noreply@spinandslide.fr> » — bascule par SEUL changement d'env var, zéro modif de code
And    tant que le domaine n'est pas vérifié, le fallback sûr d'US-092 reste actif (aucun email cassé)

Given  un visiteur ou un moteur atteint une URL sous cgws.fr
When   la requête est servie
Then   une redirection 301 permanente pointe vers l'URL équivalente sous spinandslide.fr
And    le SEO (canonical, sitemap) déclare spinandslide.fr comme domaine de référence
```

**Dépendances** : US-106 (identité de marque à l'écran) ; US-092 (expéditeur email déjà centralisé et configurable — cette US ne fait que documenter/valider la nouvelle valeur).

**Notes techniques :**
- La redirection `cgws.fr → spinandslide.fr` se configure au niveau hébergeur/Vercel (redirect domaine) ET/OU via règle applicative ; privilégier le niveau plateforme. Documenter le choix retenu.
- Mettre à jour `.env.example` et `docs/DEV_GUIDE.md` (§ variables d'environnement) : `NUXT_PUBLIC_SITE_URL`, `CGWS_EMAIL_FROM` avec la note « pointer spinandslide.fr uniquement après vérification DNS Resend ».

**Fichiers impactés (estimés) :**
- `nuxt.config.ts`, `.env.example`, `docs/DEV_GUIDE.md`
- `server/routes/sitemap.xml.ts`, `app/composables/useSeo.ts` (vérif. usage env)
- Config redirection (Vercel / plateforme — hors repo pour la partie DNS)

**Commit** : `chore(brand): canonical spinandslide.fr site URL, email sender and cgws.fr redirect [US-107]`

---

### US-108 · Refonte homepage — expertise reining d'abord, catalogue en tête, consignation pilier secondaire · 5 pts

**En tant que** Compétiteur (cavalier reining, persona n°1),
**Je veux** que la homepage me montre immédiatement l'expertise reining et le catalogue,
**Afin de** comprendre en quelques secondes que je suis chez LA spécialiste reining, et accéder vite aux produits ; la consignation restant visible mais après la boutique.

**Contexte** : `docs/BRAND_DIRECTION.md` § Impacts chantier n°1. La homepage actuelle (`app/pages/index.vue`, `HeroSection.vue`, sections associées) porte encore le message « authentique western à votre portée » et met la consignation trop en avant. Le design system v2 est conservé ; c'est la hiérarchie et le message qui changent.

**Critères d'acceptation :**

```gherkin
Given  je charge la homepage
When   le hero s'affiche
Then   le message met en avant l'expertise reining (spécialiste reining + western + randonnée en rayonnement)
And    le CTA principal mène au catalogue, un CTA secondaire (denim) mène à la consignation
And    le LCP reste < 2.5 s (aucune régression perf vs état actuel)

Given  je fais défiler la homepage
When   je parcours l'ordre des sections
Then   une entrée catalogue / mise en avant produits apparaît AVANT la section consignation
And    la promesse de curation « Testé et approuvé par Camille » est exprimée dès le haut de page
And    la section consignation reste présente comme pilier différenciateur, mais positionnée après la boutique

Given  la section de mise en avant produits
When   des cartes produits « coups de cœur » / nouveautés s'affichent
Then   le badge « Testé et approuvé par Camille » (US-110) apparaît sur les produits approuvés
       (intégration soft : si US-110 n'est pas encore mergée, la section fonctionne sans le badge)

Given  je suis sur mobile (375px)
When   je charge la homepage
Then   la hiérarchie (hero reining → catalogue → curation → consignation → histoire) est préservée en colonne
And    les animations GSAP existantes sont conservées ou adaptées sans casser l'accessibilité
```

**Dépendances** : US-106 (identité de marque). Dépendances **soft** : US-109 (nav catégories à jour dans les liens catalogue), US-110 (badge sur les cartes produits de la homepage).

**⚠️ Blocage contenu (non bloquant pour la structure)** : le copywriting définitif du hero reining et des accroches est une validation Camille. Livrable avec texte placeholder clairement marqué (même pattern que US-011 / US-099) ; le texte réel est un blocage de contenu isolé.

**Notes techniques :**
- Réutiliser les composants home existants (`HeroSection.vue`, sections histoire/consignation) ; il s'agit de réordonner et re-messager, pas de tout réécrire.
- Vérifier les patterns Nuxt/GSAP via les MCP avant toute modif de composant (règle CLAUDE.md).

**Fichiers impactés (estimés) :**
- `app/pages/index.vue`
- `app/components/home/HeroSection.vue` + composants de sections home
- éventuel `app/components/home/CurationPromise.vue` (nouveau, promesse de curation)

**Commit** : `feat(home): reining-first homepage with catalogue lead and consignment as secondary pillar [US-108]`

---

### US-109 · Refonte de la taxonomie catégories (données Supabase + filtres) · 8 pts

**En tant que** Admin (Camille),
**Je veux** que les catégories du catalogue reflètent le nouveau périmètre reining/western,
**Afin de** que mes clients trouvent le matériel selon une arborescence claire et défendable, et que je saisisse mes produits dans les bonnes catégories.

**Contexte** : `docs/BRAND_DIRECTION.md` § Impacts chantier n°2. Nouveau périmètre : **selles / bridonnerie (filets, mors) / étriers / bandes & protections / licols & accessoires / soins (crins, sabots)**, avec **bottes-chaussures et vêtements CONSERVÉS** (arbitré 2026-07-23, question fermée). Cela change à la fois les données (table `categories` + enum `ProductCategory` dans `app/types/index.ts`) et l'UI de filtres (`FilterPanel.vue`, `FilterDrawer.vue`, `useCatalogue.ts`, `ProductForm.vue`). **C'est un changement de données à risque** : il faut remapper les produits existants sans en laisser aucun orphelin.

**Critères d'acceptation :**

```gherkin
Given  la nouvelle taxonomie cible
When   la migration Supabase est appliquée
Then   les catégories suivantes existent et sont actives : selles, bridonnerie (filets, mors), étriers,
       bandes & protections, licols & accessoires, soins (crins, sabots), bottes & chaussures, vêtements
And    l'enum ProductCategory de app/types/index.ts est aligné sur ces slugs
And    database.types.ts est régénéré si le schéma change (règle US-090)

Given  des produits existants rattachés aux anciennes catégories (selles, brides-licols, bottes-chaussures, vetements, accessoires, protections)
When   la migration de remappage s'exécute
Then   chaque produit est réaffecté à une catégorie cible selon une table de correspondance explicite et documentée
And    AUCUN produit ne reste sans catégorie ni rattaché à une catégorie supprimée (zéro orphelin — vérifié par requête)
And    la correspondance ancien→nouveau slug est documentée (dans la migration et docs/DEV_GUIDE.md) pour audit/rollback

Given  je navigue sur /catalogue
When   j'ouvre le panneau de filtres (desktop) ou le drawer (mobile)
Then   les filtres de catégorie listent la nouvelle taxonomie
And    filtrer par une nouvelle catégorie renvoie les produits attendus, et l'URL reflète le nouveau slug (?categorie=bridonnerie)

Given  je crée/édite un produit dans l'admin (ProductForm.vue)
When   j'ouvre le sélecteur de catégorie
Then   il propose exactement la nouvelle taxonomie (plus aucune ancienne valeur sélectionnable)

Given  un ancien lien indexé pointant vers une ancienne catégorie (ex. ?categorie=protections)
When   il est ouvert
Then   il ne produit pas d'erreur : soit redirection vers la catégorie équivalente, soit dégradation propre vers le catalogue complet (comportement documenté)
```

**Notes techniques :**
- Migration data en 2 temps : (1) upsert des nouvelles catégories, (2) UPDATE de remappage des produits via table de correspondance, (3) désactivation/suppression des anciennes (garder is_active=false plutôt que DELETE si des ventes historiques y référencent).
- Table de correspondance proposée (à valider avec Camille) : `brides-licols` → `bridonnerie` (partie filets/mors) + `licols-accessoires` (partie licols) selon le produit ; `protections` → `bandes-protections` ; `accessoires` → `licols-accessoires` ; `selles`, `bottes-chaussures`, `vetements` inchangés ; `soins` = nouvelle. Le tri fin des ex-`brides-licols`/`accessoires` peut nécessiter un passage manuel de Camille (signalé, non bloquant : rattachement par défaut documenté).
- Vérifier les composants filtres via les MCP Nuxt UI avant modif.

**Fichiers impactés (estimés) :**
- `supabase/migrations/00X_reining_taxonomy.sql`, `supabase/seed.sql`
- `app/types/index.ts`, `app/types/database.types.ts` (régénéré)
- `app/composables/useCatalogue.ts`, `app/components/catalogue/FilterPanel.vue`, `FilterDrawer.vue`
- `app/components/admin/ProductForm.vue`, `app/pages/admin/categories.vue`

**Commit** : `feat(catalogue): reining-oriented category taxonomy with data migration and filter UI [US-109]`

---

### US-110 · Badge « Testé et approuvé par Camille » — composant, fiche produit, champ admin · 5 pts

**En tant que** Compétiteur,
**Je veux** repérer d'un coup d'œil les articles que Camille a personnellement testés et approuvés,
**Afin de** m'appuyer sur son expertise reining pour acheter en confiance — c'est la promesse centrale de la boutique (« si c'est dans le catalogue, c'est que ça marche »).

**Contexte** : `docs/BRAND_DIRECTION.md` § Signature éditoriale + Impacts chantier n°3. La curation stricte hors selles est le différenciateur affiché. Piste design actée : clin d'œil au score reining « +1½ » (manœuvre excellente). Le badge est un **nouveau composant du design system v2** (conservé), un **champ admin** pour marquer un produit approuvé, et une **colonne DB**.

**Critères d'acceptation :**

```gherkin
Given  le schéma products
When   la migration est appliquée
Then   une colonne booléenne (ex. camille_approved, défaut false) existe sur products
And    database.types.ts et l'interface Product (app/types/index.ts) sont alignés

Given  je crée/édite un produit dans l'admin (ProductForm.vue)
When   le formulaire s'affiche
Then   un contrôle « Testé et approuvé par Camille » (toggle) permet de marquer le produit comme approuvé
And    l'état est persisté et pré-rempli à la réédition

Given  un produit marqué approuvé
When   sa fiche produit se charge (app/pages/catalogue/[slug].vue)
Then   le badge « Testé et approuvé par Camille » (composant design system, clin d'œil « +1½ ») est affiché
And    un court argumentaire explique la promesse de curation (pourquoi cet article est dans le catalogue)
And    le badge apparaît aussi sur la carte produit du catalogue et sur les mises en avant homepage

Given  un produit NON marqué approuvé
When   sa fiche et sa carte s'affichent
Then   aucun badge de curation n'apparaît (le badge n'est jamais affiché par défaut)

Given  le badge affiché
When   je vérifie l'accessibilité
Then   il porte un libellé accessible (aria-label / texte alternatif), contraste ≥ 4.5:1 dans les rendus de peau existants
```

**⚠️ Blocage design (partiel)** : le visuel exact du badge (déclinaison « +1½ », intégration au design system cuir/cuivre) relève d'une spec `ux-designer` avant implémentation. L'US se livre avec un composant fonctionnel ; l'affinage visuel final est une itération de design.

**Notes techniques :**
- Composant `CgwsApprovedBadge.vue` dans `app/components/ui/` (cohérent avec TagCard/ConchoStat).
- La colonne DB est le champ de vérité ; la curation est une décision manuelle de Camille produit par produit (pas de règle automatique).
- Vérifier les patterns Nuxt UI via MCP avant implémentation.

**Fichiers impactés (estimés) :**
- `supabase/migrations/00X_product_camille_approved.sql`
- `app/types/index.ts`, `app/types/database.types.ts`
- `app/components/ui/CgwsApprovedBadge.vue` (nouveau)
- `app/components/admin/ProductForm.vue`, `app/pages/catalogue/[slug].vue`, `app/components/product/ProductInfo.vue`, `app/components/catalogue/ProductCard.vue`

**Commit** : `feat(catalogue): "Testé et approuvé par Camille" curation badge with admin toggle [US-110]`

---

### US-111 · Politique de retour des selles expédiées + clarté du mode de livraison en fiche produit · 3 pts

**En tant que** Acheteur (Compétiteur/Randonneur) achetant une selle à distance,
**Je veux** connaître clairement mes options de livraison et la politique d'essai/retour d'une selle expédiée,
**Afin d'** acheter en confiance sans me déplacer, en sachant que je peux retourner une selle qui ne convient pas.

**Contexte** : `docs/BRAND_DIRECTION.md` § Modèle de vente + Questions ouvertes (« Politique essai/retour des selles expédiées : à rédiger, affichée sur la fiche produit »). Le **choix expédition / click & collect existe déjà dans le checkout** (livré en US-082/US-091 : `fulfillment_method` = shipping/pickup, retrait Brèches à 0 €). Cette US ne reconstruit PAS le checkout : elle **rend le modèle explicite en fiche produit** et **ajoute la politique de retour** manquante.

**Critères d'acceptation :**

```gherkin
Given  je consulte la fiche d'une selle
When   la page se charge
Then   un bloc « Livraison & retrait » indique clairement les deux options : expédition France entière ET click & collect au magasin de Brèches (37)
And    un bloc « Essai & retour » présente la politique de retour des selles expédiées
And    un lien mène vers une page dédiée détaillant la politique complète (rétractation + modalités)

Given  je consulte la fiche d'un article non-selle
When   la page se charge
Then   les modalités de livraison/retrait restent affichées, cohérentes avec le droit de rétractation à distance

Given  la page dédiée « Livraison, essai & retour »
When   elle se charge
Then   elle expose : délai légal de rétractation (14 jours en vente à distance), modalités et frais de retour d'une selle, et l'invitation à privilégier l'essai/retrait au magasin
And    elle est reliée depuis le footer et depuis chaque fiche produit

Given  le contenu légal définitif n'est pas encore validé
When   la page est livrée
Then   le texte de rétractation/retour est un placeholder CLAIREMENT marqué « à valider » (jamais présenté comme définitif)
```

**⚠️ Blocage juridique/contenu (bloquant pour le contenu définitif)** : le texte exact de la politique de rétractation et de retour des selles (délai 14 jours, prise en charge et montant des frais de retour ≈ 60-100 €, conditions d'essai) engage juridiquement CGWS et **ne peut pas être inventé**. Il doit être validé par Camille (et idéalement son comptable/un juriste). L'US livre la **structure et l'emplacement** (page + blocs fiche produit) avec placeholder marqué ; le texte réel est un blocage de contenu isolé, pas un blocage de la structure.

**Notes techniques :**
- Réutiliser le mécanisme `fulfillment_method` existant : ne pas dupliquer la logique checkout, seulement l'exposer côté vitrine.
- Page `app/pages/livraison-retour.vue` (ou section CGV) reliée au footer (`AppFooter.vue`).

**Fichiers impactés (estimés) :**
- `app/pages/livraison-retour.vue` (nouveau) ou section dédiée
- `app/pages/catalogue/[slug].vue`, `app/components/product/ProductInfo.vue`
- `app/components/layout/AppFooter.vue`

**Commit** : `feat(product): saddle return policy and hybrid delivery clarity on product page [US-111]`

---

### US-112 · Révision du ton éditorial des pages existantes · 3 pts

**En tant que** Compétiteur,
**Je veux** un ton « spécialiste passionnée » plutôt que « maison de maroquinerie de luxe »,
**Afin de** ressentir l'expertise reining chaleureuse et crédible de Camille, cohérente avec le nouveau positionnement.

**Contexte** : `docs/BRAND_DIRECTION.md` § Ton de marque. On **conserve** le design system v2 (cuir, cuivre, denim, étiquettes, conchos) ; on **abandonne** le registre « haut de gamme façon Hermès » dans l'éditorial. La montée en gamme se dit par la curation, pas par le vocabulaire du luxe.

**Critères d'acceptation :**

```gherkin
Given  les pages publiques existantes (index, à-propos, consignation, contact, fiche produit, mentions)
When   je relis les textes éditoriaux et méta-descriptions
Then   le registre « maroquinerie / luxe / façon Hermès » est retiré au profit du ton « spécialiste passionnée reining »
And    la baseline « Sellerie western & reining — vente et dépôt-vente de selles » et le signal SEO « western » sont préservés

Given  le code après révision
When   je lance `rg -i "maroquinerie|haut de gamme|façon hermès|luxe" app/`
Then   il ne subsiste aucune formulation de registre « luxe » dans l'éditorial de façade

Given  les métadonnées SEO des pages
When   je vérifie les <title> et meta description
Then   elles reflètent le positionnement reining/spécialiste sans dégrader les mots-clés métier existants
And    aucune régression de structure SEO (US-023) n'est introduite

Given  le design system v2
When   je compare l'avant/après
Then   aucune couleur, font ou composant du design system n'est modifié (seul l'éditorial change)
```

**Dépendances** : US-106 (marque à l'écran), US-108 (homepage refaite — pour ne pas retravailler deux fois le hero).

**⚠️ Blocage contenu (partiel)** : le copywriting définitif est une validation Camille. Livrable avec textes révisés proposés, marqués « à valider » là où le contenu réel dépend d'elle (bio, storytelling). Ce sprint corrige le registre, pas la totalité du contenu final.

**Notes techniques :**
- Passer en revue `index.vue`, `a-propos.vue`, `consignation.vue`, `contact.vue`, `catalogue/[slug].vue`, méta via `useSeo.ts`.
- À faire APRÈS US-106/US-108 pour éviter le double travail sur les zones réécrites.

**Fichiers impactés (estimés) :**
- `app/pages/index.vue`, `app/pages/a-propos.vue`, `app/pages/consignation.vue`, `app/pages/contact.vue`
- `app/pages/catalogue/[slug].vue`, `app/composables/useSeo.ts`

**Commit** : `refactor(content): shift editorial tone from luxury register to reining specialist [US-112]`

---

## Récapitulatif Sprint 12

| US | Titre | Points | Dépendance / Blocage |
|----|-------|--------|----------------------|
| US-106 | Rebranding vitrine (lockup, header, footer, favicon, SEO/OG) | 5 | Blocage design : logo/lockup définitif (wordmark provisoire acceptable) |
| US-107 | Domaine canonique, URL de site, email, redirection cgws.fr | 2 | Dép. US-106 · **Blocage humain** : achat domaines + DNS + vérif. Resend (Nathan) |
| US-108 | Refonte homepage (reining-first, catalogue en tête) | 5 | Dép. US-106 (soft US-109/110) · Blocage contenu : copy hero |
| US-109 | Refonte taxonomie catégories (data + filtres) | 8 | — (migration de données, remappage produits) |
| US-110 | Badge « Testé et approuvé par Camille » | 5 | Blocage design : visuel du badge |
| US-111 | Politique de retour des selles + livraison en fiche produit | 3 | **Blocage juridique** : texte rétractation/retour |
| US-112 | Révision du ton éditorial | 3 | Dép. US-106/108 · Blocage contenu : copy définitif |
| **Total** | | **31** | |

**Ordre d'exécution recommandé** :
1. **US-109** (taxonomie catégories) — fondation données, sans dépendance de marque ; débloque la nav catalogue de la homepage et la saisie produit. Peut démarrer en parallèle de US-106.
2. **US-106** (rebranding vitrine) — pose l'identité de marque à l'écran ; prérequis de 107, 108 et 112.
3. **US-110** (badge curation) — composant + colonne DB ; alimente les cartes produits de la homepage et les fiches.
4. **US-108** (homepage) — après 106, bénéficie de 109 (nav) et 110 (badge sur les mises en avant).
5. **US-111** (politique de retour + livraison) — indépendant, parallélisable dès que possible (structure livrable, texte en attente de validation).
6. **US-112** (ton éditorial) — en dernier, une fois 106 et 108 stabilisées, pour ne pas réécrire deux fois les mêmes zones.
7. **US-107** (domaine/email/redirection) — **flottante** : à réaliser dès que Nathan a acheté les domaines et vérifié le domaine Resend ; sinon en toute fin de sprint. Non bloquante pour le reste (code piloté par env var, fallback sûr US-092 actif entre-temps).

**Blocages humains à lever en priorité (hors périmètre dev)** :
1. **Domaines & email** (débloque US-107) : achat de `spinandslide.fr` (+ `spinslide.fr`, `spin-slide.fr` en 301, `cgws.fr` défensif), configuration DNS, **vérification du domaine dans Resend**. En amont de l'officialisation : recherche INPI (classes 18 & 35) et réservation des handles Instagram/Facebook.
2. **Assets de marque** (débloque le rendu final de US-106 et US-110) : logo/lockup vectoriel définitif « CGWS — Spin & Slide Shop », favicon, image OG, et visuel du badge « +1½ » — spec `ux-designer` puis validation Camille.
3. **Texte légal politique d'essai/retour des selles** (débloque le contenu de US-111) : délai de rétractation, modalités et frais de retour — validation Camille (+ comptable/juriste). Ne peut pas être inventé.
4. **Copywriting définitif** (débloque le contenu de US-108 et US-112) : accroches hero reining, storytelling, bio Camille — validation Camille. Les structures sont livrables en placeholder marqué.

---

