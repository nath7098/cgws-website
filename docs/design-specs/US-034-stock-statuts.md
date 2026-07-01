# Gestion Stock & Statuts — Spec UX (US-034)

**Purpose**: Permettre à Camille de modifier le statut d'un produit en un clic depuis la liste, de saisir la vente associée le cas échéant, et de consulter l'historique des transitions de statut depuis la fiche d'édition. Priorité métier haute : évite les doubles ventes.

**Locations**:
- `app/components/admin/StatusDropdown.vue` — badge cliquable + popover/bottom-sheet
- `app/components/admin/SaleModal.vue` — modale de saisie rapide de vente
- `app/pages/admin/produits/index.vue` — intégration StatusDropdown dans colonne Statut
- `app/pages/admin/produits/[id].vue` — section historique des statuts (après ProductForm)
- `server/api/admin/products/[id]/status.patch.ts`
- `server/api/admin/products/[id]/status-history.get.ts`

---

## Types à ajouter dans `app/types/index.ts`

```ts
// Historique des transitions de statut
export interface ProductStatusHistory {
  id: string
  productId: string
  oldStatus: ProductStatus | null   // null pour la création initiale
  newStatus: ProductStatus
  changedAt: string                 // ISO timestamptz
  changedBy: string                 // 'admin' dans cette US
}

// Payload pour enregistrer une vente rapide depuis SaleModal
export interface QuickSalePayload {
  productId: string
  salePrice: number
  saleDate: string          // YYYY-MM-DD
  paymentMethod: PaymentMethod
  clientName?: string       // texte libre — pas de FK client dans cette US
  notes?: string
}
```

---

## Migration Supabase

```sql
-- À placer dans supabase/migrations/YYYYMMDD_product_status_history.sql
CREATE TABLE product_status_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  old_status  text,                          -- null si c'est l'entrée initiale
  new_status  text NOT NULL,
  changed_at  timestamptz DEFAULT now(),
  changed_by  text DEFAULT 'admin'
);

CREATE INDEX idx_psh_product_id ON product_status_history(product_id);
CREATE INDEX idx_psh_changed_at ON product_status_history(changed_at DESC);
```

Le trigger PATCH écrit dans cette table à chaque changement de statut. Aucune RLS supplémentaire — accès admin uniquement via `requireAdminAuth`.

---

---

# COMPOSANT 1 — `StatusDropdown.vue`

**Fichier** : `app/components/admin/StatusDropdown.vue`

## Props et emits

```ts
interface Props {
  productId: string
  currentStatus: ProductStatus
  productTitle: string          // pour aria-label
}

defineEmits<{
  'update:status': [newStatus: ProductStatus]
  'sale-required': []          // émis quand newStatus === 'sold', pour déclencher SaleModal
}>()
```

## Comportement global

1. L'utilisateur clique sur le badge statut dans le tableau.
2. Sur **mobile (< md)** : un bottom-sheet couvre l'écran depuis le bas.
3. Sur **desktop (md+)** : un popover s'ouvre, positionné sous le badge via `getBoundingClientRect()`.
4. L'utilisateur clique sur un nouveau statut.
5. Le composant passe en état `loading` (spinner inline, toutes options `pointer-events-none`).
6. `PATCH /api/admin/products/[id]/status` est appelé.
7. En cas de succès : fermeture du dropdown, émission de `update:status`. Si `newStatus === 'sold'`, émission supplémentaire de `sale-required`.
8. En cas d'erreur : toast d'erreur (géré par la page parente via `onError` prop ou event bus), dropdown se ferme.

## Détection breakpoint

```ts
import { useWindowSize } from '@vueuse/core'

const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)
```

## Trigger — badge cliquable

Le badge statut existant dans le tableau devient le déclencheur. La cellule `<td>` de statut reçoit le composant :

```html
<!-- Dans index.vue — colonne Statut -->
<td class="py-2.5 px-3">
  <StatusDropdown
    :product-id="product.id"
    :current-status="product.status"
    :product-title="product.title"
    @update:status="updateProductStatus(product, $event)"
    @sale-required="openSaleModal(product)"
  />
</td>
```

Le trigger interne du composant :

```html
<button
  ref="triggerRef"
  type="button"
  :aria-label="`Changer le statut de ${productTitle} — actuellement ${STATUS_LABELS[currentStatus]}`"
  aria-haspopup="listbox"
  :aria-expanded="isOpen"
  class="inline-flex items-center gap-1.5 cursor-pointer
         rounded-full transition-all duration-150 select-none
         focus-visible:outline-none focus-visible:ring-2
         focus-visible:ring-cgws-copper focus-visible:ring-offset-2"
  :class="[statusPillClass(currentStatus), isOpen ? 'ring-2 ring-cgws-copper ring-offset-1' : 'hover:ring-2 hover:ring-cgws-copper/50 hover:ring-offset-1']"
  @click="toggleDropdown"
>
  <span>{{ STATUS_LABELS[currentStatus] }}</span>
  <UIcon
    name="i-lucide-chevron-down"
    class="w-3 h-3 transition-transform duration-150"
    :class="isOpen ? 'rotate-180' : ''"
    aria-hidden="true"
  />
</button>
```

Classes `statusPillClass` — identiques à US-032 pour cohérence :

```ts
function statusPillClass(status: ProductStatus): string {
  const base = 'px-2.5 py-0.5 font-sans font-medium text-[11px] uppercase tracking-wider rounded-full'
  const map: Record<ProductStatus, string> = {
    active:   'bg-green-100 text-green-700',
    reserved: 'bg-cgws-copper/15 text-cgws-copper',
    sold:     'bg-cgws-charcoal/10 text-cgws-charcoal',
    inactive: 'bg-cgws-leather/15 text-cgws-leather',
  }
  return `${base} ${map[status]}`
}
```

