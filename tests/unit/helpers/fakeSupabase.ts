/**
 * Fake Supabase client pour les tests unitaires du chemin de paiement (US-091).
 *
 * ⚠️ Portée : ce fake reproduit la SÉMANTIQUE applicative des chaînages
 * `from().select()/.insert()/.update()/.delete().eq()...` et des RPC
 * `reserve_product_unit` / `release_product_unit` (barrières conditionnelles,
 * verrou `reserved_order_id`) — PAS l'atomicité SQL réelle des fonctions de la
 * migration 006 (aucune garantie de concurrence, un seul thread JS). Cette
 * dernière relève de la recette e2e contre une vraie base Postgres. Ce fake
 * sert uniquement à exercer l'ORCHESTRATION serveur (server/utils/fulfillment.ts,
 * server/api/checkout/*.ts) sans appel réseau, avec zéro `any`.
 */
import type { Database, Tables } from '~/types/database.types'

type TableName = keyof Database['public']['Tables']

export interface FakeQueryResult<T> {
  data: T | null
  error: { message: string } | null
}

/** Table en mémoire — les lignes sont mutées en place (Object.assign), comme
 * un update conditionnel Postgres réel filtré par les `.eq()` accumulés. */
export class FakeTable<Row extends Record<string, unknown>> {
  rows: Row[]

  constructor(initialRows: Row[] = []) {
    this.rows = initialRows
  }
}

type Filter<Row> = (row: Row) => boolean

let autoIncrementId = 1
function generateId(): string {
  return `00000000-0000-4000-8000-${String(autoIncrementId++).padStart(12, '0')}`
}

/** Reproduit `PostgrestFilterBuilder` : chaînable ET thenable (awaitable
 * directement, sans appel explicite à `.then()`), comme le client Supabase réel. */
