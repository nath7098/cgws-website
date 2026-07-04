# Correctifs — Étoile-boussole (StarDivider) & Hero — Note de design ciblée

**Statut** : correctif ponctuel sur composants déjà livrés (`US-072`, `US-073`). Ne remplace pas les specs existantes, les complète/corrige.
**Fichiers concernés** :
- `app/components/ui/StarDivider.vue`
- `app/components/home/HeroSection.vue`
- **Nouveau** : `app/utils/compassStar.ts` (utilitaire à créer)
**Réf. géométrique canonique** : artifact client `cgws-v3-preview` (fonction `compassStar(size)` fournie par l'orchestrateur, reprise telle quelle ci-dessous).
**Rappel de la règle du système** (`DESIGN_SYSTEM_v3.md` §2.1) : `accent-deco` = décoratif uniquement, jamais de texte lisible ; `accent` = tout texte lisible, AA ≥4.5:1 obligatoire, jamais supposé conforme par analogie.

---

## Bug #4 — L'étoile-boussole avec nombre (`variant="stat"`) ne ressemble pas au design system

### Constat (audit du code actuel)

`StarDivider.vue` actuel n'utilise **pas** le motif canonique dans ses deux variantes, à des degrés différents :

**`variant="stat"`** — divergence totale. Le composant empile : un cercle plein bordé (`border-2 border-cgws-accent-deco`), un anneau pointillé (`border-dashed ... /50`), et **8 petits triangles séparés** positionnés en dehors du cercle (`points="50,-6 55,10 45,10"` etc. — des pointes de vis/tooling, pas une étoile). Ce n'est pas le polygone 16-sommets de la référence : c'est un motif "concho + rayons" hérité conceptuellement de l'ancien `ConchoStat` v2, jamais remplacé par la vraie géométrie.

**`variant="divider"`** — divergence géométrique partielle, plus subtile mais réelle. Le polygone actuel *a l'air* d'une étoile 16 sommets, mais ses proportions ne respectent pas la formule canonique. Calcul vérifié sur les points actuels vs la formule de référence (`c = 50` pour un `viewBox 0 0 100 100`) :

| Élément | Rayon référence (formule) | Rayon mesuré dans le code actuel | Écart |
|---|---|---|---|
| Pointe longue (cardinale) | `longR = c` → 50 | ≈ 50 (point `50,3`, quasi correct) | conforme |
| Pointe courte (diagonale) | `shortR = 0.42c` → 21 | ≈ 30 (point `71.2,28.8`, distance au centre ≈ 30) | **+43 %, diagonales trop longues** |
| Vallée (creux entre pointes) | `innerR = 0.16c` → 8 | ≈ 12 (point `54.6,38.9`, distance au centre ≈ 12) | **+50 %, creux pas assez profonds** |
| Centre poinçonné | `0.09c` → 4.5, **sans bordure** | `r=9` (soit `0.18c`, le double), **avec bordure `stroke-cgws-edge stroke-width="2"`** | **+100 % de rayon, bordure en trop** |

Résultat visuel : une étoile plus "trapue" (diagonales longues, creux peu marqués) et un centre bien plus gros et cerclé — perceptiblement différente de la silhouette fine et nette de la référence, même si le `variant="divider"` semble à première vue correct.

**Conclusion** : les deux variantes doivent être régénérées depuis la formule canonique, pas seulement corrigées au niveau du centre. C'est précisément le type de divergence qu'une fonction partagée évite.

### Correction prescrite

#### 1. Créer l'utilitaire partagé `app/utils/compassStar.ts`

```ts
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
```

- `viewBoxSize` reste toujours `100` en pratique (le viewBox SVG ne change pas, seule la taille rendue change via les classes Tailwind `w-*/h-*`) — la fonction est paramétrée pour rester réutilisable si un viewBox différent est nécessaire un jour, mais les deux appels dans `StarDivider.vue` utiliseront `compassStarPoints()` (défaut 100) sans argument.
- Cette factorisation répond explicitement à la demande : un seul point de génération, consommé par `variant="divider"` **et** `variant="stat"`, empêchant toute divergence future entre les deux.

#### 2. `variant="divider"` — remplacer le polygone et corriger le centre

```html
<script setup lang="ts">
import { compassStarPoints, compassStarCenterRadius } from '~/utils/compassStar'

const STAR_POINTS = compassStarPoints()        // calcul unique, statique
const STAR_CENTER_R = compassStarCenterRadius() // 4.5 pour viewBox 100
</script>

<svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 100 100" aria-hidden="true">
  <polygon class="fill-cgws-accent-deco" :points="STAR_POINTS" />
  <circle cx="50" cy="50" :r="STAR_CENTER_R" class="fill-cgws-ground" />
</svg>
```

Changements vs actuel :
- `points` généré par `compassStarPoints()`, plus de valeurs codées en dur.
- Centre : `r="4.5"` (au lieu de `9`), **suppression complète de `stroke`/`stroke-width`** (la référence ne borde jamais le disque central — c'est un poinçon découpé, pas un anneau).
- Taille inchangée (`w-5 h-5` = 20px), conforme à la taille "divider" de la référence.

#### 3. `variant="stat"` — refonte complète, suppression du motif "concho + rayons"

**Éléments à supprimer intégralement** :
- Le `div` cercle extérieur bordé (`border-2 border-cgws-accent-deco`).
- Le `div` anneau intérieur pointillé (`border-dashed border-cgws-accent-deco/50`).
- Le `<svg>` des 8 polygones-triangles séparés (`points="50,-6 55,10 45,10"` etc.).

**Élément à introduire** : un unique `<svg>` étoile-boussole, identique en géométrie à celle du divider (même `compassStarPoints()`), mise à l'échelle plus grande, positionnée **au-dessus** du texte plutôt qu'en arrière-plan derrière lui.

### Décision — où placer le nombre par rapport à l'étoile solide

Deux options évaluées :

**(a) Étoile décorative au-dessus, nombre + label en dessous** (fidèle à la référence — qui ne met jamais de texte dans l'étoile).
**(b) Nombre centré dans un disque central agrandi au cœur de l'étoile.**

**Décision : (a).** Raisons, par ordre de poids :

1. **Faisabilité géométrique.** Le disque central canonique fait `0.09c` de rayon, soit `0.18c` de diamètre — à peine 18 % de la taille totale de l'étoile. Pour une étoile de 72px (taille retenue, cf. ci-dessous), cela donne un disque d'environ **13px de diamètre** : matériellement impossible d'y loger un nombre à 2-3 chiffres en `Playfair Display 700` de façon lisible. Agrandir le disque central pour faire de la place (option b) romprait les proportions canoniques mêmes que ce correctif vise à restaurer — on recréerait un nouveau bug de proportion pour en corriger un autre.
2. **Contraste non mesuré et non nécessaire.** Placer le nombre dans/sur le disque introduirait une paire de contraste inédite (`accent` sur `ground` composé à l'intérieur d'une forme `accent-deco`, ou pire, `accent` directement sur le remplissage `accent-deco`) qui n'existe dans aucune mesure du `DESIGN_SYSTEM_v3.md` §2.6. Le principe répété du doc maître — *"une paire doit être vérifiée sur l'usage réel, jamais supposée conforme par analogie"* — s'applique ici : il n'y a aucune raison d'inventer une paire non testée quand l'option (a) permet de rester sur la paire **déjà mesurée et validée** `accent` sur `ground` (5.60 / 6.88 / 6.04:1 selon rendu, §2.6).
3. **Fidélité à la référence.** La référence ne porte jamais de texte dans l'étoile, dans aucun de ses usages (hero, motif carte, divider, certificat). Introduire ce pattern uniquement pour le `variant="stat"` créerait une exception non documentée dans le système.

Le nombre + label restent donc du texte normal, en flux, sous l'étoile — pas une superposition.

### Wireframe (`variant="stat"`, corrigé)

```
┌───────────────┐
│                │
│       ✦        │   ← étoile-boussole SOLIDE, fill accent-deco
│                │      56px (mobile) / 72px (desktop), aria-hidden
│                │
│      250       │   ← Playfair Display 700 tabular-nums, text-cgws-accent
│     selles      │   ← font-eyebrow, uppercase, text-cgws-ink-soft
└───────────────┘
   role="img" aria-label="250 selles" sur le conteneur racine
```

### Classes Tailwind (`variant="stat"`, corrigé)

```html
<div class="star-stat-root flex flex-col items-center gap-2 md:gap-3" role="img" :aria-label="ariaLabel">
  <!-- Skeleton si sans valeur -->
  <div
    v-if="!hasValue"
    class="w-14 h-14 md:w-[72px] md:h-[72px] rounded-full bg-cgws-surface-2 animate-pulse"
    aria-hidden="true"
  />

  <template v-else>
    <!-- Étoile-boussole solide, décorative -->
    <svg
      class="w-14 h-14 md:w-[72px] md:h-[72px] flex-shrink-0"
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <polygon class="fill-cgws-accent-deco" :points="STAR_POINTS" />
      <circle cx="50" cy="50" :r="STAR_CENTER_R" class="fill-cgws-ground" />
    </svg>

    <!-- Nombre + label, texte lisible en flux, SOUS l'étoile -->
    <div class="flex flex-col items-center gap-0.5" aria-hidden="true">
      <span class="font-display text-3xl md:text-[32px] tabular-nums text-cgws-accent leading-none">
        {{ displayValue }}{{ suffix ?? '' }}
      </span>
      <span class="font-eyebrow text-[10px] md:text-[11px] uppercase tracking-wider text-cgws-ink-soft text-center">
        {{ label }}
      </span>
    </div>
  </template>
</div>
```

Notes :
- Taille de l'étoile : **56px mobile (`w-14 h-14`) / 72px desktop (`w-[72px] h-[72px]`)** — alignée sur la taille "motif carte 72px" de la référence pour le format desktop, réduite proportionnellement en mobile. Ni la taille "hero 58px" ni "certificat 34px" ne conviennent ici : le stat doit rester le plus visible des 3 usages non-divider (rangée de 4 dans `StatsBar`), d'où l'alignement sur la référence la plus large hors hero.
- Le skeleton "sans valeur" reste un simple cercle `bg-cgws-surface-2 animate-pulse` (pas la forme étoile) — c'est un état transitoire de chargement, pas le motif final ; inutile de complexifier le skeleton pour reproduire la silhouette exacte.
- `role="img"` + `aria-label` restent portés par `.star-stat-root` (racine), **inchangé** — c'est le même contrat qu'aujourd'hui.
- Le contenu interne (étoile SVG + bloc texte) reste `aria-hidden="true"` en cascade car l'information est déjà intégralement portée par l'`aria-label` du conteneur — évite une double annonce par les lecteurs d'écran (pattern déjà en place actuellement, conservé à l'identique).

### Contrat de props — inchangé

```ts
interface Props {
  variant?: 'divider' | 'stat'
  value?: number | string
  label?: string
  suffix?: string
  animateOnVisible?: boolean
  bgClass?: string
}
```

Aucune prop ajoutée/retirée/renommée. `StatsBar.vue` et tout autre consommateur de `StarDivider` n'ont **aucun changement d'appel** à faire.

### Animation GSAP — conservée à l'identique

Le compteur GSAP (`0 → value`, 1.5s, `power2.out`, `ScrollTrigger` sur `.star-stat-root`, `once: true`) ne dépend d'aucun des éléments supprimés (cercle, anneau, triangles) — il pilote uniquement `displayValue` via `onUpdate`, qui reste affiché dans le nouveau bloc texte sous l'étoile. **Aucun changement requis** dans le bloc `<script setup>` au-delà de l'import de `compassStarPoints`/`compassStarCenterRadius` et du calcul de `STAR_POINTS`/`STAR_CENTER_R`.

### Accessibilité — récapitulatif

| Élément | Traitement |
|---|---|
| `variant="divider"` (racine) | `aria-hidden="true"` (inchangé) |
| `variant="stat"` (racine `.star-stat-root`) | `role="img"`, `:aria-label="ariaLabel"` (inchangé, format `"{value}{suffix} {label}"`) |
| SVG étoile (les deux variantes) | `aria-hidden="true"` |
| Bloc nombre + label (`variant="stat"`) | `aria-hidden="true"` (redondant avec l'`aria-label` du parent, volontaire) |
| Contraste nombre | `text-cgws-accent` sur fond de section (`ground` par défaut) — **≥4.5:1 déjà mesuré** dans les 3 rendus (5.60 / 6.88 / 6.04:1, `DESIGN_SYSTEM_v3.md` §2.6), aucune nouvelle mesure requise grâce à la décision (a) |
| Contraste étoile | Non applicable — décoratif pur, `accent-deco` dispensé d'AA (§2.1) |

---

## Bug #3 — Hero (`HeroSection.vue`)

### 3.1 — H1 : correction du découpage par mot

**Problème.** Le titre est actuellement fragmenté caractère par caractère (`titleChars`, un `<span class="hero-letter inline-block">` par lettre, y compris les espaces) pour permettre le stagger GSAP. Chaque lettre étant une boîte inline-block **indépendante**, le navigateur insère une opportunité de saut de ligne entre n'importe quelle paire de lettres adjacentes — y compris **au milieu d'un mot** — puisqu'aucune règle CSS n'empêche actuellement ce comportement. C'est précisément la cause du bug (c'est aussi, incidemment, la preuve que les boîtes inline-block adjacentes sans nœud texte entre elles sont "cassables" par défaut : le correctif doit donc désactiver ce comportement *à l'intérieur* de chaque mot, pas le supprimer partout).

**Correction prescrite** : regrouper les lettres par mot dans un wrapper `inline-block whitespace-nowrap`. Le `whitespace-nowrap` supprime toutes les opportunités de saut de ligne *à l'intérieur* du wrapper (donc entre les lettres qu'il contient), tandis que les limites du wrapper lui-même (avant/après) restent des points de saut valides pour le H1 parent (resté en `white-space: normal` par défaut) — exactement comme aujourd'hui entre deux mots.

**Modèle de données** :

```ts
interface TitleLetter {
  char: string
  key: number
}
interface TitleWord {
  key: number
  chars: TitleLetter[]
}

const titleWords = computed<TitleWord[]>(() => {
  let k = 0
  return TITLE.split(' ').map((word, wi) => ({
    key: wi,
    chars: word.split('').map((char) => ({ char, key: k++ })),
  }))
})
```

**Structure de template** (mots → lettres) :

```html
<h1
  class="font-display font-bold uppercase leading-none text-cgws-brand-cream
         text-[52px] sm:text-[68px] md:text-[80px] lg:text-[96px] xl:text-[108px]
         mb-5 md:mb-7 max-w-[15ch] lg:max-w-[12ch]"
  aria-label="L'AUTHENTIQUE WESTERN À VOTRE PORTÉE"
>
  <template v-for="(word, wi) in titleWords" :key="word.key">
    <span class="inline-block whitespace-nowrap">
      <span
        v-for="letter in word.chars"
        :key="letter.key"
        class="hero-letter inline-block"
        aria-hidden="true"
      >{{ letter.char }}</span>
    </span><span
      v-if="wi < titleWords.length - 1"
      class="hero-letter inline-block w-[0.25em]"
      aria-hidden="true"
    > </span>
  </template>
</h1>
```

Points clés à respecter en implémentation :
- Chaque **lettre** reste un `.hero-letter inline-block` individuel — le sélecteur GSAP `.hero-letter` continue de cibler exactement les mêmes éléments qu'aujourd'hui (lettres visibles + espaces inter-mots), donc `tl.from('.hero-letter', { opacity: 0, y: 30, stagger: 0.035, duration: 0.45 }, 0.15)` fonctionne **sans aucune modification** du bloc GSAP.
- L'espaceur inter-mots (`w-[0.25em]`) reste **en dehors** du wrapper `whitespace-nowrap` du mot — c'est lui qui porte l'opportunité de saut de ligne entre deux mots, exactement comme le point de rupture existait déjà entre lettres avant ce correctif (le comportement n'est pas supprimé, seulement confiné aux limites de mot).
- Ne pas insérer d'espace texte brut entre les balises `<span>` dans le template (attention à l'indentation du `<template>` — Vue ignore les retours à la ligne/espaces entre balises par défaut, mais un espace littéral taperait dans le rendu et fausserait le calcul ; d'où le `<span> ... </span><span ...>` collé sans retour à la ligne dans l'exemple ci-dessus).
- L'`aria-label` du H1 reste la source unique lue par les lecteurs d'écran ; tous les spans (mots, lettres, espaceurs) restent `aria-hidden="true"` — pattern déjà correct aujourd'hui, inchangé.