## Layout ASCII — Popover desktop (md+)

```
  [Disponible ▾]   ← trigger badge
  ┌──────────────────────────┐
  │  ● Disponible  ✓         │  ← statut courant, grisé + coche
  │  ● Réservé               │
  │  ● Vendu                 │
  │  ● Inactif               │
  └──────────────────────────┘
```

Largeur min `180px`, ombre portée légère, bordure `cgws-leather/30`.

## Layout ASCII — Bottom-sheet mobile (< md)

```
┌──────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  ← backdrop sombre
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
├──────────────────────────────────┤  ← rounded-t-xl
│        ──────                    │  ← drag handle décoratif
│  Changer le statut               │  ← titre section
│  Selle de Trail Bob Lee          │  ← nom produit (tronqué)
│ ──────────────────────────────── │
│  ● Disponible              ✓     │
│  ● Réservé                       │
│  ● Vendu                         │
│  ● Inactif                       │
│                                  │
│  [    Annuler    ]               │  ← bouton pleine largeur
└──────────────────────────────────┘
```

## HTML du dropdown (Teleport to body)

```html
<Teleport to="body">
  <Transition :name="isMobile ? 'sheet' : 'popover'">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40"
      @click.self="close"
      @keydown.esc="close"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-cgws-charcoal/40"
        :class="isMobile ? 'block' : 'hidden'"
        aria-hidden="true"
      />

      <!-- Contenu — popover desktop -->
      <div
        v-if="!isMobile"
        ref="dropdownRef"
        role="listbox"
        :aria-label="`Options de statut pour ${productTitle}`"
        :style="popoverStyle"
        class="absolute z-50 bg-white border border-cgws-leather/30
               rounded-[4px] shadow-lg min-w-[180px] py-1
               focus:outline-none"
        tabindex="-1"
      >
        <button
          v-for="option in STATUS_OPTIONS"
          :key="option.value"
          role="option"
          :aria-selected="option.value === currentStatus"
          :disabled="option.value === currentStatus || isLoading"
          class="w-full flex items-center gap-3 px-3 py-2
                 font-sans text-sm text-left
                 transition-colors duration-100
                 focus-visible:outline-none focus-visible:bg-cgws-parchment/50
                 disabled:cursor-default"
          :class="option.value === currentStatus
            ? 'text-cgws-leather/50 cursor-default'
            : 'text-cgws-charcoal hover:bg-cgws-parchment/40 cursor-pointer'"
          @click="selectStatus(option.value)"
        >
          <!-- Pastille couleur -->
          <span
            class="w-2.5 h-2.5 rounded-full flex-shrink-0"
            :class="option.dotClass"
            aria-hidden="true"
          />
          <span class="flex-1">{{ option.label }}</span>
          <!-- Coche si statut courant -->
          <UIcon
            v-if="option.value === currentStatus"
            name="i-lucide-check"
            class="w-3.5 h-3.5 text-cgws-leather/50"
            aria-hidden="true"
          />
          <!-- Spinner si en cours de chargement sur cette option -->
          <span
            v-if="isLoading && pendingStatus === option.value"
            class="w-3.5 h-3.5 rounded-full border-2 border-cgws-copper
                   border-t-transparent animate-spin"
            aria-hidden="true"
          />
        </button>
      </div>

      <!-- Contenu — bottom-sheet mobile -->
      <div
        v-else
        ref="dropdownRef"
        role="listbox"
        :aria-label="`Options de statut pour ${productTitle}`"
        class="fixed bottom-0 left-0 right-0 z-50
               bg-white rounded-t-2xl border-t border-cgws-leather/20
               shadow-xl pb-safe"
      >
        <!-- Handle décoratif -->
        <div class="flex justify-center pt-3 pb-2" aria-hidden="true">
          <div class="w-10 h-1 bg-cgws-leather/30 rounded-full" />
        </div>

        <!-- Titre -->
        <div class="px-4 pb-3 border-b border-cgws-leather/15">
          <p class="font-sans text-[10px] uppercase tracking-widest text-cgws-leather mb-0.5">
            Changer le statut
          </p>
          <p class="font-sans text-sm font-medium text-cgws-charcoal line-clamp-1">
            {{ productTitle }}
          </p>
        </div>

        <!-- Options -->
        <div class="py-2">
          <button
            v-for="option in STATUS_OPTIONS"
            :key="option.value"
            role="option"
            :aria-selected="option.value === currentStatus"
            :disabled="option.value === currentStatus || isLoading"
            class="w-full flex items-center gap-4 px-4 py-3.5
                   font-sans text-sm text-left
                   transition-colors duration-100
                   focus-visible:outline-none focus-visible:bg-cgws-parchment/50"
            :class="option.value === currentStatus
              ? 'text-cgws-leather/50 cursor-default'
              : 'text-cgws-charcoal active:bg-cgws-parchment/40'"
            @click="selectStatus(option.value)"
          >
            <span
              class="w-3 h-3 rounded-full flex-shrink-0"
              :class="option.dotClass"
              aria-hidden="true"
            />
            <span class="flex-1 text-base">{{ option.label }}</span>
            <UIcon
              v-if="option.value === currentStatus"
              name="i-lucide-check"
              class="w-4 h-4 text-cgws-leather/50"
              aria-hidden="true"
            />
            <span
              v-if="isLoading && pendingStatus === option.value"
              class="w-4 h-4 rounded-full border-2 border-cgws-copper
                     border-t-transparent animate-spin"
              aria-hidden="true"
            />
          </button>
        </div>

        <!-- Bouton Annuler (mobile) -->
        <div class="px-4 pb-5 pt-1">
          <button
            type="button"
            class="w-full py-3 rounded-[4px] border border-cgws-leather/40
                   font-sans text-sm font-medium text-cgws-charcoal
                   hover:bg-cgws-parchment/40 transition-colors
                   focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:outline-none"
            @click="close"
          >
            Annuler
          </button>
        </div>
      </div>

    </div>
  </Transition>
</Teleport>
```

