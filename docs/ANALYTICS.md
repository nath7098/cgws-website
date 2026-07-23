# CGWS — Analytics produit (PostHog)

> Guide de lecture et de gouvernance du dispositif de mesure d'audience CGWS.
> Public : Nathan (lecture produit), développeurs (gouvernance de la taxonomie).
>
> **Projet PostHog** : org `cgws`, « Default project » (id 230708), **PostHog
> Cloud EU** — https://eu.posthog.com/project/230708
>
> **Cadrage NON négociable** (interview 2026-07-23, US-102) : mesure d'audience
> **strictement anonyme et sans cookie** (exemption CNIL, pas de bandeau de
> consentement). `persistence: 'memory'`, aucun `identify()`, pas de session
> replay ni heatmaps, autocapture désactivée, hébergement UE.

---

## 1. Taxonomie des événements

La taxonomie est **exhaustive** : tout événement hors de ces listes est refusé
en review (verrouillage compilateur côté client, voir §4 Gouvernance).

### Événements client (`app/utils/analytics-events.ts`, US-103)

Tous capturés via `useAnalytics().capture()` — jamais d'import posthog-js dans
les composants.

| Événement | Déclencheur (emplacement exact) | Propriétés | US |
|-----------|--------------------------------|------------|-----|
| `product_viewed` | Affichage d'une fiche produit (`app/pages/catalogue/[slug].vue`, onMounted après résolution du produit) | `product_id`, `product_slug`, `category`, `price`, `is_consignment` | US-103 |
| `cart_item_added` | Ajout au panier **réussi**, y compris remplacement de quantité US-096 (`app/stores/cart.ts`, branche succès de `add()`) | `product_id`, `quantity`, `price` | US-103 |
| `checkout_opened` | Montage **effectif** du checkout embarqué Stripe, une fois par visite de page (`app/pages/checkout/index.vue`) | `cart_value` (sous-total €, hors port), `items_count` (total d'unités, sémantique US-096) | US-103 |
| `consignment_form_viewed` | Affichage du formulaire de dépôt (`app/components/consignation/ConsignmentForm.vue`, onMounted) | — | US-103 |
| `consignment_submitted` | Soumission de dépôt **réussie** — confirmation serveur (`ConsignmentForm.vue`, branche succès uniquement) | `photos_count` (un COMPTE, jamais les fichiers) ; `category` optionnelle, non collectée par le formulaire actuel | US-103 |
| `contact_submitted` | Soumission de contact **réussie** (`app/pages/contact.vue`, branche succès uniquement) | — | US-103 |

### Événement serveur (`server/services/analytics.ts`, US-104)

Capturé via `posthog-node` — **compteur de conversion fiable**, insensible aux
adblockers et fermetures d'onglet. Seul le fulfillment (déclenché par le
webhook Stripe `checkout.session.completed` vérifié, ou la landing page) fait
foi ; la barrière d'idempotence `pending → paid` garantit **exactement une
capture par commande payée**.

| Événement | Déclencheur | Propriétés | US |
|-----------|-------------|------------|-----|
| `order_paid` | Fin de `fulfillCheckoutSession` (commande passée `paid`, ventes créées, emails envoyés) — `server/utils/fulfillment.ts` | `amount_total` (€, **port inclus**), `currency`, `items_count` (somme des quantités), `payment_method_type` (si disponible) + `$process_person_profile: false`, `disableGeoip: true` | US-104 |

### Hors taxonomie métier

- `$pageview` (US-102) : capturé manuellement par le plugin
  (`app/plugins/posthog.client.ts`) au chargement initial et à chaque
  navigation SPA (`router.afterEach`). Sert aux tendances d'audience, pas aux
  funnels métier.

### Jonction client → serveur (funnel Achat complet)