### 3.2 — Eyebrow : retravailler le style

**Problème.** L'eyebrow actuel (`font-eyebrow text-[13px] text-cgws-brand-sand uppercase tracking-[0.2em]`) ne porte aucune classe de graisse — `font-eyebrow` ne pilote que la *famille* de police (indirection CSS vers `--cgws-font-eyebrow`, cf. `tokens.css`/`main.css`), jamais le poids. Playfair Display s'affiche donc au poids par défaut du navigateur (400, fin) plutôt qu'au 600 attendu par la référence — d'où un rendu "pas beau", trop léger pour porter une capitale espacée sur photo.

**Référence** : `font-weight:600; uppercase; letter-spacing:.42em; font-size:.72rem; color: var(--accent); padding-left:.42em` (le `padding-left` compense visuellement le tracking final pour un **centrage optique** d'un bloc **centré**).

**Deux ajustements nécessaires par rapport à une copie littérale de la référence** :

1. **Couleur — `accent` écarté, `brand-sand` conservé.** Le Hero est posé sur une photo sombre avec scrim, pas sur le fond clair de la référence. `accent` en Élégante Jour est un mauve foncé (`#8C4A56`) pensé pour un contraste sur `ground` clair (`#F6EDDF`) — sur un scrim `brand-espresso/90` (quasi noir), ce mauve foncé se fondrait dans l'arrière-plan sombre (deux tons sombres proches). Le Hero utilise déjà, par décision assumée (`US-073` §1.3), des **littéraux de marque fixes** pour tout élément posé sur la photo (`brand-cream` pour le H1, `brand-sand` pour la tagline et l'indicateur de scroll) — précisément parce que ces littéraux ne changent jamais de teinte et restent clairs/lisibles sur fond sombre quelle que soit la peau active. L'eyebrow doit suivre la même règle : conserver `text-cgws-brand-sand`, ne **pas** basculer vers `accent`. Adopter `accent` ici romprait la cohérence de traitement du Hero (le seul élément qui varie déjà, par design, est le CTA primaire et l'arche — cf. `US-073` §1.3) et introduirait un risque de lisibilité en Élégante Jour.
2. **Tracking — réduit de `0.42em` à `0.3em`.** L'eyebrow de la référence est pensée pour des libellés courts (1-3 mots, ex. "Notre Passion"). Le texte réel du Hero ("Sellerie Équestre Western · Brèches, 37", 6 mots/40 signes) déborderait sur mobile 375px avec un tracking de `0.42em` par caractère. `0.3em` conserve l'esprit "capitale espacée" tout en restant compatible avec la largeur mobile et le fait que ce texte est plus long que les eyebrows de section habituelles.
3. **Pas de `padding-left` de compensation.** Le `padding-left: .42em` de la référence compense le tracking pour un bloc **centré** (`text-align: center`). L'eyebrow du Hero est **aligné à gauche**, précédé d'une barre décorative (cf. ci-dessous) — il n'y a rien à centrer optiquement ici. Appliquer ce padding sans réfléchir créerait un décalage non désiré entre la barre et le texte. **Ne pas copier cette valeur.**

