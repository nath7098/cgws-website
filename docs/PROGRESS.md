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
| Sprint 4 | Terminé ✅ | 4/4 | 23/23 |
| Sprint 5 | Terminé ✅ | 4/4 | 21/21 |
| Sprint 6 | Terminé ✅ | 6/6 | ~31/~31 |
| Sprint 7 | Terminé ✅ | 2/2 | 16/16 |

---

## Sprint 7 — Features post-refonte (terminé ✅)

**Objectif** : features repoussées après le pivot v3 — **US-066 espace déposant** (magic link, lecture seule) + **US-063 import CSV produits** (dry-run/preview obligatoire). Branche `feature/sprint-7` (créée depuis `develop` après merge du Sprint 6, PR #5). Ordre : US-066 d'abord (traite tôt l'isolation sécurité déposant), puis US-063. Branche **rebasée sur `develop`** (2026-07-05) pour récupérer les commits Notion (workflow d'issues) ; conflit `package-lock.json` résolu par régénération `npm install` (papaparse + deps Notion coexistent).
**Décisions Nathan** (2026-07-04) : (1) **code-only + flag** — le code est bâti contre le schéma/composables existants, la validation e2e et le go-live restent bloqués par Supabase live (US-002) ; (2) **CSV format canonique** (titre, categorie, marque, description, prix, etat, taille, stock ; UTF-8 ; virgule) — à confirmer avec Camille si gabarit existant ; (3) **déposant vendu** : voit prix de vente + **montant net à reverser** (= prix − commission), jamais notes internes ni commission détaillée.

### US-066 — Espace déposant (magic link, lecture seule) — PASS (1re passe) — commit 6969d8e

QA PASS au premier passage (US à forte composante **sécurité**). Spec `docs/design-specs/US-066-espace-deposant.md`. Commit final rebasé : `9fbe624`. Flux : `useDepositorAuth` (`signInWithOtp`, **`shouldCreateUser:false`** = pas de création de compte + pas d'email vers adresse inconnue), pages `espace-deposant/` (index demande de lien, callback gérant PKCE/`token_hash`/implicit, suivi lecture seule protégé par `middleware/depositor.ts` SSR-safe sans flash), route serveur `server/api/depositor/consignments.get.ts`. **Isolation double-barrière validée QA** : JWT vérifié via `getUser(token)` avant toute lecture → filtre `depositor_email` dérivé EXCLUSIVEMENT du token (jamais d'un param client), `.ilike` avec échappement `%`/`_`/`\` **+** second filtre applicatif JS ; `getAdminSupabase()` service role sans ouvrir de policy RLS publique. **Aucune fuite** : `DepositorConsignmentView` exclut structurellement `notes` internes et commission brute ; **net à reverser calculé côté serveur** (prix − `commission_amount` réel, fallback 20%), aucun taux en dur côté client. **Anti-énumération** : message succès neutre identique email connu/inconnu. **Lecture seule** stricte (aucune mutation, `role="group"`). Composants : `ConsignmentTrackingCard` (nouveau), `CgwsBadge` étendu (prop `label` + variants `pending`/`accepted`, non régressif), `app/utils/consignment.ts` (factorise `CONSIGNMENT_STATUS_LABELS`). vue-tsc ✅ ESLint ✅ build EXIT 0 ✅. **Nécessite Supabase live pour validation e2e** (bloqué US-002) : envoi réel du magic link, pose de session OTP réelle, expiration/réutilisation du lien, `getUser` runtime. **Observations mineures non bloquantes** : duplication résiduelle de `CONSIGNMENT_STATUS_LABELS` côté admin (factorisation admin repoussée) ; N+1 products/sales par consignation vendue (volume faible attendu) ; 2 entrées `ERROR_MESSAGES` rate-limit inatteignables (code mort, comportement anti-énumération correct).

### US-063 — Import CSV produits en masse (admin) — PASS (1re passe) — commit 7b31abb

QA PASS au premier passage. Spec `docs/design-specs/US-063-import-csv.md`. **Architecture stateless deux étapes** compatible serverless Nitro/Vercel : preview (dry-run) → confirm (renvoi du JSON validé, jamais de re-upload ni de session serveur). **Source de vérité unique partagée** `shared/utils/csvImport.ts` (importable via `#shared/utils/csvImport` côté app ET serveur) : limites (2 Mo / 500 lignes), value sets `PRODUCT_CATEGORIES`/`PRODUCT_CONDITIONS` (dont dérivent désormais les unions `app/types/index.ts`, plus de divergence possible), alias FR d'état (`neuf`/`bon`/`correct`), validation Zod-free pure `validateCsvRow`, `slugifyForImport` miroir du `slugify` serveur. **Preview** (`server/api/admin/products/import/preview.post.ts`) : `requireAdminAuth` d'abord, `TextDecoder('utf-8',{fatal:true})` pour rejeter le non-UTF-8, papaparse chargé via `createRequire` (bundle UMD non inlinable par Rollup, même pattern que pdfmake), **aucune écriture DB** (seul un `SELECT` de contrôle doublons), motifs d'erreur au mot près des exemples Gherkin, détection doublons slug intra-fichier ("avec la ligne X") **et** contre la base. **Confirm** (`confirm.post.ts`) : re-validation Zod du tableau `validRows` (jamais confiance au client), insert ligne par ligne, `is_consignment:false`/`images:[]`/`status:active`, **contrainte UNIQUE Postgres comme arbitre** (pas de `generateUniqueSlug` auto-suffixant qui masquerait le conflit) → sur `23505` la ligne part en `failed`, les autres sont créées (pas d'échec global — exigé par le Gherkin). UI : `import.vue` + `CsvDropzone` (drag&drop clavier, garde-fous client extension/taille/lignes avant réseau) + `ImportPreviewTable` (table desktop / cartes mobile, statut porté par icône+texte+couleur). Lien résultat `/admin/produits?ids=…` scopant le lot importé (`index.get.ts` filtre `ids`, bannière dédiée dans `produits/index.vue`). vue-tsc ✅ ESLint (fichiers US) ✅ build EXIT 0 ✅. **Nécessite Supabase live pour validation e2e** (bloqué US-002) : upload effectif, insert réel, déclenchement réel de la contrainte UNIQUE en concurrence. **Observations mineures non bloquantes** : ordre d'énumération des colonnes manquantes suit `REQUIRED_CSV_COLUMNS` (cosmétique) ; lint global du repo signale 1 erreur préexistante hors périmètre dans `scripts/sync-to-github.cjs` (commit Notion de `develop`, `err` inutilisé — non traité ici).

---

## Résumé Sprint 7 — Features post-refonte

**Vélocité** : 16/16 pts réalisés (100%) | **Statut** : ✅ Terminé — en attente validation humaine (mode checkpoint) et ouverture Supabase live (US-002) pour recette e2e + go-live.

### US complétées
| US | Titre | Résultat | Commit |
|----|-------|----------|--------|
| US-066 | Espace déposant (magic link, lecture seule) | ✅ PASS 1re passe | 9fbe624 |
| US-063 | Import CSV produits en masse (admin) | ✅ PASS 1re passe | 7b31abb |

### Dépendance bloquante commune (non imputable au sprint)
Les deux US sont **code-complete + QA PASS statique** mais leur **validation end-to-end réelle et le go-live restent bloqués par l'absence de projet Supabase actif (US-002)** : envoi effectif du magic link + pose de session OTP (US-066), upload/insert réel + contrainte UNIQUE en concurrence (US-063). Décision Nathan requise sur le projet Supabase à utiliser.

### Prochaines étapes
- Décision Nathan : ouvrir Supabase live (US-002) → recette e2e des deux US.
- PR `feature/sprint-7` → `develop` puis `develop` → `main` (déclenche déploiement Vercel).

---

## Journal détaillé

> Format ajouté par l'orchestrateur à chaque US :
> `### US-XXX — [titre] — [PASS/FAIL→fix→PASS] — commit [hash court]`
> suivi d'une ligne de résumé QA et d'un éventuel point de blocage signalé à Nathan.

---

## Sprint 6 — Refonte identité « CGWS v3 — Cowgirl élégante »

**Objectif** : rebranding bi-thème (peaux **Élégante** rose/crème + **Rugueux** cuir/laiton, switcher public), dérivé du nouveau logo (cavalière de reining). Typo Playfair/Rye, motifs étoile-boussole. Décidé avec Nathan de faire la refonte identité en Sprint 6, puis les features (espace déposant + import CSV) en Sprint 7.
**Specs** : `docs/design-specs/DESIGN_SYSTEM_v3.md` (doc maître) + US-070/071/072 + `US-073-homepage.md` + `US-074-catalogue-fiche.md` + `US-075-services-header-footer-admin.md`, produits par `ux-designer`.

---

## Résumé Sprint 6 — Refonte identité « CGWS v3 — Cowgirl élégante »

**Vélocité** : ~31/~31 pts réalisés (100%) | **Statut** : ✅ Terminé — en attente validation humaine (mode checkpoint) avant Sprint 7.

### US complétées
| US | Titre | Résultat | Commit |
|----|-------|----------|--------|
| US-070 | Design System v3 — fondations bi-thème | ✅ PASS 2e passe | ac25119 (+ fix e9eee01) |
| US-071 | Switcher de thème public/admin | ✅ PASS 1re passe | 9b16ffe |
| US-072 | Composants signature (étoile-boussole, filigranes, boutons/badges danger) | ✅ PASS 1re passe | a2efc72 |
| US-073 | Refonte Homepage | ✅ PASS 1re passe | 293e83c |
| US-074 | Refonte Catalogue + Fiche produit | ✅ PASS 1re passe | 032f12f |
| US-075 | Services/Contact/Header/Footer + cohérence Admin | ✅ PASS 1re passe | 9852d59 |

**Qualité** : 5 US sur 6 en PASS 1re passe (seule US-070 a nécessité une 2e passe, avant cette session). Aucune boucle de correction pour US-072→075. vue-tsc / ESLint / build EXIT 0 vérifiés à chaque US.

### Réalisations clés de la session
- **Système bi-peaux × 3 rendus** (`elegante-jour`, `elegante-nuit`, `rugueux`) désormais appliqué à TOUT le site public ET l'admin — plus aucun bandeau/panneau à couleur figée.
- **Composants signature v3** : `StarDivider` (remplace ConchoDivider+ConchoStat), `FiligreeCorner`, re-skin TagCard/CgwsButton(+`destructive`)/CgwsBadge(+`reserved`,+`rejected`).
- **Régressions theme-aware corrigées au passage** (au-delà du périmètre re-skin, trouvées par audit ux-designer) : 58 `bg-white` figés dans l'admin, ruban « Réservé » à tort en `danger` (violation taxonomie §4.1), hex v2 résiduels (SaddleIllustration, ContactMap), focus ring offset footer calé sur fond sombre fixe, 4 mappings de statut divergents unifiés.
- **Discipline de contraste** : chaque paire texte lisible recalculée et validée AA dans les 3 rendus ; règle décoratif (`accent-deco`) vs lisible (`accent`/`danger`) tenue partout.

### Points produit à confirmer par Nathan/Camille (non bloquants — défauts raisonnables déjà appliqués)
1. **Asset logo / illustration définitif** : `SaddleIllustration.vue` (selle statique v2) recolorée à titre conservatoire — alignement avec le nouveau logo « cavalière de reining » à trancher (nouvel asset ? conserver ?). Idem logo texte header (`text-cgws-accent`) vs logo image fourni par le rebranding.
2. **`success`/`warning` Nuxt UI natif vs tokens CGWS pour l'admin** : ux-designer a délibérément écarté les couleurs sémantiques natives Nuxt UI (non liées aux tokens de peau → non theme-aware) au profit des tokens CGWS `success`/`danger`/`accent`. Choix techniquement fondé mais à valider.
3. **`KpiCard` variant `warning`** remappé `danger`→`accent` : à confirmer que le sens visuel « alerte douce » reste satisfaisant.
4. **Header + footer sur `surface`** (bande chrome distincte) plutôt que `ground` : tranché par la spec, à valider visuellement en recette.
5. **Libellé CTA fiche produit si statut `reserved`** (« Réservé — nous contacter » ?) et **comportement fiche `inactive`** accessible par URL directe (404 ? masquage ?) — décisions métier laissées ouvertes.
6. **Détails cosmétiques reportés** (non bloquants) : `RevenueChart.vue` couleurs Chart.js non theme-aware ; boutons « Supprimer définitivement » (modale produit) et « Enregistrer la vente » encore en `<button>` brut au lieu de `CgwsButton` ; cible tactile bouton switcher compact 36px.

### Points de blocage hérités toujours ouverts (rappel, non traités ce sprint car hors périmètre design)
- **Supabase en ligne** (US-002) : migrations non appliquées en prod.
- **Vrais contenus Camille** : textes, photos, coordonnées, CGV, SIRET, vrais prix.
- **Scores Lighthouse réels** : mesurables seulement après déploiement Vercel prod.
- **Secrets GitHub** (`SUPABASE_URL`/`SUPABASE_ANON_KEY`) pour le CI E2E.

### Recette humaine recommandée avant Sprint 7
Lancer `npm run dev` et parcourir visuellement chaque écran (public : home, catalogue, fiche, consignation, contact, mentions ; admin : login, dashboard, produits, catégories, consignations, ventes, clients, rapports) en basculant les **3 rendus** via le switcher, pour valider l'esthétique et les points produit ci-dessus — la QA automatisée couvre les tokens/contrastes/build mais pas le jugement esthétique final.

### US-075 — Services/Contact/Header/Footer + cohérence Admin v3 — PASS (1re passe) — commit 9852d59

QA PASS au premier passage. Plus large US du sprint. Spec `docs/design-specs/US-075-services-header-footer-admin.md` (ux-designer, 3 blocs, audit code exhaustif). **31 fichiers.**
**Bloc A (header/footer/menu theme-aware, décision client §8.1)** : `AppHeader`/`AppFooter` abandonnent le bandeau sombre fixe `bg-cgws-tack` → `bg-cgws-surface` (défaut + scrolled `surface/90 backdrop-blur`, mécanique `useScrollHeader` intacte) ; logo `text-cgws-accent`, liens `text-cgws-ink-soft hover:text-cgws-accent`, bordure header `hairline`, footer `border-t-2 border-cgws-accent-deco`. **Fix focus ring offset critique** : 9 occurrences `ring-offset-cgws-tack`/`-ground` → `ring-offset-cgws-surface` (sinon offset sombre sur footer clair en Jour). `MobileMenu` reste `bg-cgws-ground` (convention drawer), backdrop `brand-espresso/60`→`ink/60`. `ThemeSwitcher` : **nouvelle variante `layout="compact"`** (icône-seule bascule peau) + garde `v-if="skin==='elegante' && !colorMode?.forced"` sur le `<ClientOnly>` jour/nuit (points US-071 reportés, réglés).
**Bloc B (contact)** : `ContactMap.vue` 4 hex v2 en dur → `var(--cgws-*)` (marker `accent-deco`, halo `ground`, popup `ink`/`ink-soft`) + override popup Leaflet theme-aware dans `main.css` (élimine le flash blanc en Nuit/Rugueux) ; `contact.vue` cadre `border-edge`.
**Bloc C (admin — switcher dispo, pas de peau figée, décision client §8.1)** : `admin.vue` sidebar/topbar plus figées (`bg-cgws-tack`/`bg-cgws-parchment` → theme-aware), `ThemeSwitcher` intégré topbar avec **2 wrappers `flex sm:hidden`(compact) / `hidden sm:flex`(inline)** mutuellement exclusifs (corrige le `hidden sm:flex` qui masquait totalement le switcher admin mobile). **58 `bg-white`→`bg-cgws-surface`** sur 22 fichiers (bien plus que les ~35 estimés — vraie régression theme-aware : panneaux blancs figés quelle que soit la peau) + 8 spinners `border-white`→`border-current`, 0 résiduel vérifié QA. `RejectModal` : bouton confirmation → `CgwsButton variant="destructive"` (fin des classes `bg-cgws-rust`/`text-white`/`hover:bg-cgws-charcoal` en dur), icône/astérisque/bordure `danger`. **Mapping statut→couleur canonique §C.11** unifié sur 4 fichiers divergents (`StatusDropdown`/`consignations/index`/`RecentActivity`/`CgwsBadge`) : `success` accepted/active, `danger` PLEIN rejected/returned, `accent` plein sold, neutre pending/reserved/inactive — **aucune couleur Nuxt UI native `success`/`warning` introduite** (elles ne sont pas liées aux tokens de peau dans `app.config.ts` → ne seraient pas theme-aware ; décision ux-designer justifiée, à confirmer PO non bloquant). `KpiCard` warning `danger`→`accent` + `tabular-nums`. `RevenueChart.vue` NON traité (hors périmètre, couleurs Chart.js statiques — arbitrage technique ultérieur). Contrastes QA sur `surface` : Jour `ink` 12.7 / `ink-soft` 7.0 / `accent` 5.05, Rugueux `accent` 5.34, pilule neutre 6.34 — tous AA. vue-tsc ✅ ESLint ✅ build EXIT 0 ✅.
**Observations mineures non bloquantes (QA)** : bouton « Supprimer définitivement » de la modale produit (`produits/index.vue`) et bouton « Enregistrer la vente » (`SaleModal`/`SaleForm`) restent des `<button>` bruts au lieu de `CgwsButton` (recommandé non bloquant, spinners déjà `border-current`). Cible tactile du bouton compact 36px (<44px, identique au toggle existant, ajustement transversal futur).

### US-074 — Refonte Catalogue + Fiche produit v3 — PASS (1re passe) — commit 032f12f

QA PASS au premier passage. Spec détaillée `docs/design-specs/US-074-catalogue-fiche.md` (ux-designer, audit ligne par ligne du code existant). 9 composants re-skinés + `CgwsBadge`. **Violation taxonomie §4.1 corrigée** : ruban diagonal « Réservé » de `ProductCard.vue` était en `bg-cgws-danger/90` (danger = refus/destructif UNIQUEMENT) → `bg-cgws-ink-soft/90 text-cgws-ground` neutre. **Nouveau variant `reserved`** sur `CgwsBadge` (neutre `surface-2`/`ink-soft`/`hairline`) intégré à `ProductInfo.vue` qui ne gérait PAS ce statut (fiche affichait CTA actif comme si dispo → incohérence grille/fiche comblée) ; mapping statut→badge complet et cohérent des deux côtés. `tabular-nums` ajouté aux 3 prix (ProductCard ×2 + ProductInfo). **Point critique a11y respecté** : chips/comptages de filtre actifs, `accent-color` natif, vignettes galerie sélectionnées = indicateurs FONCTIONNELS en `accent` (jamais `accent-deco`) — vérifié, verrouillé. **Focus rings Nuxt UI natifs** (`USlider` FilterPanel+FilterDrawer, `USelect` SortSelect) migrés de la palette « stone » par défaut → `accent` via `:ui` (pattern MCP nuxt-ui confirmé, override `ring-primary`/`ring-inverted`). `CatalogueHeader` H1 « Catalogue » (1 mot ≤4) `font-display`→`font-heading` Rye + `text-cgws-heading` + 2 `FiligreeCorner` opposés `opacity-40`. `ProductGallery` cadre `border-edge`, overlay VENDU + `aria-live` préservés. `EmptyState` CTA `ghost`. `StarDivider` déjà présent au-dessus de RelatedProducts. Bonus a11y : `aria-controls`/`role="region"` sur les 5 accordéons FilterDrawer (ids préfixés `drawer-`). Contrastes recalculés QA : badge comptage `accent`/`accent/10` composité 4.89/5.85/5.27 (AA les 3), badge `reserved` `ink-soft`/`surface-2` 6.34/6.13/4.94, ruban réservé `ground`/`ink-soft` 7.78:1, H1 `heading`/`ground` 5.79:1+ — tous ≥ seuil. GSAP préservé (stagger/ScrollTrigger/fade, cleanup, guard reduced-motion). vue-tsc ✅ ESLint ✅ build EXIT 0 ✅. **Points produit non bloquants (à trancher Nathan/Camille)** : libellé CTA fiche si `reserved` (« Réservé — nous contacter » ?), comportement fiche `inactive` accessible par URL directe (404 ? masquage ?), dette archi `ProductCard`/`TagCard` dupliqués (non fusionnés, hors scope re-skin).

### US-073 — Refonte Homepage v3 — PASS (1re passe) — commit 293e83c

QA PASS au premier passage. Spec détaillée produite par ux-designer (`docs/design-specs/US-073-homepage.md`) sur le modèle US-072. Re-skin des 5 fichiers home : `index.vue` (2 `StarDivider` ajoutés → 3 diviseurs total), `HeroSection.vue` (H1 `font-bold` — `font-display` ne pilotait que la famille Playfair pas le 700 ; arche fine ornementale SVG `stroke accent-deco` autour du bloc eyebrow+H1, marge `mt-6`≥24px, `aria-hidden` ; scrim+textes Hero conservés en **littéraux marque fixes** `brand-espresso`/`brand-cream`/`brand-sand`, NON theme-aware par décision §1.3 car illisibles en Jour clair sinon), `OurStorySection.vue` (barre verticale déco `bg-cgws-accent`→`accent-deco`, arche quart d'arc portrait), `StatsBar.vue` (2 `FiligreeCorner` coins diagonalement opposés `opacity-40`, max 2/viewport), `SaddleIllustration.vue` (dégradé radial hex v2 résiduels `#C8AB82`/`#7B3B1C`→`var(--cgws-surface-2)`/`var(--cgws-edge)`, éléments déco médaillon/tooling/coiffe/étriers `accent`→`accent-deco`, `brand-tack` conservé §2.5). Contrastes recontrôlés QA : H1 `brand-cream`/`brand-espresso` 14.08:1, eyebrow/tagline `brand-sand`/`brand-espresso` 7.66:1, corps `ink`/`ground` AAA, CTA `on-accent`/`accent` 5.70–6.88:1 — tous AA/AAA. GSAP préservé (sélecteurs `.hero-eyebrow`/`.hero-letter` toujours atteignables sous le wrapper d'arche, cleanup `onUnmounted`, guard `prefers-reduced-motion`). vue-tsc ✅ ESLint ✅ build EXIT 0 ✅. **Interruption** : sous-agent dev coupé par limite de session à mi-parcours (seul `index.vue` fait), repris via SendMessage avec contexte intact → complété. **Points produit non bloquants (à trancher Nathan/Camille)** : (1) `SaddleIllustration` = selle statique v2 recolorée à titre conservatoire, alignement narratif avec le logo « cavalière de reining » à décider ; (2) arche portrait OurStory optionnelle, à réévaluer une fois la vraie photo de Camille livrée. **Renvoyé US-075** : `AppHeader`/`AppFooter` theme-aware (hors périmètre US-073).

### US-072 — Composants signature v3 — PASS (1re passe) — commit a2efc72

QA PASS au premier passage. Livré : `StarDivider.vue` (nouveau, variantes `divider`/`stat`, étoile-boussole 8 branches `fill accent-deco` décoratif, valeur stat `text-cgws-accent tabular-nums` lisible, compteur GSAP `onMounted`+cleanup `onUnmounted`, skeleton sans valeur, a11y `aria-hidden` divider / `role="img"`+`aria-label` stat) qui **remplace et supprime** `ConchoDivider.vue`+`ConchoStat.vue` (aucune référence orpheline — 9 fichiers consommateurs migrés : ProductGrid, StatsBar, AppFooter, index/consignation/contact/catalogue×2/dev-components). `FiligreeCorner.vue` (nouveau, SVG décoratif `stroke accent-deco`/`fill:none`, `aria-hidden`, opacité 40/50/60 — intégration pages reportée US-073/074/075). Re-skins : `TagCard` (prix `accent tabular-nums` vs copper v2, image manquante `surface-2`+icône `edge/40`, focus `ring-accent`), `CgwsButton` (+variant `destructive` danger/on-danger, primary nettoyé des corrections ad hoc v2), `CgwsBadge` (+variant `rejected` danger plein, `consignment` theme-aware via nouveau `@custom-variant rugueux` Tailwind v4 — `brand-blush` Élégante → `accent/15` Rugueux, `occasion` reste neutre). CgwsInput/Textarea/Select déjà en `danger` depuis US-070 (conformes §6.1). **Bug-catch dev validé QA** : le badge consignation `text-cgws-ink` littéral de la spec §6 aurait donné 1.31:1 en Élégante Nuit (`brand-blush` non theme-aware) → corrigé en `text-cgws-brand-espresso` (10.26:1 Jour+Nuit, autorisé §2.5), Rugueux `ink`/`accent@15%` composité 9.46:1. Contrastes recalculés QA indépendamment : `ink`/`surface` 12.69/12.34/11.89, `accent`/`surface` (prix) 5.05/5.98/5.34 — tous AA. vue-tsc ✅ ESLint ✅ build EXIT 0 ✅. **Points mineurs non bloquants (repoussés)** : (1) `CgwsButton` L24 `rounded-sm` statique au lieu de `rounded-[--ui-radius]` (perd la différenciation de rayon par peau §5 — à corriger avant que d'autres composants répliquent l'oubli) ; (2) variant `destructive` réutilise l'échelle générique `size` au lieu du gabarit dédié `px-5 py-2 text-sm` de la spec (cosmétique). **Exclus du périmètre (US-073/074/075)** : Certificat élégant (§7), intégration effective FiligreeCorner/ArchFrame, variante secondary denim-en-Rugueux (marquée « à confirmer PO » dans la spec).

### US-071 — Switcher de thème public/admin — PASS (1re passe) — commit [à venir]

QA PASS au premier passage. Bascule entre les 3 rendus (elegante-jour/nuit/rugueux) pilotée par `useCgwsSkin()` (état `useState` + `localStorage['cgws-skin']` + attribut `data-skin` sur `<html>`) pour l'axe peau, et `useColorMode()` natif pour l'axe jour/nuit (masqué quand Rugueux, préférence conservée). Anti-flash SSR via `useHead({ script, tagPriority:'critical' })` dans `app.vue` (mécanisme confirmé via MCP nuxt-remote + types `unhead` : `critical = -8`). Composant `ThemeSwitcher.vue` (`role="radiogroup"`, roving tabindex, flèches, `aria-checked`/`aria-live`, `<ClientOnly>`+fallback dimensionné), intégré à `AppHeader` (desktop), `MobileMenu` (stacked) et topbar `admin.vue`. Hydratation sûre par construction (SSR rend toujours `elegante`, resync sur `app:mounted` après hydratation, `data-skin` hors arbre Vue). Contraste bouton inactif AA dans les 3 rendus (7.07/7.10/5.74:1). vue-tsc ✅ ESLint ✅ build ✅. **À corriger en US-075 (non bloquant)** : switcher masqué en topbar admin mobile (`hidden sm:flex` → variante icône-seule attendue) + ajouter garde `v-if="!colorMode?.forced"` sur le `<ClientOnly>` jour/nuit.

### US-070 — Design System v3, fondations — FAIL→fix→PASS — commit [à venir]

QA FAIL au 1er passage (statuts admin positifs `accepted`/`active` en `bg-green-*` codés en dur = non theme-aware, + `bg-cgws-heading/15` improvisé non validé AA) → PASS au 2e après ajout d'un token sémantique `success` (3 rendus, contrastes **calculés sur fond composité `/15`** : #3D5A28 Jour ajusté car la valeur claire échouait à 4.28:1, #9FC178 Nuit, #8FA85A Rugueux) + taxonomie de statuts admin figée (§4.1 du doc maître). Livré : `tokens.css` bi-peaux (rôles theme-aware `:root`/`[data-skin="elegante"].dark`/`[data-skin="rugueux"]` pour les 3 rendus), `@theme` Tailwind v4, `app.config.ts` (@nuxt/ui neutral stone), fonts (Rye + Playfair, Bebas retiré), tokens sur-mesure `danger` (#A23A47/#E0808C/#D66F3E) et `success` — tous AA-validés. Migration contextuelle de 64 fichiers (copper→`accent` texte / `accent-deco` déco selon contexte, rust→`danger`, denim→Rugueux only). vue-tsc ✅ ESLint ✅ build ✅ (EXIT 0). Périmètre respecté : switcher runtime (US-071) et re-design des composants signature (US-072) exclus. **Reste à traiter (non bloquant, repoussé US-072/075)** : aligner `reserved`/`sold` de `StatusDropdown.vue` sur la taxonomie §4.1 (aujourd'hui reserved→accent, sold→ink, hors périmètre du FAIL).

