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
