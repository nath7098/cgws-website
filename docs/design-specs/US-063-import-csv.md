# Import CSV produits en masse — Spec UX (US-063)

**Purpose** : permettre à Camille (P1) de cataloguer un lot de produits d'un coup depuis un fichier CSV plutôt que de ressaisir chaque fiche via `ProductForm` (`US-032`), **sans jamais perdre le contrôle** : un aperçu (dry-run, aucune écriture DB) est **obligatoire** avant toute validation. C'est un flux admin ponctuel (traitement par lot), pas un formulaire quotidien — la conception privilégie la lisibilité d'un tableau de contrôle dense (jusqu'à 500 lignes) plutôt que l'esthétique éditoriale du reste du site.

**Location** :
- `app/pages/admin/produits/import.vue` — page (dropzone → preview → confirm → résultat)
- `app/components/admin/CsvDropzone.vue` — nouveau, zone de dépôt fichier CSV unique
- `app/components/admin/ImportPreviewTable.vue` — nouveau, tableau d'aperçu valides/erreurs
- `app/composables/useProductImport.ts` — orchestration preview → confirm (lecture, pas de re-spec ici : logique côté `nuxt-developer`, cf. contrats de données §7)
- `server/api/admin/products/import/preview.post.ts`, `server/api/admin/products/import/confirm.post.ts` — hors périmètre visuel, contrats de données rappelés en §7 pour cohérence avec l'UI

