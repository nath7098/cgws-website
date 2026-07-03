# Design System CGWS v3 — "Cowgirl élégante" — Document maître

**Statut** : Remplace intégralement le §"Design System CGWS v2" de `CLAUDE.md`.
**Sprint** : 6 — Rebranding
**Source** : nouveau logo (cavalière de reining, rose poudré, brun alezan, lettrage Playfair, étoile-boussole).
**Révision** : intègre les décisions client sur le token `danger` (remplace `cgws-rust`), le comportement header/footer (suivent jour/nuit), le switcher en admin, et le token `success` (statuts positifs — consignation acceptée, produit actif) découvert manquant en QA `US-070` — voir §2.1/§2.6/§4.1/§6/§7/§8.

---

## 1. Vue d'ensemble

CGWS v3 abandonne le vocabulaire "sellerie western brute" (cuir brûlé + cuivre partout) au profit d'une identité double, pilotée par le logo : une cavalière élégante en reining, un rose poudré et un brun alezan raffiné, une typographie serif haut de gamme, une étoile-boussole à 8 branches comme signature graphique.

Le site expose **deux peaux** au choix du visiteur, jamais imposées — c'est un choix esthétique assumé, pas un fallback accessibilité. Le switcher est disponible **aussi bien sur le site public que dans le backoffice admin** (voir §6.1) :

- **Élégante** (défaut, féminin) — suit le logo. Se décline en variante **Jour** (claire) et **Nuit** (sombre), cette dernière suivant automatiquement `prefers-color-scheme` sauf préférence explicite de l'utilisateur.
- **Rugueux** (masculin) — monde cuir sombre + laiton, recycle la matière v2 (copper/denim) sous une nouvelle grille de rôles. **Un seul rendu, toujours sombre** — pas de variante jour.

Trois rendus visuels possibles au total : `elegante-jour`, `elegante-nuit`, `rugueux`. Tout écran du site — public **et** admin — doit être validé dans les trois.

**Ce que ce document remplace** : tous les tokens `cgws-tack/leather/copper/rope/parchment/cream/denim/rust/charcoal` de v2 deviennent des **tokens de rôle** (`ground/surface/surface-2/edge/hairline/ink/ink-soft/heading/accent/accent-deco/on-accent/danger/on-danger/success/on-success`) dont la valeur hex change selon la peau/le mode actifs, exactement comme Nuxt UI v4 fait varier `--ui-primary` entre `:root` et `.dark`. Le nom de la classe Tailwind reste stable (`bg-cgws-ground`), sa valeur change sous le capot. Ceci évite un renommage risqué de tous les usages "matière" (bordures, fonds) — voir §7 et `US-070` pour le détail de la stratégie de migration.

---

## 2. Les deux peaux — tables de tokens

### 2.1 Rôles sémantiques (theme-aware)

| Rôle | Fonction | Règle d'usage |
|---|---|---|
| `ground` | Fond de page | Fond principal du site |
| `surface` | Fond de carte / bloc | TagCard, CgwsCard, panneaux |
| `surface-2` | Fond de carte imbriquée / survol | États actifs, sous-blocs, badges neutres (aussi utilisé pour les statuts "en attente/provisoire", cf. §4.1) |
| `edge` | Bordure structurelle | Bordures de carte, contours de bouton outline |
| `hairline` | Séparateur fin | `<hr>` remplacés, séparateurs de liste, bordures discrètes |
| `ink` | Texte principal | Corps de texte, titres de produit — **doit toujours atteindre AA texte** |
| `ink-soft` | Texte secondaire / muted | Métadonnées, légendes, marque produit (aussi texte des badges neutres "en attente/provisoire", cf. §4.1) |
| `heading` | Couleur des titres H2/H3 (Rye) | Titres de section courts uniquement — voir §3 |
| `accent` | Couleur portant du texte lisible | CTA, prix, liens, texte sur bouton plein — **AA obligatoire, ≥4.5:1** |
| `accent-deco` | Couleur décorative uniquement | Bordures, coutures pointillées, étoiles, gros aplats de titre — **jamais du texte lisible** |
| `on-accent` | Texte/icône posé sur un fond `accent` plein | Texte de bouton primaire |
| `danger` | Couleur d'alerte / erreur / refus — **texte lisible, AA obligatoire comme `accent`** | Messages d'erreur de formulaire, refus/retour de consignation (`rejected`/`returned`), actions destructives |
| `on-danger` | Texte/icône posé sur un fond `danger` plein | Texte de bouton destructif, badge "Refusé"/"Rendue" plein |
| `success` | Couleur de statut positif — **texte lisible, AA obligatoire comme `accent`/`danger`, y compris en usage pilule translucide `/15`** | Consignation acceptée (`accepted`), produit actif/en vente (`active`) — cf. §4.1 pour la taxonomie complète |
| `on-success` | Texte/icône posé sur un fond `success` plein | Texte de bouton/badge positif en fond plein (ex. action "Accepter" si affichée en plein) |
| `denim` | Contre-accent — **Rugueux uniquement**, CTA secondaire, très parcimonieux | Réservé Rugueux, hérité de v2 |

