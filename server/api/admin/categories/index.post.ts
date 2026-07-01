import type { H3Event } from 'h3'

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export default defineEventHandler(async (event: H3Event) => {
  await requireAdminAuth(event)

  const supabase = getAdminSupabase()
  const body = await readBody<{
    name?: string
    slug?: string
    parentId?: string | null
    isActive?: boolean
  }>(event)

  // Validate name
  if (!body.name?.trim()) {
    throw createError({ statusCode: 422, statusMessage: 'Le nom est obligatoire.' })
  }

  // Validate slug
  const slug = body.slug?.trim() ?? ''
  if (!slug) {
    throw createError({ statusCode: 422, statusMessage: 'Le slug est obligatoire.' })
  }
  if (!SLUG_PATTERN.test(slug)) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Slug invalide : uniquement minuscules, chiffres et tirets.',
    })
  }

  // Check slug uniqueness
  const { data: slugExists } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (slugExists) {
    throw createError({ statusCode: 422, statusMessage: 'Ce slug est déjà utilisé.' })
  }

  // Validate parentId — no level 3
  const parentId = body.parentId ?? null
  if (parentId) {
    const { data: parent } = await supabase
      .from('categories')
      .select('id, parent_id')
      .eq('id', parentId)
      .maybeSingle()

    if (!parent) {
      throw createError({ statusCode: 422, statusMessage: 'Catégorie parente introuvable.' })
    }
    if (parent.parent_id !== null) {
      throw createError({
        statusCode: 422,
        statusMessage: 'Impossible de créer un niveau 3 : la catégorie parente est déjà une sous-catégorie.',
      })
    }
  }

  // Compute sort_order: MAX + 1 in same group
  const siblingsQuery = supabase.from('categories').select('sort_order')
  const { data: siblings } = parentId === null
    ? await siblingsQuery.is('parent_id', null)
    : await siblingsQuery.eq('parent_id', parentId)

  const maxOrder = siblings?.reduce((max, s) => Math.max(max, s.sort_order ?? 0), -1) ?? -1

  const { data: created, error: insertErr } = await supabase
    .from('categories')
    .insert({
      name: body.name.trim(),
      slug,
      parent_id: parentId,
      is_active: body.isActive ?? true,
      sort_order: maxOrder + 1,
    })
    .select('*')
    .single()

  if (insertErr || !created) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la création de la catégorie.',
    })
  }

  setResponseStatus(event, 201)

  return {
    category: {
      id: created.id,
      name: created.name,
      slug: created.slug,
      parentId: created.parent_id,
      sortOrder: created.sort_order ?? 0,
      isActive: created.is_active ?? true,
    },
  }
})