**Dépend de** : `DESIGN_SYSTEM_v3.md` (tokens theme-aware, §2.1 règle de contraste, §4.1 taxonomie statuts), `US-032` (patterns admin CRUD produits, `ProductForm`/`ImageUploader` comme références de composant), `US-075` (conventions bi-thème actuelles de l'admin — `bg-cgws-surface` pour tout panneau/table, plus aucun `bg-white`).

**Constat important — l'admin est déjà en v3, pas en v2** : `US-032-crud-produits.md` (référence demandée) documente encore les tokens v2 (`cgws-tack`, `cgws-copper`, `cgws-rust`…). L'audit du code réel (`app/pages/admin/produits/index.vue`, `app/components/admin/KpiCard.vue`, `ImageUploader.vue`, `app/layouts/admin.vue`) confirme que le rebranding `US-070`/`US-075` a déjà migré tout l'admin vers les rôles theme-aware (`bg-cgws-surface`, `text-cgws-ink`, `text-cgws-accent`, `text-cgws-danger`, `text-cgws-success`…). Cette spec suit donc **le code actuel**, pas `US-032`, et n'introduit aucun token v2.

---

## 0. Décisions clés (résumé — détail et justification dans les sections dédiées)

| # | Décision | Où |
|---|---|---|
| 1 | Titre de page en `font-serif font-bold` (Playfair), **pas** `font-heading` (Rye) | §1, cohérent avec toutes les pages admin existantes |
| 2 | `CsvDropzone.vue` = nouveau composant, adapté du **pattern** `ImageUploader.vue` (pas une extension directe : fichier unique, pas de grille de preview/réordonnancement) | §2 |
| 3 | Résumé chiffré = bandeau inline à 3 segments (pas 3× `KpiCard`) | §4 |
| 4 | Table de preview = HTML custom (`<table>`), pas `UTable`/TanStack — cohérence avec 100% des tables admin existantes | §5.0 |
| 5 | Motif d'erreur affiché **dans la même cellule** que le badge de statut (pas de colonne "Motif" séparée) | §5.2 |
| 6 | 500 lignes gérées par conteneur scrollable à hauteur max + `<thead>` sticky opaque (pas de pagination, pas de virtualisation) | §5.4 |
| 7 | Pas de modale de confirmation supplémentaire avant "Valider l'import" — l'aperçu obligatoire *est* la confirmation | §6.2 |
| 8 | Contrat de données `PreviewRow` (valid/error) précisé par nécessité UX (valeurs brutes par colonne pour les lignes en erreur) — **à confirmer avec `nuxt-developer`**, non figé par cette spec | §7 |

---

## 1. Page `/admin/produits/import`

```ts
definePageMeta({ middleware: 'admin', layout: 'admin', title: 'Import CSV produits' })
```

### En-tête

```html
<div class="flex items-center gap-3 mb-6">
  <NuxtLink to="/admin/produits"
            class="p-1.5 rounded-sm text-cgws-ink-soft hover:text-cgws-accent hover:bg-cgws-accent/10
                   transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
            aria-label="Retour à la liste des produits">
    <UIcon name="i-lucide-arrow-left" class="w-5 h-5" aria-hidden="true" />
  </NuxtLink>
  <div>
    <h2 class="font-serif font-bold text-2xl text-cgws-ink">Import CSV produits</h2>
    <p class="font-sans text-sm text-cgws-ink-soft mt-0.5">
      Créez plusieurs produits d'un coup. Un aperçu est toujours affiché avant tout enregistrement.
    </p>
  </div>
</div>
```

**Décision #1 — Playfair, pas Rye** : "Import CSV produits" fait 3 mots, donc *éligible* à `font-heading` (Rye) selon `DESIGN_SYSTEM_v3.md` §3. Mais **aucune** page admin existante n'utilise Rye pour son titre H2 de page (`Produits`, `Ventes`, `Consignations`, `Clients` — toutes en `font-serif font-bold text-2xl text-cgws-ink`, cf. `app/pages/admin/produits/index.vue` ligne `<h2 class="font-serif font-bold text-2xl text-cgws-ink">`). Rye reste réservé aux titres de section *éditoriaux* (public, `Certificat élégant`…) dans l'usage réel du code, pas aux en-têtes utilitaires du backoffice. Introduire Rye ici créerait la seule page admin visuellement dissonante du groupe. **Tranché : conserver `font-serif font-bold text-2xl text-cgws-ink`**, cohérence transversale > lettre stricte de la règle typographique.

### Structure globale de la page (état machine)

```
┌ En-tête (retour + titre) ──────────────────────────────────────────┐
│ ┌ Bloc format attendu (statique, toujours visible) ───────────────┐│
│ │ Colonnes / séparateur / encodage + [Télécharger un modèle CSV]  ││
│ └───────────────────────────────────────────────────────────────── ┘│
│ ┌ CsvDropzone ─────────────────────────────────────────────────────┐│
│ │  vide → survolé (drag) → fichier sélectionné → erreur fichier    ││
│ └───────────────────────────────────────────────────────────────── ┘│
│ [Prévisualiser l'import ▶]  (primary, disabled tant que pas de fichier valide) │
│                                                                       │
│ ── (si preview lancé) ──────────────────────────────────────────────│
│ ┌ Alerte bloquante (encodage / colonnes manquantes / fichier vide) ─┐│  (mutuellement exclusif avec le bloc suivant)
│ └───────────────────────────────────────────────────────────────── ┘│
│ ┌ Bandeau résumé chiffré (X valides / Y erreurs / Z total) ─────────┐│
│ └───────────────────────────────────────────────────────────────── ┘│
│ ┌ ImportPreviewTable (scroll interne, jusqu'à 500 lignes) ──────────┐│
│ └───────────────────────────────────────────────────────────────── ┘│
│ [Importer un autre fichier]                    [Valider l'import ▶] │
│                                                                       │
│ ── (si confirm lancé) ───────────────────────────────────────────────│
│ ┌ Résultat final (succès + échecs distincts + lien produits) ──────┐│
│ └───────────────────────────────────────────────────────────────── ┘│
└───────────────────────────────────────────────────────────────────┘
```

### Wireframes ASCII par largeur

**Mobile 375px**
```
┌─────────────────────────┐
│ ← Import CSV produits    │
│ Créez plusieurs...       │
│                          │
│ ┌─ Format attendu ─────┐ │
│ │ titre, categorie...   │ │
│ │ [⬇ Modèle CSV]        │ │
│ └───────────────────────┘ │
│ ┌─ Dropzone ────────────┐ │
│ │  ☁ Glissez votre      │ │
│ │  fichier CSV ici       │ │
│ │  [Parcourir]           │ │
│ │  .csv · 2 Mo · 500 l.  │ │
│ └───────────────────────┘ │
│ [Prévisualiser l'import] │ ← pleine largeur
│                          │
│ ┌─ 3 valides/1 erreur/4 ┐│ ← bandeau empilé (3 lignes)
│ └───────────────────────┘│
│ ┌─ Carte ligne 2 ───────┐│
│ │ [Sera créé]            ││
│ │ Selle Bob Lee Trail    ││
│ │ Selles · 890,00 €      ││
│ └───────────────────────┘│
│ ┌─ Carte ligne 3 ───────┐│
│ │ [Erreur]               ││
│ │ Catégorie inconnue :   ││
│ │ bottes                 ││
│ └───────────────────────┘│
│ [Importer un autre]     │
│ [Valider l'import]      │ ← pleine largeur, sticky bas d'écran optionnel
└─────────────────────────┘
```

**Tablet 768px** : identique à mobile dans sa logique (cartes empilées conservées jusqu'à `sm`, cf. décision §5.1), mais bandeau résumé en une seule ligne (3 segments côte à côte), boutons d'action côte à côte (`flex-row`) plutôt qu'empilés.

**Desktop 1440px**
```
┌───────────────────────────────────────────────────────────────────────────┐
│ ← Import CSV produits                                                     │
│                                                                            │
│ ┌─ Format attendu ────────────────────────────┐                          │
│ │ titre*, categorie*, marque, description,     │  [⬇ Télécharger un       │
│ │ prix*, etat*, taille, stock — UTF-8, virgule │   modèle CSV]            │
│ └────────────────────────────────────────────── ┘                          │
│                                                                            │
│ ┌─ Dropzone (max-w-2xl) ──────────────────────┐                          │
│ │        ☁  Glissez votre fichier CSV ici       │                          │
│ │              ou  [Parcourir…]                 │                          │
│ │        .csv seul · 2 Mo max · 500 lignes max │                          │
│ └────────────────────────────────────────────── ┘                          │
│                                       [Prévisualiser l'import ▶]           │
│                                                                            │
│ ┌───────────┬───────────┬───────────┐                                    │
│ │ 42 valides│ 3 erreurs │ 45 total  │  ← bandeau résumé, 3 segments        │
│ └───────────┴───────────┴───────────┘                                    │
│ ┌─ Table (sticky thead, max-h-[560px] scroll) ─────────────────────────┐ │
│ │ Ligne│Statut          │Titre / Marque      │Catégorie│  Prix│État    │ │
│ │ L.2  │[Sera créé]     │Selle Bob Lee Trail │Selles   │890 € │Excel.  │ │
│ │ L.3  │[Erreur]         │Botte Nocona        │—        │—     │—       │ │
│ │      │Catégorie inconnue : bottes                                    │ │
│ │ ...  │ (jusqu'à 500 lignes, scroll interne)                          │ │
│ └────────────────────────────────────────────────────────────────────── ┘ │
│                                          [Importer un autre] [Valider ▶]  │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Bloc "Format attendu" + modèle téléchargeable

Statique, toujours visible (avant même le dépôt d'un fichier) — documente le contrat CSV canonique du `SPRINT_PLAN.md`.

```html
<section aria-labelledby="csv-format-heading"
         class="bg-cgws-surface border border-cgws-hairline rounded-[4px] p-4 mb-4">
  <div class="flex items-start justify-between gap-4 flex-wrap">
    <div>
      <h3 id="csv-format-heading" class="font-sans font-semibold text-xs uppercase tracking-widest text-cgws-accent mb-2">
        Format de fichier attendu
      </h3>
      <p class="font-sans text-sm text-cgws-ink-soft">
        Fichier <strong class="text-cgws-ink font-medium">.csv</strong>, encodage
        <strong class="text-cgws-ink font-medium">UTF-8</strong>, séparateur
        <strong class="text-cgws-ink font-medium">virgule</strong>, en-tête en première ligne.
      </p>
      <dl class="mt-2 font-sans text-xs text-cgws-ink-soft grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
        <div><dt class="inline font-medium text-cgws-ink">titre</dt> <dd class="inline">— requis</dd></div>
        <div><dt class="inline font-medium text-cgws-ink">categorie</dt> <dd class="inline">— requis</dd></div>
        <div><dt class="inline font-medium text-cgws-ink">marque</dt> <dd class="inline">— optionnel</dd></div>
        <div><dt class="inline font-medium text-cgws-ink">description</dt> <dd class="inline">— optionnel</dd></div>
        <div><dt class="inline font-medium text-cgws-ink">prix</dt> <dd class="inline">— requis</dd></div>
        <div><dt class="inline font-medium text-cgws-ink">etat</dt> <dd class="inline">— requis</dd></div>
        <div><dt class="inline font-medium text-cgws-ink">taille</dt> <dd class="inline">— optionnel</dd></div>
        <div><dt class="inline font-medium text-cgws-ink">stock</dt> <dd class="inline">— défaut 1</dd></div>
      </dl>
      <p class="font-sans text-xs text-cgws-ink-soft mt-2 italic">
        Aucune colonne image — ajoutez les photos ensuite depuis la fiche produit.
      </p>
    </div>
    <a href="/templates/import-produits-modele.csv"
       download
       class="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-cgws-edge
              text-cgws-accent font-sans text-sm font-semibold hover:bg-cgws-accent/10
              transition-colors focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-cgws-accent focus-visible:ring-offset-2 focus-visible:ring-offset-cgws-surface
              flex-shrink-0">
      <UIcon name="i-lucide-download" class="w-4 h-4" aria-hidden="true" />
      Télécharger un modèle CSV
    </a>
  </div>
</section>
```

**Note pour `nuxt-developer`** : `import-produits-modele.csv` est un fichier statique servi depuis `public/templates/` — contenu réel (2-3 lignes d'exemple avec les 8 colonnes) à générer à l'implémentation, pas un contenu métier sensible (pas de vrais prix/clients), donc pas un point de blocage listé dans les garde-fous `CLAUDE.md`.

---

## 3. `CsvDropzone.vue` — composant nouveau

**Décision #2** : nouveau composant, pas une extension de `ImageUploader.vue`. Justification : `ImageUploader` gère intrinsèquement une **collection réordonnable multi-fichiers** (grille, `Sortable.js`, gestion `kept/new/removed`) — aucun de ces concepts ne s'applique à un import CSV (un seul fichier, remplacé et non complété à chaque dépôt). Réutiliser `ImageUploader` forcerait soit une prop `maxImages=1` bancale, soit un composant avec des branches conditionnelles inutilisées. **En revanche, le *pattern visuel et interactif* de la dropzone (bordure pointillée, drag events, `role="button" tabindex="0"`, input caché) est directement repris à l'identique** — même vocabulaire, nouveau composant plus simple.

### Props / emits

```ts
interface Props {
  disabled?: boolean
  maxSizeMb?: number   // défaut 2 (cf. constante partagée front/back, SPRINT_PLAN)
  maxLines?: number    // défaut 500
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  maxSizeMb: 2,
  maxLines: 500,
})

const emit = defineEmits<{
  'update:modelValue': [file: File | null]
  'error': [message: string]   // erreur bloquante détectée au dépôt (extension/taille/lignes)
}>()

defineProps<{ modelValue: File | null }>()
```

### Vérifications côté client, au dépôt/sélection (avant tout appel réseau)

1. **Extension/type** : `file.name` doit finir par `.csv` (insensible à la casse) — sinon `"Format de fichier non supporté, un fichier .csv est attendu"`.
2. **Taille** : `file.size > maxSizeMb * 1024 * 1024` → `"Fichier trop volumineux (max 2 Mo)"`.
3. **Nombre de lignes** (heuristique rapide, pas un vrai parsing CSV) : lecture du fichier via `await file.text()`, comptage des occurrences de `\n` (moins 1 pour l'en-tête, ligne finale sans retour tolérée) → si `> maxLines` → `"Trop de lignes (max 500 par import)"`.

   **Note de conception** : ce comptage est une heuristique de *ligne physique*, pas un vrai parsing respectant le quoting CSV (un champ contenant un saut de ligne entre guillemets fausserait légèrement le compte). C'est acceptable ici : l'objectif est de bloquer *tôt* les cas grossiers (fichier de 10 000 lignes) sans attendre un aller-retour réseau ; le parsing **définitif** avec `papaparse` a lieu côté serveur dans `preview.post.ts` et reste l'unique source de vérité pour la validation réelle — un léger écart d'estimation côté client ne casse rien, il retarde au pire la détection d'un cas limite jusqu'à l'étape serveur (qui applique la même constante `maxLines` de façon fiable).

4. **Encodage UTF-8** : **non vérifiable de façon fiable côté client** avec `file.text()` (qui ne lève pas d'erreur sur un fichier mal encodé, il produit juste des caractères de substitution). Cette vérification reste **entièrement côté serveur** (`preview.post.ts`) et se traduit par l'alerte bloquante de la page (§4), pas par une erreur de `CsvDropzone`.

Si l'une des 3 vérifications ci-dessus échoue : le fichier **n'est pas** assigné à `modelValue` (reste `null`), le composant affiche son propre état d'erreur (§ États) et émet `error` (la page peut l'utiliser pour un `aria-live` consolidé si besoin, mais l'affichage principal du message est déjà porté par le composant lui-même).

### Anatomie (états)

```
┌ Vide ────────────────────────────────────────────────────┐
│         ☁  Glissez votre fichier CSV ici                  │
│                    ou                                     │
│              [Parcourir…]                                 │
│      .csv seul · 2 Mo max · 500 lignes max                │
└────────────────────────────────────────────────────────────┘

┌ Survolé (drag-over) ─── bordure pleine, fond teinté ──────┐

┌ Fichier sélectionné ───────────────────────────────────────┐
│  [📄] import-produits-juillet.csv                          │
│       48 Ko                                    [Retirer ✕] │
└────────────────────────────────────────────────────────────┘

┌ Erreur fichier ─────────────────────────────────────────────┐
│  ⚠ Fichier trop volumineux (max 2 Mo)                       │
│  (dropzone reste affichée en dessous pour réessayer)         │
└────────────────────────────────────────────────────────────┘
```

### Tailwind — dropzone (repris du pattern `ImageUploader.vue`)

```html
<div v-if="!modelValue"
     role="button" tabindex="0"
     aria-label="Zone de dépôt du fichier CSV. Activez pour parcourir vos fichiers."
     :class="[
       'border-2 border-dashed rounded-sm p-8 text-center transition-colors duration-200 cursor-pointer',
       isDragOver
         ? 'border-cgws-accent bg-cgws-surface-2 border-solid'
         : 'border-cgws-accent/40 hover:border-cgws-accent hover:bg-cgws-surface-2/40',
       disabled ? 'opacity-50 cursor-not-allowed' : '',
     ]"
     @click="openFilePicker()"
     @keydown.enter.prevent="openFilePicker()"
     @keydown.space.prevent="openFilePicker()"
     @dragenter.prevent="isDragOver = true"
     @dragover.prevent="isDragOver = true"
     @dragleave.prevent="isDragOver = false"
     @drop.prevent="handleDrop">
  <UIcon name="i-lucide-cloud-upload" class="w-8 h-8 mx-auto mb-3 text-cgws-accent/50" aria-hidden="true" />
  <p class="font-sans text-sm font-medium text-cgws-ink mb-2">Glissez votre fichier CSV ici</p>
  <CgwsButton variant="ghost" size="sm" type="button" :disabled="disabled" @click.stop="openFilePicker()">
    Parcourir…
  </CgwsButton>
  <p class="font-sans text-xs text-cgws-ink-soft mt-3">
    .csv seul &nbsp;·&nbsp; {{ maxSizeMb }} Mo max &nbsp;·&nbsp; {{ maxLines }} lignes max
  </p>
