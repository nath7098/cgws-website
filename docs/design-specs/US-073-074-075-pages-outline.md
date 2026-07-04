# Refonte des pages v3 — Outlines (US-073, US-074, US-075)

**Statut** : Outlines de cadrage uniquement (capacité de sprint restante) — chaque page nécessitera une spec détaillée complète (wireframes précis, classes Tailwind exhaustives, Gherkin) avant implémentation, sur le modèle de `US-072`. Ce document fixe le périmètre et les décisions de rôle-token par section, pas le détail pixel-perfect.
**Dépend de** : `US-070`, `US-071`, `US-072`.
**Rappel permanent** : `accent-deco` décoratif uniquement, `accent`/`danger` pour tout texte lisible. Chaque section ci-dessous doit être vérifiée dans les 3 rendus (`elegante-jour`, `elegante-nuit`, `rugueux`).
**Révision** : intègre les décisions client — header/footer suivent jour/nuit (§US-075), switcher disponible en admin (§US-075), token `danger` remplace `cgws-rust` (formulaires, `RejectModal`) — voir `DESIGN_SYSTEM_v3.md` §8.1.

---

## US-073 — Homepage

**Pages/composants concernés** : `app/pages/index.vue`, `HeroSection.vue`, `OurStorySection.vue`, `StatsBar.vue`, `SaddleIllustration.vue`.

| Section | Ancien (v2) | Nouveau (v3) |
|---|---|---|
| Hero | Fond `cgws-tack`, H1 `font-display` (Bebas Neue), CTA copper | Fond `ground`/`surface` (Élégante) ou `ground` sombre (Rugueux), cadre **arche fine** (`US-072` §4) autour du bloc titre, H1 `font-display` (Playfair 700), tagline `font-serif italic`, CTA primary (`accent`/`on-accent`) |
| StatsBar | `ConchoStat` en ligne, fond tack | `StarDivider variant="stat"` en ligne, filigranes discrets aux coins de section (`US-072` §3) |
| Notre Histoire | `CgwsCard` fond cream, texte charcoal | `CgwsCard` fond `surface`, texte `ink`, portrait/illustration encadré d'une arche fine optionnelle |
| Illustration selle | `SaddleIllustration.vue` en `text-cgws-leather/30` | Remplacer/adapter la teinte vers `text-cgws-edge/30` ; évaluer si l'illustration cadre encore avec l'identité "cavalière de reining" du nouveau logo ou doit être remplacée par un asset aligné logo (hors scope design token, à signaler à `product-owner`) |
| Diviseurs de section | `ConchoDivider` | `StarDivider variant="divider"` partout |

**Point à trancher (produit, pas design pur — mineur, non bloquant, cf. `DESIGN_SYSTEM_v3.md` §8.2)** : `SaddleIllustration.vue` est un asset SVG v2 (silhouette de selle) qui ne correspond pas nécessairement au nouveau vocabulaire visuel (cavalière de reining). À signaler à `product-owner`/Camille pour savoir si un nouvel asset doit être fourni ou si l'illustration existante est recolorée et conservée telle quelle pour ce sprint.

---

## US-074 — Catalogue + Fiche produit

**Pages/composants concernés** : `app/pages/catalogue/index.vue`, `app/pages/catalogue/[slug].vue`, `CatalogueHeader.vue`, `FilterPanel.vue`, `FilterDrawer.vue`, `ProductGrid.vue`, `EmptyState.vue`, `ProductGallery.vue`, `ProductInfo.vue`, `RelatedProducts.vue`.

