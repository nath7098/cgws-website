import type { ComputedRef, InjectionKey, Reactive, Ref } from 'vue'
import type {
  CatalogueFilters,
  Product,
  ProductCategory,
  ProductCondition,
  ProductStatus,
  SortOption,
} from '~/types'
import type { Database } from '~/types/database.types'

export interface CatalogueContext {
  filters: Reactive<CatalogueFilters>
  maxPrice: Ref<number>
  availableBrands: Ref<string[]>
  hasActiveFilters: ComputedRef<boolean>
  activeFilterCount: ComputedRef<number>
  totalCount: Ref<number>
  resetFilters: () => void
}

export const CATALOGUE_CONTEXT_KEY: InjectionKey<CatalogueContext> = Symbol('catalogue')

type ProductRow = Database['public']['Tables']['products']['Row']

const PAGE_SIZE = 12

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  selles: 'Selles',
  'brides-licols': 'Brides & Licols',
  'bottes-chaussures': 'Bottes & Chaussures',
  vetements: 'Vêtements',
  accessoires: 'Accessoires',
  protections: 'Protections',
}

const ALL_CATEGORIES: ProductCategory[] = [
  'selles',
  'brides-licols',
  'bottes-chaussures',
  'vetements',
  'accessoires',
  'protections',
]

function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? '',
    price: Number(row.price),
    category: row.category as ProductCategory,
    brand: row.brand ?? '',
    size: row.size ?? undefined,
    condition: row.condition as ProductCondition,
    isConsignment: row.is_consignment ?? false,
    consignmentId: row.consignment_id ?? undefined,
    status: (row.status ?? 'active') as ProductStatus,
    images: row.images ?? [],
    stock: row.stock ?? 1,
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
  }
}