**Ajout — barre décorative, pour cohérence avec le reste du site.** `OurStorySection.vue` porte déjà une petite barre verticale `bg-cgws-accent-deco` devant son eyebrow "Notre Passion" (traitement confirmé conforme, cf. `US-073-074-075` §3.2). Reproduire le même motif dans le Hero unifie le "signe distinctif eyebrow" à travers le site, et donne un point d'ancrage visuel supplémentaire cohérent avec la famille `accent-deco` (couture/ornement).

**Correction prescrite** :

```html
<!-- Wrapper : la classe .hero-eyebrow (ciblée par GSAP) migre du <p> vers ce <div> -->
<div class="hero-eyebrow flex items-center gap-2.5 mt-6 mb-4 md:mb-5">
  <span class="block w-0.5 h-3 bg-cgws-accent-deco flex-shrink-0" aria-hidden="true" />
  <p class="font-eyebrow font-semibold text-[11px] md:text-xs text-cgws-brand-sand uppercase tracking-[0.3em]">
    Sellerie Équestre Western · Brèches, 37
  </p>
</div>
```

Points d'implémentation :
- La classe `.hero-eyebrow`, ciblée par `tl.from('.hero-eyebrow', { opacity: 0, y: -8, duration: 0.5 }, 0)`, doit être déplacée sur le **wrapper** (le `<div>`), pas laissée sur le `<p>` interne — sinon seul le texte s'anime, pas la barre, ce qui romprait l'unité visuelle de l'entrée en scène.
- Barre : `w-0.5 h-3` (2px × 12px), même épaisseur que celle de `OurStorySection` (`w-0.5 h-5`) mais légèrement raccourcie (`h-3` au lieu de `h-5`) pour rester proportionnée à un texte `11px` (vs `13px` en `OurStorySection`) — `aria-hidden="true"`, décorative pure, `accent-deco`.
- Contraste : `brand-sand` sur `brand-espresso/90→/40` — littéral déjà en usage ailleurs dans le Hero (tagline, scroll indicator), **aucune nouvelle paire non mesurée introduite**. Reste soumis à la vérification QA déjà signalée dans `US-073` §1.3/§7 (paires littérales non pré-calculées dans le doc maître) — ce correctif n'aggrave ni ne résout ce point, il est simplement hérité tel quel.