## Constante `STATUS_OPTIONS`

```ts
const STATUS_OPTIONS = [
  {
    value: 'active'   as ProductStatus,
    label: 'Disponible',
    dotClass: 'bg-green-500',
  },
  {
    value: 'reserved' as ProductStatus,
    label: 'Réservé',
    dotClass: 'bg-cgws-copper',
  },
  {
    value: 'sold'     as ProductStatus,
    label: 'Vendu',
    dotClass: 'bg-cgws-charcoal',
  },
  {
    value: 'inactive' as ProductStatus,
    label: 'Inactif',
    dotClass: 'bg-cgws-leather/60',
  },
] as const
```

## Positionnement popover desktop

```ts
const triggerRef = ref<HTMLElement | null>(null)
const popoverStyle = ref<Record<string, string>>({})

function computePopoverPosition(): void {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  popoverStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
  }
}

function toggleDropdown(): void {
  if (isOpen.value) {
    close()
    return
  }
  if (!isMobile.value) computePopoverPosition()
  isOpen.value = true
  nextTick(() => {
    // Focus premier item non-désactivé
    const firstOption = dropdownRef.value?.querySelector<HTMLElement>(
      'button:not([disabled])'
    )
    firstOption?.focus()
  })
}
```

## Fermeture — onClickOutside + Escape

```ts
import { onClickOutside } from '@vueuse/core'

const dropdownRef = ref<HTMLElement | null>(null)
onClickOutside(dropdownRef, () => { if (isOpen.value) close() })

function close(): void {
  isOpen.value = false
  pendingStatus.value = null
  triggerRef.value?.focus()   // retour focus sur le trigger
}
```

## Appel API — selectStatus

```ts
const isLoading = ref(false)
const pendingStatus = ref<ProductStatus | null>(null)

async function selectStatus(status: ProductStatus): Promise<void> {
  if (status === currentStatus || isLoading.value) return
  isLoading.value = true
  pendingStatus.value = status

  try {
    await $fetch(`/api/admin/products/${productId}/status`, {
      method: 'PATCH',
      body: { status },
    })
    emit('update:status', status)
    if (status === 'sold') emit('sale-required')
    close()
  } catch {
    // La page parente affiche le toast d'erreur
    emit('error')
    close()
  } finally {
    isLoading.value = false
    pendingStatus.value = null
  }
}
```

## Transitions CSS

```css
/* Popover desktop — fade + translateY léger */
.popover-enter-active,
.popover-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.popover-enter-from,
.popover-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Bottom-sheet mobile — slide from bottom */
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.2s ease;
}
.sheet-enter-active .fixed.bottom-0,
.sheet-leave-active .fixed.bottom-0 {
  transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1);
}
.sheet-enter-from .fixed.bottom-0,
.sheet-leave-to .fixed.bottom-0 {
  transform: translateY(100%);
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
```

## États

| État | Apparence |
|------|-----------|
| Default (fermé) | Badge pill avec `▾` iconographique |
| Hover | Ring `cgws-copper/50` 2px offset 1 |
| Ouvert | Ring `cgws-copper` 2px, dropdown/sheet visible |
| Loading | Spinner `animate-spin` sur l'option en cours, toutes options `pointer-events-none` |
| Erreur | Fermeture + toast via event sur page parente |

## Breakpoints

- **Mobile < md (375–767px)** : bottom-sheet full-width, options à grande cible tactile `py-3.5`, bouton Annuler dédié
- **Desktop md+ (768px+)** : popover `min-w-[180px]` ancré sous le trigger, `shadow-lg`

## Tailwind classes clés

```
/* Trigger badge */
inline-flex items-center gap-1.5 cursor-pointer rounded-full
focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:ring-offset-2

/* Popover desktop */
absolute z-50 bg-white border border-cgws-leather/30 rounded-[4px]
shadow-lg min-w-[180px] py-1

/* Option hover */
hover:bg-cgws-parchment/40 transition-colors duration-100

/* Pastille disponible */   bg-green-500
/* Pastille réservé */      bg-cgws-copper
/* Pastille vendu */        bg-cgws-charcoal
/* Pastille inactif */      bg-cgws-leather/60

/* Bottom-sheet mobile */
fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl
border-t border-cgws-leather/20 shadow-xl

/* Handle décoratif */
w-10 h-1 bg-cgws-leather/30 rounded-full
```

## Accessibilité

- `role="listbox"` sur le conteneur dropdown
- `role="option"` + `aria-selected` sur chaque bouton de statut
- `aria-haspopup="listbox"` + `aria-expanded` sur le trigger
- `aria-label` complet sur le trigger : "Changer le statut de {productTitle} — actuellement {statusLabel}"
- Focus piégé dans le dropdown pendant l'ouverture (focus sur premier item non-désactivé)
- Retour focus sur le trigger à la fermeture
- Escape ferme le dropdown
- Spinner : `aria-hidden="true"`, état loading annoncé via `aria-live="polite"` sur la région parente si nécessaire
- Contraste pastilles : vert `bg-green-500` sur blanc = 4.6:1 (AA), copper sur blanc = 3.2:1 acceptable pour indic. non-textuel

