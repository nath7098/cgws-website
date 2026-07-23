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

---

## US-082 — Rework E8 : Checkout Stripe embarqué + réservation des pièces uniques — PASS (2e passe)

**2026-07-08 · branche `feature/US-082-embedded-checkout` · décisions Nathan** : checkout **embarqué** (plutôt que redirection hébergée) · **tous moyens de paiement** éligibles (Dashboard-driven, plus de `payment_method_types` figé) · **réservation** des pièces uniques (correction de la double-vente actée « à arbitrer » en E8) · **livraison/adresse déléguées à Stripe** (`shipping_address_collection` + `shipping_options`).

**Architecture** : le formulaire CGWS de coordonnées/adresse/mode de réception est SUPPRIMÉ — Stripe collecte tout dans le Checkout embarqué (`ui_mode: 'embedded_page'`, monté via `@stripe/stripe-js` dans `/checkout`, `return_url` → `/checkout/success?session_id=…`). Le serveur ne reçoit plus que `{ productIds, previousOrderId? }` ; les coordonnées sont rapatriées au paiement par le webhook (`customer_details`, `collected_information.shipping_details`), d'où la migration **005** (orders `email`/`customer_name`/`fulfillment_method` nullable + `products.reserved_until`/`reserved_order_id`). Mode de réception déduit du shipping choisi dans Stripe (coût > 0 ⇒ livraison ; retrait Brèches = option 0 €).