### 3.3 — Retirer `SaddleIllustration` du Hero

**Correction prescrite** :

1. Supprimer l'import :
   ```diff
   - import SaddleIllustration from './SaddleIllustration.vue'
   ```
2. Supprimer entièrement le bloc de template :
   ```diff
   - <!-- Saddle illustration (desktop only) -->
   - <div
   -   class="saddle-illustration-wrapper absolute z-[2] hidden md:block
   -          right-[6%] lg:right-[8%] xl:right-[10%]
   -          top-1/2 -translate-y-[55%]
   -          w-[200px] lg:w-[260px] xl:w-[300px]
   -          opacity-70 md:opacity-75"
   -   aria-hidden="true"
   - >
   -   <SaddleIllustration />
   - </div>
   ```
3. Supprimer le tween GSAP devenu orphelin dans la timeline (`onMounted`) :
   ```diff
   - tl.from('.saddle-illustration-wrapper', {
   -   opacity: 0,
   -   x: 30,
   -   duration: 0.9,
   -   ease: 'power1.out',
   - }, 0.4)
   ```
   Sans cette suppression, le `gsap.from()` ciblerait un sélecteur inexistant — GSAP ne lève pas d'erreur dans ce cas (no-op silencieux), mais c'est du code mort à nettoyer explicitement (cf. Definition of Done : pas de logique orpheline).

