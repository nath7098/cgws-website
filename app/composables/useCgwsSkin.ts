export type CgwsSkin = 'elegante' | 'rugueux'

export const CGWS_SKIN_STORAGE_KEY = 'cgws-skin'

/**
 * Peau (skin) active du site — axe indépendant du mode jour/nuit natif
 * @nuxtjs/color-mode (US-071, cf. docs/design-specs/DESIGN_SYSTEM_v3.md §6.2
 * et docs/design-specs/US-071-theme-switcher.md).
 *
 * État réactif partagé (via `useState`, SSR-friendly) backé par
 * `localStorage['cgws-skin']`, piloté aussi via l'attribut `data-skin` posé
 * sur `<html>`. Défaut : 'elegante'.
 *
 * Anti-flash : le rendu SSR initial connaît uniquement la valeur par défaut
 * 'elegante' (le serveur n'a pas accès au localStorage du client). Un script
 * bloquant déclaré dans `app/app.vue` (via `useHead`, `tagPriority: 'critical'`)
 * pose déjà l'attribut `data-skin` correct sur `<html>` avant le premier
 * paint — ce qui évite tout flash visuel des couleurs. L'état réactif Vue
 * `skin` (utilisé pour l'affichage du `ThemeSwitcher` lui-même) est ensuite
 * resynchronisé par `app/plugins/cgws-skin.client.ts`, au hook `app:mounted`
 * (donc **après** l'hydratation) pour ne jamais provoquer de warning de
 * mismatch d'hydratation.
 */
export function useCgwsSkin() {
  const skin = useState<CgwsSkin>('cgws-skin', () => 'elegante')

  function setSkin(value: CgwsSkin) {
    skin.value = value

    if (import.meta.client) {
      document.documentElement.dataset.skin = value

      try {
        localStorage.setItem(CGWS_SKIN_STORAGE_KEY, value)
      }
      catch {
        // localStorage indisponible (navigation privée, quota dépassé...) —
        // l'état réactif en mémoire reste appliqué pour la session en cours.
      }
    }
  }

  return { skin, setSkin }
}

/**
 * Lit la préférence de peau stockée côté client. Retourne toujours
 * 'elegante' côté serveur (le localStorage n'existe pas en SSR) — utilisé
 * uniquement par le plugin de resynchronisation post-montage.
 */
export function readStoredCgwsSkin(): CgwsSkin {
  if (import.meta.server) return 'elegante'

  try {
    const stored = localStorage.getItem(CGWS_SKIN_STORAGE_KEY)
    return stored === 'rugueux' ? 'rugueux' : 'elegante'
  }
  catch {
    return 'elegante'
  }
}