---

---

# COMPOSANT 2 — `SaleModal.vue`

**Fichier** : `app/components/admin/SaleModal.vue`

**Déclenchement** : S'ouvre automatiquement quand la page parente reçoit l'événement `sale-required` de `StatusDropdown`. Le statut est déjà enregistré comme "Vendu" en base ; la modale propose seulement d'enrichir avec les données de vente.

## Props et emits

```ts
interface Props {
  product: Product       // pour pré-remplir salePrice et afficher le nom
  isOpen: boolean
}

defineEmits<{
  close: []
  submitted: [sale: QuickSalePayload]
}>()
```

La page parente passe `:is-open="saleModalOpen"` et gère l'appel API POST après `@submitted`.

## Layout ASCII (desktop)

```
  ┌──────────────────── Enregistrer la vente ────────────────────┐
  │                                                               │
  │  [i-lucide-receipt]  Enregistrer la vente                     │  ← titre
  │  Selle de Trail Bob Lee                                       │  ← nom produit
  │                                                               │
  │  ┌─── Date de vente ─────────────┐  ┌─── Prix de vente (€) ──┐  │
  │  │  [  28/06/2026             ]  │  │  [ 480.00             ] │  │
  │  └───────────────────────────────┘  └────────────────────────┘  │
  │                                                               │
  │  Moyen de paiement                                            │
  │  [ Espèces             ▼ ]                                    │
  │                                                               │
  │  Client (optionnel)                                           │
  │  [ Dupont Marie…                ]                             │
  │                                                               │
  │  Notes internes (optionnel)                                   │
  │  [ ___________________________________ ]                      │
  │  [ ___________________________________ ]                      │
  │                                                               │
  │  ─────────────────────────────────────────────────────────    │
  │  [    Ignorer    ]                  [ Enregistrer la vente ▶] │
  └───────────────────────────────────────────────────────────────┘
```

## Layout ASCII (mobile 375px)

Les deux colonnes (date + prix) s'empilent. La modale occupe 100% de la hauteur viewport avec défilement interne.

```
  ┌──────────────────────────┐
  │  [✕]  Enregistrer vente  │  ← topbar modale
  │                          │
  │  Selle de Trail Bob Lee  │
  │                          │
  │  Date de vente           │
  │  [ 28/06/2026          ] │
  │                          │
  │  Prix de vente (€)       │
  │  [ 480.00              ] │
  │                          │
  │  Moyen de paiement       │
  │  [ Espèces           ▼ ] │
  │                          │
  │  Client (optionnel)      │
  │  [ …                   ] │
  │                          │
  │  Notes (optionnel)       │
  │  [ …                   ] │
  │  [ …                   ] │
  │                          │
  │  [       Ignorer       ] │
  │  [ Enregistrer la vente] │
  └──────────────────────────┘
```

## HTML complet

