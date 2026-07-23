# CGWS — Direction de marque & positionnement (v2)

> Actée le 2026-07-23 entre Nathan et Camille (atelier de repositionnement).
> Ce document est la source de vérité produit : toute US, spec design ou arbitrage de scope
> doit s'y référer. Il remplace le positionnement initial « sellerie premium, consignation
> au centre » qui a servi de base aux Sprints 1-11.

---

## Positionnement

**CGWS est la boutique de la spécialiste reining** : sellerie western en ligne + magasin à
Brèches (37), spécialisée **reining** et plus largement équitation western et randonnée.

- **Catalogue** : selles neuves & occasion, filets, mors, étriers, bandes et protections,
  licols western (ex. Boho Street), produits de soin (crins, sabots).
- **Curation stricte — promesse centrale** : hors selles, **uniquement des articles que
  Camille a personnellement utilisés et approuvés** (qualité + efficacité). Le catalogue est
  court et défendable, jamais exhaustif. C'est l'anti-catalogue-de-10 000-références.
- **Dépôt-vente de selles** : différenciateur affiché, pilier visible de la homepage.
  Face aux gros e-commerçants, c'est le service qu'eux ne peuvent pas offrir — et le modèle
  économique le plus adapté au statut micro-entreprise (commission, pas achat-revente).

**Signature éditoriale** : « Testé et approuvé par Camille » — à décliner en badge produit,
en argument de fiche produit (pourquoi cet article est dans le catalogue) et en storytelling.

## Hiérarchie des cibles

1. **Cavalier reining** (compétition & entraînement) — persona n°1. C'est pour lui qu'on
   optimise homepage, ton, SEO et catalogue. Niche d'autorité : crédibilité et réseau de
   Camille (concours, NRHA France), panier élevé, communauté prescriptrice.
2. **Cavalier western généraliste** — touché par rayonnement de l'expertise reining.
3. **Randonneur** — cible d'élargissement (confort, robustesse), jamais au prix d'une
   dilution du message reining.

## Personas (mise à jour)

| Persona | Description |
|---------|-------------|
| `Compétiteur` | cavalier reining/western, exigeant, connaît les marques, cherche du matériel technique précis |
| `Randonneur` | cavalier loisir/extérieur, cherche confort, robustesse et conseil de confiance |
| `Déposant` | particulier souhaitant vendre sa selle via le dépôt-vente |
| `Admin` | Camille (propriétaire), gère catalogue, stock et ventes depuis le backoffice |

## Modèle de vente

**Tout le catalogue est achetable en ligne** (selles comprises), avec au choix :
- **Expédition** France entière ;
- **Click & collect** au magasin de Brèches ;
- et tout reste achetable **directement en magasin**.

Points d'attention (à traiter dans les US concernées) :
- Selles expédiées : politique d'essai/retour à définir explicitement (rétractation légale
  14 jours en vente à distance, frais de retour d'une selle ≈ 60-100 €) — encourager
  l'essai/retrait sans bloquer l'achat à distance.
- Pièces uniques (occasion, dépôt-vente) : mécanique de réservation de l'epic Panier/Stripe
  (issue #2) inchangée.

## Ton de marque

**Spécialiste passionnée** — western authentique, expert et chaleureux. La boutique de LA
spécialiste reining, pas une « maison de maroquinerie ». On **garde** le design system v2
(cuir, cuivre, denim, étiquettes, conchos) ; on **abandonne** le registre « haut de gamme
façon Hermès » dans l'éditorial. La montée en gamme se dit par la curation (« si c'est dans
le catalogue, c'est que ça marche »), pas par le vocabulaire du luxe.

## Contraintes de statut (micro-entreprise)

À valider avec le comptable de Camille, mais structurant pour les arbitrages produit :
- Plafond micro (vente) ≈ 188 500 € de CA ; **franchise de TVA ≈ 85 000 €** — le mix
  selles neuves + accessoires peut atteindre le seuil TVA rapidement.
- En micro, l'achat-revente est imposé sur le CA total, pas sur la marge → pour l'occasion,
  **privilégier le dépôt-vente (commission)** au rachat de selles.

## Impacts chantier (à dériver en US)

1. **Homepage** : hero = expertise reining + catalogue ; consignation conservée en pilier
   visible mais repositionnée après la boutique.
2. **Taxonomie catégories** : à refondre autour du nouveau catalogue — selles /
   bridonnerie (filets, mors) / étriers / bandes & protections / licols & accessoires /
   soins (crins, sabots). Sort des catégories actuelles : `bottes-chaussures` et
   `vetements` **à confirmer avec Camille** (non cités dans le nouveau périmètre).
3. **Design system** : nouveau badge « Testé et approuvé par Camille » ; ton éditorial
   révisé sur les pages existantes.
4. **Checkout (issue #2)** : ajouter le choix expédition / click & collect ; étendre aux
   produits multi-stock.
5. **SEO/contenu** : pages d'expertise reining (guides, choix d'une selle de reining…),
   fiche Google Business Profile.
6. **Domaine** : voir discussion domaine — « Sellerie de Brèches » reste cohérent avec ce
   positionnement ; décision Camille + Nathan en attente.

## Questions ouvertes

- [x] Bottes/chaussures et vêtements : **gardés** au catalogue (soumis au filtre curation, comme le reste) — arbitré 2026-07-23.
- [ ] Politique essai/retour des selles expédiées : **à rédiger** (principe acté : il en faut une, affichée sur la fiche produit) → à dériver en US.
- [x] Statut : assumé en micro-entreprise, pas de blocage identifié — arbitré 2026-07-23. Garder un œil sur le seuil de franchise de TVA (~85 k€ de CA) : la franchise n'est pas illimitée, même en micro.
- [x] **Nom de marque : « Spin & Slide » — ACTÉ** (Nathan + Camille, 2026-07-23). Usage courant « Spin & Slide Shop » (sans « western »). CGWS est conservé en parallèle (voir architecture de marque ci-dessous). Reste avant officialisation : recherche INPI (classes 18, 35), handles Instagram/Facebook, achat des domaines.

### Architecture de marque (actée 2026-07-23)

- **Marque commerciale** : **Spin & Slide** (déclinaison courante : « Spin & Slide Shop »).
- **CGWS conservé en endossement** : souhait acté d'un lockup type « CGWS — Spin & Slide Shop ».
  Recommandation d'usage (à valider avec Camille) : en **façade** (header du site, enseigne,
  réseaux sociaux), Spin & Slide domine et CGWS endosse (« Spin & Slide Shop — by CGWS ») pour
  ne pas remettre l'acronyme opaque en premier contact ; l'ordre « CGWS — Spin & Slide Shop »
  vit sur les supports où CGWS est déjà connu ou obligatoire (mentions légales, factures,
  étiquettes produit avec monogramme CGWS au verso). CGWS reste le nom de l'entreprise et le
  monogramme du design system.
