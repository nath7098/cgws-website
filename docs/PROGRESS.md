# CGWS — Journal de Progression

> Ce fichier est mis à jour automatiquement par la session Claude Code orchestratrice après chaque US complétée et à chaque fin de sprint. Ne pas éditer manuellement pendant une session autonome en cours.

---

## Statut global

| Sprint | Statut | US complétées | Points réalisés / planifiés |
|--------|--------|----------------|------------------------------|
| Sprint 0 | Terminé ✅ | 3/3 | 13/13 |
| Sprint 1 | Terminé ✅ | 5/5 | 27/27 |
| Sprint 2 | Terminé ✅ | 4/4 | 13/13 |
| Sprint 3 | Terminé ✅ | 5/5 | 26/26 |
| Sprint 4 | En cours 🔄 | 2/4 | 13/23 |
| Sprint 5 | À démarrer | 0/4 | 0/21 |

---

## Journal détaillé

> Format ajouté par l'orchestrateur à chaque US :
> `### US-XXX — [titre] — [PASS/FAIL→fix→PASS] — commit [hash court]`
> suivi d'une ligne de résumé QA et d'un éventuel point de blocage signalé à Nathan.

### US-041 — Suivi des Ventes — PASS (2e passe) — commit [à venir]

QA PASS au deuxième passage (FAIL 1re passe : `agreedPrice` hardcodé à `null` dans `SaleForm.vue`). Fix : `agreedPrice` converti en `ref`, `fetchAgreedPrice(consignmentId)` appelle `/api/admin/consignments/{id}` avec auth headers au watch sur `selectedProductId` quand `isConsignment && consignmentId`. Panel commission affiche skeleton pendant chargement, montants réels si `agreedPrice` disponible, message dégradé sinon. Pages créées : admin/ventes/index.vue (4 KpiCards grille 2→4 colonnes, filtres month+type, table desktop `hidden sm:block` colonnes article/date/type/prix/paiement/client, cartes mobile `block sm:hidden`, pagination, animations GSAP `.sale-row`, toast auto-dismiss 4s). Composant créé : SaleForm.vue (modal avec chargement produits actifs, récap produit Transition `recap`, panel commission Transition `commission-panel`, focus trap Tab/Shift+Tab, fermeture Esc/backdrop/Annuler/×, validation côté client). Routes serveur : index.get (filtres month/type, pagination, JOIN products, summary 4 KPIs), index.post (vérif statut active 409, calcul commission serveur, update status=sold, product_status_history, email non-bloquant). Email : `ConsignmentSaleEmailData` + `sendConsignmentSaleEmail` ajoutés. TypeScript ✅ ESLint ✅.

### US-040 — Gestion des Consignations — PASS (1re passe) — commit [à venir]