---

## Résumé Sprint 5 — Polish & Go-live

**Vélocité** : 21/21 pts réalisés (100%) | Durée : 1 session
**Statut** : ✅ Terminé — **PROJET COMPLET** 🎉

### US complétées
| US | Titre | Pts | Résultat | Commit |
|----|-------|-----|----------|--------|
| US-050 | Animations Immersives | 8 | ✅ PASS 1re passe | 5281352 |
| US-051 | Optimisation Images | 3 | ✅ PASS 1re passe | 2866991 |
| US-052 | Performance Lighthouse | 5 | ✅ PASS 1re passe | 6f3de47 |
| US-053 | Tests E2E & CI | 5 | ✅ PASS 1re passe | 16d804e |

### Notes techniques
- `app/plugins/gsap.client.ts` : registration centralisée ScrollTrigger (évite les double-registrations)
- `app/composables/useAnimation.ts` : helpers partagés (revealFrom, staggerReveal, animateCounter, parallaxScrub) avec guard prefers-reduced-motion
- Page transitions CSS `name='page'` mode `out-in` — 150ms leave / 200ms enter
- Double couche prefers-reduced-motion : CSS `@media` global + guard JS dans chaque composant GSAP
- Hero parallax désactivé sur mobile (< 768px) pour éviter le layout shift
- `useProductImage.ts` composable : extraction path Supabase Storage pour provider nuxt/image
- `vercel.json` : headers CDN Cache-Control pour assets Nuxt (immutable) et images (1 jour)
- `nitro.compressPublicAssets: { gzip: true, brotli: true }` activé
- `@playwright/test` v1.61.1 installé ; mock Supabase via `page.route('**/rest/v1/products*')`
- CI GitHub Actions : build avec secrets GitHub (pas de credentials hardcodés), artifact upload on failure
- `npm run lint` échoue car eslint global Windows cassé (acorn.js manquant) — utiliser `./node_modules/.bin/eslint` localement. À corriger : `npm uninstall -g eslint`