```html
<Teleport to="body">
  <Transition name="modal">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4
             sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sale-modal-title"
      @keydown.esc="$emit('close')"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-cgws-charcoal/60 backdrop-blur-sm"
        aria-hidden="true"
        @click="$emit('close')"
      />

      <!-- Boîte modale -->
      <div
        class="relative bg-white border-2 border-cgws-charcoal rounded-sm
               shadow-xl w-full max-w-lg
               flex flex-col max-h-[90dvh] sm:max-h-[80vh]"
      >
        <!-- En-tête fixe -->
        <div class="flex items-start gap-3 p-5 border-b border-cgws-leather/20 flex-shrink-0">
          <div
            class="flex-shrink-0 w-10 h-10 rounded-full bg-cgws-copper/10
                   flex items-center justify-center"
            aria-hidden="true"
          >
            <UIcon name="i-lucide-receipt" class="w-5 h-5 text-cgws-copper" />
          </div>
          <div class="flex-1 min-w-0">
            <h3
              id="sale-modal-title"
              class="font-serif font-bold text-lg text-cgws-charcoal"
            >
              Enregistrer la vente
            </h3>
            <p class="font-sans text-sm text-cgws-leather mt-0.5 truncate">
              {{ product.title }}
            </p>
          </div>
          <!-- Bouton fermeture (mobile) -->
          <button
            type="button"
            class="flex-shrink-0 p-1.5 -mr-1.5 -mt-1.5 rounded-sm
                   text-cgws-leather hover:text-cgws-charcoal hover:bg-cgws-parchment/40
                   transition-colors focus-visible:ring-2 focus-visible:ring-cgws-copper
                   focus-visible:outline-none"
            aria-label="Fermer sans enregistrer"
            @click="$emit('close')"
          >
            <UIcon name="i-lucide-x" class="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <!-- Corps défilable -->
        <div class="flex-1 overflow-y-auto p-5 space-y-4">

          <!-- Date + Prix — grille 2 cols sm+ -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <!-- Date de vente -->
            <div>
              <label
                for="sale-date"
                class="block font-sans text-xs font-semibold uppercase
                       tracking-wider text-cgws-leather mb-1.5"
              >
                Date de vente
              </label>
              <input
                id="sale-date"
                v-model="form.saleDate"
                type="date"
                required
                class="w-full px-3 py-2 bg-cgws-cream border border-cgws-leather/40
                       rounded-sm font-sans text-sm text-cgws-charcoal
                       focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20
                       focus:outline-none"
                :aria-required="true"
              />
            </div>

            <!-- Prix de vente -->
            <div>
              <label
                for="sale-price"
                class="block font-sans text-xs font-semibold uppercase
                       tracking-wider text-cgws-leather mb-1.5"
              >
                Prix de vente (€)
              </label>
              <input
                id="sale-price"
                v-model.number="form.salePrice"
                type="number"
                min="0"
                step="0.01"
                required
                class="w-full px-3 py-2 bg-cgws-cream border border-cgws-leather/40
                       rounded-sm font-display text-base text-cgws-copper
                       focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20
                       focus:outline-none"
                :aria-required="true"
                :aria-describedby="errors.salePrice ? 'sale-price-error' : undefined"
              />
              <p
                v-if="errors.salePrice"
                id="sale-price-error"
                role="alert"
                class="mt-1 font-sans text-xs text-cgws-rust"
              >
                {{ errors.salePrice }}
              </p>
            </div>
          </div>

          <!-- Moyen de paiement -->
          <div>
            <label
              for="payment-method"
              class="block font-sans text-xs font-semibold uppercase
                     tracking-wider text-cgws-leather mb-1.5"
            >
              Moyen de paiement
            </label>
            <div class="relative">
              <select
                id="payment-method"
                v-model="form.paymentMethod"
                required
                class="w-full px-3 py-2 pr-9 bg-cgws-cream border border-cgws-leather/40
                       rounded-sm font-sans text-sm text-cgws-charcoal appearance-none
                       focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20
                       focus:outline-none"
                :aria-required="true"
              >
                <option value="cash">Espèces</option>
                <option value="card">Carte bancaire</option>
                <option value="transfer">Virement</option>
                <option value="check">Chèque</option>
              </select>
              <UIcon
                name="i-lucide-chevron-down"
                class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2
                       w-4 h-4 text-cgws-leather/60"
                aria-hidden="true"
              />
            </div>
          </div>

          <!-- Client (texte libre, optionnel) -->
          <div>
            <label
              for="sale-client"
              class="block font-sans text-xs font-semibold uppercase
                     tracking-wider text-cgws-leather mb-1.5"
            >
              Client
              <span class="font-normal normal-case tracking-normal text-cgws-leather/70">
                (optionnel)
              </span>
            </label>
            <input
              id="sale-client"
              v-model="form.clientName"
              type="text"
              placeholder="Nom du client…"
              class="w-full px-3 py-2 bg-cgws-cream border border-cgws-leather/40
                     rounded-sm font-sans text-sm text-cgws-charcoal
                     placeholder:text-cgws-rope
                     focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20
                     focus:outline-none"
            />
          </div>

          <!-- Notes internes (optionnel) -->
          <div>
            <label
              for="sale-notes"
              class="block font-sans text-xs font-semibold uppercase
                     tracking-wider text-cgws-leather mb-1.5"
            >
              Notes internes
              <span class="font-normal normal-case tracking-normal text-cgws-leather/70">
                (optionnel)
              </span>
            </label>
            <textarea
              id="sale-notes"
              v-model="form.notes"
              :rows="2"
              placeholder="Observations, conditions particulières…"
              class="w-full px-3 py-2 bg-cgws-cream border border-cgws-leather/40
                     rounded-sm font-sans text-sm text-cgws-charcoal
                     placeholder:text-cgws-rope resize-none
                     focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20
                     focus:outline-none"
            />
          </div>

        </div>

        <!-- Footer fixe -->
        <div
          class="flex flex-col-reverse sm:flex-row items-center justify-between
                 gap-3 p-5 border-t border-cgws-leather/20 flex-shrink-0"
        >
          <!-- Ignorer -->
          <button
            type="button"
            class="w-full sm:w-auto px-4 py-2 rounded-sm border border-cgws-leather/40
                   font-sans text-sm font-medium text-cgws-leather
                   hover:bg-cgws-parchment/40 hover:text-cgws-charcoal transition-colors
                   focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:outline-none"
            @click="$emit('close')"
          >
            Ignorer
          </button>

          <!-- Enregistrer la vente -->
          <button
            type="button"
            :disabled="isSubmitting"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2
                   px-5 py-2 rounded-sm bg-cgws-copper text-white
                   font-sans text-sm font-semibold
                   hover:bg-cgws-leather transition-colors
                   disabled:opacity-40 disabled:cursor-not-allowed
                   focus-visible:ring-2 focus-visible:ring-cgws-copper
                   focus-visible:ring-offset-2 focus-visible:outline-none"
            @click="submitSale"
          >
            <span
              v-if="isSubmitting"
              class="w-4 h-4 rounded-full border-2 border-white
                     border-t-transparent animate-spin"
              aria-hidden="true"
            />
            {{ isSubmitting ? 'Enregistrement…' : 'Enregistrer la vente' }}
            <UIcon
              v-if="!isSubmitting"
              name="i-lucide-arrow-right"
              class="w-4 h-4"
              aria-hidden="true"
            />
          </button>
        </div>

      </div>
    </div>
  </Transition>
</Teleport>
```

## État initial du formulaire

```ts
const today = new Date().toISOString().split('T')[0]  // YYYY-MM-DD

const form = reactive({
  saleDate:      today,
  salePrice:     props.product.price,      // pré-rempli avec prix catalogue
  paymentMethod: 'cash' as PaymentMethod,
  clientName:    '',
  notes:         '',
})
```

## Validation et soumission

```ts
const errors = reactive({ salePrice: '' })
const isSubmitting = ref(false)

async function submitSale(): Promise<void> {
  errors.salePrice = ''
  if (!form.salePrice || form.salePrice <= 0) {
    errors.salePrice = 'Le prix de vente doit être supérieur à 0.'
    return
  }

  isSubmitting.value = true
  const payload: QuickSalePayload = {
    productId:     props.product.id,
    salePrice:     form.salePrice,
    saleDate:      form.saleDate,
    paymentMethod: form.paymentMethod,
    clientName:    form.clientName || undefined,
    notes:         form.notes || undefined,
  }

  emit('submitted', payload)
  // La page parente appelle POST /api/admin/sales et gère le toast
}
```