- **Baseline descriptive** (le signal métier perdu en retirant « western ») : conserver
  « Sellerie western & reining — vente et dépôt-vente de selles » dans le `<title>` SEO,
  la bio Instagram et le footer.
- **Domaines à acheter** (tous libres au registre AFNIC le 2026-07-23) :
  `spinandslide.fr` (canonique), `spinslide.fr` et `spin-slide.fr` (301),
  `cgws.fr` (défensif — codé en dur dans le projet), `reiningshop.fr` (optionnel, SEO 301).

### Shortlist noms de marque (brainstorm Nathan + Claude, 2026-07-23 — à présenter à Camille)

Disponibilité `.fr` vérifiée au registre AFNIC (RDAP) le 2026-07-23. Avant décision finale :
recherche INPI (classes 18 sellerie, 35 vente au détail) + handles Instagram/Facebook.

**Salve 3 (retenue pour arbitrage) — lexique reining** (les manœuvres : sliding stop, spin,
rollback, circles ; vocabulaire nativement anglais dans la discipline) :

| Nom | Domaine | Idée |
|-----|---------|------|
| **Spin & Slide** | `spinandslide.fr` libre | Les deux manœuvres les plus spectaculaires du reining. Vraie marque (distinctive, logotypable), baseline « western shop » possible. |
| **Sliding Stop** | `slidingstop.fr` libre | LA manœuvre signature. Iconographie forte : les traces « 11 » dans le sable en logo. |
| **Slider Shop** | `slidershop.fr` libre | « Sliders » = surnom des chevaux de reining. Très initié, mais « slider » évoque aussi burgers/UI hors du milieu. |
| Reining Shop | `reiningshop.fr` libre | Descriptif pur : clarté et SEO max, mais indéfendable comme marque (générique). À utiliser en baseline ou domaine SEO secondaire. |
| Western Reining Shop | `westernreiningshop.fr` libre | Variante descriptive, filiation avec « western shop » de CGWS. Même limite. |

Pris : `rollback.fr`, `whoa.fr`.

**Salve 4 (tour d'horizon culture des concours — challengers du finaliste)** : le sliding
stop est le moment où les tribunes crient (« yeah! ») et sifflent ; certains fans saluent une
manœuvre exceptionnelle par trois coups de sifflet ; chaque manœuvre est notée de -1½ à +1½
(70 = run moyen). Candidats issus de cette culture :

| Nom | Domaine | Idée |
|-----|---------|------|
| Trois Sifflets | `troissifflets.fr` libre | Les 3 coups de sifflet des tribunes pour une manœuvre exceptionnelle — belle métaphore de la curation. Outsider crédible. |
| Big Stop | `bigstop.fr` libre | « What a big stop! » — punchy mais évoque une aire d'autoroute hors contexte. |
| Yeah! Western Shop | `yeahwesternshop.fr` libre | Le cri des tribunes — énergique mais registre streetwear, faible à l'INPI. |
| Slide On | pris (`slideon.fr`) | — |

→ **Verdict : « Spin & Slide Western Shop » confirmé** face aux challengers.
Piste design à creuser : le score « +1½ » (manœuvre excellente) comme clin d'œil visuel du
badge curation « Testé et approuvé par Camille ».

**Salves précédentes (écartées par Nathan & Camille, 2026-07-23)** : Au Quart de Tour,
La Rêne de l'Ouest, Remuda, À Bride Abattue, Hackamore, Crins d'Ouest (domaines libres au
2026-07-23) ; Latigo, Concho, Vaquero, Bosal, Palomino (domaines pris).