### Points en suspens (nécessitent Nathan)
- **Scores Lighthouse réels** : mesure uniquement possible après déploiement Vercel production
- **Supabase en ligne** : migrations non appliquées en production (blocage US-002 toujours ouvert)
- **Vrais contenus Camille** : textes, photos, coordonnées, CGV, SIRET
- **Secrets GitHub** : `SUPABASE_URL` et `SUPABASE_ANON_KEY` à ajouter dans les secrets du repo pour que le CI E2E fonctionne

---

## Résumé Sprint 4 — Backoffice Commerce

**Vélocité** : 23/23 pts réalisés (100%) | Durée : 1 session
**Statut** : ✅ Terminé — en attente validation humaine avant Sprint 5

### US complétées
| US | Titre | Pts | Résultat | Commit |
|----|-------|-----|----------|--------|
| US-040 | Gestion des Consignations | 8 | ✅ PASS 1re passe | 9f1885d |
| US-041 | Suivi des Ventes | 5 | ✅ PASS 2e passe | cf84ce9 |
| US-042 | Gestion des Clients | 5 | ✅ PASS 1re passe | 893191a |
| US-043 | Exports & Reporting | 5 | ✅ PASS 1re passe | b559c45 |

### Notes techniques
- Dépendances ajoutées : `vue-chartjs` + `chart.js` v4 (graphique CA), `pdfmake` v0.3.11 (PDF bon de dépôt)
- pdfmake configuré en `nitro.externals` pour compatibilité Vercel serverless (évite bundle size limits)
- pdfmake API v0.3.x (singleton + `createPdf()` + `.getBuffer()`) — différente de la v0.2.x documentée dans le spec
- Graphique stacked bar avec couleurs hex dans options Chart.js (exception acceptable — correspond aux tokens cgws-copper/denim du design system)
- Bouton "Bon de dépôt PDF" uniquement sur statuts `accepted`/`sold` (côté client + garde côté serveur)
- Autocomplete ClientAutocomplete : pattern ARIA combobox v1.1/v1.2 mixte (conforme au design spec)
- Bouton "+ Nouveau client" (admin/clients) sans page dédiée — hors scope US-042, à traiter si besoin

