import type { H3Event } from 'h3'

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export default defineEventHandler(async (event: H3Event) => {
  await requireAdminAuth(event)

  const supabase = getAdminSupabase()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID manquant' })
  }

  const body = await readBody<{
    name?: string
    slug?: string
    parentId?: string | null
    isActive?: boolean
  }>(event)

  // Verify category exists
  const { data: existing } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Catégorie introuvable.' })
  }

  const updates: Record<string, unknown> = {}

  if (body.name !== undefined) {
    const name = body.name.trim()
    if (!name) throw createError({ statusCode: 422, statusMessage: 'Le nom est obligatoire.' })
    updates.name = name
  }

  if (body.slug !== undefined) {
    const slug = body.slug.trim()
    if (!slug) throw createError({ statusCode: 422, statusMessage: 'Le slug est obligatoire.' })
    if (!SLUG_PATTERN.test(slug)) {
      throw createError({ statusCode: 422, statusMessage: 'Slug invalide.' })
    }
    if (slug !== existing.slug) {
      // Check uniqueness excluding self
      const { data: slugTaken } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .maybeSingle()

      if (slugTaken) {
        throw createError({ statusCode: 422, statusMessage: 'Ce slug est déjà utilisé.' })
      }
    }
    updates.slug = slug
  }

  if ('parentId' in body) {
    const parentId = body.parentId ?? null

    if (parentId !== existing.parent_id) {
      // Can't move a category with children to level 2
      if (parentId !== null) {
        const { data: children } = await supabase
          .from('categories')
          .select('id')
          .eq('parent_id', id)

        if (children && children.length > 0) {
          throw createError({
            statusCode: 422,
            statusMessage: 'Une catégorie avec des sous-catégories ne peut pas être déplacée en niveau 2.',
          })
        }

        // Verify new parent exists and is not itself a sub-category (prevent level 3)
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
            statusMessage: 'Impossible de créer un niveau 3.',
          })
        }
      }
      updates.parent_id = parentId
    }
  }

  if (body.isActive !== undefined) {
    updates.is_active = body.isActive
  }

  if (Object.keys(updates).length === 0) {
    return {
      category: {
        id: existing.id,
        name: existing.name,
        slug: existing.slug,
        parentId: existing.parent_id,
        sortOrder: existing.sort_order ?? 0,
        isActive: existing.is_active ?? true,
      },
    }
  }

  const { data: updated, error: updateErr } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (updateErr || !updated) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la mise à jour de la catégorie.',
    })
  }

  return {
    category: {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      parentId: updated.parent_id,
      sortOrder: updated.sort_order ?? 0,
      isActive: updated.is_active ?? true,
    },
  }
})