## Focus trap

Utiliser `useFocusTrap` de VueUse sur la boîte modale au montage :

```ts
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap'

const modalBoxRef = ref<HTMLElement | null>(null)
const { activate, deactivate } = useFocusTrap(modalBoxRef)

watch(() => props.isOpen, (val) => {
  if (val) nextTick(() => activate())
  else deactivate()
})
```

## Breakpoints

- **Mobile (375px)** : grille date/prix en colonne unique, footer boutons en colonne-reverse (Enregistrer au-dessus de Ignorer, targets tactiles `py-3`), max-h `90dvh` avec scroll interne
- **Tablet (768px+)** : grille date/prix côte à côte (50/50), footer en ligne, max-w `lg` (512px)
- **Desktop (1440px)** : centré dans le viewport, identique tablet

## États

| État | Apparence |
|------|-----------|
| Ouverture | Fade-in overlay + scale-up boîte (voir Transitions US-032) |
| Default | Champs pré-remplis, focus sur input Date |
| Erreur prix | Bordure `border-cgws-rust`, message inline rouge en dessous |
| Submitting | Bouton `Enregistrer` en loading, spinner, tous champs désactivés |
| Succès | Fermeture de la modale, toast "Vente enregistrée" géré par la page |

## Transition CSS (identique US-032)

```css
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .relative {
  transform: scale(0.96) translateY(8px);
}
```

## Accessibilité

- `role="dialog" aria-modal="true" aria-labelledby="sale-modal-title"`
- Focus piégé via `useFocusTrap` ; retour focus sur le bouton "Vendu" dans le StatusDropdown à la fermeture
- Tous les labels `<label for="...">` explicitement associés aux inputs
- Champs requis : `aria-required="true"`
- Erreur prix : `aria-describedby="sale-price-error"` + `role="alert"` sur le message
- Escape ferme sans enregistrer (comportement "Ignorer")
- Spinner : `aria-hidden="true"`, état communiqué par le texte du bouton qui change
- Contraste bouton principal : blanc sur `cgws-copper (#B8650A)` = 3.2:1 (acceptable pour texte gras large), hover sur `cgws-leather (#7B3B1C)` = 5.9:1 (AA)

---

---

# SECTION 3 — Historique des statuts dans `/admin/produits/[id].vue`

## Position dans la page

Après le composant `<ProductForm>`, avant le bas de page. Section indépendante avec son propre chargement asynchrone (ne bloque pas le rendu du formulaire).

```html
<!-- Dans app/pages/admin/produits/[id].vue -->
<template>
  <div class="space-y-6">
    <!-- Breadcrumb + titre -->
    <!-- ProductForm (existant) -->

    <!-- Historique des statuts (nouveau US-034) -->
    <StatusHistorySection :product-id="productId" />
  </div>
</template>
```

`StatusHistorySection` peut être un composant autonome ou une section inline dans la page. Spécifié ici comme section inline pour éviter la prolifération de composants.

## Layout ASCII

```
┌─ Historique des statuts ────────────────────────────────────────┐
│                                                                   │
│  ●─── Vendu          · 28/06/2026 à 14h32  · admin              │
│  │                                                               │
│  ●─── Réservé        · 27/06/2026 à 10h15  · admin              │
│  │                                                               │
│  ●─── Disponible     · 25/06/2026 à 09h00  · admin  (initial)   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

La timeline est ordonnée du plus récent au plus ancien (DESC `changed_at`). Le plus récent est en haut.

## HTML

```html
<section
  aria-labelledby="status-history-title"
  class="bg-white border border-cgws-leather/30 rounded-[4px] p-5"
>
  <!-- En-tête fieldset -->
  <h3
    id="status-history-title"
    class="font-sans font-semibold text-xs uppercase tracking-widest
           text-cgws-copper mb-4"
  >
    Historique des statuts
  </h3>

  <!-- Skeleton — 3 lignes -->
  <div v-if="isLoadingHistory" aria-busy="true" aria-label="Chargement de l'historique">
    <div v-for="i in 3" :key="i"
         class="flex items-center gap-3 mb-4 last:mb-0 animate-pulse">
      <div class="w-3 h-3 rounded-full bg-cgws-leather/20 flex-shrink-0" />
      <div class="flex-1 space-y-1.5">
        <div class="h-3.5 w-28 bg-cgws-leather/15 rounded" />
        <div class="h-3 w-44 bg-cgws-leather/10 rounded" />
      </div>
    </div>
  </div>

  <!-- État vide -->
  <div
    v-else-if="!isLoadingHistory && statusHistory.length === 0"
    class="flex items-center gap-3 py-2"
  >
    <UIcon
      name="i-lucide-clock"
      class="w-4 h-4 text-cgws-leather/40 flex-shrink-0"
      aria-hidden="true"
    />
    <p class="font-sans text-sm text-cgws-leather italic">
      Aucun changement de statut enregistré.
    </p>
  </div>

  <!-- Timeline -->
  <ol
    v-else
    class="relative"
    aria-label="Historique des changements de statut"
  >
    <li
      v-for="(entry, index) in statusHistory"
      :key="entry.id"
      class="flex gap-3 pb-4 last:pb-0 relative"
    >
      <!-- Trait vertical reliant les items -->
      <div
        v-if="index < statusHistory.length - 1"
        class="absolute left-[5px] top-4 bottom-0 w-px bg-cgws-leather/15"
        aria-hidden="true"
      />

      <!-- Cercle coloré -->
      <div
        class="flex-shrink-0 w-3 h-3 rounded-full mt-1 border-2"
        :class="statusDotClass(entry.newStatus)"
        aria-hidden="true"
      />

      <!-- Contenu -->
      <div class="flex-1 min-w-0">
        <div class="flex items-baseline gap-2 flex-wrap">
          <span class="font-sans text-sm font-semibold text-cgws-charcoal">
            {{ STATUS_LABELS[entry.newStatus as ProductStatus] }}
          </span>
          <span
            v-if="entry.oldStatus"
            class="font-sans text-xs text-cgws-leather"
          >
            ← {{ STATUS_LABELS[entry.oldStatus as ProductStatus] }}
          </span>
          <span
            v-else
            class="font-sans text-xs text-cgws-leather italic"
          >
            (statut initial)
          </span>
        </div>
        <p class="font-sans text-xs text-cgws-leather mt-0.5">
          {{ formatHistoryDate(entry.changedAt) }} · {{ entry.changedBy }}
        </p>
      </div>
    </li>
  </ol>