À la création de la session de paiement, le navigateur transmet son
distinct_id anonyme éphémère (`useAnalytics().getDistinctId()` →
`CheckoutPayload.analyticsId` → metadata Stripe `analytics_id`). Le webhook le
reprend comme distinct_id du `order_paid` : le funnel
`checkout_opened → order_paid` se raccorde **pour la session de navigation**.
Si PostHog est bloqué côté client, `order_paid` est capturé quand même avec un
id aléatoire — le comptage global reste exhaustif (mais cette conversion
n'apparaît pas dans le funnel, voir §3).

---

## 2. Dashboard & insights — quelle vue répond à quelle question

Dashboard épinglé **« CGWS — Produit »** :
https://eu.posthog.com/project/230708/dashboard/843332

| # | Tuile | Question produit | Lien |
|---|-------|------------------|------|
| 1 | **Funnel Achat — fiche produit → paiement** (`product_viewed → cart_item_added → checkout_opened → order_paid`, ordered, fenêtre 1 jour, 30 derniers jours) | **Où perd-on les acheteurs ?** Quelle marche du tunnel (fiche → panier → checkout → paiement) décroche le plus ? | https://eu.posthog.com/project/230708/insights/Z0jGFQrs |
| 2 | **Funnel Consignation — formulaire → dépôt soumis** (`consignment_form_viewed → consignment_submitted`, fenêtre 1 jour) | **Le tunnel de dépôt de selle convertit-il ?** Le formulaire décourage-t-il les déposants ? | https://eu.posthog.com/project/230708/insights/zbibrb5M |
| 3 | **Contact — soumissions réussies** (tendance par jour) | Le site génère-t-il des prises de contact ? Y a-t-il des pics (post-publication, salon…) ? | https://eu.posthog.com/project/230708/insights/3rYfMZY1 |
| 4 | **Commandes payées — volume + CA (€)** (`order_paid` : total + somme de `amount_total`, 2 axes Y) | Combien de commandes et quel CA en ligne, au jour le jour ? **C'est le chiffre fiable** (serveur). NB : `amount_total` inclut les frais de port. | https://eu.posthog.com/project/230708/insights/PUMmNYpi |
| 5 | **Top produits vus** (`product_viewed` ventilé par `product_slug`, barres, top 15) | Quels articles attirent l'attention ? Lesquels sont vus mais jamais ajoutés au panier (croiser avec le funnel 1) ? | https://eu.posthog.com/project/230708/insights/6PRFaGES |

---

## 3. Limites du dispositif — à garder en tête en lisant les chiffres

Ces limites sont des **conséquences assumées du cadrage anonyme sans
consentement**, pas des bugs.

1. **Funnels valides uniquement intra-session de navigation.**
   `persistence: 'memory'` : l'identité anonyme meurt avec l'onglet (et à
   chaque rechargement complet de page). Aucun suivi cross-session ni
   cross-device : un visiteur qui voit une fiche lundi et achète mardi compte
   comme DEUX personnes — le funnel ne raccorde que les parcours effectués
   dans la même session. C'est pourquoi la fenêtre de conversion des funnels
   est réglée à **1 jour** (une fenêtre plus longue n'apporterait rien).

2. **Le funnel Achat SOUS-ESTIME la conversion réelle.** Les 3 premières
   marches (client) sont bloquables par les adblockers ; `order_paid`
   (serveur) ne l'est pas. Le dénominateur est donc sous-compté, le numérateur
   exhaustif — et une part des `order_paid` arrive avec un id aléatoire (client
   bloqué) qui ne raccorde pas au funnel. **La mesure de cet écart** : comparer
   le volume `order_paid` de la tuile 4 (exhaustif) à la dernière marche du
   funnel 1 (raccordée uniquement) — la différence = conversions invisibles
   côté client.

3. **Pas de session replay ni heatmaps** — désactivés explicitement dans la
   config (décision d'interview 2026-07-23) : ces fonctionnalités sont
   incompatibles avec le cadrage anonyme sans consentement (elles
   enregistrent le comportement individuel). Ne pas les activer côté projet
   PostHog : le client les refuse de toute façon
   (`disable_session_recording: true`, `capture_heatmaps: false`).

4. **Anti-fuite d'URL** : le hook `before_send` (US-102,
   `app/utils/analytics.ts`) tronque query string ET fragment de toute
   propriété porteuse d'URL sur tous les événements — les jetons
   (`?token_hash=`, `?session_id=cs_…`) ne quittent jamais le navigateur.
   Conséquence de lecture : aucune analyse par paramètre d'URL (utm, etc.)
   n'est possible, par construction.

5. Divers : autocapture désactivée (seuls les événements de la taxonomie
   existent) ; l'init client est différée (post-hydratation + idle) avec un
   buffer borné à 20 événements — les tout premiers clics ne sont pas perdus ;
   IP écartée (`disableGeoip` côté serveur, « Discard client IP data » côté
   projet).

---

## 4. Gouvernance de la taxonomie

**Règle : tout NOUVEL événement exige, dans la même PR :**

1. Sa déclaration dans `app/utils/analytics-events.ts` (client — nom dans
   `ANALYTICS_EVENTS` + payload typé dans `AnalyticsEventPayloadMap` ; le
   compilateur refuse tout appel hors taxonomie) **ou** dans
   `SERVER_ANALYTICS_EVENTS` (`server/services/analytics.ts`) côté serveur ;
2. La mise à jour de la table du §1 de **ce fichier** (déclencheur exact,
   propriétés, US) ;
3. Le respect des invariants : **jamais de PII** (email, nom, téléphone,
   adresse, contenu de message, prix demandé du déposant, noms de fichiers),
   **jamais d'URL avec query string** dans une propriété, tout appel client
   via `useAnalytics().capture()`, tout appel serveur via
   `server/services/analytics.ts`.

Si l'événement doit alimenter un dashboard, mettre à jour l'insight PostHog
concerné et l'annexe §6.

---

## 5. Recette de bout en bout (action Nathan)

**Prérequis** (une seule fois) :

- [ ] `NUXT_PUBLIC_POSTHOG_KEY` (clé projet `phc_…`, projet 230708 EU) et
      `NUXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com` saisies dans Vercel
      (Production), puis **redéploiement**
- [x] Option **« Discard client IP data »** activée dans PostHog — condition de
      l'anonymat revendiqué dans les mentions légales. **Vérifié actif le
      2026-07-23** (`anonymize_ips: true` côté projet, ainsi que
      `session_recording_opt_in: false`) — à recontrôler uniquement si le
      projet PostHog est reconfiguré
- [ ] Navigateur de test **sans adblocker** (sinon seul `order_paid`
      apparaîtra — ce qui est aussi un test utile, mais pas celui-ci)

**Parcours Achat** (prouve la jonction client → serveur `analyticsId`) :

- [ ] Ouvrir le site en production, **rester dans le même onglet sans
      rechargement complet** pendant tout le parcours (l'identité anonyme
      meurt à chaque full reload — navigation interne uniquement)
- [ ] Accueil → Catalogue → ouvrir une fiche produit (→ `product_viewed`)
- [ ] Ajouter au panier (→ `cart_item_added`)
- [ ] Aller sur `/checkout`, attendre l'affichage du formulaire Stripe
      (→ `checkout_opened`)
- [ ] Payer avec la carte de test Stripe `4242 4242 4242 4242` (si
      l'environnement est en clés Stripe test ; sinon paiement réel minime à
      rembourser ensuite) (→ `order_paid`, capturé par le webhook)
- [ ] Dans PostHog, vérifier sous ~1 à 2 minutes : **Activity** montre les 4
      événements ; ouvrir le funnel Achat
      (https://eu.posthog.com/project/230708/insights/Z0jGFQrs) → le parcours
      apparaît de **bout en bout** (les 4 marches converties). Contrôle fin :
      l'événement `order_paid` porte le **même distinct_id** que les 3
      événements client de la session
- [ ] Vérifier au passage (Inspecteur navigateur → Application) : **aucun
      cookie ni entrée localStorage** créés par PostHog

**Parcours Consignation** :

- [ ] Ouvrir `/consignation` (→ `consignment_form_viewed`)
- [ ] Soumettre une demande de dépôt valide avec 1–2 photos de test
      (→ `consignment_submitted`, avec `photos_count`)
- [ ] Vérifier le funnel Consignation
      (https://eu.posthog.com/project/230708/insights/zbibrb5M) : 1 conversion
- [ ] Nettoyer : supprimer la demande de test depuis `/admin/consignations`

**Bonus contact** : soumettre `/contact` → +1 sur la tuile 3.

Consigner le résultat dans `docs/PROGRESS.md`.

---

## 6. Annexe — définitions des 5 insights (reproductibilité)

Résumés minimaux des requêtes (recréables via l'UI ou l'API PostHog) — pas les
dumps complets.

```jsonc
// 1. Funnel Achat — fiche produit → paiement (Z0jGFQrs)
{
  "kind": "FunnelsQuery",
  "series": [
    { "event": "product_viewed" },
    { "event": "cart_item_added" },
    { "event": "checkout_opened" },
    { "event": "order_paid" }
  ],
  "funnelsFilter": { "funnelWindowInterval": 1, "funnelWindowIntervalUnit": "day", "funnelOrderType": "ordered" },
  "dateRange": { "date_from": "-30d" }
}
```

```jsonc
// 2. Funnel Consignation — formulaire → dépôt soumis (zbibrb5M)
{
  "kind": "FunnelsQuery",
  "series": [
    { "event": "consignment_form_viewed" },
    { "event": "consignment_submitted" }
  ],
  "funnelsFilter": { "funnelWindowInterval": 1, "funnelWindowIntervalUnit": "day", "funnelOrderType": "ordered" },
  "dateRange": { "date_from": "-30d" }
}
```

```jsonc
// 3. Contact — soumissions réussies (3rYfMZY1)
{
  "kind": "TrendsQuery",
  "series": [{ "event": "contact_submitted", "math": "total" }],
  "interval": "day",
  "dateRange": { "date_from": "-30d" }
}
```

```jsonc
// 4. Commandes payées — volume + CA € (PUMmNYpi)
{
  "kind": "TrendsQuery",
  "series": [
    { "event": "order_paid", "math": "total" },
    { "event": "order_paid", "math": "sum", "math_property": "amount_total" }
  ],
  "interval": "day",
  "dateRange": { "date_from": "-30d" }
  // 2 axes Y : volume (gauche), CA € (droite)
}
```

```jsonc
// 5. Top produits vus (6PRFaGES)
{
  "kind": "TrendsQuery",
  "series": [{ "event": "product_viewed", "math": "total" }],
  "breakdownFilter": { "breakdown": "product_slug", "breakdown_type": "event", "breakdown_limit": 15 },
  "trendsFilter": { "display": "ActionsBar" },
  "dateRange": { "date_from": "-30d" }
}
```