export function useCatalogue() {
  const supabase = useSupabase()
  const route = useRoute()
  const router = useRouter()

  const filters = reactive<CatalogueFilters>({
    categories: [],
    conditions: [],
    brands: [],
    priceMin: 0,
    priceMax: 5000,
    includeReserved: false,
    isConsignment: null,
  })

  const sort = ref<SortOption>('relevance')
  const products = ref<Product[]>([])
  const totalCount = ref(0)
  const isLoading = ref(false)
  const isFetchingMore = ref(false)
  const hasMore = ref(true)
  const currentOffset = ref(0)
  const availableBrands = ref<string[]>([])
  const maxPrice = ref(5000)
  const initialized = ref(false)
  let fetchVersion = 0

  const hasActiveFilters = computed(
    () =>
      filters.categories.length > 0 ||
      filters.conditions.length > 0 ||
      filters.brands.length > 0 ||
      filters.priceMin > 0 ||
      filters.priceMax < maxPrice.value ||
      filters.isConsignment === true,
  )

  const activeFilterCount = computed(() => {
    let count = 0
    if (filters.categories.length) count += filters.categories.length
    if (filters.conditions.length) count += filters.conditions.length
    if (filters.brands.length) count += filters.brands.length
    if (filters.priceMin > 0 || filters.priceMax < maxPrice.value) count++
    if (filters.isConsignment === true) count++
    return count
  })

  function buildConditionValues(): string[] {
    const conds: string[] = []
    if (filters.conditions.includes('new')) conds.push('new')
    if (filters.conditions.includes('occasion')) conds.push('excellent', 'good', 'fair')
    return conds
  }

  function buildStatuses(): string[] {
    return ['active', ...(filters.includeReserved ? ['reserved'] : [])]
  }

  async function fetchProducts(): Promise<void> {
    const myVersion = ++fetchVersion
    isFetchingMore.value = false  // cancel any in-flight loadMore
    isLoading.value = true
    currentOffset.value = 0
    products.value = []

    try {
      const conditionValues = buildConditionValues()
      const statuses = buildStatuses()

      let q = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .in('status', statuses)
        .gte('price', filters.priceMin)
        .lte('price', filters.priceMax)

      if (filters.categories.length > 0) q = q.in('category', filters.categories)
      if (conditionValues.length > 0) q = q.in('condition', conditionValues)
      if (filters.brands.length > 0) q = q.in('brand', filters.brands)
      if (filters.isConsignment === true) q = q.eq('is_consignment', true)

      if (sort.value === 'price_asc') q = q.order('price', { ascending: true })
      else if (sort.value === 'price_desc') q = q.order('price', { ascending: false })
      else q = q.order('created_at', { ascending: false })

      q = q.range(0, PAGE_SIZE - 1)

      const { data, error, count } = await q
      if (fetchVersion !== myVersion) return  // superseded by a newer fetch, discard
      if (error) throw error

      products.value = (data ?? []).map(mapProductRow)
      totalCount.value = count ?? 0
      hasMore.value = (data?.length ?? 0) >= PAGE_SIZE
      currentOffset.value = data?.length ?? 0
    }
    finally {
      if (fetchVersion === myVersion) isLoading.value = false
    }
  }

  async function loadMore(): Promise<void> {
    if (!hasMore.value || isFetchingMore.value) return
    isFetchingMore.value = true
    const myVersion = fetchVersion

    try {
      const conditionValues = buildConditionValues()
      const statuses = buildStatuses()

      let q = supabase
        .from('products')
        .select('*')
        .in('status', statuses)
        .gte('price', filters.priceMin)
        .lte('price', filters.priceMax)

      if (filters.categories.length > 0) q = q.in('category', filters.categories)
      if (conditionValues.length > 0) q = q.in('condition', conditionValues)
      if (filters.brands.length > 0) q = q.in('brand', filters.brands)
      if (filters.isConsignment === true) q = q.eq('is_consignment', true)

      if (sort.value === 'price_asc') q = q.order('price', { ascending: true })
      else if (sort.value === 'price_desc') q = q.order('price', { ascending: false })
      else q = q.order('created_at', { ascending: false })

      q = q.range(currentOffset.value, currentOffset.value + PAGE_SIZE - 1)

      const { data, error } = await q
      if (fetchVersion !== myVersion) { isFetchingMore.value = false; return }
      if (error) throw error

      const newProducts = (data ?? []).map(mapProductRow)
      products.value = [...products.value, ...newProducts]
      hasMore.value = (data?.length ?? 0) >= PAGE_SIZE
      currentOffset.value += data?.length ?? 0
    }
    finally {
      isFetchingMore.value = false
    }
  }

  async function fetchBrands(): Promise<void> {
    const { data } = await supabase
      .from('products')
      .select('brand')
      .not('brand', 'is', null)
      .in('status', ['active', 'reserved'])

    if (data) {
      const unique = [
        ...new Set(data.map((p) => p.brand).filter((b): b is string => b !== null)),
      ].sort()
      availableBrands.value = unique
    }
  }

  async function fetchMaxPrice(): Promise<void> {
    const { data } = await supabase
      .from('products')
      .select('price')
      .order('price', { ascending: false })
      .limit(1)

    if (data?.[0]) {
      const max = Math.ceil(Number(data[0].price) / 100) * 100 + 100
      maxPrice.value = Math.min(max, 5000)
      filters.priceMax = maxPrice.value
    }
  }

  function initFromUrl(): void {
    const q = route.query

    if (q.categorie) {
      const cats = Array.isArray(q.categorie) ? q.categorie : [q.categorie]
      filters.categories = cats.filter((c): c is ProductCategory =>
        c !== null && (ALL_CATEGORIES as string[]).includes(c as string),
      )
    }

    if (q.etat) {
      const etats = Array.isArray(q.etat) ? q.etat : [q.etat]
      filters.conditions = etats.filter(
        (e): e is 'new' | 'occasion' => e === 'new' || e === 'occasion',
      )
    }

    if (q.marque) {
      const brands = Array.isArray(q.marque) ? q.marque : [q.marque]
      filters.brands = brands.filter((b): b is string => b !== null)
    }

    if (q.prix_min && !Number.isNaN(Number(q.prix_min))) {
      filters.priceMin = Number(q.prix_min)
    }
    if (q.prix_max && !Number.isNaN(Number(q.prix_max))) {
      filters.priceMax = Number(q.prix_max)
    }

    if (q.consignation === 'true') filters.isConsignment = true

    const validSorts: SortOption[] = ['relevance', 'price_asc', 'price_desc', 'newest']
    if (q.tri && validSorts.includes(q.tri as SortOption)) {
      sort.value = q.tri as SortOption
    }
  }

  function syncToUrl(): void {
    const query: Record<string, string | string[]> = {}

    if (filters.categories.length) query.categorie = [...filters.categories]
    if (filters.conditions.length) query.etat = [...filters.conditions]
    if (filters.brands.length) query.marque = [...filters.brands]
    if (filters.priceMin > 0) query.prix_min = String(filters.priceMin)
    if (filters.priceMax < maxPrice.value) query.prix_max = String(filters.priceMax)
    if (filters.isConsignment === true) query.consignation = 'true'
    if (sort.value !== 'relevance') query.tri = sort.value

    router.replace({ query })
  }

  function resetFilters(): void {
    filters.categories = []
    filters.conditions = []
    filters.brands = []
    filters.priceMin = 0
    filters.priceMax = maxPrice.value
    filters.includeReserved = false
    filters.isConsignment = null
    sort.value = 'relevance'
  }

  // Watch for filter/sort changes — fires only after initialization
  watch(
    [filters, sort],
    () => {
      if (!initialized.value) return
      fetchProducts()
      syncToUrl()
    },
    { deep: true },
  )

  async function init(): Promise<void> {
    // fetchMaxPrice must complete before initFromUrl so that URL prix_max can override the DB max
    await Promise.all([fetchMaxPrice(), fetchBrands()])
    initFromUrl()
    await fetchProducts()
    initialized.value = true
  }

  return {
    filters,
    sort,
    products,
    totalCount,
    isLoading,
    isFetchingMore,
    hasMore,
    availableBrands,
    maxPrice,
    hasActiveFilters,
    activeFilterCount,
    init,
    loadMore,
    resetFilters,
  }
}