</div>

<!-- Input caché -->
<input ref="fileInputRef" type="file" accept=".csv,text/csv"
       :disabled="disabled" class="sr-only" aria-hidden="true"
       @change="handleFileInput" />

<!-- Fichier sélectionné -->
<div v-else
     class="flex items-center gap-3 p-4 bg-cgws-surface-2 border border-cgws-hairline rounded-sm">
  <UIcon name="i-lucide-file-spreadsheet" class="w-8 h-8 text-cgws-accent flex-shrink-0" aria-hidden="true" />
  <div class="flex-1 min-w-0">
    <p class="font-sans text-sm font-medium text-cgws-ink truncate">{{ modelValue.name }}</p>
    <p class="font-sans text-xs text-cgws-ink-soft">{{ formatFileSize(modelValue.size) }}</p>
  </div>
  <button type="button"
          class="p-1.5 rounded-sm text-cgws-ink-soft hover:text-cgws-danger hover:bg-cgws-danger/10
                 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent"
          aria-label="Retirer le fichier sélectionné"
          @click="clearFile()">
    <UIcon name="i-lucide-x" class="w-4 h-4" aria-hidden="true" />
  </button>
</div>

<!-- Erreur fichier -->
<p v-if="fileError" role="alert" class="font-sans text-xs text-cgws-danger mt-2 flex items-center gap-1.5">
  <UIcon name="i-lucide-triangle-alert" class="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
  {{ fileError }}