class FakeQueryBuilder<Row extends Record<string, unknown>>
implements PromiseLike<FakeQueryResult<Row[] | Row | null>> {
  private op: 'select' | 'insert' | 'update' | 'delete' = 'select'
  private payload: Partial<Row> | Partial<Row>[] | null = null
  private readonly filters: Filter<Row>[] = []
  // ⚠️ Nommé `singleMode` (et non `single`) : un champ de classe portant le
  // même nom que la méthode `single()` ci-dessous écraserait cette dernière
  // sur l'instance (l'initialiseur de champ s'exécute après la définition du
  // prototype), rendant `.single()` indéfini à l'exécution.
  private singleMode: 'single' | 'maybeSingle' | null = null

  /** `onDelete` : callback de cascade optionnel (ex. `orders` → `order_items`,
   * miroir de la contrainte `ON DELETE CASCADE` du schéma — voir migration
   * SQL). Appelé avec les lignes effectivement supprimées. */
  constructor(private readonly table: FakeTable<Row>, private readonly onDelete?: (deletedRows: Row[]) => void) {}

  select(): this {
    return this
  }

  insert(payload: Partial<Row> | Partial<Row>[]): this {
    this.op = 'insert'
    this.payload = payload
    return this
  }

  update(payload: Partial<Row>): this {
    this.op = 'update'
    this.payload = payload
    return this
  }

  delete(): this {
    this.op = 'delete'
    return this
  }

  eq<K extends keyof Row>(column: K, value: Row[K]): this {
    this.filters.push(row => row[column] === value)
    return this
  }

  neq<K extends keyof Row>(column: K, value: Row[K]): this {
    this.filters.push(row => row[column] !== value)
    return this
  }

  in<K extends keyof Row>(column: K, values: Row[K][]): this {
    this.filters.push(row => values.includes(row[column]))
    return this
  }

  like<K extends keyof Row>(column: K, pattern: string): this {
    const prefix = pattern.replace(/%+$/, '')
    this.filters.push(row => String(row[column]).startsWith(prefix))
    return this
  }

  single(): this {
    this.singleMode = 'single'
    return this
  }

  maybeSingle(): this {
    this.singleMode = 'maybeSingle'
    return this
  }

  private execute(): FakeQueryResult<Row[] | Row | null> {
    if (this.op === 'insert') {
      const payloads = Array.isArray(this.payload) ? this.payload : [this.payload ?? {}]
      const inserted = payloads.map(partial => ({ id: generateId(), created_at: new Date().toISOString(), ...partial }) as Row)
      this.table.rows.push(...inserted)
      return this.finalize(inserted)
    }

    const matching = this.table.rows.filter(row => this.filters.every(f => f(row)))

    if (this.op === 'update' && this.payload) {
      for (const row of matching) Object.assign(row, this.payload)
      return this.finalize(matching)
    }

    if (this.op === 'delete') {
      this.table.rows = this.table.rows.filter(row => !matching.includes(row))
      this.onDelete?.(matching)
      return this.finalize(matching)
    }

    return this.finalize(matching)
  }

  private finalize(rows: Row[]): FakeQueryResult<Row[] | Row | null> {
    if (this.singleMode) {
      return { data: rows[0] ?? null, error: null }
    }
    return { data: rows, error: null }
  }

  then<TResult1 = FakeQueryResult<Row[] | Row | null>, TResult2 = never>(
    onfulfilled?: ((value: FakeQueryResult<Row[] | Row | null>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected)
  }
}

/** Résultat d'un RPC `reserve_product_unit` (mirrors `Database['public']['Functions']`). */
export type ReserveRpcResult = { new_stock: number }[]

export interface FakeSupabaseTables {
  orders: FakeTable<Tables<'orders'>>
  order_items: FakeTable<Tables<'order_items'>>
  products: FakeTable<Tables<'products'>>
  sales: FakeTable<Tables<'sales'>>
  consignments: FakeTable<Tables<'consignments'>>
  product_status_history: FakeTable<Tables<'product_status_history'>>
}

/**
 * Client Supabase factice couvrant `.from(table)` (select/insert/update/delete
 * chainé avec `.eq()/.neq()/.in()/.like()/.single()/.maybeSingle()`) et
 * `.rpc('reserve_product_unit' | 'release_product_unit', args)` avec la même
 * sémantique de verrou que la migration 006 :
 *   - `reserve_product_unit` : `stock -= 1` sous barrière `status='active' AND
 *     stock>=1` ; passe `status='reserved'` + verrou `reserved_order_id`
 *     uniquement si c'était la dernière unité (stock atteint 0). Retourne
 *     `[]` (0 ligne) si la barrière ne matche pas — course perdue.
 *   - `release_product_unit` : `stock += 1` ; ne déverrouille (`status`
 *     redevient `active`) QUE si `reserved_order_id === p_order_id` — une
 *     réservation détenue par une autre commande n'est jamais réactivée.
 */
export class FakeSupabase {
  readonly tables: FakeSupabaseTables

  constructor(overrides: Partial<FakeSupabaseTables> = {}) {
    this.tables = {
      orders: overrides.orders ?? new FakeTable(),
      order_items: overrides.order_items ?? new FakeTable(),
      products: overrides.products ?? new FakeTable(),
      sales: overrides.sales ?? new FakeTable(),
      consignments: overrides.consignments ?? new FakeTable(),
      product_status_history: overrides.product_status_history ?? new FakeTable(),
    }
  }

  from<T extends TableName>(table: T): FakeQueryBuilder<Tables<T>> {
    const fakeTable = this.tables[table as keyof FakeSupabaseTables] as unknown as FakeTable<Tables<T>>
    if (!fakeTable) {
      throw new Error(`[fakeSupabase] table non mockée : ${String(table)}`)
    }

    // `orders` → `order_items` : ON DELETE CASCADE (schéma SQL — voir
    // supabase/migrations). `session.post.ts` supprime la commande orpheline
    // sans supprimer explicitement ses lignes (comportement réel confié à la
    // contrainte FK), donc le fake doit le reproduire pour être fidèle.
    const onDelete
      = table === 'orders'
        ? (deletedOrders: Tables<T>[]) => {
            const deletedIds = new Set(deletedOrders.map(o => (o as unknown as Tables<'orders'>).id))
            this.tables.order_items.rows = this.tables.order_items.rows.filter(item => !deletedIds.has(item.order_id))
          }
        : undefined

    return new FakeQueryBuilder(fakeTable, onDelete)
  }

  async rpc(
    fn: 'reserve_product_unit',
    args: { p_product_id: string, p_order_id: string, p_reserved_until: string },
  ): Promise<FakeQueryResult<ReserveRpcResult>>
  async rpc(
    fn: 'release_product_unit',
    args: { p_product_id: string, p_order_id: string },
  ): Promise<FakeQueryResult<null>>
  async rpc(
    fn: 'reserve_product_unit' | 'release_product_unit',
    args: Record<string, string>,
  ): Promise<FakeQueryResult<ReserveRpcResult | null>> {
    const product = this.tables.products.rows.find(p => p.id === args.p_product_id)
    if (!product) return { data: fn === 'reserve_product_unit' ? [] : null, error: null }

    if (fn === 'reserve_product_unit') {
      const stock = product.stock ?? 0
      if (product.status !== 'active' || stock < 1) {
        return { data: [], error: null }
      }
      const newStock = stock - 1
      product.stock = newStock
      if (newStock === 0) {
        product.status = 'reserved'
        product.reserved_order_id = args.p_order_id
        product.reserved_until = args.p_reserved_until ?? null
      }
      return { data: [{ new_stock: newStock }], error: null }
    }

    // release_product_unit
    product.stock = (product.stock ?? 0) + 1
    if (product.status === 'reserved' && product.reserved_order_id === args.p_order_id) {
      product.status = 'active'
      product.reserved_order_id = null
      product.reserved_until = null
    }
    return { data: null, error: null }
  }
}