**Confirmation demandée dans la mission — réponse tranchée** : `SaddleIllustration.vue` **reste dans le dépôt** (fichier non supprimé) — il n'est simplement plus importé/rendu par `HeroSection.vue`. Il redevient un composant disponible pour un usage futur ailleurs sur le site (ou en dev-components), sans lien avec ce correctif. Cette position est cohérente avec le point déjà signalé en `US-073` §"Point produit à confirmer" : l'asset est un résidu v2 ("sellerie western brute") potentiellement incohérent avec le nouveau logo (cavalière de reining) — sa suppression du Hero n'est donc pas seulement une correction de bug isolée, elle anticipe cette réserve déjà remontée à `product-owner`/Camille.

**Vide visuel à droite du Hero — confirmation** : retirer l'illustration ne laisse **aucun trou visuel à combler**. Le Hero est une photographie plein cadre (`NuxtPicture` en `absolute inset-0`) avec un scrim en dégradé — l'illustration était une **surcouche** positionnée par-dessus la photo (`absolute z-[2]`), indépendante du flux de contenu texte (lui-même dans une colonne distincte, ancrée à gauche/bas). Sa suppression fait simplement réapparaître la photo de fond à cet emplacement, ce qui est le comportement par défaut attendu et esthétiquement acceptable (le Hero reste un plan photo immersif, cohérent avec la philosophie "IMMERSIVE" du système). **Aucun élément de remplacement n'est requis.** Aucun autre changement de mise en page (colonne de contenu, CTA, arche fine) n'est nécessaire suite à ce retrait.