</p>
```

`clearFile()` remet `modelValue` à `null`, vide `fileInputRef.value`, efface `fileError` — et surtout (cf. §6.4) déclenche côté page parente la **réinitialisation complète** de l'aperçu précédent, qu'il y ait eu preview ou non.

### États — tableau récapitulatif

| État | Déclencheur | Rendu |
|---|---|---|
| Vide | Défaut / après `clearFile()` | Dropzone pointillée, icône upload |
| Survolé | `dragenter`/`dragover` | Bordure pleine `accent`, fond `surface-2` |
| Fichier sélectionné (valide) | Drop/sélection passant les 3 checks client | Chip fichier (icône, nom, taille, bouton retirer) |
| Erreur fichier | Une des 3 vérifications échoue | Message `role="alert" text-cgws-danger`, dropzone reste affichée en dessous (permet de réessayer immédiatement) |
| Disabled | Pendant preview/confirm en cours | `opacity-50 cursor-not-allowed`, input désactivé |

---

## 4. Bannière/alerte bloquante + bandeau résumé chiffré

### 4.1 Alerte bloquante (encodage / colonnes manquantes / fichier vide)

Réutilise le pattern déjà établi de bannière d'erreur serveur (`RejectModal`, `contact.vue`) :

```html
<div role="alert" aria-live="assertive"
     class="bg-cgws-danger/10 border border-cgws-danger rounded-[4px] p-4 mb-4 flex items-start gap-3">
  <UIcon name="i-lucide-triangle-alert" class="w-5 h-5 text-cgws-danger flex-shrink-0 mt-0.5" aria-hidden="true" />
  <div>
    <p class="font-sans text-sm font-semibold text-cgws-danger">Import impossible</p>
    <p class="font-sans text-sm text-cgws-ink-soft mt-0.5">{{ blockingErrorMessage }}</p>
  </div>
</div>
```

`blockingErrorMessage` reprend le message exact renvoyé par `preview.post.ts` (SPRINT_PLAN) :
- `"Encodage non reconnu, veuillez exporter en UTF-8"`
- `"Colonnes manquantes : prix, categorie"`
- `"Aucune ligne de données trouvée dans le fichier"` (fichier = en-tête seul — cf. Gherkin dédié)

Dans ces 3 cas : **aucun tableau d'aperçu ne s'affiche**, le bandeau résumé (§4.2) n'apparaît pas non plus, et "Valider l'import" reste absent/désactivé.

### 4.2 Bandeau résumé chiffré

**Décision #3 — bandeau inline, pas 3× `KpiCard`.** `KpiCard.vue` (cf. `app/components/admin/KpiCard.vue`) est conçu pour des **indicateurs persistants** de dashboard (une carte = un chiffre, `rounded-[4px] shadow-sm p-5`, empilable en grille `dashboard.vue`). Le résumé d'aperçu CSV est au contraire un **état transitoire** lié à un seul fichier en cours de traitement, avec 3 nombres étroitement corrélés (valides + erreurs = total) qui doivent être lus *comme un tout* d'un coup d'œil, pas comme 3 métriques indépendantes dispersées dans une grille. Un bandeau à 3 segments dans un seul conteneur communique mieux cette relation, prend moins de hauteur verticale (important avec la table qui suit, potentiellement longue), et réutilise le même vocabulaire typographique (`font-display tabular-nums` pour les chiffres, cf. règle transversale `DESIGN_SYSTEM_v3.md` §3) sans dupliquer un composant conçu pour un autre contexte.

```html
<div ref="summaryRef" tabindex="-1"
     role="status" aria-live="polite"
     class="bg-cgws-surface border border-cgws-hairline rounded-[4px] mb-4
            flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-cgws-hairline
            focus:outline-none">
  <div class="flex-1 p-4 flex items-center justify-between sm:flex-col sm:items-start sm:justify-center gap-1">
    <span class="font-sans text-xs uppercase tracking-widest text-cgws-ink-soft">Lignes valides</span>
    <span class="font-display text-3xl tabular-nums text-cgws-success">{{ summary.valid }}</span>
  </div>
  <div class="flex-1 p-4 flex items-center justify-between sm:flex-col sm:items-start sm:justify-center gap-1">
    <span class="font-sans text-xs uppercase tracking-widest text-cgws-ink-soft">Lignes en erreur</span>
    <span class="font-display text-3xl tabular-nums"
          :class="summary.error > 0 ? 'text-cgws-danger' : 'text-cgws-ink-soft'">{{ summary.error }}</span>
  </div>
  <div class="flex-1 p-4 flex items-center justify-between sm:flex-col sm:items-start sm:justify-center gap-1">
    <span class="font-sans text-xs uppercase tracking-widest text-cgws-ink-soft">Total</span>
    <span class="font-display text-3xl tabular-nums text-cgws-ink">{{ summary.total }}</span>
  </div>
</div>
```

Texte équivalent annoncé aux lecteurs d'écran (contenu réel de la région, pas seulement visuel) : *"X ligne(s) valide(s), Y ligne(s) en erreur, Z ligne(s) au total"* — cf. `aria-label` complémentaire recommandé si le texte visuel seul (nombres + labels courts) est jugé insuffisant à l'implémentation :
```html
:aria-label="`${summary.valid} ligne(s) valide(s), ${summary.error} ligne(s) en erreur, ${summary.total} ligne(s) au total`"
```

**Gestion du focus (a11y, cf. §8)** : après réception de la réponse de preview, le focus clavier est déplacé programmatiquement sur `summaryRef` (`tabindex="-1"` + `.focus()`) — pertinent pour un utilisateur clavier/lecteur d'écran qui vient de déclencher une action asynchrone (clic sur "Prévisualiser") et doit être notifié du résultat sans avoir à re-naviguer toute la page.

---

## 5. `ImportPreviewTable.vue` — composant nouveau

### 5.0 Décision #4 — table HTML custom, pas `UTable`

Vérification MCP (`mcp__nuxt-ui-remote__get-component-metadata Table`) : le composant `UTable` de Nuxt UI v4 encapsule **TanStack Table** (tri, colonnes dynamiques, pagination intégrée). C'est un outil puissant, mais **aucune table admin existante du projet ne l'utilise** (`produits/index.vue`, `ventes/index.vue`, `consignations/index.vue`, `clients/index.vue` sont toutes des `<table>` HTML custom avec les rôles CGWS directement en classes Tailwind, cf. audit `US-075` §C.3/§C.10). Introduire `UTable` ici serait la **seule** table du site à utiliser un mécanisme différent (colonnes déclaratives TanStack vs `<template v-for>` direct), avec son propre système de theming (`ui` prop object) à recâbler sur les tokens `cgws-*` — coût de cohérence qui dépasse largement le bénéfice pour un tableau qui n'a besoin ni de tri ni de colonnes reconfigurables. **Tranché : `ImportPreviewTable` reste une `<table>` HTML custom**, alignée sur le pattern exact de `produits/index.vue` (thead sémantique, `tbody` avec lignes conditionnelles, cartes mobile en parallèle) — seule nouveauté : le conteneur scrollable à hauteur fixe (§5.4, nécessaire vu le volume de lignes possible, absent des tables paginées existantes).

### 5.1 Props

```ts
interface PreviewRowValid {
  line: number                 // numéro de ligne dans le fichier (1 = en-tête, données à partir de 2)
  status: 'valid'
  fields: {
    title: string
    category: ProductCategory
    brand: string
    price: number
    condition: ProductCondition
    size: string
    stock: number
  }
}

interface PreviewRowError {
  line: number
  status: 'error'
  // valeurs brutes telles que lues dans le CSV (avant validation Zod) — cf. §7,
  // nécessaires pour afficher fidèlement ce que Camille a réellement dans son fichier
  columns: {
    titre: string
    categorie: string
    marque: string
    prix: string
    etat: string
    taille: string
    stock: string
  }
  reason: string                // ex. "Catégorie inconnue : bottes"
}

type PreviewRow = PreviewRowValid | PreviewRowError

