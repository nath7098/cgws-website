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
| **TOTAL** | **9 sem** | **6 épics** | **123 pts** | |

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
| US-063 | Import CSV produits en masse (admin) | 5 pts |
| US-064 | Mode sombre (dark/light toggle) | 3 pts |
| US-065 | PWA offline (service worker, splash screen) | 5 pts |
| US-066 | Espace déposant (suivi consignation avec code) | 8 pts |
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