</section>
```

## Helpers couleur des cercles de timeline

```ts
function statusDotClass(status: string): string {
  const map: Record<string, string> = {
    active:   'bg-green-500 border-green-300',
    reserved: 'bg-cgws-copper border-cgws-copper/40',
    sold:     'bg-cgws-charcoal border-cgws-charcoal/30',
    inactive: 'bg-cgws-leather/60 border-cgws-leather/30',
  }
  return map[status] ?? 'bg-cgws-leather/40 border-cgws-leather/20'
}
```

## Formatage date dans la timeline

```ts
function formatHistoryDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
  // → "28/06/2026 à 14h32"
}
```

## Chargement des données

```ts
const statusHistory = ref<ProductStatusHistory[]>([])
const isLoadingHistory = ref(true)

const { data, error } = await useFetch<{ history: ProductStatusHistory[] }>(
  `/api/admin/products/${productId}/status-history`
)

watch(data, (val) => {
  if (val) statusHistory.value = val.history
  isLoadingHistory.value = false
}, { immediate: true })
```

## Breakpoints

- **Mobile (375px)** : timeline pleine largeur, textes lisibles en `text-sm` / `text-xs`, pas de troncature nécessaire
- **Tablet / Desktop** : identique, la section hérite du `max-w` de la page `[id].vue`

## Tailwind classes clés de la section

```
/* Conteneur section */
bg-white border border-cgws-leather/30 rounded-[4px] p-5

/* Titre section */
font-sans font-semibold text-xs uppercase tracking-widest text-cgws-copper

/* Trait vertical timeline */
absolute left-[5px] top-4 bottom-0 w-px bg-cgws-leather/15

/* Label statut */
font-sans text-sm font-semibold text-cgws-charcoal

/* Meta date/auteur */
font-sans text-xs text-cgws-leather

/* Skeleton */
animate-pulse bg-cgws-leather/15 rounded
```

## Accessibilité de la section historique

- `<section aria-labelledby="status-history-title">` pour délimiter la région
- `<ol aria-label="Historique...">` : liste ordonnée (ordre temporel décroissant)
- `aria-busy="true"` sur le conteneur pendant le chargement du skeleton
- Trait vertical et cercles : `aria-hidden="true"` (purement décoratifs)
- Contraste texte : `cgws-charcoal` sur `white` > 18:1 (AAA)

---

---

# ROUTES API

## `PATCH /api/admin/products/[id]/status`

**Fichier** : `server/api/admin/products/[id]/status.patch.ts`

**Body** :
```ts
{
  status: ProductStatus
}
```

**Traitement** :
1. `requireAdminAuth(event)` — 401 si non authentifié
2. Valider `status` ∈ `['active', 'reserved', 'sold', 'inactive']` — 422 sinon
3. Récupérer `old_status` actuel via `SELECT status FROM products WHERE id = ?`
4. `UPDATE products SET status = ?, updated_at = now() WHERE id = ?`
5. Si `old_status !== status` → insérer dans `product_status_history`
6. Retourner `{ product: { id, status } }`

**Requêtes Supabase** :
```ts
// 1. Lire le statut actuel
const { data: current } = await supabase
  .from('products')
  .select('status')
  .eq('id', id)
  .single()

// 2. Mettre à jour
const { data: updated, error } = await supabase
  .from('products')
  .update({ status, updated_at: new Date().toISOString() })
  .eq('id', id)
  .select('id, status')
  .single()

// 3. Enregistrer dans l'historique
if (current?.status !== status) {
  await supabase.from('product_status_history').insert({
    product_id: id,
    old_status: current?.status ?? null,
    new_status: status,
    changed_by: 'admin',
  })
}
```

**Réponse 200** : `{ product: { id: string, status: ProductStatus } }`
**Réponse 404** : si produit non trouvé
**Réponse 422** : si statut invalide

---

## `GET /api/admin/products/[id]/status-history`

**Fichier** : `server/api/admin/products/[id]/status-history.get.ts`

**Traitement** :
1. `requireAdminAuth(event)`
2. `SELECT * FROM product_status_history WHERE product_id = ? ORDER BY changed_at DESC`
3. Mapper snake_case → camelCase

**Réponse 200** :
```ts
{
  history: ProductStatusHistory[]
}
```

---

## `POST /api/admin/sales` (déjà prévu par US-032 scope)

La `SaleModal` poste vers cette route. Body attendu :
```ts
{
  product_id:     string
  sale_price:     number
  sale_date:      string   // YYYY-MM-DD
  payment_method: PaymentMethod
  client_name?:   string   // texte libre — non mappé vers clients.id dans cette US
  notes?:         string
}
```

Si `client_name` est fourni, la route crée optionnellement un enregistrement `clients` minimal (`name = client_name`) et lie son `id` dans `sales.client_id`. Ce comportement est optionnel dans cette US — le minimum acceptable est d'ignorer `client_name` et laisser `client_id = null`.

---

---

# INTÉGRATION DANS `/admin/produits/index.vue`

## Ajouts à la page existante

```ts
// ─── État pour SaleModal ──────────────────────────────────────────────────────