interface Props {
  rows: PreviewRow[]            // fusion validRows + errorRows, triée par `line` croissant (cf. §7 — responsabilité du composable)
  loading?: boolean
}
```

### 5.2 Structure desktop (`hidden sm:block`, cf. §5.1 pattern breakpoint identique à `produits/index.vue`)

```html
<div class="hidden sm:block bg-cgws-surface border border-cgws-hairline rounded-[4px] overflow-hidden">
  <div class="max-h-[560px] overflow-y-auto" tabindex="0" role="region"
       aria-label="Tableau d'aperçu défilant, {{ rows.length }} lignes">
    <table class="w-full text-sm font-sans" aria-describedby="preview-table-caption">
      <caption id="preview-table-caption" class="sr-only">
        Aperçu de l'import : {{ rows.length }} ligne(s) de données, triées par ordre d'apparition dans le fichier.
        Chaque ligne indique si elle sera créée ou si elle contient une erreur, avec le motif en cas d'erreur.
      </caption>
      <thead class="sticky top-0 z-10 bg-cgws-surface border-b border-cgws-hairline">
        <tr>
          <th scope="col" class="w-14 py-3 pl-4 pr-2 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft">Ligne</th>
          <th scope="col" class="py-3 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft min-w-[220px]">Statut</th>
          <th scope="col" class="py-3 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft">Titre</th>
          <th scope="col" class="hidden md:table-cell py-3 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft">Catégorie</th>
          <th scope="col" class="py-3 px-3 text-right font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft">Prix</th>
          <th scope="col" class="hidden lg:table-cell py-3 px-3 text-left font-sans text-[10px] uppercase tracking-widest text-cgws-ink-soft">État</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-cgws-hairline">
        <tr v-for="row in rows" :key="row.line"
            :class="[
              'transition-colors duration-100',
              row.status === 'error'
                ? 'bg-cgws-danger/5 border-l-2 border-l-cgws-danger hover:bg-cgws-danger/10'
                : 'hover:bg-cgws-surface-2/60',
            ]">
          <!-- Ligne -->
          <td class="py-2.5 pl-4 pr-2 font-sans text-xs text-cgws-ink-soft whitespace-nowrap">
            L.{{ row.line }}
          </td>

          <!-- Statut + motif -->
          <td class="py-2.5 px-3">
            <span v-if="row.status === 'valid'"
                  class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5
                         bg-cgws-success/15 text-cgws-success border border-cgws-success/40
                         font-sans font-medium text-[11px] uppercase tracking-wider">
              <UIcon name="i-lucide-circle-check" class="w-3 h-3" aria-hidden="true" />
              Sera créé
            </span>
            <template v-else>
              <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5
                           bg-cgws-danger text-cgws-on-danger
                           font-sans font-medium text-[11px] uppercase tracking-wider">
                <UIcon name="i-lucide-circle-x" class="w-3 h-3" aria-hidden="true" />
                Erreur
              </span>
              <p class="font-sans text-xs text-cgws-danger mt-1 max-w-xs">{{ row.reason }}</p>
            </template>
          </td>

          <!-- Titre / Marque -->
          <td class="py-2.5 px-3">
            <span class="font-sans text-sm font-medium text-cgws-ink line-clamp-1 block">
              {{ row.status === 'valid' ? row.fields.title : (row.columns.titre || '—') }}
            </span>
            <span v-if="(row.status === 'valid' ? row.fields.brand : row.columns.marque)"
                  class="font-sans text-xs text-cgws-ink-soft">
              {{ row.status === 'valid' ? row.fields.brand : row.columns.marque }}
            </span>
          </td>

          <!-- Catégorie (md+) -->
          <td class="hidden md:table-cell py-2.5 px-3 font-sans text-sm text-cgws-ink-soft">
            {{ row.status === 'valid' ? CATEGORY_LABELS[row.fields.category] : (row.columns.categorie || '—') }}
          </td>

          <!-- Prix -->
          <td class="py-2.5 px-3 text-right font-display text-base tabular-nums whitespace-nowrap"
              :class="row.status === 'valid' ? 'text-cgws-accent' : 'text-cgws-ink-soft'">
            {{ row.status === 'valid' ? formatPrice(row.fields.price) : (row.columns.prix || '—') }}
          </td>

          <!-- État (lg+) -->
          <td class="hidden lg:table-cell py-2.5 px-3 font-sans text-sm text-cgws-ink-soft">
            {{ row.status === 'valid' ? CONDITION_LABELS[row.fields.condition] : (row.columns.etat || '—') }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

**Pourquoi le `<thead>` est en `bg-cgws-surface` opaque (pas `/40` comme `produits/index.vue`)** : dans une table paginée classique, le thead ne défile jamais, une teinte translucide (`bg-cgws-surface/40`) est purement décorative. Ici le `<thead>` est **`sticky top-0`** à l'intérieur d'un conteneur qui défile (§5.4) — un fond translucide laisserait les lignes de données apparaître *à travers* l'en-tête pendant le scroll, ce qui est illisible. Le fond doit donc être **opaque** dès qu'un `<thead>` devient sticky : divergence assumée et documentée, pas un oubli de cohérence.

### 5.3 Structure mobile (`block sm:hidden`) — cartes empilées

Même logique de contenu que le pattern carte de `produits/index.vue`, avec statut en premier (le plus important à scanner rapidement sur 500 lignes) :

```html
<div class="block sm:hidden max-h-[560px] overflow-y-auto space-y-2 pr-1"
     role="region" aria-label="Aperçu de l'import, {{ rows.length }} lignes">
  <div v-for="row in rows" :key="row.line"
       :class="[
         'rounded-[4px] p-3 border',
         row.status === 'error'
           ? 'bg-cgws-danger/5 border-cgws-danger/40'
           : 'bg-cgws-surface border-cgws-hairline',
       ]">
    <div class="flex items-center justify-between gap-2 mb-2">
      <span class="font-sans text-xs text-cgws-ink-soft">L.{{ row.line }}</span>
      <span v-if="row.status === 'valid'"
            class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5
                   bg-cgws-success/15 text-cgws-success border border-cgws-success/40
                   font-sans font-medium text-[11px] uppercase tracking-wider">
        <UIcon name="i-lucide-circle-check" class="w-3 h-3" aria-hidden="true" />
        Sera créé
      </span>
      <span v-else
            class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5
                   bg-cgws-danger text-cgws-on-danger
                   font-sans font-medium text-[11px] uppercase tracking-wider">
        <UIcon name="i-lucide-circle-x" class="w-3 h-3" aria-hidden="true" />
        Erreur
      </span>
    </div>

    <p class="font-sans text-sm font-medium text-cgws-ink line-clamp-1">
      {{ row.status === 'valid' ? row.fields.title : (row.columns.titre || '—') }}
    </p>
    <p v-if="row.status === 'valid' && row.fields.brand" class="font-sans text-xs text-cgws-ink-soft">
      {{ row.fields.brand }}
    </p>

    <div v-if="row.status === 'valid'" class="flex items-center gap-3 mt-1.5 flex-wrap font-sans text-xs text-cgws-ink-soft">
      <span>{{ CATEGORY_LABELS[row.fields.category] }}</span>
      <span class="font-display text-sm tabular-nums text-cgws-accent">{{ formatPrice(row.fields.price) }}</span>
      <span>{{ CONDITION_LABELS[row.fields.condition] }}</span>
    </div>

    <p v-else class="font-sans text-xs text-cgws-danger mt-1.5">{{ row.reason }}</p>
  </div>
</div>
```

### 5.4 Décision #6 — scroll à hauteur fixe, pas de pagination ni de virtualisation

500 lignes est un volume gérable par le DOM sans virtualisation (bien en dessous des seuils habituels de dégradation de performance, ~qq milliers de nœuds simples) — introduire une librairie de virtualisation (`vue-virtual-scroller` ou équivalent) pour ce volume serait disproportionné. La pagination (comme sur `produits/index.vue`) est **délibérément écartée** ici : l'aperçu doit permettre de juger la qualité globale du fichier d'un coup d'œil (proportion erreurs/valides) — paginer forcerait Camille à cliquer à travers plusieurs pages pour avoir une vision complète avant de décider de valider, ce qui contredit l'objectif même de l'aperçu ("garder le contrôle avant validation"). **Tranché : conteneur unique `max-h-[560px] overflow-y-auto` avec `<thead>`/en-tête de carte sticky**, défilement interne classique, `tabindex="0"` + `role="region"` pour rendre la zone de scroll elle-même focusable/navigable au clavier (flèches haut/bas une fois focus dans le conteneur, comportement natif du scroll d'un élément focusable).