---

## Checklist de critères d'acceptation (vérifiables par `qa-engineer`)

```gherkin
Fonctionnalité : Correctifs Bug #4 (étoile-boussole) et Bug #3 (Hero)

  Scénario : Géométrie canonique de l'étoile — variant divider
    Étant donné le composant StarDivider en variant="divider"
    Alors le polygone de l'étoile est généré par compassStarPoints()
    Et le cercle central a un rayon de 4.5 sur un viewBox 100 (ratio 0.09)
    Et le cercle central ne porte aucune bordure (stroke)

  Scénario : Géométrie canonique de l'étoile — variant stat
    Étant donné le composant StarDivider en variant="stat" avec une valeur
    Alors l'étoile est un unique polygone généré par compassStarPoints()
      (même géométrie que le variant divider, pas de cercle bordé ni de
      triangles séparés résiduels)
    Et le nombre et le label sont affichés en texte normal SOUS l'étoile,
      jamais superposés ni intégrés dans le disque central

  Scénario : Factorisation de la géométrie
    Alors app/utils/compassStar.ts existe et exporte compassStarPoints()
    Et StarDivider.vue importe et utilise cette fonction dans les deux variantes
    Et aucun tableau de points d'étoile n'est codé en dur dans StarDivider.vue

  Scénario : Lisibilité du nombre (variant stat)
    Alors la valeur numérique utilise la classe "text-cgws-accent" (jamais
      "text-cgws-accent-deco")
    Et le contraste accent/ground mesure ≥ 4.5:1 dans les 3 rendus
      (élégante-jour, élégante-nuit, rugueux)

  Scénario : Accessibilité StarDivider inchangée
    Alors le variant="divider" porte "aria-hidden=true" sur sa racine
    Et le variant="stat" porte "role=img" et un "aria-label" au format
      "{value}{suffix} {label}" sur sa racine
    Et le SVG étoile est "aria-hidden=true" dans les deux variantes

  Scénario : Contrat de props StarDivider préservé
    Alors les props value/label/suffix/animateOnVisible/variant/bgClass
      restent inchangées
    Et StatsBar.vue ne nécessite aucune modification de ses appels à StarDivider

  Scénario : Compteur GSAP toujours fonctionnel
    Étant donné un StarDivider variant="stat" avec animateOnVisible=true
    Quand le composant entre dans le viewport
    Alors la valeur s'anime de 0 à sa valeur finale en 1.5s (power2.out)
    Et l'animation ne se déclenche qu'une fois (ScrollTrigger once: true)

  Scénario : H1 du Hero ne coupe jamais un mot
    Étant donné le Hero affiché à 375px, 768px et 1440px de large
    Alors aucun mot du H1 n'est visuellement scindé entre deux lignes
    Et chaque lettre individuelle reste un span ".hero-letter" animable
    Et le stagger GSAP anime toutes les lettres comme avant ce correctif

  Scénario : Eyebrow du Hero lisible et stylée
    Alors l'eyebrow porte "font-semibold" en plus de "font-eyebrow"
    Et une barre décorative accent-deco précède le texte, "aria-hidden=true"
    Et la couleur du texte reste "text-cgws-brand-sand" (pas "accent")
    Et l'animation GSAP ".hero-eyebrow" cible le wrapper (barre + texte),
      pas seulement le texte

  Scénario : Suppression de SaddleIllustration du Hero
    Alors HeroSection.vue ne contient plus d'import de SaddleIllustration.vue
    Et le template ne rend plus <SaddleIllustration />
    Et aucun tween GSAP ne cible ".saddle-illustration-wrapper"
    Et le fichier SaddleIllustration.vue existe toujours dans le dépôt
      (non supprimé, simplement non consommé par le Hero)

  Scénario : Qualité de code
    Alors "vue-tsc --noEmit" ne remonte aucune erreur
    Et ESLint ne remonte aucune erreur
    Et aucun "any" TypeScript n'est introduit

  Scénario : Vérification dans les 3 rendus
    Quand StarDivider (les deux variantes) et HeroSection sont affichés dans
      "élégante-jour", "élégante-nuit" et "rugueux"
    Alors la géométrie de l'étoile est visuellement identique dans les 3 rendus
      (seule la teinte accent-deco change)
    Et l'eyebrow du Hero reste lisible sur le scrim photo dans les 3 rendus
```