const saleModalOpen = ref(false)
const saleTargetProduct = ref<Product | null>(null)

function openSaleModal(product: Product): void {
  saleTargetProduct.value = product
  saleModalOpen.value = true
}

function closeSaleModal(): void {
  saleModalOpen.value = false
  saleTargetProduct.value = null
}

async function handleSaleSubmit(payload: QuickSalePayload): Promise<void> {
  try {
    await $fetch('/api/admin/sales', { method: 'POST', body: payload })
    showToast({ type: 'success', message: 'Vente enregistrée.' })
    closeSaleModal()
  } catch {
    showToast({ type: 'error', message: 'Erreur lors de l\'enregistrement de la vente.' })
  }
}

// ─── Mise à jour locale du statut (optimistic update) ────────────────────────

function updateProductStatus(product: Product, newStatus: ProductStatus): void {
  const index = products.value.findIndex(p => p.id === product.id)
  if (index !== -1) {
    products.value[index] = { ...products.value[index]!, status: newStatus }
  }
}
```

## Template — remplacement cellule Statut + ajout SaleModal

```html
<!-- Colonne Statut — remplacement du span statique US-032 -->
<td class="py-2.5 px-3">
  <StatusDropdown
    :product-id="product.id"
    :current-status="product.status"
    :product-title="product.title"
    @update:status="updateProductStatus(product, $event)"
    @sale-required="openSaleModal(product)"
    @error="showToast({ type: 'error', message: 'Impossible de modifier le statut.' })"
  />
</td>

<!-- SaleModal (Teleport inclus dans le composant) -->
<SaleModal
  v-if="saleTargetProduct"
  :product="saleTargetProduct"
  :is-open="saleModalOpen"
  @close="closeSaleModal"
  @submitted="handleSaleSubmit"
/>
```

---

---

# RÉCAPITULATIF DES STATES ET TRANSITIONS

## StatusDropdown

| État | Description |
|------|-------------|
| Closed | Badge pill avec `▾`, cursor-pointer |
| Open (desktop) | Popover sous le badge, premier item focusé |
| Open (mobile) | Bottom-sheet slide-up, backdrop sombre |
| Loading | Spinner sur l'option cliquée, autres `pointer-events-none` |
| Success | Fermeture, badge mis à jour optimistiquement |
| Error | Fermeture + toast erreur, badge revient à l'ancien statut |

## SaleModal

| État | Description |
|------|-------------|
| Closed | Invisible (`v-if="isOpen"`) |
| Open | Fade-in overlay + scale-up boîte, focus piégé |
| Validation error | Erreur inline sous `salePrice` si ≤ 0 |
| Submitting | Bouton en loading, tous champs disabled |
| Success | Fermeture, toast "Vente enregistrée", mise à jour liste |
| Ignoré | Fermeture sans POST, statut reste "Vendu" |

## Section historique

| État | Description |
|------|-------------|
| Loading | 3 lignes skeleton `animate-pulse` |
| Empty | Message informatif avec icône horloge |
| Populated | Timeline verticale, plus récent en haut |

---

---

# TAILWIND — RÉCAPITULATIF GLOBAL

```
/* StatusDropdown trigger */
inline-flex items-center gap-1.5 rounded-full cursor-pointer
focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:ring-offset-2

/* Popover desktop */
fixed z-50 bg-white border border-cgws-leather/30 rounded-[4px]
shadow-lg min-w-[180px] py-1

/* Option statut */
w-full flex items-center gap-3 px-3 py-2 font-sans text-sm text-left
hover:bg-cgws-parchment/40 transition-colors duration-100

/* Bottom-sheet mobile */
fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl
border-t border-cgws-leather/20 shadow-xl pb-safe

/* SaleModal boîte */
relative bg-white border-2 border-cgws-charcoal rounded-sm
shadow-xl w-full max-w-lg flex flex-col max-h-[90dvh] sm:max-h-[80vh]

/* SaleModal input date/prix */
w-full px-3 py-2 bg-cgws-cream border border-cgws-leather/40
rounded-sm font-sans text-sm text-cgws-charcoal
focus:border-cgws-copper focus:ring-2 focus:ring-cgws-copper/20 focus:outline-none

/* SaleModal bouton primaire */
inline-flex items-center gap-2 px-5 py-2 rounded-sm bg-cgws-copper text-white
font-sans text-sm font-semibold hover:bg-cgws-leather transition-colors
disabled:opacity-40 disabled:cursor-not-allowed
focus-visible:ring-2 focus-visible:ring-cgws-copper focus-visible:ring-offset-2

/* Timeline cercle */
flex-shrink-0 w-3 h-3 rounded-full mt-1 border-2

/* Timeline trait vertical */
absolute left-[5px] top-4 bottom-0 w-px bg-cgws-leather/15

/* Skeleton ligne */
h-3.5 rounded bg-cgws-leather/15 animate-pulse

/* Toast succès */
bg-cgws-tack text-cgws-rope border-l-4 border-cgws-copper px-4 py-3 rounded-sm
```
