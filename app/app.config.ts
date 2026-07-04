// Theming runtime Nuxt UI v4 — voir US-070-design-system-v3.md §4
//
// Décision tranchée (option 1 de la spec) : on NE relie PAS ui.colors.primary
// aux tokens CGWS. Nuxt UI v4 exige que `ui.colors.primary` pointe vers une
// couleur Tailwind complète avec les nuances 50 à 950 (voir
// mcp__nuxt-ui-remote "Design System" doc, section Colors : "make sure to
// define all shades from 50 to 950"). Nos rôles CGWS (--cgws-accent,
// --cgws-danger, etc.) sont des tokens plats (une seule valeur par rôle et
// par peau/mode), pas une échelle — générer une échelle 50-950 synthétique
// est un travail non demandé par le brief pour ce sprint (option 2 de la
// spec, explicitement mise de côté).
//
// Conséquence : les composants Nuxt UI natifs utilisés tels quels (UModal,
// USelectMenu, UTable...) gardent leur palette neutre Nuxt UI par défaut.
// Tous les composants CGWS custom (CgwsButton, TagCard, CgwsBadge...)
// utilisent directement les classes bg-cgws-accent / text-cgws-danger etc.
// A documenter comme dette si des composants Nuxt UI natifs non stylés
// custom apparaissent dans le backoffice et doivent suivre la peau active.
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'stone',
      neutral: 'stone',
    },
  },
})