---

## Récapitulatif des décisions clés

| # | Décision | Justification en une ligne |
|---|---|---|
| 1 | Nombre + label **sous** l'étoile (option a), jamais dans le disque central (option b) | Le disque canonique (0.09c) est géométriquement trop petit pour du texte lisible, et forcer un texte dedans introduirait une paire de contraste jamais mesurée |
| 2 | Géométrie factorisée dans `app/utils/compassStar.ts`, consommée par les deux variantes | Élimine la cause racine du bug (points recopiés à la main, ayant dérivé de la formule canonique dans le variant divider aussi, pas seulement le stat) |
| 3 | Centre de l'étoile : `r = 0.09c`, sans bordure, dans les deux variantes | Conforme à la référence ; corrige le `r=9` bordé actuel (`0.18c` + `stroke-cgws-edge`) |
| 4 | Eyebrow Hero : couleur `brand-sand` conservée (pas `accent`), tracking réduit à `0.3em` (pas `0.42em`), pas de `padding-left` compensatoire | Cohérence avec le traitement "littéraux fixes" déjà tranché pour le Hero (`US-073` §1.3) ; `accent` illisible sur scrim sombre en Élégante Jour ; le texte de 6 mots déborderait à `0.42em` sur mobile ; le padding de centrage ne s'applique qu'aux eyebrows centrés, pas ici (aligné à gauche + barre) |
| 5 | `SaddleIllustration` retirée du Hero mais conservée dans le dépôt | Résidu v2 déjà signalé comme potentiellement incohérent avec le nouveau logo (cavalière de reining) ; aucun élément de remplacement nécessaire, la photo plein cadre comble l'espace |
