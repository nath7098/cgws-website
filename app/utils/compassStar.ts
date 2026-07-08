// app/utils/compassStar.ts
// Géométrie canonique de l'étoile-boussole CGWS v3 — SOURCE UNIQUE DE VÉRITÉ.
// Reproduit exactement la fonction compassStar(size) de l'artifact de référence
// cgws-v3-preview validé par le client. Toute étoile du site (StarDivider,
// futures utilisations) DOIT consommer cette fonction — ne jamais recopier
// des points à la main (c'est exactement la cause du Bug #4).

/**
 * Génère la chaîne `points` d'un <polygon> SVG représentant l'étoile-boussole
 * 8 branches (4 longues cardinales N/E/S/W + 4 courtes diagonales NE/SE/SW/NW),
 * pour un viewBox carré `0 0 viewBoxSize viewBoxSize`.
 */
export function compassStarPoints(viewBoxSize = 100): string {
  const c = viewBoxSize / 2
  const longR = c
  const shortR = c * 0.42
  const innerR = c * 0.16
  const pts: string[] = []

  for (let i = 0; i < 8; i++) {
    const tipR = i % 2 === 0 ? longR : shortR
    const aTip = (Math.PI / 4) * i - Math.PI / 2
    pts.push(`${c + tipR * Math.cos(aTip)},${c + tipR * Math.sin(aTip)}`)

    const aVal = aTip + Math.PI / 8
    pts.push(`${c + innerR * Math.cos(aVal)},${c + innerR * Math.sin(aVal)}`)
  }

  return pts.join(' ')
}

/** Rayon du disque central poinçonné, en fraction du rayon du viewBox (c). */
export const COMPASS_STAR_CENTER_RADIUS_RATIO = 0.09

/** Rayon absolu du disque central pour un viewBox donné (ex. 100 → 4.5). */
export function compassStarCenterRadius(viewBoxSize = 100): number {
  return (viewBoxSize / 2) * COMPASS_STAR_CENTER_RADIUS_RATIO
}