**Réservation anti double-vente** : à la création de session, verrou atomique `active → reserved` (update conditionnel `eq status active`) + `reserved_order_id` (ne touche jamais une réservation manuelle admin) ; course perdue ⇒ rollback complet + 409. `expires_at` session 35 min aligné sur `reserved_until`. Libération sur `expired`/`async_payment_failed` (webhook) et sur retour au checkout après abandon (`previousOrderId` → release, l'acheteur ne se bloque pas lui-même).

**Fulfillment partagé** (`server/utils/fulfillment.ts`) : source de vérité unique appelée par le webhook (`completed`/`async_payment_succeeded`) ET par la landing page (`GET /api/checkout/session-status`) — reco Stripe. Idempotence conservée (update conditionnel `pending → paid`). Paiements asynchrones gérés (`completed`+`unpaid` ne fulfille pas). Produits `reserved → sold` + `sales` (CA admin) + emails, comme avant.

**QA** : FAIL 1re passe (bloquant : insert `order_items` perdu à la réécriture de `session.post.ts` → fulfillment à vide, produits bloqués `reserved`, aucune vente/email ; + code mort `reservedIds`) → fix → **PASS 2e passe**. vue-tsc 0 err · ESLint 0 err · tests unitaires 18/18 · build EXIT 0 · 0 `any`.

**Fichiers** : migration `005_orders_reservation.sql` ; `server/utils/fulfillment.ts` (nouveau) ; `server/api/checkout/{session.post,webhook.post,session-status.get}.ts` ; `server/api/orders/[id].get.ts` (null-safe) ; `app/composables/useCheckout.ts` ; `app/pages/checkout/{index,success}.vue` ; `app/stores/cart.ts` (`pendingOrderId`) ; `app/types/index.ts` ; `nuxt.config.ts` (+`public.stripePublishableKey`) ; dépendance `@stripe/stripe-js@8`.

**Actions requises avant mise en service** (Nathan) :
1. Appliquer la migration `005_orders_reservation.sql` sur le projet Supabase prod.
2. Ajouter `NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_…) en env Vercel.
3. Mettre à jour l'endpoint webhook Stripe : ajouter les événements `checkout.session.async_payment_succeeded` + `checkout.session.async_payment_failed` (en plus de `completed`/`expired`).
4. Test e2e en mode test Stripe (compte « environnement de test cgws » connecté au MCP) : carte 4242…, vérif produit `reserved→sold`, ligne `sales`, emails.

**Non bloquant, acté** : `GET /api/orders/[id]` orphelin côté front (conservé) ; `previousOrderId` non authentifié (UUID non devinable, risque faible, cohérent avec le modèle de sécurité existant) ; `SHIPPING_FLAT_RATE` 9,90 € toujours placeholder Camille.

---

## US-082 — Recette prod & correctifs (2026-07-09/10)

Recette e2e réelle par Nathan sur https://cgws.vercel.app (mode test Stripe). **Checkout embarqué, réservation, webhook et fulfillment validés en conditions réelles.** Quatre problèmes trouvés et corrigés dans la foulée (boucle dev/QA à chaque fois) :

1. **Link imposé + modal d'identité intempestive** → Link désactivé dans la configuration des moyens de paiement du compte Stripe (`payment_method_configurations`, `link → off`, via API — le MCP Stripe n'expose pas cette ressource). Effet immédiat.
2. **Emails Resend jamais envoyés — cause 1 (observabilité)** : le SDK Resend ne throw pas (`{ data, error }` ignoré) → échecs 100 % silencieux. Fix commit `f46cd12` : helper `sendViaResend` loggant chaque envoi (id ou erreur) dans les logs Vercel.
3. **Emails — cause 2 (serverless)** : envois fire-and-forget non awaités → **lambda Vercel gelée dès la réponse partie, requête Resend tuée en vol** (`application_error Unable to fetch data`, apparaissant sous une AUTRE requête 20 s plus tard). Fix commit `7ca0b2f` : tous les envois serveur awaités dans try/catch (non-bloquant conservé, webhook répond toujours 200) + sanitize de la clé (défense issue #16). **Cause 3** : `RESEND_API_KEY` de prod invalide (`validation_error API key is invalid`) → nouvelle clé fournie par Nathan, remplacée sur Vercel (Prod+Preview) + `.env.local`. **Emails confirmés reçus.** ⚠️ Incident Resend le 2026-07-09 au soir (dashboard + status page down, API up) — sans lien avec notre bug.
4. **Bug multi-stock** : acheter 1 exemplaire d'un produit en stock N vendait TOUT le produit (modèle « pièce unique » appliqué aveuglément). Fix commit `7c4dfac` + **migration `006_stock_reservation_functions.sql`** (appliquée en prod) : fonctions SQL atomiques `reserve_product_unit`/`release_product_unit` — stock décrémenté à la réservation, statut `reserved` seulement sur la dernière unité (owner `reserved_order_id`), `sold` au paiement seulement si la commande détient le verrou, restitution idempotente (barrière `pending→cancelled`). REVOKE EXECUTE FROM PUBLIC (le revoke nominatif seul était inefficace — grant implicite Postgres). **Edge case acté non traité** : release d'une unité pendant qu'une autre commande détient le verrou dernière-unité et paie ensuite → produit `sold` avec stock résiduel 1 (réactivation admin nécessaire) — rare, arbitrage produit ultérieur.

**Découverte majeure de la QA** : `npm run typecheck` (`vue-tsc --noEmit` sur le tsconfig racine « solution » `files:[]`) **ne vérifiait RIEN depuis le début du projet** — tous les « typecheck ✅ » historiques étaient des faux positifs. Script remplacé par `nuxi typecheck` (commit `7c4dfac`). **Dette révélée : 11 erreurs préexistantes hors périmètre** (CartDrawer aria-label UButton, useSeo ogType, useHead children→innerHTML ×2, @vueuse/motion visibleOnce, supabase-provider useRuntimeConfig, catégories/consignments update dynamique ×2, mapConsignmentRow condition, Content-Length number) → **US dédiée « dette typecheck » à planifier**.

**Nettoyage recette** (2026-07-10) : base remise à zéro (sales/orders/order_items purgés, historique webhook purgé, 9 produits restaurés actifs) + les 8 paiements test Stripe remboursés via API (~1 721 € test). Pour effacer l'historique des paiements test : Dashboard → Delete all test data (manuel uniquement).

**Autres actions infra de la recette** : clé publishable ajoutée (Vercel Prod+Preview + `.env.local`) ; webhook Stripe existant nettoyé (~80 événements parasites → les 4 checkout utiles) ; `RESEND_API_KEY` présente en prod. Le frontmatter cassé de `.claude/agents/nuxt-developer.md` (ligne `mcp__stripe` orpheline) réparé — l'agent était invisible du registre.

---

## Go-live v0 (PR #19) + hotfixes production post-E8

**Statut prod (2026-07-08, confirmé Nathan)** : `develop` a été **squash-mergé dans `main`** (commit unique `15c26e7` « v0 (#19) »), puis `develop` **recréé depuis `main`** → les deux branches sont alignées sur `v0`. Tout l'historique détaillé ci-dessus (Sprints 0→7 + Epic E8) est collapsé dans ce commit unique ; **`git log` ne montre plus que `v0` + `iniital setup`** (la reconstitution fine passe par le reflog). **Tout le code est déployé en production** via Vercel (auto-deploy sur `main`).

**Conséquence sur US-002 (Supabase live)** : le blocage historique est **levé de facto**. Un projet Supabase réel tourne en production — attesté par la série de hotfixes runtime ci-dessous qui ne pouvaient se manifester que contre une vraie instance. Le journal antérieur mentionne encore US-002 « bloqué » : c'est de l'historique, **ne plus le considérer comme ouvert**.

### Hotfixes runtime appliqués après l'Epic E8 (non journalisés individuellement à l'époque — rattrapage documentaire)

Tous mergés dans `develop` puis inclus dans le squash `v0`. Reconstitués depuis le reflog + lecture du code en place :

| Sujet | Fichier(s) | Nature du fix |
|-------|-----------|---------------|
| **Images Supabase cassées (issue #6)** | `~/providers/supabase-provider.ts`, `nuxt.config.ts` | baseURL du provider `nuxt/image` mal résolue en prod → images produit 404. Provider Supabase custom + `render/image/...` corrigé. |
| **Crash header clé Supabase** | `app/composables/useSupabase.ts`, `server/utils/adminSupabase.ts` | Env var Vercel « sale » (BOM UTF-8 `U+FEFF` en tête d'URL / caractère non-Latin1 dans la clé, **issue #16**) → **toutes** les requêtes échouaient (503/headers invalides) en prod alors que la même clé marchait en local. Fix : `sanitizeCredential()` (retire tout hors ASCII imprimable `\x21-\x7E`) **symétrique** côté client public ET client admin service-role. |
| **BOM dans image provider** | provider image | Même famille de bug (BOM) côté résolution d'URL image. |
| **Sanitisation credentials admin** | `server/utils/adminSupabase.ts` | `getAdminSupabase()` applique `sanitizeCredential` sur `supabaseUrl` + `supabaseServiceRoleKey`. |
| **Email de confirmation commande** | `server/services/email.ts` | Expéditeur de l'email **acheteur** basculé sur `CGWS <onboarding@resend.dev>` (domaine de test Resend, n'envoie qu'à l'adresse du compte) car `cgws.fr` **pas encore vérifié dans Resend**. ⚠️ Les autres templates (consignation, contact, vente) sont restés en `noreply@cgws.fr` — **incohérence à traiter** : ils échoueront tant que le domaine n'est pas vérifié. |

### Points de blocage encore réellement ouverts (mis à jour)

1. ~~US-002 Supabase live~~ → **RÉSOLU** (projet Supabase en prod).
2. **Domaine Resend `cgws.fr` non vérifié** : seul l'email de confirmation commande a été rabattu sur `onboarding@resend.dev` ; les 4 autres templates pointent toujours `noreply@cgws.fr` et n'enverront pas. À vérifier le domaine dans Resend puis réunifier l'expéditeur.
3. **`SHIPPING_FLAT_RATE = 9,90 €`** : toujours un placeholder non confirmé par Camille.
4. **Clés Stripe prod** (`STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`) : présence/validité en env Vercel à confirmer ; endpoint webhook `POST /api/checkout/webhook`.
5. **Contenus réels Camille** : textes légaux, coordonnées, vraies photos, CGV/SIRET — inchangé.

---

# Épic E9 — Qualité & Dette Technique · Sprint 8

**Branche `feature/sprint-8` · 20 pts planifiés · 20 pts livrés (vélocité 100 %) · 2026-07-22**

Sprint entièrement consacré à la dette révélée par la recette prod d'US-082. Ordre impératif respecté (US-090 en premier : les autres se valident contre un typecheck qui vérifie réellement). **Objectif de sprint atteint** : `npm run typecheck && npm run lint && npm run test:unit && npm run build` passe en EXIT 0, la CI n'est plus jamais rouge par défaut, le chemin de l'argent est couvert par des tests.

## US-090 — Gate TypeScript réel à zéro erreur · 5 pts — PASS

Commit `4643306`. `npm run typecheck` était un **no-op** (tsconfig « solution » racine avec `files:[]`) → tous les « typecheck ✅ » de l'historique du projet étaient des faux positifs. Script remplacé par `nuxi typecheck`.

Les **11 erreurs préexistantes** révélées ont été corrigées **à la source**, sans aucun `any` ni `@ts-ignore` : `ogType` via `useHead` meta, `useHead` `children`→`innerHTML` (×2), slot `#close` d'`USlideover`, `v-motion` `visible-once`, `TablesUpdate` au lieu de `Record` (×2), type predicates dans `mapConsignmentRow`, `Content-Length` en number, déclaration node du provider Nuxt Image. `database.types.ts` régénéré via `supabase gen types` (migrations 001→006). `DEV_GUIDE` documente la procédure de régénération (même commit que la migration).

## US-091 — CI verte + tests du chemin de paiement · 8 pts — PASS

Commit `8d8cf97`. **`npm ci` réparé** : `package-lock.json` régénéré sous npm 10 (désynchronisation `crossws`/`h3` introduite par npm 11) — le blocage CI historique est levé.

**CI `e2e.yml` restructurée en 3 jobs** : `quality` (typecheck + lint + test:unit, sans secret requis → **vrai gate bloquant**), `e2e-secrets-check` (toujours vert, annonce si les secrets sont absents), `e2e` (Skipped proprement si secrets absents, **jamais rouge**).

**23 nouveaux tests** (41 au total à ce stade) sur la logique de paiement : fulfillment (idempotence, garde `unpaid`, `fulfillment_method`, `sold` conditionnel au verrou, email commission), release idempotent, rollback + 409 sur course perdue, routing webhook sur les 4 événements. `fakeSupabase` typé (`Database`/`Tables`, zéro `any`) reproduisant fidèlement l'update conditionnel. `DEV_GUIDE` liste les secrets GitHub à créer par Nathan (`SUPABASE_URL`, `SUPABASE_ANON_KEY`).

## US-092 — Emails : expéditeur centralisé et configurable · 2 pts — PASS

Commit `3531e86`. `runtimeConfig.emailFrom` (serveur) alimenté par `CGWS_EMAIL_FROM`, fallback sûr `onboarding@resend.dev`. Les **6 templates** lisent `resolveEmailFrom()` → plus aucun `from` hardcodé divergent (l'incohérence relevée au go-live v0 est résorbée). La bascule vers `noreply@cgws.fr` se fera par **simple variable d'env, zéro code** — prérequis : domaine `cgws.fr` vérifié dans Resend par Nathan (blocage 2 ci-dessus, toujours ouvert). `.env.example` + `DEV_GUIDE` documentent `CGWS_EMAIL_FROM`.

## US-093 — Nettoyage code mort et duplications · 5 pts — PASS (2e passe)

Commit `42c29ee`. Les 6 items de dette actés lors des QA des sprints 6/7 et de la recette US-082 :

1. Endpoint orphelin `server/api/orders/[id].get.ts` supprimé (la page checkout success passe par `/api/checkout/session-status`) — zéro référence résiduelle.
2. `CONSIGNMENT_STATUS_LABELS` dédupliqué : source canonique unique dans `app/utils/consignment.ts`, importée par les 3 pages admin, libellés FR strictement inchangés.
3. Code mort supprimé dans `useDepositorAuth.ts` (entrées rate-limit inatteignables par design anti-énumération, acté QA US-066) — message neutre et comportement anti-énumération préservés à l'identique.
4. Boutons bruts → `CgwsButton` (variants `destructive`/`primary`) dans `produits/index.vue`, `SaleModal.vue`, `SaleForm.vue` ; états loading/disabled et spinners conservés (`aria-busy` propagé nativement).
5. `RevenueChart` theme-aware : couleurs résolues au runtime depuis les tokens `--cgws-*`, réactif au changement de peau sans rechargement.
6. **N+1 éliminé** dans `/api/depositor/consignments` : requêtes groupées `.in()`, nombre de requêtes Supabase constant (3 max, indépendant du nombre de consignations vendues), réponse identique champ à champ, barrières de sécurité US-066 intouchées.

**QA : FAIL 1re passe** sur l'item 5 uniquement. Le mécanisme theme-aware était correct, mais la sous-clause « distinction visuelle CA propre vs CA consignation reste lisible » échouait mesurablement : `--cgws-accent` et `--cgws-accent-deco` sont à **1.71:1 (Jour) / 1.10:1 (Nuit) / 1.43:1 (Rugueux)** l'un de l'autre — les deux segments empilés étaient indiscernables en Nuit. **Fix** : délimiteur 1px `borderColor: --cgws-ground` + `borderWidth: 1` sur les deux datasets (`borderSkipped: false` déjà présent), c'est-à-dire un séparateur **indépendant de la teinte**. Contrastes vérifiés indépendamment par la QA : ground/accent 5.60 / 6.88 / 6.04 et ground/accent-deco 3.28 / 6.26 / 4.22 — tous ≥ 3:1 (WCAG 1.4.11). `--cgws-surface` écarté (2.96:1 contre accent-deco en Jour, sous le seuil). **Aucun token de `tokens.css` modifié** : la palette v3 reste une décision actée en US-070/072, la correction est purement au niveau du rendu Chart.js. **PASS 2e passe.**

Test dédié ajouté : `tests/unit/depositor-consignments.spec.ts` (constance du nombre de requêtes + invariants de sécurité US-066 : filtre `depositor_email` dérivé exclusivement du JWT, échappement ILIKE avec test du joker `_`, zéro fuite de `notes`/commission brute). `fakeSupabase` étendu d'un `.ilike()` fidèle (traduction pattern LIKE→RegExp) — la QA a explicitement vérifié que le test n'est **pas complaisant** : un mock laxiste ferait échouer le cas du `_`.

**Gates finaux** : `typecheck` / `lint` / `test:unit` (51 tests, 4 fichiers) / `build` → EXIT 0.

## Points relevés pendant le sprint

- **Faux positif d'environnement (résolu, rien à faire)** : `nuxt-developer` a rapporté un `npm run lint` cassé (résolution vers un ESLint global 9.0.0 orphelin, `Cannot find module '...acorn.js'`). Vérifié par la QA : le dépôt est en ESLint **9.39.4** et `npm run lint` préfixe `node_modules/.bin` au PATH → EXIT 0 stable sur deux exécutions. **Artefact du shell du subagent, ni le dépôt ni la CI ne sont affectés.**
- **Hors périmètre, laissé non commité** : modifications de `.claude/agents/*.md`, nouvel agent `session-starter.md`, `docs/LAUNCH_PROMPT.md` (configuration d'agents, sans impact produit).

## Blocages ouverts après Sprint 8

Inchangés par rapport à la liste ci-dessus (§ « Points de blocage encore réellement ouverts »), **sauf** que l'incohérence d'expéditeur email est désormais résolue côté code : il ne reste que l'action infra de Nathan (vérifier `cgws.fr` dans Resend, puis positionner `CGWS_EMAIL_FROM`). Reste également l'**edge case acté non traité** de la recette US-082 : release d'une unité pendant qu'une autre commande détient le verrou dernière-unité et paie ensuite → produit `sold` avec stock résiduel 1 (réactivation admin nécessaire) — rare, arbitrage produit ultérieur.

---

# Épic E10 — Fiabilité & confiance du site public · Sprint 9

**Branche `feature/sprint-9` · 18 pts planifiés · 18 pts livrés (vélocité 100 %) · 2026-07-22**

Sprint consacré à la perte silencieuse de prospects et aux défauts déjà visibles en production. **Objectif de sprint atteint** : les deux bugs qui cassaient la conversion en silence sont traités, le lien mort `/a-propos` ne renvoie plus de 404, et PayPal est débloqué sans une ligne de code. Les 5 US sont commitées, `typecheck` / `lint` / `test:unit` (68 tests) / `build` en EXIT 0.

## US-094 — Garde-fou expéditeur email de test visible en admin · 3 pts — PASS

Commit `cdd0474`. Diagnostic confirmé : `sendViaResend()` avale les erreurs API (par design, pour ne jamais bloquer l'UI) et le fallback `onboarding@resend.dev` ne délivre **qu'à l'adresse du titulaire du compte Resend** — ce qui explique exactement #27 (le visiteur voit un succès, l'email ne part jamais) et #24 (« mail d'achat non reçu sur d'autres adresses que la mienne » est littéralement le comportement du domaine de test).

Nouveau `GET /api/admin/email-status` (`requireAdminAuth`, retourne strictement `{ isFallback }` — ni `runtimeConfig` brut ni adresse expéditrice), adossé à `isFallbackSender()` exporté depuis `server/services/email.ts` (diff strictement additif, 12 lignes, aucun changement de comportement d'envoi). Bandeau non fermable dans le dashboard admin.

**Décision design notable** : `UAlert` explicitement écarté — sa prop `color` tape dans la palette Nuxt UI par défaut, délibérément non câblée aux tokens CGWS (`app/app.config.ts`) ; l'utiliser aurait rejoué le FAIL QA du Sprint 8. Bandeau custom aligné sur les patterns `RejectModal`/`KpiCard`. Contrastes recalculés indépendamment par la QA : `danger`/`surface` = 5.05 (Jour) / 5.47 (Nuit) / 4.72 (Rugueux), tous ≥ 4.5:1. Fail-safe vérifié : le `catch` du fetch force `isFallback = true`, une erreur réseau **affiche** le bandeau au lieu de le masquer.

Livrable documentaire : checklist de recette manuelle des 6 templates dans `DEV_GUIDE` § emails, + procédure pour lever le bandeau.

## US-095 — Fiabiliser la soumission du dépôt de selle · 5 pts — PASS (2e passe)

Commit `0c74406`. Cause racine de #26 confirmée dans le code : validation de taille **par fichier uniquement** (5 Mo), aucune compression client → 5 photos smartphone = payload multipart de 15-25 Mo, au-delà de la limite serverless Vercel (~4,5 Mo). L'échec survient **avant** la validation Zod, avec une erreur réseau opaque perçue comme « une erreur survient ».

Compression client (1600px / qualité 0.75) via **import dynamique** de `browser-image-compression` dans le handler (lib browser-only — jamais en import statique, sous peine de casser le SSR). Garde de payload cumulé à **3 Mo**, appliquée après compression et avant tout appel réseau : marge sous la limite Vercel pour absorber l'overhead multipart et les champs texte. Un fichier dont la compression échoue est retiré et signalé sans faire échouer la soumission des autres. Côté serveur, `readMultipartFormData` et la boucle d'upload Storage sont enveloppés en try/catch renvoyant des `createError` 400/502 actionnables.

Logique extraite dans `app/utils/consignmentPhotoUpload.ts` + 13 tests unitaires — la QA a explicitement vérifié que le test d'isolement des échecs **n'est pas complaisant**.

**QA : FAIL 1re passe** sur un point d'accessibilité : le message d'erreur reçoit un focus programmatique mais portait `outline-none` sans ring de remplacement — un utilisateur clavier voyant était déplacé sans repère visuel. **Fix** : ring de focus en `focus:` (et non `focus-visible:`) — choix délibéré et documenté : l'heuristique `:focus-visible` des moteurs ne garantit pas le ring sur un `.focus()` scripté franchissant une frontière asynchrone démarrée par un clic souris, ce qui aurait laissé le trou pour une partie des utilisateurs. **PASS 2e passe.**

## US-099 — Page À propos · 5 pts — PASS (2e passe)

Commit `1683aea`. Le lien `/a-propos` était référencé par `AppHeader`, `MobileMenu` et `AppFooter` et renvoyait une **404 depuis toutes les pages du site en production** — défaut visible, pas simple absence de feature.

Page en 5 sections (hero, Camille, atelier de Brèches, activités + consignation avec CTA vers `/consignation`, CTA contact), texte repris et étendu depuis `OurStorySection.vue` plutôt que réinventé. JSON-LD `Person` + `LocalBusiness` via `innerHTML` (jamais `children`, cf. US-090). Le `LocalBusiness` de `index.vue` est factorisé dans `app/utils/localBusinessSchema.ts` et partagé — la QA a vérifié la sortie rendue **byte-identique** à l'existant, le risque de divergence SEO sur une page déjà en prod étant le vrai danger de cette factorisation.

**QA : FAIL 1re passe** — la QA a lancé le build de production et `curl`é la page : le `<title>` portait le **suffixe de marque en double**. Cause racine : `usePageSeo()` (écrit en US-023, **jamais branché sur une page jusqu'ici** — bug latent révélé, pas introduit) concaténait manuellement un suffixe que `@nuxtjs/seo` applique déjà via son `titleTemplate` global. Fix d'une ligne dans le composable, revérifié par `curl` sur le build. **PASS 2e passe.**

## US-098 — PayPal comme moyen de paiement · 3 pts — PASS

Commit `2c69ca2`. **Zéro ligne de code**, comme l'anticipait le PO : `session.post.ts` ne fige aucun `payment_method_types` et pose déjà une `return_url` — le prérequis technique des moyens de paiement à redirection. Vérification faite en amont contre la doc Stripe : PayPal est supporté par Checkout **y compris en formulaire embarqué** (redirection pleine page vers PayPal puis retour), compte marchand FR et devise EUR bien dans les listes éligibles. Le webhook `checkout.session.completed` → `fulfillOrder` et `release_product_unit` sont agnostiques du moyen de paiement.

`DEV_GUIDE` documente désormais que les moyens de paiement sont **Dashboard-driven**, pour éviter qu'un futur ticket du même genre soit sur-estimé comme du développement.

## US-100 — Hero homepage épuré · 2 pts — PASS

Commit `ff3144a`. Arche SVG décorative, bloc eyebrow et appel GSAP mort `tl.from('.hero-eyebrow', ...)` retirés ; espacement du bloc titre réinjecté en `pt-6 md:pt-7` pour compenser les marges perdues. H1 et animation lettre par lettre intacts, image de fond LCP non touchée. Diff : 2 insertions / 37 suppressions dans un seul fichier.

## Points relevés pendant le sprint

- **Faux positif d'environnement (récurrent, rien à faire sur le dépôt)** : `npm run lint` échoue dans les shells de subagent en résolvant un ESLint global 9.0.0 corrompu (`Cannot find module '...acorn.js'`) hors projet. Confirmé une nouvelle fois par la QA : le dépôt est en ESLint 9.39.4 local et passe à zéro erreur. Identique au Sprint 8. **Nettoyer l'ESLint global de la machine éviterait ce bruit à chaque sprint.**
- **Ordonnancement** : les 4 US développables ont été menées en parallèle (fichiers disjoints), avec sérialisation volontaire des `npm install` et limitation des `build`/`typecheck` concurrents — plusieurs agents partagent le même arbre de travail et le même `.nuxt/`.

## Blocages et dettes ouverts après Sprint 9

1. **Domaine Resend `cgws.fr` non vérifié** (inchangé, action Nathan) — désormais **signalé visuellement** dans le backoffice par le bandeau US-094. Le 4e scénario Gherkin d'US-094 (recette réelle des 6 templates depuis une adresse hors compte Resend) reste **non exécuté** : il est bloqué par cette action infra. Checklist prête à cocher dans `DEV_GUIDE`.
2. **Activation PayPal dans le Dashboard Stripe** (action Nathan) + recette bout en bout en mode test avant communication à Camille.
3. **Confirmation logs Vercel pour #26** (action Nathan, recommandée par le PO) : consulter Functions → `consignments/create` pour confirmer la signature d'erreur exacte (413 / `FUNCTION_PAYLOAD_TOO_LARGE` / timeout) avant de clore définitivement l'issue. Le correctif traite l'hypothèse la plus solide, mais elle n'est pas prouvée par les logs.
4. **⚠️ Incohérence d'adresse à arbitrer (nouveau, relevé par la QA)** : le JSON-LD `LocalBusiness` porte le code postal **`37220`** alors que tout le texte visible du site (footer, mentions légales, contact, à propos) porte **`37320`**. C'est une incohérence NAP qui pèse sur le SEO local. La bonne valeur doit être confirmée par Camille, puis propagée à la source unique (`app/utils/localBusinessSchema.ts`).
5. **Dette design system — contraste des anneaux de focus (nouveau)** : `ring-offset-color` n'est jamais spécifié, donc `#fff` par défaut. Contraste de `cgws-accent` contre ce fond : ≈6.5:1 en Jour mais **≈2.5:1 en Nuit** et ≈3.0:1 en Rugueux (sous ou à la limite du seuil 3:1, WCAG 1.4.11). Défaut **transverse et préexistant** : `CgwsButton`, `ThemeSwitcher`, `ProductCard`, `ProductForm`, `CategoryPanel`, `CategoryTreeItem`, `StatusDropdown` — soit la quasi-totalité des éléments focusables du site, déjà en production. Seul `AppFooter` le corrige (`ring-offset-cgws-surface`). **Candidat US pour un prochain sprint** — à traiter au niveau du design system, pas composant par composant.
6. **Dette mineure US-095** : quand une compression échoue de façon isolée sans dépasser le seuil, le message « photos retirées » peut être démonté par la transition vers l'écran de succès avant que le déposant l'ait lu. Un rappel dans l'écran de succès améliorerait la perceptibilité.
7. **Contenus réels Camille** (inchangé) : bio définitive et 3-4 vraies photos de l'atelier pour `/a-propos`, textes légaux, CGV/SIRET, vraies photos catalogue. La page À propos est construite pour que ce soit un **swap de constantes**, sans retouche de structure ni de SEO.
8. **`SHIPPING_FLAT_RATE = 9,90 €`** (inchangé) : toujours un placeholder non confirmé par Camille.
9. **Edge case US-082** (inchangé) : release d'une unité pendant qu'une autre commande détient le verrou dernière-unité → produit `sold` avec stock résiduel 1.

---

# Épic E11 — Stock multi-unités & rupture · Sprint 10

**Branche `feature/sprint-10` · 16 pts planifiés · 16 pts livrés (vélocité 100 %) · 2026-07-23**

Sprint entièrement séquentiel (US-097 étend le modèle de stock consolidé par US-096, aucune parallélisation possible). Une spec UX unique a couvert les deux US pour garantir un continuum d'états de stock cohérent sur la fiche produit (en stock → stock bas → épuisé → de nouveau disponible). **Objectif de sprint atteint** : un produit non-consigné peut être vendu en plusieurs exemplaires avec quantité restante visible, et un produit en rupture reste consultable avec option d'alerte email au retour en stock. Les 2 US commitées, `typecheck` / `lint` / `test:unit` (108 tests) / `build` en EXIT 0.

## US-096 — Quantité restante affichée + achat multiple · 8 pts — PASS (2e passe)

Commit `cd6cd7b`. Le socle SQL était déjà multi-unités depuis le rework E8 (`reserve_product_unit` décrémente 1 unité/appel, ne verrouille que sur la dernière) : le travail était purement applicatif. Champ `quantity` par ligne de panier (`addCartLine` remplace au lieu de dupliquer — décision produit « nouvelle quantité totale », pas cumul), `computeSubtotal` multiplié, `count` = total d'unités, payload checkout `items[{productId, quantity}]` borné à 30 unités totales. Boucle de réservation appelant `reserve_product_unit` × quantité avec rollback multi-unités (restitue toutes les unités déjà réservées, ce produit ET les autres, avant 409). `QuantitySelector.vue` custom (pas `UInputNumber` — palette Nuxt UI non câblée aux tokens CGWS, même raison que le rejet d'`UAlert` en US-094), masqué pour les consignations. État « Épuisé » dérivé (`active` + stock 0) distinct de « Vendu », préparant US-097.

**QA : FAIL 1re passe** — les 7 scénarios Gherkin passaient, mais la QA a trouvé **deux bugs réels non testés** en creusant le module :
1. **CA admin sous-évalué (chemin de l'argent)** : `fulfillment.ts` ne sélectionnait pas `quantity` et insérait une ligne `sales` au prix unitaire pour une ligne multi-unités → le dashboard sous-comptait le CA. Corrigé : `sale_price = prix × quantity` (une ligne au total, préservant la sémantique « 1 ligne sales = 1 vente » du modèle existant), commission inchangée (consignations toujours quantité 1).
2. **Panier legacy → NaN + checkout bloqué** : un `CartItem` en localStorage sans champ `quantity` (antérieur au déploiement) donnait `NaN` au badge et envoyait `quantity: undefined` → rejet Zod 422, checkout bloqué. Corrigé par gardes `?? 1` sur `count` et le payload.

Corrigé aussi dans la foulée (défaut introduit de fait par la feature multi-unités, pas « préexistant ») : le template email de confirmation affichait toujours « quantité 1 » (le champ était ignoré) → « Titre × N » + total ligne, rendu inchangé pour N=1. `releaseOrderReservation` corrigé pour restituer `quantity` unités par ligne (sous-restituait le stock des commandes multi-unités). Log `[stock-anomaly]` distinctif quand un produit passe `sold` avec stock résiduel (Gherkin 6, edge case Sprint 8 rendu visible sans corriger l'atomicité SQL sous-jacente). **PASS 2e passe.**

## US-097 — Rupture de stock : parcage catalogue + alerte email retour en stock · 8 pts — PASS

Commit `3d51533`. Deux décisions d'architecture tranchées en amont par l'orchestrateur pour dérisquer :

1. **État de rupture DÉRIVÉ**, pas de nouvelle valeur DB `out_of_stock`. Justification vérifiée : le catalogue filtre `status IN ('active','reserved')` et 38 fichiers référencent le statut produit ; garder `status='active'` (stock 0) maintient automatiquement le produit dans le catalogue (exigence Gherkin) sans toucher à la contrainte CHECK ni auditer 38 fichiers. Le « repasse à Disponible » est automatique — le produit n'a jamais quitté `active`, l'affichage suit le stock.
2. **Détection du réappro APPLICATIVE** dans `server/api/admin/products/[id].put.ts` (transition stock 0 → >0), pas un trigger SQL : Postgres ne peut pas envoyer d'email, un trigger-to-email exigerait pg_net + edge function, disproportionné, et les critères Gherkin n'exercent que le chemin admin. Vérifié que `status.patch.ts` ne touche jamais le stock et que l'import CSV ne fait que des INSERT.

Table `stock_notifications` (UNIQUE `(product_id, email)`, index partiel `notified_at IS NULL`), RLS calquée sur `orders` : aucune lecture publique des emails, écritures en service role uniquement. Route publique `notify-restock` avec upsert idempotent et réponse **strictement neutre** dans tous les cas (déjà inscrit / nouveau / hors rupture / consignation) — aucune fuite d'information. 7e template `sendRestockNotification` réutilisant `resolveEmailFrom()`. À la réactivation : email à chaque inscrit `notified_at IS NULL` + marquage pour empêcher tout re-spam ultérieur ; envoi non bloquant (une panne Resend ne casse pas la mise à jour produit admin). `RestockNotifyForm.vue` remplace le CTA d'achat sur la fiche épuisée. Migration 007 appliquée, `database.types.ts` régénéré.

**QA : PASS 1re passe.** Sécurité RLS vérifiée (calquée sur `004_orders.sql`), non-fuite de la route confirmée, détection de transition strictement `0 → >0`, non-régression consignation, 15 tests dédiés non complaisants.

## Points relevés pendant le sprint

- **Décision UX notable** : `QuantitySelector` custom plutôt que `UInputNumber` — la palette `ui.colors` de Nuxt UI n'est délibérément pas câblée aux tokens CGWS (`app/app.config.ts`), un composant natif brut détonnerait à côté d'un CTA `cgws-accent`. Cohérent avec le rejet d'`UAlert` en US-094.
- **Issue #30 non aggravée** : les deux nouveaux composants (`QuantitySelector`, `RestockNotifyForm`) spécifient un `ring-offset-cgws-ground` thème-aware explicite, plutôt que le `ring-offset-2` nu (blanc) responsable du défaut transverse de contraste ouvert en fin de Sprint 9.
- **Faux positif d'environnement (récurrent, inchangé)** : `npm run lint` échoue dans les shells de subagent (ESLint global 9.0.0 corrompu hors projet, `Cannot find module '...acorn.js'`). Dépôt sain (ESLint 9.39.4 local). Nettoyer l'ESLint global de la machine supprimerait ce bruit.
- **Migration appliquée sur le projet Supabase live** via MCP (table `stock_notifications` + RLS) — additive et réversible.

## Blocages et dettes ouverts après Sprint 10

1. **Domaine Resend `cgws.fr` non vérifié** (inchangé, action Nathan) : bloque la validation end-to-end réelle de l'alerte de retour en stock US-097 (envoi testé avec mocks uniquement, conforme au pattern acté US-063/US-066). Le bandeau admin US-094 signale toujours le fallback actif.
2. **Dette produit — affichage qté×prix dans le panier (nouveau, non bloquant)** : `CartLineItem.vue` / `CartDrawer.vue` et le récap `/checkout` affichent le prix unitaire par ligne, pas « qté × prix », pour les lignes multi-unités. Descopé explicitement par la spec design §0.2 ; sous-total et totaux Stripe corrects ; aucun scénario Gherkin US-096 ne l'exige. À traiter dans une future US de polish panier.
3. **Limite assumée US-097 — chemin import CSV** : si un futur import CSV se met à METTRE À JOUR le stock de produits existants (aujourd'hui il ne fait que des INSERT), la détection de réappro applicative ne se déclencherait pas. Documenté en commentaire dans `[id].put.ts`. À rouvrir si/quand l'import CSV évolue vers l'update de stock.
4. **Pas d'UI admin pour visualiser les inscriptions `stock_notifications`** : non demandé par le Sprint Plan ; amélioration opérationnelle possible (voir aussi spec design §7.5).
5. **Edge case US-082 (inchangé, désormais VISIBLE)** : release d'une unité pendant qu'une autre commande détient le verrou dernière-unité → produit `sold` avec stock résiduel. L'atomicité SQL sous-jacente reste hors périmètre (acté non-bloquant US-091), mais l'anomalie est désormais tracée par le log `[stock-anomaly]` (US-096) pour réactivation admin rapide.
6. **Issue #30 (dette design system, ouverte fin Sprint 9)** : contraste des anneaux de focus (`ring-offset-color` par défaut blanc) sous le seuil WCAG en peaux Nuit/Rugueux, transverse à ~8 composants existants. Les nouveaux composants de ce sprint ne l'aggravent pas. Candidat US pour un prochain sprint.
7. **Contenus réels Camille, `SHIPPING_FLAT_RATE`, activation PayPal, logs Vercel #26** (inchangés) — voir bilans Sprints 8-9.

---

# Épic E12 — Sécurité & Analytics produit · Sprint 11

**Branche `feature/sprint-11` · 18 pts planifiés · en cours · démarré 2026-07-23**

Ordre strict acté en interview : US-101 (faille RLS #34) en premier, puis US-102→105 (PostHog #31, cookieless sans consentement, pas de replay/heatmaps).

## US-101 — RLS admin réel — rôle admin vérifié dans les policies · 5 pts — PASS (1re passe)

Fermeture de #34 : `auth.role() = 'authenticated'` servait de critère « admin » sur 7 tables (002/004) — depuis l'espace déposant US-066, tout déposant magic-link pouvait lire les PII de tous les déposants/clients via PostgREST ou écrire dans le catalogue.

**Migration `008_admin_role_rls.sql`** : fonction `public.is_admin()` (SQL, STABLE, `SET search_path = ''`) lisant `auth.jwt() -> 'app_metadata' ->> 'cgws_role' = 'admin'` — jamais `user_metadata` (modifiable par l'utilisateur via `updateUser()`, ce serait recréer la faille). Les 12 policies fautives droppées/recréées sous le même nom avec `is_admin()` : `products_{insert,update,delete}_admin`, `categories_{insert,update,delete}_admin`, `consignments_{select,update}_admin`, `sales_all_admin`, `clients_all_admin`, `orders_select_admin`, `order_items_select_admin`. `consignments_insert_public` conservée (formulaire public de dépôt). **Bonus assumé et validé QA** : `product_status_history` n'avait JAMAIS eu de RLS depuis 003 (anon pouvait lire ET écrire) → RLS activée + `psh_select_admin` ; zéro impact applicatif (toutes les écritures passent par le service role).

**Script de non-régression rejouable `supabase/tests/rls_admin.sql`** (transactionnel, ROLLBACK final) : 4 scénarios via `SET LOCAL ROLE` + `request.jwt.claims` — déposant sans claim, déposant avec `user_metadata` forgé (`role: admin` écrit via updateUser → toujours refusé), admin `app_metadata`, anonyme. **Exécuté sur la base de dev : 58/58 assertions PASS** (2026-07-23). Ordre de déploiement respecté sur dev : claim attribué AVANT la migration aux 2 comptes admin (`nathcouton@gmail.com`, `camille.guignon37@gmail.com`).

**QA : PASS 1re passe** (analyse statique exhaustive — le MCP supabase n'était pas exposé dans sa session ; contre-vérification live faite par l'orchestrateur : `pg_policies` post-migration ne contient plus AUCUNE policy `auth.role()='authenticated'`, tout passe par `is_admin()`). Barrières US-066 (`server/api/depositor/*` en service role) vérifiées intouchées ; aucun code public `app/` ne lit les tables durcies avec le JWT. `nuxi typecheck` EXIT 0 (diff SQL/doc uniquement).

`docs/DEV_GUIDE.md` § « Sécurité — Rôle admin & RLS » : SQL/Dashboard d'attribution du claim + **checklist de déploiement prod ordonnée** — le claim doit être attribué aux comptes de Camille et Nathan sur la base de PRODUCTION avant d'y déployer 008, sinon le backoffice se verrouille ; reconnexion requise pour que le claim entre dans le JWT.

**⚠️ Action prod en attente (Nathan)** : seule la base de dev est traitée. En prod : (1) attribuer le claim aux 2 comptes, (2) déployer la migration 008, (3) reconnexion admin, (4) rejouer `rls_admin.sql`.

**Remarque QA non bloquante** : `server/utils/adminAuth.ts` compare `user.email` à un unique `process.env.ADMIN_EMAIL` — si un seul email y figure, l'un des deux comptes admin serait bloqué sur les routes `server/api/admin/*`, indépendamment du claim. À vérifier/faire évoluer (candidat future US).

## US-102 — Socle PostHog cookieless — plugin client SSR-safe et différé · 3 pts — PASS (2e passe)

Cadrage CNIL respecté à la lettre : `persistence: 'memory'` (zéro cookie/storage), `person_profiles: 'never'`, aucun `identify()`, `autocapture: false`, recording/heatmaps/surveys désactivés, `disable_external_dependency_loading: true`, host UE par défaut. Config 100 % explicite (pas de snapshot `defaults`, plus auditable). `posthog-js@1.407.1` en **import dynamique** dans `app/plugins/posthog.client.ts`, init différée `onNuxtReady` — chunk isolé (~228 kB) jamais dans le bundle d'entrée, prefetch idle uniquement. `$pageview` manuels (initial + `router.afterEach`), pas de double comptage. Sans clé : `return` précoce avant tout import — no-op strictement silencieux. `app/composables/useAnalytics.ts` = point d'entrée unique pour US-103/104 (typage structurel sans import posthog-js, guard SSR, buffer borné 20 événements pré-init rejoués au branchement).

**QA : FAIL 1re passe — excellente prise** : PostHog attache par défaut `$current_url = window.location.href` COMPLET à chaque événement → les query params sensibles auraient fui vers le tiers : `?code=`/`?token_hash=` (jeton magic link, `espace-deposant/callback`) et `?session_id=cs_…` (session Stripe, `checkout/success`). Contredisait frontalement le « aucune donnée identifiante » des mentions légales.

**Fix** : hook `before_send: sanitizeAnalyticsEvent` (`app/utils/analytics.ts`) — les alternatives ont été écartées preuves à l'appui dans les types installés (`get_current_url` ne touche pas `$current_url` per JSDoc ; `sanitize_properties` dépréciée). `stripQueryAndHash()` tronque query ET fragment (couvre le flow implicite Supabase `#access_token=`) sur toute clé finissant par `url`/`pathname`/`referrer` dans `properties`/`$set`/`$set_once`. La QA a vérifié dans le code compilé de la lib que `before_send` intercepte TOUT le pipeline capture (pageviews, buffer rejoué, futurs événements US-103/104). 11 tests dédiés (`tests/unit/analytics-url.spec.ts`) incluant les deux cas exacts du FAIL. Règle anti-fuite documentée dans DEV_GUIDE pour US-103/104. Try/catch global du callback différé (échec adblocker/réseau → silencieux en prod). **PASS 2e passe.**

Mentions légales : paragraphe mesure d'audience anonyme ajouté (section Cookies), **formulation placeholder à valider par Nathan** (TODO marqué). Actions Nathan restantes : projet PostHog Cloud **EU** + « Discard client IP data » + clés `NUXT_PUBLIC_POSTHOG_KEY`/`NUXT_PUBLIC_POSTHOG_HOST` dans Vercel. Gates : typecheck 0 · eslint 0 · **126 tests PASS** · build 0.

## US-103 — Taxonomie d'événements produit — funnels achat, consignation, contact · 5 pts — PASS (1re passe)

Les 6 événements de la taxonomie actée (et RIEN d'autre — audit grep exhaustif QA) : `product_viewed` (`catalogue/[slug].vue`, onMounted post-résolution), `cart_item_added` (`stores/cart.ts`, après mutation réussie — jamais sur les no-op), `checkout_opened` (`checkout/index.vue`, après `checkout.mount()` effectif, flag one-shot par instance, recompte à chaque visite), `consignment_form_viewed` / `consignment_submitted` (`ConsignmentForm.vue`, submitted UNIQUEMENT dans la branche succès du try), `contact_submitted` (`contact.vue`, idem).

**Taxonomie verrouillée au COMPILATEUR** : `app/utils/analytics-events.ts` (union type des 6 noms + `AnalyticsEventPayloadMap` event→payload) + surcharges de `capture()` — un nom hors taxonomie ou une propriété hors payload ne compile pas. La QA l'a prouvé par reproduction isolée (`tsc --strict` + `@ts-expect-error` sur 3 cas pirates : tous rejetés), et vérifié zéro échappatoire `as` dans `app/`. Résilience durcie : `safeForward()` try/catch sur tout appel client (adblocker → parcours intacts, testé sur le résultat métier réel). Zéro PII vérifié champ par champ ; `photos_count` = compte seul ; même distinct_id anonyme sur tout le funnel (memory persistence, aucun reset/identify).

**Déviations statuées par la QA (les 3 validées)** : `consignment_submitted.category` omise (le formulaire ne collecte pas de catégorie — typée optionnelle pour plus tard) ; `cart_item_added` aussi sur remplacement de quantité US-096 (sémantique remplacement confirmée, quantité résultante capturée) ; `items_count` = total d'unités et `cart_value` = sous-total hors port (aligné badge US-096 ; à reconfirmer si le funnel montre des écarts vs total payé).

**QA : PASS 1re passe.** Gates : typecheck 0 · eslint 0 · **135 tests PASS** (dont 7 cart-analytics + use-analytics réécrit taxonomie-valide) · build 0. Suggestion QA future : matérialiser le verrouillage compilateur par des `@ts-expect-error` dans les tests du repo (garantie continue en CI).

## US-104 — Capture serveur fiable « commande payée » via webhook Stripe · 2 pts — PASS (1re passe)

`order_paid` capturé côté serveur via `posthog-node@5.46` — compteur de conversion insensible aux adblockers/fermetures d'onglet. **Déviation architecturale validée QA** : capture dans `fulfillCheckoutSession` (`server/utils/fulfillment.ts`), PAS dans `webhook.post.ts` — le fulfillment a 2 déclencheurs (webhook + landing `session-status`) derrière la barrière d'idempotence `pending → paid` ; la capture en dernière instruction de la branche gagnante garantit exactement UNE capture par commande payée, après fulfillment complet, jamais sur rejeu, quel que soit le déclencheur vainqueur de la course.

`server/services/analytics.ts` (nouveau, seul module serveur parlant à PostHog) : `captureOrderPaid()` no-op sans clé, ne lève jamais (try/catch interne + ceinture dans fulfillment). Pattern serverless vérifié sur le package installé : `flushAt: 1` + `flushInterval: 0` + `await client._shutdown(3000)` — la QA a contre-vérifié dans les `.d.ts` que `_shutdown()` est bien l'API v5.46 (`shutdown()` public n'existe plus). Propriétés : `amount_total` en euros, `currency`, `items_count` (somme des quantités order_items, sémantique US-096), `payment_method_type`, `$process_person_profile: false`, `disableGeoip: true` (l'IP vue est celle de Stripe) — `customer_details` JAMAIS lu (vérifié ligne à ligne QA).

**Jonction funnel anonyme** : `getDistinctId()` exposé par `useAnalytics` (inerte SSR/bloqué) → `analyticsId` optionnel (Zod, borne 100) → `metadata.analytics_id` Stripe → capture avec CE distinct_id ; fallback `randomUUID()` si absent (comptage exhaustif même adblocké). Taxonomie client `analytics-events.ts` intacte (exhaustive à 6) : `SERVER_ANALYTICS_EVENTS` séparée — `order_paid` jamais capturable côté client par construction.

**QA : PASS 1re passe.** 11 tests via le vrai fulfillment (posthog-node mocké au module, `toHaveBeenCalledWith` sur l'objet complet = preuve zéro PII résiduelle) : idempotence rejeu, no-op sans clé, échecs constructeur/capture avalés avec fulfillment/email intacts, ordre capture-après-email. Gates : typecheck 0 · eslint 0 · **146 tests PASS** · build 0.
