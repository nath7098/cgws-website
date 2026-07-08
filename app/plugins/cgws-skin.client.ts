/**
 * Resynchronise l'état réactif `useCgwsSkin()` avec la vraie préférence
 * stockée en localStorage, une fois l'application montée (hook `app:mounted`,
 * qui se déclenche APRÈS l'hydratation complète).
 *
 * Le script anti-flash inline (voir `app/app.vue`) a déjà posé le bon
 * attribut `data-skin` sur `<html>` avant le premier paint — les couleurs
 * affichées sont donc déjà correctes dès le rendu SSR. Ce plugin ne fait que
 * mettre à jour la valeur réactive Vue `skin` (utilisée pour l'état visuel
 * du `ThemeSwitcher` lui-même, ex. quel bouton segmenté est actif), ce qui
 * ne peut pas être fait plus tôt sans provoquer un warning d'hydration
 * mismatch (cf. `useCgwsSkin.ts` pour le détail du raisonnement).
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', () => {
    const { skin } = useCgwsSkin()
    const resolved = readStoredCgwsSkin()

    if (resolved !== skin.value) {
      skin.value = resolved
    }

    document.documentElement.dataset.skin = resolved
  })
})