> ⚠️ **RÈGLE DE CONTRASTE — GARDE-FOU NON NÉGOCIABLE DU SPRINT**
> Le rose (`accent-deco` Élégante) et le copper (`accent-deco` Rugueux) échouent WCAG AA en tant que couleur de texte (mesures ci-dessous, 3.3–4.2:1 selon le fond). **`accent-deco` = décoratif uniquement** (bordures, coutures, ornements, très gros titres purement décoratifs qui ne portent pas d'information critique). **`accent`, `danger` et `success` = tout ce qui porte du texte lisible** (CTA, prix, liens, labels de formulaire, texte de badge, messages d'erreur, statuts) et doivent toujours atteindre ≥4.5:1 texte normal / ≥3:1 UI et large text. Cette règle s'applique **identiquement dans les deux peaux et les trois rendus**, sans exception de contexte — même quand une mesure ponctuelle d'`accent-deco` dépasserait 4.5:1 dans un rendu donné (c'est le cas en Élégante Nuit, voir note §2.4), la règle reste catégorique pour la cohérence du système et parce qu'`accent-deco` est aussi utilisé à opacité réduite (coutures, filigranes) où le contraste réel chute bien en dessous du seuil. **`danger` et `success` suivent exactement le même régime que `accent`** : jamais de version "décorative" tolérée sous le seuil.
>
> **Cas particulier `success` — pilule translucide `bg-cgws-success/15 text-cgws-success`** : c'est l'usage réel prévu pour les badges de statut positif (cf. §4.1), et **c'est le fond composité (couleur de base mélangée à 15% de `success`), pas le fond opaque, qui doit être utilisé pour calculer le contraste du texte**. Un token qui passe AA sur `ground`/`surface` opaques peut échouer une fois mélangé à 15% — c'est exactement l'écart qui a motivé cette révision (cf. §2.6). Toute nouvelle classe `bg-cgws-{role}/{opacity} text-cgws-{role}` doit être vérifiée de la même façon avant d'être généralisée, jamais supposée conforme par analogie.

### 2.2 Élégante — Jour (claire, défaut)

| Rôle | Hex | Variable CSS |
|---|---|---|
| `ground` | `#F6EDDF` | `--cgws-ground` |
| `surface` | `#EFE1CC` | `--cgws-surface` |
| `surface-2` | `#E7D6BC` | `--cgws-surface-2` |
| `edge` | `#8A4B2F` | `--cgws-edge` |
| `hairline` | `#D8C4A8` | `--cgws-hairline` |
| `ink` | `#2A1D16` | `--cgws-ink` |
| `ink-soft` | `#5B4436` | `--cgws-ink-soft` |
| `heading` | `#8A4B2F` | `--cgws-heading` |
| `accent` | `#8C4A56` (mauve) | `--cgws-accent` |
| `accent-deco` | `#B76E79` (rose) | `--cgws-accent-deco` |
| `on-accent` | `#FFF7F0` | `--cgws-on-accent` |
| `danger` | `#A23A47` (bordeaux) | `--cgws-danger` |
| `on-danger` | `#FFF7F0` | `--cgws-on-danger` |
| `success` | `#3D5A28` (sauge/olive foncé — voir note ci-dessous) | `--cgws-success` |
| `on-success` | `#FFF7F0` | `--cgws-on-success` |

> ⚠️ **Écart mesuré et corrigé vs la valeur proposée par le client (`~#4E6B34`).** En usage opaque, `#4E6B34` passe AA (5.21:1 sur `ground`, 4.70:1 sur `surface`). Mais l'usage réel des badges de statut est une pilule translucide `bg-cgws-success/15 text-cgws-success` (cf. §4.1) : une fois le fond composité à 15% sur `ground`/`surface` (eux-mêmes très clairs), le contraste du texte `#4E6B34` tombe à **4.28:1** sur `ground`/15 et **3.89:1** sur `surface`/15 — sous le seuil AA (§2.6). La teinte a donc été assombrie vers `#3D5A28`, qui conserve la même famille sauge/olive (teinte ~95° proche du ~92° d'origine, saturation quasi identique ~38% vs ~35%, seule la clarté baisse ~25% vs ~31%) tout en atteignant **5.38:1**/**4.89:1** sur les fonds composités réels (§2.6). C'est un ajustement de rigueur calculé sur l'usage réel du composant, pas une préférence esthétique.

### 2.3 Élégante — Nuit (sombre, suit `prefers-color-scheme`)

| Rôle | Hex | Variable CSS |
|---|---|---|
| `ground` | `#241811` | `--cgws-ground` |
| `surface` | `#33231A` | `--cgws-surface` |
| `surface-2` | `#402C20` | `--cgws-surface-2` |
| `edge` | `#7A5334` | `--cgws-edge` |
| `hairline` | `#4B3527` | `--cgws-hairline` |
| `ink` | `#F3E7D7` | `--cgws-ink` |
| `ink-soft` | `#C8AC93` | `--cgws-ink-soft` |
| `heading` | `#E8B9C0` | `--cgws-heading` |
| `accent` | `#D98F9B` | `--cgws-accent` |
| `accent-deco` | `#C98B94` | `--cgws-accent-deco` |
| `on-accent` | `#241811` | `--cgws-on-accent` |
| `danger` | `#E0808C` | `--cgws-danger` |
| `on-danger` | `#241811` | `--cgws-on-danger` |
| `success` | `#9FC178` | `--cgws-success` |
| `on-success` | `#241811` | `--cgws-on-success` |

Valeurs `danger` et `success` proposées par `ux-designer` à partir des exemples client (`~#E0808C`, `~#9FC178`) et validées par calcul (§2.6) — aucun ajustement nécessaire pour ce rendu, les deux propositions passent déjà AA avec marge confortable sur `ground`/`surface` opaques **et** sur les fonds composités `/15` réels.

### 2.4 Rugueux (sombre, rendu unique)

| Rôle | Hex | Variable CSS |
|---|---|---|
| `ground` | `#1E140D` | `--cgws-ground` |
| `surface` | `#2C1F15` | `--cgws-surface` |
| `surface-2` | `#3A2A1C` | `--cgws-surface-2` |
| `edge` | `#7A5A38` | `--cgws-edge` |
| `hairline` | `#463322` | `--cgws-hairline` |
| `ink` | `#ECDCC6` | `--cgws-ink` |
| `ink-soft` | `#B39676` | `--cgws-ink-soft` |
| `heading` | `#E8B57E` | `--cgws-heading` |
| `accent` | `#CF8438` (laiton) | `--cgws-accent` |
| `accent-deco` | `#B8650A` (copper) | `--cgws-accent-deco` |
| `on-accent` | `#241A10` | `--cgws-on-accent` |
| `danger` | `#D66F3E` (brique éclairci — voir note §2.4a) | `--cgws-danger` |
| `on-danger` | `#241A10` | `--cgws-on-danger` |
| `success` | `#8FA85A` | `--cgws-success` |
| `on-success` | `#241A10` | `--cgws-on-success` |
| `denim` (contre-accent) | `#5B7A9B` | `--cgws-denim` |

**§2.4a — Écart mesuré et corrigé vs la valeur "brique" approuvée par le client.** Le client a approuvé `#C4562B` comme point de départ pour `danger` en Rugueux. Mesure réelle (§2.6) : **4.06:1** sur `ground` et **3.59:1** sur `surface` — sous le seuil AA 4.5:1 requis pour un rôle qui porte du texte lisible (messages d'erreur, labels de badge "Refusé"), contrairement à `accent-deco` qui est explicitement dispensé de ce seuil parce qu'il ne porte jamais de texte. Conformément à la règle de contraste non négociable (§2.1), la teinte a été éclaircie vers `#D66F3E` — toujours dans la famille "brique/terracotta" du brief, luminance relative accrue pour atteindre **5.34:1** sur `ground` et **4.72:1** sur `surface` (mesures §2.6). **Ceci est un ajustement de rigueur calculé, pas une préférence esthétique** — à reconfirmer visuellement avec le client avant implémentation ; si le rendu "brique clair" ne convient pas, toute alternative devra repasser par le même calcul de contraste avant validation.

**§2.4b — `success` Rugueux, proposition client validée telle quelle.** `#8FA85A` (olive/kaki, exemple client) passe AA en usage opaque (6.82:1 sur `ground`, 6.03:1 sur `surface`) **et** en usage réel pilule `/15` composité : **5.39:1** sur `ground`/15, **4.69:1** sur `surface`/15 (§2.6) — marge plus serrée que Jour/Nuit sur `surface`/15 (4.69:1 vs seuil 4.5:1) mais un passage net, aucun ajustement nécessaire.

### 2.5 Littéraux de marque (fixes, non theme-aware)

Ces valeurs ne changent **jamais** selon la peau/le mode. Réservées au logo, aux illustrations de marque, et à des usages ponctuels explicitement documentés (ex. badge consignation en Élégante, §5.5). Ne jamais les utiliser pour du chrome UI générique (fonds de page, boutons, textes) — utiliser les rôles ci-dessus à la place.

| Nom | Hex | Variable CSS |
|---|---|---|
| `brand-cream` | `#F6EDDF` | `--cgws-brand-cream` |
| `brand-parchment` | `#EFE1CC` | `--cgws-brand-parchment` |
| `brand-sand` | `#CBAD85` | `--cgws-brand-sand` |
| `brand-rose` | `#B76E79` | `--cgws-brand-rose` |
| `brand-mauve` | `#8C4A56` | `--cgws-brand-mauve` |
| `brand-blush` | `#E8C4CB` | `--cgws-brand-blush` |
| `brand-chestnut` | `#8A4B2F` | `--cgws-brand-chestnut` |
| `brand-tack` | `#4E3227` | `--cgws-brand-tack` |
| `brand-espresso` | `#2A1D16` | `--cgws-brand-espresso` |

### 2.6 Mesures de contraste (WCAG 2.1, formule luminance relative sRGB)

| Paire | Ratio calculé | Seuil | Statut |
|---|---|---|---|
| Élégante Jour — `ink` sur `ground` | 14.07:1 | 4.5:1 | ✓ AAA |
| Élégante Jour — `ink-soft` sur `ground` | 7.78:1 | 4.5:1 | ✓ AAA |
| Élégante Jour — `ink-soft` sur `surface-2` (badge neutre "en attente") | 6.34:1 | 4.5:1 | ✓ |
| Élégante Jour — `heading` sur `ground` | 5.79:1 | 3:1 (large text) | ✓ |
| Élégante Jour — `accent` sur `ground` (prix, liens) | 5.60:1 | 4.5:1 | ✓ |
| Élégante Jour — `on-accent` sur `accent` (bouton primaire) | 6.13:1 | 4.5:1 | ✓ |
| Élégante Jour — `accent-deco` sur `ground` (texte, référence) | **3.28:1** | 4.5:1 | ✗ — confirme la règle : décoratif uniquement |
| Élégante Jour — `danger` sur `ground` (erreurs, texte) | 5.60:1 | 4.5:1 | ✓ |
| Élégante Jour — `danger` sur `surface` | 5.04:1 | 4.5:1 | ✓ |
| Élégante Jour — `on-danger` sur `danger` (bouton/badge destructif) | 6.13:1 | 4.5:1 | ✓ |
| Élégante Jour — `success` valeur client `#4E6B34` sur `ground` (opaque, référence) | 5.21:1 | 4.5:1 | ✓ (opaque) |
| Élégante Jour — `success` valeur client `#4E6B34` sur **`bg-cgws-success/15` composité sur `ground`** (usage réel pilule) | **4.28:1** | 4.5:1 | ✗ — sous le seuil, valeur ajustée retenue |
| Élégante Jour — `success` valeur client `#4E6B34` sur **`bg-cgws-success/15` composité sur `surface`** (usage réel pilule) | **3.89:1** | 4.5:1 | ✗ — sous le seuil, valeur ajustée retenue |
| Élégante Jour — `success` valeur ajustée `#3D5A28` sur `ground` (opaque) | 6.73:1 | 4.5:1 | ✓ |
| Élégante Jour — `success` valeur ajustée `#3D5A28` sur `surface` (opaque) | 6.06:1 | 4.5:1 | ✓ |
| Élégante Jour — `success` valeur ajustée `#3D5A28` sur **`bg-cgws-success/15` composité sur `ground`** (usage réel pilule) | **5.38:1** | 4.5:1 | ✓ — retenue |
| Élégante Jour — `success` valeur ajustée `#3D5A28` sur **`bg-cgws-success/15` composité sur `surface`** (usage réel pilule) | **4.89:1** | 4.5:1 | ✓ — retenue |
| Élégante Jour — `on-success` sur `success` (bouton/badge positif plein) | 7.36:1 | 4.5:1 | ✓ |
| Élégante Nuit — `ink` sur `ground` | 14.18:1 | 4.5:1 | ✓ AAA |
| Élégante Nuit — `ink-soft` sur `surface-2` (badge neutre "en attente") | 6.13:1 | 4.5:1 | ✓ |
| Élégante Nuit — `accent` sur `ground` (prix, liens) | 6.88:1 | 4.5:1 | ✓ |
| Élégante Nuit — `on-accent` sur `accent` (bouton primaire) | 6.88:1 | 4.5:1 | ✓ |
| Élégante Nuit — `danger` sur `ground` | 6.29:1 | 4.5:1 | ✓ |
| Élégante Nuit — `danger` sur `surface` | 5.47:1 | 4.5:1 | ✓ |
| Élégante Nuit — `on-danger` sur `danger` | 6.29:1 | 4.5:1 | ✓ |
| Élégante Nuit — `success` `#9FC178` sur `ground` (opaque) | 8.55:1 | 4.5:1 | ✓ |
| Élégante Nuit — `success` `#9FC178` sur `surface` (opaque) | 7.43:1 | 4.5:1 | ✓ |
| Élégante Nuit — `success` `#9FC178` sur **`bg-cgws-success/15` composité sur `ground`** (usage réel pilule) | **6.38:1** | 4.5:1 | ✓ |
| Élégante Nuit — `success` `#9FC178` sur **`bg-cgws-success/15` composité sur `surface`** (usage réel pilule) | **5.49:1** | 4.5:1 | ✓ |
| Élégante Nuit — `on-success` sur `success` | 8.55:1 | 4.5:1 | ✓ |
| Rugueux — `ink` sur `ground` | 13.45:1 | 4.5:1 | ✓ AAA |
| Rugueux — `ink-soft` sur `ground` | 6.49:1 | 4.5:1 | ✓ |
| Rugueux — `ink-soft` sur `surface-2` (badge neutre "en attente/réservé") | 4.94:1 | 4.5:1 | ✓ |
| Rugueux — `accent` (laiton) sur `ground` (prix, liens, CTA) | 6.04:1 | 4.5:1 | ✓ |
| Rugueux — `on-accent` sur `accent` (bouton primaire) | 5.70:1 | 4.5:1 | ✓ |
| Rugueux — `accent-deco` (copper) sur `ground`, référence texte | 4.22:1 | 4.5:1 | ✗ — décoratif uniquement |
| Rugueux — `accent-deco` (copper) sur `surface` (fond carte), référence texte | 3.73:1 | 4.5:1 | ✗ — décoratif uniquement |
| Rugueux — `danger` valeur client `#C4562B` sur `ground`, référence | 4.06:1 | 4.5:1 | ✗ — sous le seuil, valeur ajustée retenue |
| Rugueux — `danger` valeur client `#C4562B` sur `surface`, référence | 3.59:1 | 4.5:1 | ✗ — sous le seuil, valeur ajustée retenue |
| Rugueux — `danger` valeur ajustée `#D66F3E` sur `ground` | 5.34:1 | 4.5:1 | ✓ — retenue |
| Rugueux — `danger` valeur ajustée `#D66F3E` sur `surface` | 4.72:1 | 4.5:1 | ✓ — retenue |
| Rugueux — `on-danger` sur `danger` (ajustée) | 5.04:1 | 4.5:1 | ✓ |
| Rugueux — `success` `#8FA85A` sur `ground` (opaque) | 6.82:1 | 4.5:1 | ✓ |
| Rugueux — `success` `#8FA85A` sur `surface` (opaque) | 6.03:1 | 4.5:1 | ✓ |
| Rugueux — `success` `#8FA85A` sur **`bg-cgws-success/15` composité sur `ground`** (usage réel pilule) | **5.39:1** | 4.5:1 | ✓ |
| Rugueux — `success` `#8FA85A` sur **`bg-cgws-success/15` composité sur `surface`** (usage réel pilule) | **4.69:1** | 4.5:1 | ✓ — marge la plus serrée des 3 rendus, à surveiller si le composant évolue |
| Rugueux — `on-success` sur `success` | 6.43:1 | 4.5:1 | ✓ |

**Conclusion mesurable** : dans les trois rendus, `accent`, `danger` et `success` passent systématiquement AA texte normal — y compris `success` dans son usage réel de pilule translucide `/15`, qui est plus contraignant que l'usage opaque et a nécessité un ajustement en Élégante Jour (`#4E6B34` → `#3D5A28`, la valeur d'origine échouait à 4.28:1/3.89:1 précisément dans cet usage réel) tout en validant directement les propositions client pour Nuit et Rugueux. `accent-deco` reste toujours sous le seuil 4.5:1 en usage texte plein (3.3 à 4.2:1 selon fond) — la ségrégation de rôle proposée est la seule façon de respecter AA tout en conservant le rose/copper dans le système visuel. Ces deux épisodes (`danger` Rugueux, `success` Jour) illustrent la même leçon : une valeur "approuvée en première intention" ou "improvisée en implémentation" (`bg-cgws-heading/15 text-cgws-heading`, cf. §4.1) doit systématiquement être vérifiée par le calcul **sur l'usage réel du composant**, jamais supposée conforme par analogie avec une autre paire déjà validée. QA doit revérifier ces ratios sur les vraies classes Tailwind rendues, pas seulement sur cette table.

---

## 3. Typographie

Bebas Neue est **supprimé**. Rye est **conservé** (revirement client) mais restreint aux titres courts.

| Rôle | Police | Poids | Usage | Classe Tailwind |
|---|---|---|---|---|
| Hero H1 | Playfair Display | 700 | Titre plein écran hero, un par page | `font-display` |
| Prix / labels numériques | Playfair Display | 700, `tabular-nums` | Prix produit, StarDivider stat, KPI admin | `font-display tabular-nums` |
| Titres de section H2/H3 **courts** | Rye | 400 | Titres de section ≤ ~4 mots uniquement — **jamais** sur un nom de produit ni un paragraphe | `font-heading` |
| Titres de section H2/H3 **longs**, noms de produit | Playfair Display | 600–700 | Fallback quand le titre dépasse ~4 mots ou est dynamique (nom produit, titre CMS) | `font-serif font-semibold` |
| Eyebrows / labels de section | Playfair Display | 600, capitales | `uppercase tracking-[0.4em]` — serif capitales espacées, pas de police dédiée supplémentaire (décision, voir note) | `font-eyebrow` |
| Taglines / pull quotes | Playfair Display Italic | 400 | Sous-titres hero, citations de marque | `font-serif italic` |
| Corps de texte | Inter | 400–500 | Tout texte courant, formulaires | `font-sans` |
| Boutons, badges, emphase numérique | Inter | 600–700 | Libellés CTA (hors bouton primaire qui utilise `font-display`), badges | `font-sans font-semibold` |

**Décision non spécifiée par le client, tranchée ici (notée/validée côté orchestrateur, non bloquante)** : le brief demande "serif capitales espacées (~0.4em, uppercase)" pour les eyebrows sans nommer de police. Plutôt que charger une police supplémentaire, `--font-eyebrow` réutilise Playfair Display en 600 + `uppercase tracking-[0.4em]` — cohérent avec le reste de la famille serif du système et évite d'alourdir le poids de police chargé.

**Règle Rye (renforcée vs v2)** : jamais sur un nom de produit long, jamais dans un paragraphe, jamais dans un badge. Rye est illisible en dessous de ~20px et en texte courant — réservé aux H2/H3 de section de 1 à 4 mots (`"Notre Histoire"`, `"Consignation"`, `"Le Certificat"`). Si un titre de section dynamique (CMS, catalogue) peut dépasser 4 mots, utiliser systématiquement le fallback Playfair Display 700, jamais Rye.

**Chargement fonts** (`nuxt.config.ts`, `@nuxtjs/google-fonts`) :
```ts
googleFonts: {
  families: {
    'Rye': true,
    'Playfair Display': { wght: [400, 600, 700], ital: [400] },
    'Inter': [400, 500, 700],
  },
  display: 'swap',
}
// 'Bebas Neue': true  ← retiré
```

**Prix / chiffres — `tabular-nums` obligatoire** : tout affichage de prix ou de statistique numérique (StarDivider stat, KpiCard admin) doit porter la classe utilitaire Tailwind `tabular-nums` pour aligner les chiffres en largeur fixe (évite le "jitter" visuel lors des compteurs GSAP ou des mises à jour de prix).

---

## 4. Inventaire des motifs signature

| Motif v2 (retiré) | Motif v3 | Rôle |
|---|---|---|
| Conchos cuivre (médaillon plat) | **Étoile-boussole 8 branches** (`StarDivider`) | Diviseur de section ET médaillon-stat (deux variantes du même composant, voir `US-072`) |
| ConchoDivider | `StarDivider variant="divider"` | Remplace le `<hr>`, interrompt une ligne fine `hairline` par l'étoile en petit format |
| ConchoStat | `StarDivider variant="stat"` | Remplace les barres de stats plates, grand format, valeur + label au centre |
| — (nouveau) | **Arabesques filigranées** (SVG décoratif) | Coins de section, en-têtes de bloc — décoratif, `aria-hidden="true"` systématique |
| — (nouveau) | **Arche fine** | Cadre de hero et d'en-têtes de page — ligne fine `edge`/`accent-deco` en forme d'arc, jamais pleine |
| TagCard (conservé, re-skinné) | TagCard v3 | Composant phare conservé — bg `surface`, bordure `edge` 2px, couture pointillée `accent-deco`, badge statut, titre Playfair, prix Playfair `accent` |
| Wanted-poster (parchemin + double bordure charcoal, woodtype) | **Certificat élégant** | Section consignation — double bordure `accent-deco`, étoile-boussole centrée, titre Rye, corps Playfair/Inter. Porte l'accent signature car la consignation est LE différenciateur métier |
| Badge statut (pilules pleines) | Badge statut v3 | Consignation = accent signature (fond `brand-blush`/soft + bordure `accent-deco`) ; Neuf = outline `ink` ; Occasion = neutre `surface-2` ; Vendu = accent plein `accent`/`on-accent` ; Refusé/Rendue = `danger` plein (`danger`/`on-danger`) ; **Acceptée/Active = `success` pilule translucide (`bg-cgws-success/15 text-cgws-success`)** — taxonomie complète en §4.1 |

Détail complet des composants (props, classes Tailwind, states, breakpoints) : voir `US-072-signature-components.md`.

### 4.1 Taxonomie des statuts admin (Consignation / Produit)

**Contexte** : la QA d'`US-070` a révélé qu'aucun rôle validé n'existait pour un statut positif — le développeur a soit laissé des `bg-green-*` Tailwind en dur (non theme-aware, casse dans les 3 rendus), soit improvisé `bg-cgws-heading/15 text-cgws-heading` (paire non prévue pour cet usage, mesurée ~4.3–4.7:1 en Élégante Jour, sous le seuil pour du texte de pilule normal). Cette section fige la cartographie complète pour éviter toute nouvelle improvisation sur les statuts restants.

Types concernés (`app/types/index.ts`) : `ConsignmentStatus` (`'pending' | 'accepted' | 'rejected' | 'sold' | 'returned'`) et `ProductStatus` (`'active' | 'sold' | 'reserved' | 'inactive'`).

| Domaine | Statut | Signification | Token | Classe recommandée | Contraste vérifié |
|---|---|---|---|---|---|
| Consignation | `pending` | En attente d'examen | Neutre (`ink-soft`/`surface-2`, **déjà utilisé pour le badge "Occasion", pas de nouveau token**) | `bg-cgws-surface-2 text-cgws-ink-soft border border-cgws-hairline` | 6.34:1 / 6.13:1 / 4.94:1 (Jour/Nuit/Rugueux — §2.6, nouvellement validé à cette occasion) |
| Consignation | `accepted` | Acceptée | `success` | `bg-cgws-success/15 text-cgws-success border border-cgws-success/40` | 5.38:1 / 6.38:1 / 5.39:1 sur `ground`/15 · 4.89:1 / 5.49:1 / 4.69:1 sur `surface`/15 (§2.6) |
| Consignation | `rejected` | Refusée | `danger` | `bg-cgws-danger text-cgws-on-danger` (plein — identique au badge produit "Refusé", `US-072` §6) | 6.13:1 / 6.29:1 / 5.04:1 (`on-danger` sur `danger`, §2.6) |
| Consignation | `sold` | Vendue | `accent` | `bg-cgws-accent text-cgws-on-accent` (plein — identique à `Product.status === 'sold'`) | 6.13:1 / 6.88:1 / 5.70:1 (`on-accent` sur `accent`, §2.6) |
| Consignation | `returned` | Rendue au déposant | `danger` | `bg-cgws-danger text-cgws-on-danger` (plein — même traitement que `rejected` ; différenciation par le libellé/icône, pas par une nuance de couleur supplémentaire non testée) | Idem `rejected` |
| Produit | `active` | En vente | `success` | `bg-cgws-success/15 text-cgws-success border border-cgws-success/40` — badge optionnel : l'état "actif" est aussi l'état par défaut dans les listes où seuls les statuts exceptionnels sont signalés visuellement | Idem `accepted` ci-dessus |
| Produit | `reserved` | Réservé | Neutre (`ink-soft`/`surface-2`) | `bg-cgws-surface-2 text-cgws-ink-soft border border-cgws-hairline` | Idem `pending` ci-dessus |
| Produit | `sold` | Vendu | `accent` | `bg-cgws-accent text-cgws-on-accent` (plein — identique à `CgwsBadge variant="sold"`, `US-072` §6) | Idem `Consignation.sold` |
| Produit | `inactive` | Inactif / masqué du catalogue | Neutre (`ink-soft`/`surface-2`) | `bg-cgws-surface-2 text-cgws-ink-soft border border-cgws-hairline` | Idem `pending` — **extension non explicitement demandée par le client, ajoutée pour couvrir l'intégralité de `ProductStatus` ; à confirmer avec `product-owner` si un traitement distinct de `reserved` est souhaité** |

**Principe de lecture de cette table** : seuls deux rôles "chauds" existent pour les statuts — `success` (issue positive) et `danger` (issue négative/destructive). Tout le reste (attente, provisoire, masqué) utilise le même couple neutre déjà existant `ink-soft`/`surface-2` plutôt que d'inventer une quatrième ou cinquième couleur de statut. `accent` n'est volontairement **pas** un rôle de statut : il reste réservé aux CTA/prix/liens ; son usage pour `sold` est un cas particulier hérité (le produit vendu "sort" du cycle de vie plutôt que de recevoir une couleur de statut à proprement parler) et ne doit pas être étendu à d'autres statuts sans revalidation.

---

## 5. Principes d'espacement et de forme

Conservés de v2, sans changement (le rebranding est chromatique/typographique/motifs, pas structurel) :

```css
--section-py:    clamp(3rem, 8vw, 6rem);
--container-max: 1280px;
--container-px:  clamp(1rem, 4vw, 2rem);
```

**Rayon de bordure — nouveauté v3 (notée/validée côté orchestrateur, non bloquante)** : Nuxt UI v4 pilote un rayon global via `--ui-radius` (voir §6.2). Décision de design : la peau Élégante adopte un rayon plus généreux (raffiné, arrondi doux, cohérent avec le lettrage Playfair) ; Rugueux conserve un rayon plus sec (utilitaire, coupe cuir nette), theme-aware via le même mécanisme `[data-skin]` que les couleurs :

| Peau | `--ui-radius` |
|---|---|
| Élégante (jour + nuit) | `0.5rem` |
| Rugueux | `0.25rem` |

Rayon spécifique conservé pour TagCard (motif étiquette, coins légèrement arrondis mais pas circulaires) : `6px`, indépendant de `--ui-radius`.

---

## 6. Switcher de thème — spec UX et mécanisme technique

### 6.1 Comportement fonctionnel

- **Placement** : icône/segment dans `AppHeader` (public), à droite, avant (desktop) ou dans le menu mobile (mobile) — position équivalente à l'actuel bouton téléphone/burger. Toujours visible, jamais caché dans un sous-menu secondaire. **Également présent dans la topbar du layout admin** (`app/layouts/admin.vue`) — Camille dispose exactement du même contrôle que le visiteur public, aucun écran du backoffice n'est figé sur une peau unique. Placement précis dans la topbar admin : voir `US-073-074-075-pages-outline.md` §US-075.
- **Deux contrôles logiquement distincts, réunis dans un seul composant `ThemeSwitcher`**, réutilisé tel quel entre header public et topbar admin :
  1. **Peau** (Élégante / Rugueux) — toggle à 2 états, toujours disponible.
  2. **Mode jour/nuit** — uniquement pertinent quand la peau active est Élégante ; **masqué/désactivé quand Rugueux est actif** (Rugueux est intrinsèquement sombre, pas de variante jour).
- **Défaut** : peau = Élégante ; mode = suit `prefers-color-scheme` du système tant que l'utilisateur n'a pas fait de choix explicite (équivalent du mode `system` de `@nuxtjs/color-mode`). Le défaut s'applique identiquement en admin (pas de préréglage différent pour Camille).
- **Persistance** : `localStorage`, deux clés séparées :
  - `cgws-skin` → `'elegante' | 'rugueux'`
  - `cgws-color-mode` → `'light' | 'dark' | 'system'` (gérée nativement par `@nuxtjs/color-mode`, clé par défaut du module, généralement `nuxt-color-mode` — à confirmer par `nuxt-developer` via `mcp__nuxt-remote`/`mcp__nuxt-ui-remote` au moment de l'implémentation, cf. `US-071`).
  - La persistance est partagée entre site public et admin (même `localStorage`, même origine) — si Camille change de peau en admin, le site public s'ouvre dans le même navigateur avec la même préférence, et inversement. C'est le comportement attendu, pas un bug.
- **Anti-flash SSR obligatoire** : le rendu initial (HTML servi + premier paint) doit déjà porter la bonne peau et le bon mode — aucun flash de la peau/mode par défaut avant bascule client, **y compris sur les pages admin** qui sont elles aussi rendues côté serveur (Nuxt SSR) avant hydratation. Voir §6.2 pour le mécanisme exact.

### 6.2 Mécanisme technique vérifié (MCP `nuxt-ui-remote`)

Confirmé via la documentation officielle Nuxt UI v4 (`/docs/getting-started/integrations/color-mode/nuxt`, `/docs/getting-started/theme/css-variables`) :

- **`@nuxt/ui` enregistre automatiquement `@nuxtjs/color-mode`** — aucune installation manuelle requise. Peut être désactivé via `ui: { colorMode: false }` dans `nuxt.config.ts` (non souhaité ici, on le garde actif).
- Composable `useColorMode()` expose `colorMode.preference` (`'light' | 'dark' | 'system'`, ce que choisit l'utilisateur) et `colorMode.value` (la valeur résolue après application de `system`).
- Pattern officiel documenté pour un toggle custom :
  ```vue
  <script setup lang="ts">
  const colorMode = useColorMode()
  const isDark = computed({
    get: () => colorMode.value === 'dark',
    set: (v) => { colorMode.preference = v ? 'dark' : 'light' }
  })
  </script>
  <template>
    <ClientOnly v-if="!colorMode?.forced">
      <UButton :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'" @click="isDark = !isDark" />
      <template #fallback><div class="size-8" /></template>
    </ClientOnly>
  </template>
  ```
  Le wrapping `<ClientOnly>` + `#fallback` évite tout hydration mismatch sur l'icône (le mode résolu n'est connu qu'après lecture du `localStorage`/`prefers-color-scheme` côté client) — **à répliquer pour le contrôle jour/nuit de `ThemeSwitcher`**, en public comme en admin.
- Nuxt UI documente et applique lui-même le pattern de **variables CSS theme-aware** que ce document reprend pour les rôles CGWS : une valeur définie en `:root`, une autre sous `.dark` (cf. `--ui-bg`, `--ui-text`, `--ui-border` en §"CSS Variables" de la doc officielle). C'est exactement le mécanisme utilisé en §2 pour `--cgws-ground`, `--cgws-accent`, `--cgws-danger`, `--cgws-success`, etc.
- Le module `@nuxtjs/color-mode` gère nativement l'anti-flash pour l'axe jour/nuit : il injecte un script bloquant exécuté avant le premier paint qui lit la préférence stockée et pose la classe `dark`/`light` sur `<html>` avant l'hydratation Vue. C'est un comportement par défaut du module, pas une implémentation custom à écrire — et il s'applique de la même façon aux pages publiques et aux pages admin puisqu'il opère au niveau du document, pas d'une layout spécifique.

**Ce qui N'EST PAS un mécanisme natif de `@nuxtjs/color-mode`** : l'axe **peau** (Élégante/Rugueux) est un besoin métier CGWS à 2 valeurs (3 rendus visuels combinés avec jour/nuit), distinct du binaire light/dark que gère nativement le module. Décision de design retenue ici (à valider techniquement par `nuxt-developer`) :

- Attribut `data-skin="elegante" | "rugueux"` posé sur `<html>`, piloté par un composable custom `useCgwsSkin()` (state + `localStorage['cgws-skin']`).
- Pour garantir l'anti-flash sur cet axe également (le mécanisme interne du module color-mode ne couvre que light/dark), répliquer le **même principe** : un script bloquant, exécuté avant le premier paint, qui lit `localStorage['cgws-skin']` et pose l'attribut `data-skin` sur `<html>` avant hydratation. Concrètement dans Nuxt 4 : script inline déclaré dans `app.head.script` (`nuxt.config.ts`) ou via `useHead()` dans un plugin `app/plugins`, à confirmer/implémenter par `nuxt-developer` avec vérification `mcp__nuxt-remote` de l'API `useHead`/`app.head` avant implémentation (règle absolue MCP de `CLAUDE.md`) — ce point technique bas niveau n'a pas pu être vérifié depuis les outils MCP disponibles dans cette session de conception (uniquement `nuxt-ui-remote`, pas `nuxt-remote`), il est donc explicitement signalé comme **à re-vérifier côté implémentation**, pas deviné. Ce script s'applique globalement (posé au niveau document), donc **couvre nativement les pages admin sans logique dupliquée**.
- CSS résultant :
  ```css
  :root,
  [data-skin="elegante"] {
    --cgws-ground: #F6EDDF; /* … Élégante Jour, cf. §2.2 */
  }
  [data-skin="elegante"].dark {
    --cgws-ground: #241811; /* … Élégante Nuit, cf. §2.3 */
  }
  [data-skin="rugueux"] {
    --cgws-ground: #1E140D; /* … Rugueux, cf. §2.4 — ignore volontairement .dark */
    --ui-radius: 0.25rem;
  }
  [data-skin="elegante"] { --ui-radius: 0.5rem; }
  ```
- Quand `data-skin="rugueux"`, le contrôle jour/nuit du `ThemeSwitcher` est désactivé/masqué (§6.1) — la classe `.dark` posée par `@nuxtjs/color-mode` peut rester présente en mémoire (préférence utilisateur conservée pour quand il repasse en Élégante) mais n'a aucun effet visuel tant que `data-skin="rugueux"`, car les sélecteurs Rugueux ne dépendent jamais de `.dark`.

Spec de composant complète (états, clavier, aria, Gherkin) : `US-071-theme-switcher.md`.

---

## 7. Migration des tokens v2 → v3 (résumé — détail complet dans `US-070`)

| Ancien token v2 | Nouveau rôle v3 | Remarque |
|---|---|---|
| `cgws-cream` | `ground` | Fond principal |
| `cgws-parchment` | `surface` | Fond de carte |
| — (nouveau) | `surface-2` | Nouveau rôle, pas d'équivalent v2 direct |
| `cgws-leather` | `edge` | Bordures structurelles |
| — (nouveau, dérivé de `cgws-leather` à opacité réduite) | `hairline` | Séparateurs fins |
| `cgws-charcoal` | `ink` | Texte fort |
| `cgws-leather`/`cgws-rope` (selon contexte) | `ink-soft` | Texte secondaire — nécessite un audit au cas par cas, pas un simple alias |
| — (nouveau) | `heading` | Couleur des H2/H3 Rye — proche de `cgws-leather` historiquement |
| `cgws-copper` (usage texte : prix, liens) | `accent` | ⚠️ Rupture volontaire — voir règle de contraste §2.1 |
| `cgws-copper` (usage décoratif : bordures, coutures) | `accent-deco` | Reste visuellement proche du copper v2 (Rugueux) |
| `cgws-denim` | `denim` | Conservé, Rugueux uniquement |
| `cgws-rust` | `danger` (texte/bordure) + `on-danger` (texte sur fond `danger` plein) | **Tranché par le client** — nouveau rôle sur-mesure remplace `cgws-rust` dans les 32 fichiers concernés (`RejectModal.vue`, erreurs de formulaire `CgwsInput`/`CgwsTextarea`/`CgwsSelect`, `CgwsBadge` état "Refusé", hover destructif bouton déconnexion admin). Contrairement à `accent-deco`, `danger` n'a **aucune tolérance de contraste réduit** — voir mesures §2.6, y compris l'ajustement de la valeur Rugueux (`#C4562B` → `#D66F3E`) nécessaire pour rester AA. |
| — (nouveau — comblé suite QA `US-070`) | `success` (texte/pilule) + `on-success` (texte sur fond `success` plein) | **Tranché par le client.** Aucun token v2 n'existait pour cet usage — le développeur avait improvisé `bg-green-*` (non theme-aware) ou `bg-cgws-heading/15 text-cgws-heading` (paire non validée, ~4.3–4.7:1, sous AA). Remplace ces deux patterns dans `StatusDropdown.vue`, listes admin `consignations`/`produits`. Taxonomie complète : §4.1. |
| `cgws-tack` | `ground` (Rugueux) | |
| `font-display` (Bebas Neue) | `font-display` (Playfair Display 700) | Même nom de classe, police différente |
| `font-eyebrow` (Rye) | `font-heading` (Rye, H2/H3 courts) + `font-eyebrow` (Playfair capitales, nouveau rôle) | Rye change de rôle : d'eyebrow à titre de section court |