`560px` est un choix d'implémentation raisonnable (~8-9 lignes visibles avant de devoir défiler sur desktop) — ajustable sans impact sur le reste de la spec.

### 5.5 État vide (fichier = en-tête seul)

Remplace entièrement la table (pas de thead vide) :

```html
<div class="bg-cgws-surface border border-cgws-hairline rounded-[4px] py-16 text-center">
  <UIcon name="i-lucide-file-x" class="w-10 h-10 mx-auto mb-3 text-cgws-ink-soft/30" aria-hidden="true" />
  <p class="font-sans text-sm text-cgws-ink-soft italic">
    Aucune ligne de données trouvée dans le fichier.
  </p>
</div>
```

### 5.6 État chargement (`loading`)

Skeleton simplifié (pas de vraies lignes tant que la réponse preview n'est pas connue) :

```html
<div v-for="i in 5" :key="i" class="p-3 border-b border-cgws-hairline last:border-b-0">
  <div class="h-4 w-24 bg-cgws-hairline rounded animate-pulse mb-2" />
  <div class="h-4 w-64 bg-cgws-hairline rounded animate-pulse" />
</div>
```

---

## 6. Actions et flux (page)

### 6.1 Bouton "Prévisualiser l'import"

```html
<CgwsButton variant="primary" size="md"
            :disabled="!selectedFile || isPreviewing"
            :loading="isPreviewing"
            @click="runPreview()">
  {{ isPreviewing ? 'Analyse en cours…' : "Prévisualiser l'import" }}
</CgwsButton>
```

Désactivé tant qu'aucun fichier valide n'est présent dans `CsvDropzone` (`v-model` `null`). Aucune vérification de format supplémentaire ici : les 3 checks client ont déjà eu lieu dans `CsvDropzone` avant que `modelValue` ne soit renseigné.

### 6.2 Bouton "Valider l'import" — décision #7, pas de modale supplémentaire

```html
<CgwsButton variant="primary" size="md"
            :disabled="summary.valid === 0 || isConfirming"
            :aria-disabled="summary.valid === 0"
            :loading="isConfirming"
            @click="runConfirm()">
  {{ isConfirming ? 'Import en cours…' : "Valider l'import" }}
</CgwsButton>
<p v-if="summary.valid === 0 && !isConfirming"
   class="font-sans text-xs text-cgws-ink-soft mt-1.5">
  Aucune ligne valide à importer — corrigez le fichier et déposez-le à nouveau.
</p>
```

**Pas de modale de confirmation intermédiaire** (contrairement à la suppression produit dans `produits/index.vue`, qui en a une) : l'aperçu obligatoire *est déjà* l'étape de confirmation voulue par la US (*"Purpose"* : *"un aperçu obligatoire... tout en gardant le contrôle avant validation"*). Camille a déjà vu, ligne par ligne, ce qui sera créé avant d'arriver à ce bouton — ajouter une seconde boîte de dialogue ("Êtes-vous sûre ?") redemanderait une confirmation déjà implicitement donnée par le passage à travers l'aperçu, pure friction sans bénéfice de sécurité supplémentaire (contrairement à une suppression, action destructive irréversible sur de la donnée existante, l'import est une **création** non destructive — les produits créés restent modifiables/supprimables ensuite comme n'importe quel produit).

### 6.3 Lien "Importer un autre fichier"

```html
<button type="button"
        class="font-sans text-sm text-cgws-ink-soft hover:text-cgws-accent hover:underline
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent rounded-sm"
        @click="resetAll()">
  Importer un autre fichier
</button>
```

Équivalent explicite au dépôt d'un nouveau fichier (§6.4) mais accessible sans repasser par la dropzone — utile une fois qu'elle a scrollé hors champ sous une longue table.

### 6.4 Réinitialisation complète (Gherkin "nouveau fichier CSV déposé")

`resetAll()` et le dépôt d'un nouveau fichier dans `CsvDropzone` (détecté via un `watch` sur le `File` émis) déclenchent **la même** remise à zéro complète, sans exception :
- `previewRows = []`, `summary = null`
- `blockingErrorMessage = null`
- `confirmResult = null`
- `isPreviewing = false`, `isConfirming = false`
- Le focus repart sur la dropzone (ou reste sur le nouveau fichier sélectionné si le dépôt vient de là)

Aucun état résiduel de l'import précédent ne doit rester visible — la table, le bandeau résumé et le panneau de résultat sont conditionnés strictement sur l'état courant (`v-if`), jamais laissés visuellement en place "au cas où".

### 6.5 Panneau de résultat final (après confirm)

```html
<div ref="resultRef" tabindex="-1" role="status" aria-live="polite"
     class="bg-cgws-surface border border-cgws-hairline rounded-[4px] p-5 mt-4 focus:outline-none">
  <div class="flex items-start gap-3">
    <div class="w-9 h-9 rounded-full bg-cgws-success/15 flex items-center justify-center flex-shrink-0">
      <UIcon name="i-lucide-circle-check" class="w-5 h-5 text-cgws-success" aria-hidden="true" />
    </div>
    <div>
      <p class="font-sans text-sm font-semibold text-cgws-ink">
        {{ confirmResult.created.length }} produit{{ confirmResult.created.length !== 1 ? 's' : '' }}
        créé{{ confirmResult.created.length !== 1 ? 's' : '' }} avec succès
      </p>
      <NuxtLink :to="importedProductsLink"
                class="font-sans text-sm text-cgws-accent hover:underline
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cgws-accent rounded-sm">
        Voir les produits importés →
      </NuxtLink>
    </div>
  </div>

  <!-- Échecs à la confirmation (conflit de slug concurrent, etc.) -->
  <div v-if="confirmResult.failed.length > 0" class="mt-4 pt-4 border-t border-cgws-hairline">
    <p class="font-sans text-sm font-semibold text-cgws-danger mb-2">
      {{ confirmResult.failed.length }} ligne{{ confirmResult.failed.length !== 1 ? 's' : '' }}
      n'{{ confirmResult.failed.length !== 1 ? 'ont' : 'a' }} pas pu être importée{{ confirmResult.failed.length !== 1 ? 's' : '' }}
    </p>
    <ul class="space-y-1">
      <li v-for="f in confirmResult.failed" :key="f.line"
          class="font-sans text-xs text-cgws-ink-soft">
        <span class="text-cgws-danger font-medium">L.{{ f.line }}</span> — {{ f.reason }}
      </li>
    </ul>
  </div>
</div>
```

**Gestion du focus** : identique au bandeau résumé (§4.2) — focus déplacé sur `resultRef` après réception de la réponse de confirm, pour notifier immédiatement un utilisateur clavier/lecteur d'écran du résultat de l'action asynchrone.

**Point ouvert, à confirmer avec `nuxt-developer`** : `importedProductsLink` (lien "Voir les produits importés") suppose que `GET /api/admin/products` (contrat existant, `US-032`) accepte un filtre par identifiants (`?ids=uuid1,uuid2,...`). Ce paramètre **n'existe pas** dans le contrat actuel (`search`/`category`/`status` uniquement). Recommandation : étendre l'endpoint avec un paramètre `ids` optionnel pour ce cas d'usage précis (`produits.value = data.items` déjà mappé, filtre supplémentaire `if (ids) query = query.in('id', ids.split(','))`) — c'est une extension mineure et non-cassante du contrat existant. **Si ce point n'est pas retenu**, alternative de repli acceptable : lister directement les titres créés dans ce même panneau (avec lien individuel vers `/admin/produits/${id}` par produit) plutôt qu'un lien de liste filtrée — dégradation mineure, n'affecte pas le reste de la spec.

---

## 7. Contrats de données — points à confirmer avec `nuxt-developer` (non figés par cette spec)

Cette spec est UX/visuelle ; le contrat JSON exact des routes serveur relève de l'implémentation (`SPRINT_PLAN.md` en donne l'esquisse : `{ validRows, errorRows: { line, raw, reason }[], summary }` pour preview, `{ created, failed: { row, reason }[] }` pour confirm). Deux précisions **nécessaires côté rendu** que cette spec introduit et qui méritent une confirmation explicite plutôt qu'une supposition silencieuse :