### Points de blocage ouverts
(En plus des blocages précédents — Supabase live, vrais contenus Camille)
- Aucun nouveau blocage bloquant pour Sprint 5

---

### US-043 — Exports & Reporting — PASS (1re passe) — commit b559c45

QA PASS au premier passage. Page créée : admin/rapports.vue (sélecteur de période from/to avec validation client-side validateDates(), bouton "Export CSV" avec états idle/loading/success/empty/error + auto-dismiss, `<ClientOnly>` wrapping de RevenueChart). Composant créé : RevenueChart.vue (vue-chartjs Bar stacked, copper=#B8650A pour CA propre, denim=#2C4A72 pour CA consignation, légende HTML custom bg-cgws-*, overflow-x-auto + min-w-[560px] mobile, fetch interne revenue-monthly, états loading skeleton + error). Plugin créé : chart.client.ts (registration CategoryScale/LinearScale/BarElement/Tooltip/Legend, tree-shaking). Routes serveur créées : admin/exports/sales.get.ts (CSV UTF-8 BOM + header X-Record-Count, 7 colonnes date/produit/prix_vente/type/client/commission/net_deposant, validation dates), admin/exports/consignment-receipt.get.ts (PDF pdfmake v0.3.11 singleton API, garde statut accepted/sold, contenu CGWS header + déposant + article + financier + zones signature, setUrlAccessPolicy bloque accès externes), admin/stats/revenue-monthly.get.ts (12 derniers mois agrégés, inclut mois à zéro). Fichiers modifiés : admin/consignations/[id].vue (bouton PDF dans sections accepted+sold uniquement), admin.vue (lien nav Rapports), types/index.ts (MonthlyRevenue), nuxt.config.ts (nitro.externals pdfmake). Dépendances ajoutées : vue-chartjs, chart.js v4, pdfmake v0.3.11. TypeScript ✅ ESLint ✅.

### US-042 — Gestion des Clients — PASS (1re passe) — commit 893191a

QA PASS au premier passage. Pages créées/complétées : admin/clients/index.vue (tableau desktop + cartes mobile ClientCard.vue, recherche debounce 300ms filtrée serveur sur nom+email `.ilike`, pagination serveur page/limit, animations GSAP `.client-row`), admin/clients/[id].vue (fiche avec coordonnées, historique 10 derniers achats avec products JOIN, liste consignations par depositor_email, notes éditables inline avec PUT + toast). Composant créé : ClientAutocomplete.vue (ARIA combobox pattern, debounce 300ms, ≥3 chars, navigation ↑↓ Entrée Échap, option "Créer" inline, skeleton loading). ClientAutocomplete intégré dans SaleForm.vue (v-model clientSelection, payload QuickSalePayload porte clientId+clientName). Types ajoutés : ClientWithStats, ClientPurchase, QuickSalePayload. Routes serveur : index.get (purchase aggregate COUNT+last_date via sales JOIN), [id].get (detail+purchases+consignments), [id].put (notes Zod). Lint fixes appliqués : vue/first-attribute-linebreak dans [id].vue, vue/attributes-order dans SaleForm.vue. TypeScript ✅ ESLint ✅. Note : bouton "+ Nouveau client" pointe vers /admin/clients/nouveau (hors scope US-042) — à traiter dans US dédiée.

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

---

## Épic E8 — Commerce en ligne (Panier & Paiement)

**Hors sprint · issue #2 (priorité haute) · dév sur modèle fable 5**
**Objectif** : un visiteur peut ajouter des articles au panier et payer en ligne via Stripe (livraison ou retrait boutique), en invité.

### US complétées
| US | Titre | Résultat | Commit |
|----|-------|----------|--------|
| US-080 | Panier persistant (store Pinia + drawer) | ✅ QA PASS 1re passe | _(voir branche feature/US-080)_ |
| US-081 | Checkout Stripe hébergé + orders + webhook | ✅ QA PASS 1re passe | _(voir branche feature/US-080)_ |

**Décisions produit** (arbitrées par Nathan) : Stripe Checkout hébergé (pas Elements) · livraison **+** retrait au choix · guest checkout (pas de compte) · tables `orders`/`order_items` + webhook idempotent.

**Qualité** : `vue-tsc` 0 err · `eslint` 0 err · tests unitaires panier 18/18 · invariants QA OK (prix serveur, idempotence webhook, signature raw body, RLS verrouillée, non-fuite données, SSR/hydratation, a11y contraste ≥ 4.5:1, 0 `any`).

### Points de blocage ouverts (E8)
1. **Clés Stripe absentes** : `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` à renseigner (env Vercel). Endpoint webhook : `POST /api/checkout/webhook` (événements `checkout.session.completed` + `checkout.session.expired`).
2. **Migration `004_orders.sql`** à appliquer sur le projet Supabase (dépend du blocage US-002 Supabase live ci-dessus).
3. **`SHIPPING_FLAT_RATE` = 9,90 €** : placeholder à confirmer par Camille (impossible d'inventer un tarif transporteur réel — selle 10-20 kg).
4. **Validation e2e réelle** (paiement carte test, réception webhook signé, emails Resend, rejeu webhook, concurrence) : à faire une fois Supabase + Stripe live.

**À arbitrer plus tard** (non bloquant) : réservation temporaire au panier (deux acheteurs peuvent créer chacun une commande `pending` sur la même pièce unique sans verrou — acceptable à faible trafic) ; quantité toujours = 1 par ligne (modèle pièce unique).