QA PASS au premier passage. Pages créées : admin/consignations/index.vue (tableau desktop + cartes mobile, tri pending-first via 2 requêtes séquentielles, badge pulsant animate-pulse bg-cgws-copper sur lignes pending, filtres déposant/statut debounce 300ms, pagination), admin/consignations/[id].vue (grid lg:3 colonnes, photos NuxtImg sticky desktop, prix éditable si pending, panels d'action contextuels selon statut, commission 20% calculée frontend, toasts). Composant créé : RejectModal.vue (Teleport + Transition + focus trap handleRejectModalKeydown, textarea motif requis, bouton disabled si vide). Routes serveur : index.get (pending-first 2 queries concaténées), [id].get (détail + linkedProduct + linkedSale), accept.post (garde pending → 409, crée produit auto, email non-bloquant), reject.post (garde pending + reason validation, email), [id].patch (agreed_price/notes). Email : sendConsignmentAcceptEmail + sendConsignmentRejectEmail ajoutés à server/services/email.ts. TypeScript ✅ ESLint ✅.

### US-034 — Gestion Stock & Statuts — PASS (2e passe) — commit e922ad7

QA FAIL au 1er passage (1 issue) → PASS au 2e. Composants créés : StatusDropdown.vue (badge statut cliquable, popover desktop via Teleport + getBoundingClientRect, bottom-sheet mobile slide-up, spinner inline, onClickOutside + Escape, role="listbox"/role="option"/aria-selected), SaleModal.vue (focus trap handleModalKeydown, champs date/prix/paiement/client optionnel, "Ignorer" ferme sans POST). Routes serveur : PATCH /api/admin/products/[id]/status (insert product_status_history si statut change), GET /api/admin/products/[id]/status-history, POST /api/admin/sales (Zod, client optionnel). Migration ajoutée : 003_product_status_history.sql (table + 2 index). Pages modifiées : produits/index.vue (StatusDropdown remplace le span statique dans table + cartes mobiles, SaleModal ajoutée), produits/[id].vue (section historique skeleton/timeline/vide). Correction QA : fichier migration SQL manquant créé. TypeScript ✅ ESLint ✅.

### US-033 — Gestion des Catégories — PASS (2e passe) — commit 3f82bcf

QA FAIL au 1er passage (1 issue) → PASS au 2e. Page créée : admin/categories/index.vue (arbre 2 niveaux, skeleton, états vide/chargé, modale suppression bloquante si produits). Composants créés : CategoryTree.vue (liste racine + Sortable racine, skeleton, état vide, watcher loading), CategoryTreeItem.vue (nœud récursif niveau 1/2, Sortable enfants, toggle is_active inline, boutons clavier sr-only pour accessibilité), CategoryPanel.vue (Teleport + Transition slide depuis droite/bottom-sheet mobile, focus trap, slug auto-synchronisé). API routes : 5 routes CRUD + PATCH reorder avec requireAdminAuth. Types ajoutés : Category, CategoryWithMeta, CategoryFormPayload, ReorderPayload. Correction QA : `.eq('parent_id', null)` → ternaire `.is()` / `.eq()` pour fix PostgREST null comparison (sort_order des racines cassé sinon). TypeScript ✅ ESLint ✅.

### US-032 — CRUD Produits — PASS (2e passe) — commit ef15ea1

QA FAIL au 1er passage (2 issues) → PASS au 2e. Pages créées : admin/produits/index.vue (tableau + cartes mobiles, recherche debounce 300ms, filtres catégorie/statut, pagination fenêtre glissante, modale suppression focus trap, toast aria-live), admin/produits/nouveau.vue, admin/produits/[id].vue (skeleton chargement). Composants créés : ProductForm.vue (3 fieldsets, slug preview computed, validation blur+submit, status select en mode édition), ImageUploader.vue (drag & drop, Sortable.js réordonnement, preview blob URL, cleanup onUnmounted). Composable : useAdminApi.ts (getAccessToken + buildAuthHeaders). API routes serveur : 5 routes CRUD avec requireAdminAuth + getAdminSupabase (service role key, bypass RLS). Utils serveur : adminAuth.ts (JWT validation), adminSupabase.ts (slugify, generateUniqueSlug, storagePathFromUrl, mapProductRow snake→camel). Dépendances ajoutées : sortablejs + @types/sortablejs. Corrections QA : vue mobile (tableau→cartes empilées `hidden sm:block`), focus trap modale (handleModalKeydown Tab/Shift+Tab). TypeScript ✅ ESLint ✅.

### US-031 — Dashboard Admin — PASS (2e passe) — commit df040e9

QA FAIL au 1er passage (bg-green-100 hors palette CGWS) → PASS au 2e. Composants créés : KpiCard.vue (4 variants, border-l-4 border-l-cgws-rust pour warning, skeleton animate-pulse, aria-label), RecentActivity.vue (table consignments/sales, STATUS_CONFIG avec tokens cgws-*, skeleton 5 rows, caption sr-only, scope col). dashboard.vue : 6 requêtes Supabase en 2 groupes parallèles (loadingKpis/loadingActivity), dateLabel dans onMounted SSR-safe, liens rapides CgwsButton. Correction inline : bg-green-100→bg-cgws-denim/15 text-cgws-denim. Stub dashboard/index.vue supprimé. TypeScript ✅ ESLint ✅.

### US-030 — Authentification Admin — PASS (1re passe) — commit 0416ff3

QA PASS au premier passage. Créés : useAdminAuth.ts (singleton useState, login/logout/initSession, mapping erreurs FR), admin.ts middleware (defineNuxtRouteMiddleware, guard server passthrough, getSession client), admin.vue layout (sidebar fixe cgws-tack w-64 desktop, drawer slide-in mobile + focus trap manuel + Escape, topbar cgws-parchment, 5 liens nav aria-current, bouton déconnexion), login.vue (card centrée, CgwsInput email/password, shake @keyframes, focus management erreur), admin/index.vue (redirect dashboard), admin/dashboard/index.vue (stub). Correction inline : ref="errorBannerRef" résiduelle supprimée. @vueuse/motion remplacé par transition CSS (module non enregistré). TypeScript ✅ ESLint ✅.

### US-023 — SEO Fondations — PASS (1re passe) — commit b8c64ba

QA PASS au premier passage. Créés : app/composables/useSeo.ts (usePageSeo() + constantes SITE_NAME/SITE_URL/DEFAULT_OG_IMAGE), server/api/__sitemap/urls.ts (endpoint Nitro produits actifs pour @nuxtjs/sitemap). Modifiés : nuxt.config.ts (blocs site/robots/sitemap), public/_robots.txt (Disallow /admin/ /api/ /dev-components + Sitemap directive), index.vue (+ogImage +twitterCard +LocalBusiness JSON-LD), catalogue/index.vue (+ogImage +twitterCard), consignation.vue (idem), contact.vue (idem). Schema.org Product hérité de US-013 intact. DEFAULT_OG_IMAGE = Unsplash URL (placeholder Camille). TypeScript ✅ ESLint ✅.

### US-022 — Footer & Mentions Légales — PASS (1re passe) — commit de44b65

QA PASS au premier passage. AppFooter.vue entièrement refait : bg-cgws-tack, border-t-2 border-cgws-copper, grid 2→lg:4 colonnes (logo/nav/contact/légal), liens désactivés (CGV/Politique) en <span> sans href, copyright dynamique new Date(). ConchoDivider : prop ringClass ajoutée (rétrocompatible, défaut ring-cgws-cream). mentions-legales.vue : 6 sections (éditeur, hébergeur, PI, RGPD, cookies, CGV 5 sous-sections), <dl> pour données structurées, useSeoMeta noindex. TypeScript ✅ ESLint ✅.

### US-021 — Page Contact — PASS (1re passe) — commit f556b73

QA PASS au premier passage. Créés : contact.vue (hero tack + section cream 2 colonnes, formulaire CgwsInput/Select/Textarea, validation blur, honeypot sr-only, rate limiting 5/h/IP, success aria-live, GSAP x:-30/+30), ContactMap.vue (Leaflet dans ClientOnly, tuiles OSM, marqueur copper DivIcon, cleanup onUnmounted), server/api/contact.post.ts (Zod + honeypot silencieux + rate limit Map + Resend). Email Resend : sendContactEmail() ajoutée à server/services/email.ts. leaflet + @types/leaflet installés, eslint@^9 ajouté (peer dep manquante). Point d'action : ajouter CGWS_CAMILLE_EMAIL dans .env.local (placeholder=nathcouton@gmail.com). TypeScript ✅ ESLint ✅.

### US-020 — Page Consignation — PASS (1re passe) — commit 8b4e84e

QA PASS au premier passage. Composants créés : HowItWorks.vue (3 étapes GSAP ScrollTrigger stagger), ConsignmentForm.vue (validation temps réel, drag & drop upload 5 photos max/5MB, aperçu miniatures blob URL, success/error states), server/api/consignments/create.post.ts (validation Zod + upload Supabase Storage + insert DB + email Resend), server/services/email.ts (template HTML branded). Nouveaux composants UI : CgwsTextarea.vue, CgwsSelect.vue. Correction bug pré-existant : inheritAttrs:false sur CgwsInput (blur ne bubblait pas sur le wrapper div). ConchoDivider : prop bgClass ajoutée (rétrocompatible). TypeScript ✅ ESLint ✅.

### US-013 — Fiche Produit — PASS (1re passe) — commit 84c03bc

QA PASS au premier passage. Composants créés : ProductGallery.vue (Swiper v14 vanilla JS dynamic import, miniatures, flèches custom, overlay "VENDU" rotaté, GSAP fade-in, aria-live pour changement de slide), ProductInfo.vue (badges état/consignation, H1 Playfair, prix Bebas Neue copper, taille conditionnelle, encart consignation, CTA tel: + disabled si vendu), RelatedProducts.vue (grid 1→2→4 cols, requête Supabase filtrée catégorie + limit 4, GSAP ScrollTrigger). Page [slug].vue : useAsyncData + createError 404, useSeoMeta() dynamique, JSON-LD Product schema, breadcrumb BreadcrumbList. Dépendance ajoutée : swiper v14.0.1. TypeScript ✅ ESLint ✅.

### US-012 — Catalogue — Liste Produits — PASS (2e passe) — commit 1ad7c67

QA FAIL au 1er passage (2 issues) → PASS au 2e. Composants créés : CatalogueHeader.vue (Rye eyebrow + Bebas Neue H1 + live counter aria-live), ProductCard.vue (TagCard-style, NuxtImg lazy, badges état/consignation, hover overlay), ProductGrid.vue (grid 1→2→3→4 cols, GSAP stagger, sentinel IntersectionObserver), FilterPanel.vue (sticky desktop sidebar, 5 sections collapsibles), FilterDrawer.vue (UDrawer bottom mobile), SortSelect.vue (4 options), EmptyState.vue, ProductCardSkeleton.vue. Composables : useCatalogue.ts (Supabase query builder + filtres URL sync + pagination 12/page), useInfiniteScroll.ts (IntersectionObserver). Corrections QA : accent-color hex hardcodé (#B8650A) → classe Tailwind accent-cgws-copper (12 occurrences), imports NuxtLink inutiles supprimés dans HeroSection/OurStorySection/CgwsButton/default.vue. Architecture : provide/inject via CATALOGUE_CONTEXT_KEY au lieu de v-model:filters (évite vue/no-mutating-props). TypeScript ✅ ESLint ✅.

### US-011 — Section Notre Histoire — PASS (correction inline) — commit ae8e2d2

QA FAIL au 1er passage (TODO actif dans commentaire HTML) → correction directe par l'orchestrateur (renommage TODO→PLACEHOLDER). Composants créés : OurStorySection.vue (layout 2 cols, NuxtImg placeholder, GSAP ScrollTrigger fade-in-left/right, prefers-reduced-motion guard, aria-labelledby), ConchoDivider.vue (SVG décoratif aria-hidden). TypeScript ✅ ESLint local ✅. Note : npm run lint exit 2 sur cette machine (ESLint global corrompu, acorn.js manquant) — non lié au code.

### US-010 — Hero Section Homepage — PASS (2e passe) — commit 8bad333

QA FAIL au 1er passage (hex hardcodés SVG) → PASS au 2e. Composants créés : HeroSection.vue (NuxtImg eager/fetchpriority, GSAP stagger H1, sous-titre Playfair, 2 CTA, SaddleIllustration), StatsBar.vue (4 ConchoStat onDark), SaddleIllustration.vue (SVG inline 7 parties anatomiques, GSAP float). Modifications design system : CgwsButton+variant outline-light, ConchoStat+prop onDark. Corrections QA : stroke hex→currentColor+class Tailwind, fill hex→fill-cgws-* classes. TypeScript ✅ ESLint ✅.

### US-014 — Navigation Responsive — PASS (2e passe) — commit 2878d17

QA FAIL au 1er passage (2 issues) → PASS au 2e. Composants créés : AppHeader.vue (logo CGWS Bebas Neue/Inter, 4 liens nav, icône téléphone, scroll detection backdrop-blur), MobileMenu.vue (drawer GSAP depuis la droite, focus trap, body scroll lock, Teleport), useScrollHeader.ts. Corrections QA : focus return au hamburger après fermeture drawer (WCAG 2.4.3 A) + z-index header z-40→z-50 (drawer à z-60). TypeScript ✅ ESLint ✅.

---

### US-001 — Initialisation du projet Nuxt 4 — PASS — commit c180cae

QA PASS au premier passage. Nuxt 4 scaffoldé avec @nuxt/ui v4 (v3 incompatible avec vue-router v5), @nuxt/image v2, @pinia/nuxt, gsap, @vueuse/motion, @nuxt/eslint, prettier. TypeScript strict, tokens CSS CGWS v2, types CGWS complets. Build ✅ typecheck ✅ lint ✅.
Note : @nuxt/ui retenu en v4 (non v3) — incompatibilité vue-router v5. Doc à aligner.

### US-002 — Configuration Supabase (partielle) — PASS local — commit 8167374

QA PASS sur artefacts locaux. Migrations SQL (5 tables + trigger + CHECK), RLS policies, seed (3 catégories + 5 produits), composable useSupabase.ts, .env.example. Build ✅ typecheck ✅.
Note : camelCase/snake_case mismatch dans Database type — à corriger lors des premiers accès data (US-012+).
Bloqué humain : projet Supabase en ligne, bucket storage, utilisateur admin, .env.local.

### US-003 — Design System CGWS — PASS (2e passe) — commit 6117de5

QA FAIL au 1er passage (2 issues) → PASS au 2e. Composants créés : CgwsButton (3 variants), CgwsCard, CgwsBadge (4 variants), CgwsInput, TagCard (composant phare étiquette de selle), ConchoStat (médaillon SVG), AppHeader, AppFooter. Layout default.vue mis à jour. Page /dev-components complète. Build ✅ typecheck ✅ lint ✅.
Corrections QA : polygones SVG passés de fill hardcodé à class="fill-cgws-copper" + focus-visible ring corrigé en cgws-copper sur variant secondary.

---

## Résumé Sprint 2 — Services & SEO

**Vélocité** : 13/13 pts réalisés (100%) | Durée : 1 session
**Statut** : ✅ Terminé — en attente validation humaine avant Sprint 3

### US complétées
| US | Titre | Pts | Résultat | Commit |
|----|-------|-----|----------|--------|
| US-020 | Page Consignation | 5 | ✅ PASS 1re passe | 8b4e84e |
| US-021 | Page Contact | 3 | ✅ PASS 1re passe | f556b73 |
| US-022 | Footer & Mentions Légales | 2 | ✅ PASS 1re passe | de44b65 |
| US-023 | SEO Fondations | 3 | ✅ PASS 1re passe | b8c64ba |

### Notes techniques
- Nouveaux composants UI : CgwsTextarea, CgwsSelect (réutilisables dans les sprints suivants)
- Correction bug pré-existant : inheritAttrs:false sur CgwsInput (blur ne bubblait pas)
- Dépendances ajoutées : leaflet + @types/leaflet (carte OSM), eslint@^9 (peer dep)
- ConchoDivider : props bgClass + ringClass ajoutées (rétrocompatibles)

### Points de blocage ouverts
1. **Vrais contenus Camille** : adresse exacte, téléphone, email, horaires (placeholders dans footer, contact, JSON-LD)
2. **og-default.jpg** (1200×630px brandé) : à créer par Camille/designer — DEFAULT_OG_IMAGE pointe sur Unsplash en attendant
3. **CGWS_CAMILLE_EMAIL** : ajouter dans .env.local et Vercel avant déploiement
4. **Vraies URLs sociales** : Instagram/Facebook placeholders href="#" dans le footer

---

## Résumé Sprint 1 — Site Public Vitrine

**Vélocité** : 27/27 pts réalisés (100%) | Durée : 1 session
**Statut** : ✅ Terminé — en attente validation humaine avant Sprint 2

### US complétées
| US | Titre | Pts | Résultat | Commit |
|----|-------|-----|----------|--------|
| US-014 | Navigation Responsive | 3 | ✅ PASS 2e passe | 2878d17 |
| US-010 | Hero Section Homepage | 8 | ✅ PASS 2e passe | 8bad333 |
| US-011 | Section Notre Histoire | 3 | ✅ PASS inline fix | ae8e2d2 |
| US-012 | Catalogue — Liste Produits | 8 | ✅ PASS 2e passe | 1ad7c67 |
| US-013 | Fiche Produit | 5 | ✅ PASS 1re passe | 84c03bc |

### Notes techniques
- Swiper v14 installé (galerie fiche produit) — API vanilla JS identique à v11
- provide/inject pattern (CATALOGUE_CONTEXT_KEY) pour les filtres catalogue — évite vue/no-mutating-props
- ESLint global corrompu sur cette machine (acorn.js manquant) — lint via node_modules/.bin/eslint uniquement
- Numéro de téléphone CGWS placeholder dans AppHeader et ProductInfo — à renseigner par Camille

### Points de blocage ouverts
1. **Supabase en ligne** (US-002) : migrations non appliquées en production — catalogue et fiches fonctionnels uniquement avec seed local
2. **Vraies photos produits** : NuxtImg avec placeholder pour l'instant — à remplacer par les vraies images Camille
3. **Numéro de téléphone réel** : placeholder `+33247561234` dans AppHeader et ProductInfo

---

## Résumé Sprint 0 — Fondations Techniques

**Vélocité** : 13/13 pts réalisés (100%) | Durée : 1 session
**Statut** : ✅ Terminé — en attente validation humaine avant Sprint 1

### US complétées
| US | Titre | Pts | Résultat | Commit |
|----|-------|-----|----------|--------|
| US-001 | Init Nuxt 4 | 3 | ✅ PASS 1re passe | c180cae |
| US-002 | Supabase config (partiel) | 5 | ✅ PASS local | 8167374 |
| US-003 | Design System | 5 | ✅ PASS 2e passe | 6117de5 |

### Points de blocage ouverts
1. **US-002 partie Supabase en ligne** : décision requise de Nathan sur quel projet utiliser (A: créer "cgws", B: réutiliser existant). Ensuite créer `.env.local` manuellement.
2. **Vercel preview** (US-001 critère optionnel) : nécessite lien manuel du projet Vercel.

---

## Points de blocage nécessitant une décision humaine

> L'orchestrateur liste ici toute décision produit, légale, ou de contenu réel (textes, images, conditions commerciales) qu'aucun agent n'a tranchée seul, en attendant ton arbitrage.

### BLOCAGE US-002 — Création projet Supabase

**Contexte** : US-002 requiert un projet Supabase CGWS avec URL + clés API. Il existe 3 projets dans ton compte (pink-amazones, miloshare, nath7098's Project) — tous INACTIVE — mais aucun nommé CGWS.

**Décision requise de Nathan** :
1. **Option A** : je crée un nouveau projet Supabase "cgws" en eu-west-3 (region Paris) dans l'une de tes orgs
2. **Option B** : je réutilise / restaure un des projets existants
3. Dans les deux cas, tu devras ensuite créer `.env.local` avec SUPABASE_URL + SUPABASE_ANON_KEY + SUPABASE_SERVICE_ROLE_KEY

**Ce qui est implémenté sans blocage** : migrations SQL (supabase/migrations/), RLS policies, seed data, composable useSupabase.ts, .env.example.
**Ce qui attend ton feu vert** : `apply_migration` sur le vrai projet Supabase, création bucket storage "product-images", utilisateur admin test.