1. **Valeurs brutes par colonne pour les lignes en erreur** (`columns: { titre, categorie, marque, prix, etat, taille, stock }` dans `PreviewRowError`, §5.1) — nécessaire pour afficher fidèlement ce que contient réellement le fichier de Camille sur une ligne en erreur (ex. voir que `prix` contenait littéralement `"à définir"`). `papaparse` parse la syntaxe CSV indépendamment de la validation Zod qui suit : les valeurs de cellule brutes (strings) sont disponibles même quand la ligne échoue la validation métier — il s'agit donc de les propager dans la réponse plutôt que de les jeter, pas d'un nouveau calcul.
2. **Fusion et tri par `line`** de `validRows` + `errorRows` en un tableau unique `PreviewRow[]`, dans l'ordre d'apparition du fichier — supposée être une responsabilité du composable `useProductImport.ts` (léger `.sort((a, b) => a.line - b.line)` après concaténation), pas de la route serveur elle-même ni du composant `ImportPreviewTable` (qui reçoit `rows` déjà fusionné/trié en prop).

Si l'implémentation retient une forme différente (ex. pas de `columns` bruts, `raw` = ligne CSV texte brute non découpée par colonne), la seule adaptation nécessaire est dans le petit bloc d'affichage conditionnel `row.status === 'valid' ? row.fields.x : row.columns.x` de `ImportPreviewTable` (§5.2/5.3) — le reste de la spec (layout, états, a11y) reste inchangé.

---

## 8. Accessibilité (récapitulatif transversal)

- **Statut jamais porté par la seule couleur** : chaque pilule "Sera créé"/"Erreur" combine icône (`circle-check`/`circle-x`) + libellé texte + couleur — cf. règle transversale `DESIGN_SYSTEM_v3.md` §9.
- **`aria-live` sur les zones asynchrones** : bandeau résumé (`role="status" aria-live="polite"`, §4.2) et panneau de résultat final (idem, §6.5). L'alerte bloquante (§4.1) utilise `role="alert" aria-live="assertive"` (plus urgente — bloque toute progression).
- **Gestion du focus** : après réception de la réponse de preview → focus sur le bandeau résumé (`summaryRef.focus()`) ; après réception de la réponse de confirm → focus sur le panneau de résultat (`resultRef.focus()`). Les deux éléments portent `tabindex="-1"` pour être focusables programmatiquement sans entrer dans l'ordre de tabulation naturel.
- **Dropzone accessible clavier** : `role="button" tabindex="0"`, activation `Enter`/`Espace`, `aria-label` explicite incluant l'instruction ("Activez pour parcourir vos fichiers") — input `<input type="file">` cassé en `sr-only` mais natif, donc lisible/utilisable par tout lecteur d'écran qui l'atteindrait directement au clavier (`Tab`) en plus du déclenchement via la zone `role="button"`.
- **Boutons désactivés avec raison visible** : "Valider l'import" désactivé porte `aria-disabled="true"` **et** un texte adjacent explicite (§6.2 — *"Aucune ligne valide à importer…"*), jamais une simple désactivation silencieuse.
- **Table sémantique** : `<caption>` (contenu informatif complet, pas juste décoratif, §5.2), `<th scope="col">` sur toutes les colonnes, `aria-describedby` liant le tableau à sa légende. Le conteneur de scroll interne (`role="region" aria-label="..."`, `tabindex="0"`) permet la navigation clavier du contenu défilant indépendamment du reste de la page (pattern recommandé pour les zones de scroll interne imbriquées dans une page qui défile elle-même).
- **Contraste** : toutes les paires utilisées ici sont déjà mesurées AA dans les 3 rendus par `DESIGN_SYSTEM_v3.md` §2.6 — `success`/`on-success`, `danger`/`on-danger`, `accent`/`on-accent`, `ink`/`ink-soft` sur `ground`/`surface`. Le seul point **non pré-mesuré analytiquement** dans le doc maître est `ink`/`ink-soft`/`accent` sur `bg-cgws-surface-2` (fond du chip "fichier sélectionné", §3, et du hover valide de la table, §5.2) — à confirmer visuellement par QA dans les 3 rendus, cohérent avec la même réserve déjà formulée pour `surface` dans `US-075` §A.1/§C.3 (écart mineur attendu, non bloquant).
- **`prefers-reduced-motion`** : aucune animation GSAP sur cette page (transitions CSS courtes `duration-100`/`duration-150`/`duration-200` uniquement) — cohérent avec le traitement déjà en place ailleurs dans l'admin (`US-075` §A.7), aucune garde spécifique supplémentaire requise.
- **Focus visible** : `focus-visible:ring-2 focus-visible:ring-cgws-accent` sur tous les éléments interactifs (dropzone, boutons, lien modèle CSV, lien résultat), `ring-offset-cgws-surface` sur les éléments posés sur un fond `surface` (lien "Télécharger un modèle CSV", §2).

---

## 9. Vérification dans les 3 rendus (`elegante-jour` / `elegante-nuit` / `rugueux`)