| Section | Décisions clés v3 |
|---|---|
| `CatalogueHeader` | Titre H2 court possible en `font-heading` (Rye) si ≤4 mots (ex. "Le Catalogue"), sinon Playfair. Filigrane discret en fond d'en-tête. |
| `FilterPanel`/`FilterDrawer` | Fond `surface`, bordures `hairline`, chip de filtre actif en `accent`/`on-accent`, jamais `accent-deco` (les chips portent du texte : nom de filtre) |
| `ProductGrid` | Grille de `TagCard` v3 (cf. `US-072` §1), stagger GSAP inchangé |
| `EmptyState` | Illustration + texte `ink-soft`, CTA "Réinitialiser les filtres" en `ghost`/`accent` |
| `ProductGallery` (fiche produit) | Cadre image `border-edge`, vignettes actives soulignées `accent` (pas `accent-deco` — indicateur d'état fonctionnel) |
| `ProductInfo` | Prix en `font-display tabular-nums text-cgws-accent` (grand format, cf. règle prix v3), badge statut = `CgwsBadge` v3, description en `font-sans text-cgws-ink` |
| `RelatedProducts` | Réutilise `TagCard` v3, séparateur `StarDivider variant="divider"` au-dessus de la section |

**Point d'attention accessibilité spécifique** : les chips de filtre actifs et les vignettes de galerie sélectionnées sont des **indicateurs d'état fonctionnels**, pas de la décoration — ils doivent utiliser `accent` (et respecter ≥3:1 UI a minima, idéalement ≥4.5:1 si le chip porte du texte), jamais `accent-deco`, même si visuellement `accent-deco` (rose/copper) semble plus "signature". C'est l'application directe de la règle de contraste à des composants non couverts explicitement par `US-072`.

---

## US-075 — Services/Contact/Header/Footer + cohérence Admin

**Pages/composants concernés** : `app/pages/contact.vue`, `app/components/ui/ContactMap.vue`, `app/components/layout/AppHeader.vue`, `app/components/layout/AppFooter.vue`, `app/components/layout/MobileMenu.vue`, `app/layouts/admin.vue` + composants `app/components/admin/*`.

### Header/Footer — décision client tranchée : suivent jour/nuit

| Élément | v2 | v3 |
|---|---|---|
| Fond header/footer | `bg-cgws-tack` fixe (toujours sombre, indépendamment du thème site) | **Tranché par le client (`DESIGN_SYSTEM_v3.md` §8.1, décision 2)** : plus de bandeau sombre fixe. `AppHeader` et `AppFooter` prennent les rôles de la peau active comme le reste du site — `bg-cgws-surface` (header, légèrement distinct du fond de page pour la lisibilité au scroll) et `bg-cgws-ground`/`bg-cgws-surface` (footer), donc clairs en Élégante Jour, sombres en Élégante Nuit/Rugueux. L'état "scrolled" du header (`useScrollHeader`, cf. `AppHeader.vue` existant) passe de `bg-cgws-tack/90 backdrop-blur-md` à `bg-cgws-surface/90 backdrop-blur-md` — même mécanique de transparence/flou, tokens différents. |
| Bordure header/footer | `border-cgws-leather/30` (header), `border-t-2 border-cgws-copper` (footer) | `border-cgws-hairline` (header), `border-t-2 border-cgws-accent-deco` (footer — décoratif, cohérent avec la règle accent-deco) |
| Logo texte | `font-display text-cgws-copper` | `font-display` (Playfair) `text-cgws-accent`, ou remplacement par le logo image fourni par le rebranding (cavalière + lettrage) si disponible — à confirmer, le brief mentionne un "nouveau logo" sans fournir l'asset final |
| Liens nav | `text-cgws-rope hover:text-cgws-copper` | `text-cgws-ink-soft hover:text-cgws-accent` — cohérent maintenant que le header suit les rôles de la peau active (`ink-soft` est le token "texte secondaire" quel que soit le fond, clair ou sombre) |
| `ThemeSwitcher` | — | Intégré ici, cf. `US-071` — desktop : à droite avant l'icône téléphone ; mobile : dans `MobileMenu` |
| `ConchoDivider` (footer, avant la barre de copyright) | — | `StarDivider variant="divider"` |

**Point d'implémentation à vérifier** : le focus-visible ring du skip-link et des liens de `AppFooter.vue` utilise aujourd'hui `focus-visible:ring-offset-cgws-tack` (offset calé sur un fond toujours sombre). Puisque le footer devient theme-aware, cet offset doit devenir `focus-visible:ring-offset-cgws-surface` (ou `-ground`, selon le token de fond retenu pour le footer) pour rester cohérent visuellement dans les 3 rendus — sinon l'offset du ring resterait sombre même sur un footer clair en Élégante Jour.

### Contact

- `ContactMap.vue` : cadre `border-edge`, marker si custom en `accent-deco` (décoratif, pas de texte porté par le pin lui-même) — le label d'adresse associé doit être en `ink`/`accent` selon qu'il est statique ou cliquable (lien = `accent`).
- Formulaire de contact : réutilise `CgwsInput`/`CgwsTextarea`/`CgwsSelect` — re-skin mécanique via la table de migration `US-070` §6 (bordures `edge`, focus ring `accent`, état d'erreur en `danger`/`on-danger` — cf. `US-072` §6.1 pour le détail des classes, plus de point bloquant sur ce sujet, le rôle `danger` est tranché).

### Cohérence Admin (`app/layouts/admin.vue` + `app/components/admin/*`) — décision client tranchée : switcher disponible, pas de peau figée

Le backoffice **n'est pas figé sur une peau** : Camille dispose du même `ThemeSwitcher` que le visiteur public (`DESIGN_SYSTEM_v3.md` §8.1, décision 3). Détail d'implémentation :

- **Placement dans la topbar admin** (`app/layouts/admin.vue`, bloc `<header role="banner">` actuel) : le `ThemeSwitcher` prend place dans le groupe "droite" de la topbar, entre le titre de page et le bloc email/avatar (actuellement `<div class="flex items-center gap-2">` contenant l'email et l'avatar) — devient `<ThemeSwitcher class="..." /> <span email /> <avatar />`. Sur mobile (topbar compacte, hamburger visible), le `ThemeSwitcher` peut passer en version icône-seule (segment skin réduit à une seule icône togglable, cf. `US-071` §3 pour le pattern responsive déjà prévu côté public) plutôt que d'être retiré — l'admin n'a pas de drawer de menu séparé pour l'apparence comme `MobileMenu` côté public, donc le contrôle doit tenir dans la topbar à toutes les largeurs.
- Tous les composants admin (`KpiCard`, `DataTable`/`UTable`, `StatusDropdown`, `ProductForm`, `AdminSidebar`, la topbar elle-même) migrent leurs classes `cgws-*` v2 vers les rôles v3 selon la table `US-070` §6, **theme-aware comme le reste du site** — plus de fond `bg-cgws-tack` figé sur la sidebar ni `bg-cgws-parchment` figé sur la topbar (ancien code `admin.vue`), ces fonds suivent désormais `surface`/`ground` de la peau active.
- **`RejectModal.vue`** (refus de consignation) migre son état d'alerte de `cgws-rust` vers `danger`/`on-danger` — plus de point bloquant, cf. `US-072` §5 (variant `destructive` proposé pour `CgwsButton`) et §6.1 (état d'erreur du champ "Motif de refus"). Détail précis à spécifier lors de l'implémentation de cette US : icône `bg-cgws-danger/10` + `text-cgws-danger` (remplace `bg-cgws-rust/10`/`text-cgws-rust`), astérisque requis `text-cgws-danger` (remplace `text-cgws-rust`), bordure de champ en erreur `border-cgws-danger`, bouton de confirmation `bg-cgws-danger text-cgws-on-danger hover:bg-cgws-danger/90` (remplace `bg-cgws-rust text-white hover:bg-cgws-charcoal`).
- `StatusDropdown.vue`, `SaleModal.vue` utilisent des couleurs sémantiques d'état (succès/attente) qui ne font pas partie de la grille de rôles v3 (laquelle couvre le chrome de marque + `danger` pour l'alerte/refus) — recommandation inchangée : utiliser les couleurs sémantiques natives Nuxt UI (`success`/`warning`, cf. `mcp__nuxt-ui-remote` §Design System) pour les états qui ne sont ni "marque" ni "alerte destructive", plutôt que de forcer `accent`/`danger` sur des états qui n'en relèvent pas sémantiquement. Point à valider avec `product-owner` avant `US-075`, mais ne bloque plus le token `danger` lui-même (qui est, lui, tranché).
- **Validation dans les 3 rendus obligatoire** : chaque écran admin (`dashboard`, `produits`, `consignations`, `ventes`, `clients`, `rapports`, `login`) doit être revu visuellement en `elegante-jour`, `elegante-nuit` et `rugueux` avant merge de cette US — au même titre que les pages publiques. Aucun écran admin n'est exempté de cette vérification.

---

## Prochaine étape recommandée

Les points précédemment bloquants (fond header/footer, statut de l'admin vis-à-vis du switcher, remplacement de `cgws-rust`) sont désormais tranchés par le client et intégrés ci-dessus. Reste à signaler à `product-owner`, non bloquant pour le reste du Sprint 6 :
- Asset logo/illustration définitif (remplacement possible de `SaddleIllustration.vue`, logo image vs texte dans header/footer) — cf. `US-073` et le tableau Header/Footer ci-dessus.
- Répartition `success`/`warning` (Nuxt UI natif) vs rôles de marque CGWS pour les états admin non couverts par `accent`/`danger` (`StatusDropdown`, `SaleModal`) — cf. §Cohérence Admin ci-dessus.