**Décision de stratégie de migration** (détaillée dans `US-070`) : conserver le préfixe Tailwind `cgws-*` et le mécanisme de classes utilitaires stables (`bg-cgws-ground`, `text-cgws-accent`, etc.) plutôt que d'introduire un préfixe `v3-*` — cela permet un remplacement mécanique (recherche/remplace) des noms de token dans les fichiers qui référencent les tokens v2 actuels, sans changer la syntaxe des appels (`bg-cgws-copper` → `bg-cgws-accent` ou `bg-cgws-accent-deco` selon le contexte texte/décoratif — jamais un remplacement 1:1 automatique aveugle, cf. règle de contraste ; `text-cgws-rust`/`border-cgws-rust`/`bg-cgws-rust` → `text-cgws-danger`/`border-cgws-danger`/`bg-cgws-danger` selon le même principe ; tout `bg-green-*`/`bg-cgws-heading/15` improvisé → `bg-cgws-success/15 text-cgws-success` selon §4.1).

---

## 8. Décisions de design — statut

### 8.1 Tranchées par le client (Sprint 6, révision post-review)

| # | Décision | Détail / renvoi |
|---|---|---|
| 1 | Token `danger` sur-mesure, remplace `cgws-rust` | Rôle défini §2.1, valeurs §2.2/§2.3/§2.4, mesures de contraste §2.6, migration §7. Implémentation : `US-070` (déclaration token), `US-072` (badges + états d'erreur), `US-075` (RejectModal admin + formulaires). |
| 2 | Header & footer suivent jour/nuit (pas de bandeau sombre fixe) | `AppHeader`/`AppFooter` prennent les rôles `ground`/`surface`/`ink`/etc. de la peau active, comme le reste du site — clairs en Élégante Jour, sombres en Nuit/Rugueux. Traitement détaillé : `US-073-074-075-pages-outline.md` §US-075. |
| 3 | Switcher disponible aussi en admin | Le backoffice n'est pas figé sur une peau : `ThemeSwitcher` intégré à la topbar de `app/layouts/admin.vue`, tous les écrans admin doivent être validés dans les 3 rendus. Détail §6.1 ci-dessus et `US-073-074-075-pages-outline.md` §US-075. |
| 4 | Token `success` sur-mesure, comble le trou révélé en QA `US-070` | Rôle défini §2.1, valeurs §2.2/§2.3/§2.4, mesures de contraste §2.6 (y compris l'usage réel pilule `/15`, plus contraignant que l'usage opaque), taxonomie complète des statuts admin §4.1. Implémentation : `US-070` (déclaration token), `US-075` (`StatusDropdown.vue`, listes admin). |

### 8.2 Points mineurs — validés/notés côté orchestrateur, non bloquants

Ces points restent des choix de `ux-designer` faute de spécification client explicite, mais ont été relus et acceptés en l'état ; ils ne nécessitent pas d'arbitrage supplémentaire avant implémentation :

- **Police des eyebrows** : Playfair Display capitales retenue faute de police dédiée nommée dans le brief (§3).
- **`--ui-radius` différencié par peau** (§5) : `0.5rem` Élégante / `0.25rem` Rugueux — à valider visuellement en implémentation mais non bloquant.
- **Remplacement de `SaddleIllustration.vue`** : asset v2 potentiellement incohérent avec le nouveau logo (cavalière de reining) — signalé à `product-owner` dans `US-073-074-075-pages-outline.md` §US-073, traité au fil de l'implémentation, pas bloquant pour le reste du Sprint 6.
- **Statut `inactive` (produit)** : mappé au même traitement neutre que `pending`/`reserved` (§4.1) par extension raisonnée, non explicitement demandé — à confirmer avec `product-owner` si un traitement distinct est souhaité.

Pour mémoire, deux décisions supplémentaires prises par `ux-designer` dans les specs détaillées restent également en l'état (déjà formulées comme des décisions assumées, pas des questions ouvertes) : la fusion `StarDivider` (divider + stat, `US-072` §2) et le remplacement de `brand-blush` par `bg-cgws-accent/15` sur le badge consignation en Rugueux (`US-072` §6).

---

## 9. Accessibilité — rappel transversal

- WCAG AA minimum partout : 4.5:1 texte normal, 3:1 texte large (≥24px normal ou ≥18.66px gras)/éléments UI.
- `accent-deco` (rose/copper) = décoratif uniquement, jamais de texte lisible — voir §2.1 et §2.6 pour les mesures. `accent`, `danger` et `success` = tout texte lisible, toujours ≥4.5:1 mesuré (pas supposé) — **y compris pour les usages à opacité réduite (`/15`), dont le fond composité doit être mesuré et non le fond opaque sous-jacent** (cf. §2.1, §4.1).
- Navigation clavier complète, focus visible en `accent` (ring 2px) dans les deux peaux — y compris en admin.
- Respect de `prefers-reduced-motion: reduce` — animations GSAP et transitions CSS désactivées (mécanisme déjà en place dans `app/assets/css/main.css`, conservé à l'identique).
- `ClientOnly` + fallback pour tout contrôle dont l'état dépend de `localStorage`/`prefers-color-scheme`, afin d'éviter les hydration mismatches (cf. §6.2) — en public comme en admin.
