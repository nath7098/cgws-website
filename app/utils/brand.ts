// app/utils/brand.ts
// ─────────────────────────────────────────────────────────────────────────────
// SOURCE UNIQUE DE VÉRITÉ — identité de marque « Spin & Slide » (US-106).
//
// Toute mention de marque à l'écran (header, footer, menu mobile) ou en
// métadonnée (title, og:site_name, JSON-LD, site.name) DOIT consommer ces
// constantes. Ne jamais re-saisir un libellé de marque en dur dans un
// composant : c'est exactement la dispersion qui a coûté cher en US-092/US-093.
//
// Architecture de marque (actée 2026-07-23 — docs/BRAND_DIRECTION.md) :
//  • Marque commerciale ............ « Spin & Slide » (usage courant « Spin & Slide Shop »)
//  • Lockup de façade recommandé ... « Spin & Slide Shop — by CGWS »
//    (Spin & Slide domine, CGWS endosse ; ordre inversé réservé aux supports
//     où CGWS est obligatoire : mentions légales, factures, monogramme au verso)
//  • Monogramme d'entreprise ....... « CGWS » (conservé, marque du design system)
//  • Raison sociale ................ « CGWS — Camille Guignon Western Shop »
//    (bloc légal / mentions légales / factures UNIQUEMENT — jamais en façade)
//  • Baseline descriptive .......... signal métier SEO à préserver malgré le
//    retrait de « western » du nom commercial.
//
// ⚠️ Le wordmark affiché (header/footer/menu) est un WORDMARK TYPOGRAPHIQUE
//    PROVISOIRE (Bebas Neue / Rye du design system). Le logo/lockup vectoriel
//    définitif est un livrable design ultérieur (spec ux-designer + validation
//    Camille) ; son intégration remplacera le rendu typographique sans toucher
//    à ces constantes.
// ─────────────────────────────────────────────────────────────────────────────

/** Marque commerciale — usage courant complet. og:site_name / site.name. */
export const BRAND_NAME = 'Spin & Slide Shop'

/** Marque commerciale nue (sans « Shop ») — wordmark dominant du lockup. */
export const BRAND_SHORT = 'Spin & Slide'

/** Monogramme / marque d'entreprise conservée en endossement. */
export const BRAND_MONOGRAM = 'CGWS'

/** Suffixe d'endossement affiché sous le wordmark (« Shop — by CGWS »). */
export const BRAND_ENDORSEMENT = 'Shop — by CGWS'

/** Lockup de façade complet (attributs d'accessibilité, alt, aria-label). */
export const BRAND_LOCKUP = 'Spin & Slide Shop — by CGWS'

/** Raison sociale complète — bloc légal / mentions légales / factures uniquement. */
export const BRAND_LEGAL_NAME = 'CGWS — Camille Guignon Western Shop'

/**
 * Baseline descriptive complète — signal métier « western & reining » perdu en
 * retirant « western » du nom. À conserver dans le footer et le Schema.org.
 */
export const BRAND_BASELINE = 'Sellerie western & reining — vente et dépôt-vente de selles'

/** Baseline courte — signal SEO injecté dans le titre par défaut / suffixe. */
export const BRAND_BASELINE_SHORT = 'Sellerie western & reining'

/**
 * Titre par défaut (homepage / pages sans titre propre). Contient à la fois la
 * marque « Spin & Slide » ET le signal « Sellerie western & reining » exigés au
 * SEO — cf. titleTemplate dans app/app.vue.
 */
export const BRAND_DEFAULT_TITLE = `${BRAND_NAME} — ${BRAND_BASELINE}`

/** Suffixe de titre par page (« %s · Spin & Slide Shop »). */
export const BRAND_TITLE_SUFFIX = BRAND_NAME
