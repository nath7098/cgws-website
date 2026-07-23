// app/utils/consignmentPhotoUpload.ts
// US-095 — Logique métier extraite (et testable sans DOM/lib de compression)
// pour fiabiliser la soumission du formulaire de dépôt de selle
// (app/components/consignation/ConsignmentForm.vue).
//
// ⚠️ Ce module ne doit JAMAIS importer `browser-image-compression` de façon
// statique : cette librairie est browser-only (Canvas/OffscreenCanvas/Web
// Worker) et casserait le rendu SSR du composant si elle était chargée au
// niveau module. La fonction de compression réelle est donc TOUJOURS
// injectée par l'appelant (`compressFn`), qui l'obtient lui-même via un
// `await import('browser-image-compression')` dynamique placé DANS le
// handler de soumission — jamais en haut de fichier. Voir ConsignmentForm.vue.

/**
 * Seuil de payload PHOTOS cumulé (après compression) considéré sûr avant
 * tout envoi réseau.
 *
 * Justification de la valeur (3 Mo) : la limite par défaut du corps d'une
 * Serverless Function Vercel (plan utilisé par CGWS) est d'environ 4,5 Mo.
 * Le payload multipart réel envoyé au serveur n'est pas QUE les photos : il
 * inclut aussi les boundaries multipart, les en-têtes par partie
 * (Content-Disposition, Content-Type — répétés pour chaque champ texte ET
 * chaque photo) et les champs texte du formulaire (jusqu'à ~50 000
 * caractères de description + les autres champs). Un budget photos de 3 Mo
 * laisse donc une marge d'environ 1,5 Mo pour cet overhead — largement
 * suffisant même dans le pire cas (5 photos, description au maximum, noms de
 * fichiers longs) — sans s'approcher dangereusement de la limite réelle.
 */
export const MAX_CUMULATIVE_PHOTO_BYTES = 3 * 1024 * 1024 // 3 MB

/** Message bloquant affiché AVANT tout envoi réseau si le seuil est dépassé. */
export const CUMULATIVE_PHOTO_LIMIT_MESSAGE
  = 'Vos photos sont trop volumineuses au total, réduisez leur nombre ou leur résolution'

/** Options de compression ciblées par la US : ~1600px de large max, qualité ~75%. */
export const PHOTO_COMPRESSION_OPTIONS = {
  maxWidthOrHeight: 1600,
  initialQuality: 0.75,
  useWebWorker: true,
} as const

export type PhotoCompressionResult
  = | { status: 'success', index: number, file: File, originalName: string }
    | { status: 'failure', index: number, originalName: string, message: string }

/** Somme des tailles (octets) d'une liste de fichiers. */
export function totalFileSize(files: File[]): number {
  return files.reduce((sum, file) => sum + file.size, 0)
}

/** `true` si le total cumulé franchit STRICTEMENT le seuil sûr. */
export function exceedsCumulativeLimit(totalBytes: number): boolean {
  return totalBytes > MAX_CUMULATIVE_PHOTO_BYTES
}

/**
 * Compresse chaque fichier via `compressFn` (injectée pour la testabilité —
 * en production elle enveloppe `browser-image-compression`, importée
 * dynamiquement par l'appelant). Un échec isolé (format inattendu, fichier
 * corrompu) est capturé et reporté avec son index d'origine, SANS
 * interrompre le traitement des fichiers suivants ni faire échouer
 * l'ensemble de la compression — c'est à l'appelant de décider comment
 * traiter les échecs (ex. retirer le fichier concerné et continuer).
 */
export async function compressPhotos(
  files: File[],
  compressFn: (file: File) => Promise<File>,
): Promise<PhotoCompressionResult[]> {
  const results: PhotoCompressionResult[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!
    try {
      const compressed = await compressFn(file)
      results.push({ status: 'success', index: i, file: compressed, originalName: file.name })
    } catch (err) {
      results.push({
        status: 'failure',
        index: i,
        originalName: file.name,
        message: err instanceof Error ? err.message : 'Compression impossible',
      })
    }
  }

  return results
}
