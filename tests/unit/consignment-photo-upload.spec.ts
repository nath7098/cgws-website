/**
 * US-095 — Tests unitaires de la logique métier extraite pour fiabiliser la
 * soumission du formulaire de dépôt de selle (app/utils/consignmentPhotoUpload.ts) :
 * calcul du total cumulé, franchissement du seuil de payload sûr, et
 * comportement d'orchestration de la compression quand un fichier échoue.
 *
 * ⚠️ Portée : `browser-image-compression` (la lib réelle de compression)
 * n'est PAS testée ici — elle est browser-only (Canvas/Web Worker) et hors de
 * portée d'un environnement Vitest "node". Seule la fonction `compressFn` est
 * mockée/injectée : c'est l'ORCHESTRATION (compressPhotos) qui est couverte,
 * exactement comme ConsignmentForm.vue l'utilise en production.
 */
import { describe, expect, it } from 'vitest'
import {
  compressPhotos,
  CUMULATIVE_PHOTO_LIMIT_MESSAGE,
  exceedsCumulativeLimit,
  MAX_CUMULATIVE_PHOTO_BYTES,
  totalFileSize,
} from '~/utils/consignmentPhotoUpload'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeFile(name: string, sizeBytes: number, type = 'image/jpeg'): File {
  // Un Blob dont le contenu réel correspond à `sizeBytes` — `File.size` reflète
  // la taille réelle du buffer, pas une valeur déclarée.
  return new File([new Uint8Array(sizeBytes)], name, { type })
}

// ─── totalFileSize ────────────────────────────────────────────────────────────

describe('totalFileSize', () => {
  it('additionne la taille de plusieurs fichiers', () => {
    const files = [makeFile('a.jpg', 1000), makeFile('b.jpg', 2000), makeFile('c.jpg', 500)]
    expect(totalFileSize(files)).toBe(3500)
  })

  it('retourne 0 pour une liste vide', () => {
    expect(totalFileSize([])).toBe(0)
  })
})

// ─── exceedsCumulativeLimit ───────────────────────────────────────────────────

describe('exceedsCumulativeLimit', () => {
  it('ne franchit pas le seuil quand le total est strictement inférieur', () => {
    expect(exceedsCumulativeLimit(MAX_CUMULATIVE_PHOTO_BYTES - 1)).toBe(false)
  })

  it('ne franchit pas le seuil quand le total est exactement égal (limite non stricte)', () => {
    expect(exceedsCumulativeLimit(MAX_CUMULATIVE_PHOTO_BYTES)).toBe(false)
  })

  it('franchit le seuil dès que le total dépasse strictement la limite', () => {
    expect(exceedsCumulativeLimit(MAX_CUMULATIVE_PHOTO_BYTES + 1)).toBe(true)
  })

  it('reflète un scénario réaliste : 5 photos compressées à ~700 Ko dépassent le seuil de 3 Mo', () => {
    const files = Array.from({ length: 5 }, (_, i) => makeFile(`photo-${i}.jpg`, 700 * 1024))
    expect(exceedsCumulativeLimit(totalFileSize(files))).toBe(true)
  })

  it('reflète un scénario réaliste : 5 photos compressées à ~400 Ko restent sous le seuil de 3 Mo', () => {
    const files = Array.from({ length: 5 }, (_, i) => makeFile(`photo-${i}.jpg`, 400 * 1024))
    expect(exceedsCumulativeLimit(totalFileSize(files))).toBe(false)
  })
})

// ─── Message bloquant ─────────────────────────────────────────────────────────

describe('CUMULATIVE_PHOTO_LIMIT_MESSAGE', () => {
  it('correspond exactement au message attendu par les critères d\'acceptation (US-095)', () => {
    expect(CUMULATIVE_PHOTO_LIMIT_MESSAGE).toBe(
      'Vos photos sont trop volumineuses au total, réduisez leur nombre ou leur résolution',
    )
  })
})

// ─── compressPhotos — orchestration ───────────────────────────────────────────

describe('compressPhotos', () => {
  it('compresse tous les fichiers avec succès en préservant leur ordre et index d\'origine', async () => {
    const files = [makeFile('a.jpg', 5000), makeFile('b.jpg', 6000)]
    const compressFn = async (file: File): Promise<File> => makeFile(file.name, Math.floor(file.size / 2))

    const results = await compressPhotos(files, compressFn)

    expect(results).toHaveLength(2)
    expect(results[0]).toMatchObject({ status: 'success', index: 0, originalName: 'a.jpg' })
    expect(results[1]).toMatchObject({ status: 'success', index: 1, originalName: 'b.jpg' })
    expect((results[0] as { file: File }).file.size).toBe(2500)
  })

  it('isole un échec de compression sur UN fichier sans bloquer le traitement des autres', async () => {
    const files = [makeFile('good-1.jpg', 5000), makeFile('corrupted.jpg', 5000), makeFile('good-2.jpg', 5000)]
    const compressFn = async (file: File): Promise<File> => {
      if (file.name === 'corrupted.jpg') {
        throw new Error('Format non supporté')
      }
      return file
    }

    const results = await compressPhotos(files, compressFn)

    expect(results).toHaveLength(3)
    expect(results[0]).toMatchObject({ status: 'success', index: 0, originalName: 'good-1.jpg' })
    expect(results[1]).toMatchObject({
      status: 'failure',
      index: 1,
      originalName: 'corrupted.jpg',
      message: 'Format non supporté',
    })
    expect(results[2]).toMatchObject({ status: 'success', index: 2, originalName: 'good-2.jpg' })
  })

  it('retombe sur un message générique si l\'erreur de compression n\'est pas une Error', async () => {
    const files = [makeFile('weird.jpg', 100)]
    const compressFn = async (): Promise<File> => {
      return Promise.reject('boom')
    }

    const results = await compressPhotos(files, compressFn)

    expect(results[0]).toMatchObject({ status: 'failure', message: 'Compression impossible' })
  })

  it('renvoie un tableau vide pour une liste de fichiers vide, sans appeler compressFn', async () => {
    let callCount = 0
    const compressFn = async (file: File): Promise<File> => {
      callCount++
      return file
    }

    const results = await compressPhotos([], compressFn)

    expect(results).toEqual([])
    expect(callCount).toBe(0)
  })

  it('permet de reconstituer, à partir des résultats, la liste des fichiers à téléverser après filtrage des échecs', async () => {
    const files = [makeFile('ok.jpg', 1000), makeFile('bad.jpg', 1000)]
    const compressFn = async (file: File): Promise<File> => {
      if (file.name === 'bad.jpg') throw new Error('corrompu')
      return file
    }

    const results = await compressPhotos(files, compressFn)
    const successes = results.filter(r => r.status === 'success')
    const failures = results.filter(r => r.status === 'failure')

    expect(successes).toHaveLength(1)
    expect(failures).toHaveLength(1)
    expect(failures[0]?.index).toBe(1)
  })
})