| Élément | `elegante-jour` | `elegante-nuit` | `rugueux` |
|---|---|---|---|
| Dropzone vide/survolée | Bordure mauve pointillée sur `ground`, fond `surface-2` clair au survol | Bordure rose clair, fond `surface-2` sombre au survol | Bordure laiton, fond `surface-2` très sombre au survol |
| Pilule "Sera créé" (`success/15`) | Sauge assombri `#3D5A28` sur fond translucide, lisible (§2.6 doc maître, valeur déjà corrigée) | `#9FC178` sur translucide, marge confortable | `#8FA85A` sur translucide — marge la plus serrée des 3 rendus sur `surface`/15 (4.69:1, cf. doc maître §2.6), à surveiller si le fond de ligne change |
| Pilule "Erreur" (`danger` plein) | Bordeaux `#A23A47`/`on-danger` crème — AA large marge | `#E0808C`/`on-danger` sombre — AA large marge | `#D66F3E` (brique éclairci, valeur déjà corrigée §2.4a)/`on-danger` — **vérifier absence de confusion visuelle avec `accent` laiton** (même remarque que `US-072` §9 pour `danger`/`accent`/`accent-deco` en Rugueux — les deux sont des tons chauds proches en Rugueux) |
| Ligne d'erreur tintée (`bg-cgws-danger/5 border-l-cgws-danger`) | Teinte rosée très légère sur `surface` clair | Teinte sombre légère | Teinte brique très légère sur fond très sombre — vérifier que le liseré `border-l-2` reste perceptible (contraste UI ≥3:1, pas seulement le texte) |
| Bandeau résumé (chiffres `font-display`) | `success`/`danger`/`ink` bien distincts sur `surface` clair | idem, teintes Nuit | idem, teintes Rugueux — vérifier lisibilité du chiffre "erreurs" en `danger` (brique) à côté du chiffre "valides" en `success` (olive), tons chauds/froids doivent rester différenciables |
| `<thead>` sticky opaque | `bg-cgws-surface` clair, occulte bien le contenu qui défile dessous | idem sombre | idem très sombre |

---

## 10. Critères d'acceptation (Gherkin — complète le volet UX du `SPRINT_PLAN.md`)

```gherkin
Fonctionnalité : Import CSV produits en masse — rendu (US-063)

  Scénario : Page d'import au chargement
    Étant donné que je suis sur /admin/produits/import
    Alors une zone de dépôt de fichier CSV (drag & drop + bouton "Parcourir") est affichée
    Et le format attendu (colonnes, séparateur, encodage) est documenté
    Et un lien "Télécharger un modèle CSV" est présent

  Scénario : Dépôt d'un fichier avec une mauvaise extension
    Quand je dépose un fichier qui n'a pas l'extension ".csv"
    Alors "CsvDropzone" affiche "Format de fichier non supporté, un fichier .csv est attendu"
    Et le bouton "Prévisualiser l'import" reste désactivé

  Scénario : Dépôt d'un fichier trop volumineux ou trop long
    Quand je dépose un fichier de plus de 2 Mo, ou contenant plus de 500 lignes
    Alors un message d'erreur explicite ("Fichier trop volumineux (max 2 Mo)"
      ou "Trop de lignes (max 500 par import)") s'affiche immédiatement dans la dropzone
    Et aucun appel réseau n'est déclenché

  Scénario : Aperçu sans écriture en base
    Étant donné un fichier CSV valide et bien formé déposé
    Quand je clique sur "Prévisualiser l'import"
    Alors aucune écriture n'est faite en base de données
    Et un bandeau résumé affiche "X valides / Y erreurs / Z total"
    Et le focus clavier se déplace sur ce bandeau
    Et un tableau affiche chaque ligne avec son statut ("Sera créé" en pilule "success",
      "Erreur" en pilule "danger" pleine) et, pour les erreurs, le motif précis à côté

  Scénario : Fichier avec erreur bloquante (encodage/colonnes)
    Quand je prévisualise un fichier à l'encodage non-UTF-8 ou aux colonnes obligatoires manquantes
    Alors aucun tableau d'aperçu ne s'affiche
    Et une alerte bloquante ("role=alert") explique la cause précise

  Scénario : Fichier avec en-tête seul (aucune ligne de données)
    Quand je prévisualise un tel fichier
    Alors le message "Aucune ligne de données trouvée dans le fichier" s'affiche
    Et le bouton "Valider l'import" reste désactivé

  Scénario : Validation de l'import
    Étant donné un aperçu avec des lignes valides et des lignes en erreur
    Quand je clique sur "Valider l'import"
    Alors seules les lignes valides sont créées avec le statut "active"
    Et le focus se déplace sur le panneau de résultat
    Et un message récapitule "X produit(s) créé(s) avec succès" avec un lien vers les produits importés
    Et les lignes en erreur lors de l'aperçu ne sont pas créées

  Scénario : Conflit de concurrence à la confirmation
    Étant donné qu'un produit a été créé entre-temps avec un slug identique à une ligne du CSV
    Quand je valide l'import
    Alors cette ligne est rapportée en échec, distinctement, dans le panneau de résultat
    Et les autres lignes valides sont tout de même créées

  Scénario : Bouton "Valider l'import" conditionnel
    Alors le bouton n'est actif que si au moins une ligne valide existe dans l'aperçu
    Et lorsqu'il est désactivé, un texte adjacent explique pourquoi

  Scénario : Réinitialisation au dépôt d'un nouveau fichier
    Étant donné un aperçu ou un résultat déjà affiché
    Quand je dépose un nouveau fichier CSV
    Alors l'aperçu et le résultat précédents sont intégralement réinitialisés

  Scénario Plan : Responsive
    Étant donné la largeur d'écran <largeur>
    Alors la page d'import s'affiche selon <comportement>

    Exemples :
      | largeur | comportement                                                              |
      | 375px   | cartes empilées pour l'aperçu, boutons pleine largeur                     |
      | 768px   | cartes empilées conservées, bandeau résumé en une ligne                  |
      | 1440px  | table desktop avec colonnes Catégorie/État visibles, thead sticky        |

  Scénario Plan : Validation dans les 3 rendus
    Étant donné le rendu actif <rendu>
    Alors les pilules "Sera créé"/"Erreur", le bandeau résumé et le tableau restent
      lisibles et cohérents, sans résidu "bg-white" ni token v2

    Exemples :
      | rendu           |
      | elegante-jour   |
      | elegante-nuit   |
      | rugueux         |
```

---

## 11. Tailwind classes clés — récapitulatif

```
/* Panneau générique (dropzone container, format attendu, bandeau résumé, résultat) */
bg-cgws-surface border border-cgws-hairline rounded-[4px]

/* Dropzone vide */
border-2 border-dashed border-cgws-accent/40 rounded-sm
hover:border-cgws-accent hover:bg-cgws-surface-2/40

/* Dropzone survolée */
border-cgws-accent bg-cgws-surface-2 border-solid

/* Chip fichier sélectionné */
bg-cgws-surface-2 border border-cgws-hairline rounded-sm

/* Pilule "Sera créé" (success) */
bg-cgws-success/15 text-cgws-success border border-cgws-success/40 rounded-full

/* Pilule "Erreur" (danger plein) */
bg-cgws-danger text-cgws-on-danger rounded-full

/* Ligne de table en erreur (tint + liseré) */
bg-cgws-danger/5 border-l-2 border-l-cgws-danger hover:bg-cgws-danger/10

/* Ligne de table valide (hover) */
hover:bg-cgws-surface-2/60

/* Thead sticky (opaque, cf. §5.2) */
sticky top-0 z-10 bg-cgws-surface border-b border-cgws-hairline

/* Chiffres bandeau résumé / table (prix) */
font-display tabular-nums

/* Alerte bloquante */
bg-cgws-danger/10 border border-cgws-danger rounded-[4px]

/* Panneau résultat succès (icône) */
bg-cgws-success/15 text-cgws-success rounded-full
```
