import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db'
import { elections, congressionalCandidates, congressionalCategories } from '~~/server/db/schema'
import { assertCanMutateElections, assertElectionWritableByCreator, requireExistingAccount } from '~~/server/utils/auth'

const chamberSchema = z.enum(['senate', 'representative'])

const bodySchema = z.object({
  name: z.string().min(2),
  party: z.string().trim().min(2).max(3),
  category: chamberSchema
})

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  const electionId = Number(idParam)

  if (!idParam || !Number.isInteger(electionId) || electionId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid election id' })
  }

  const body = await readValidatedBody(event, bodySchema.parse)

  const electionRows = await db
    .select()
    .from(elections)
    .where(eq(elections.id, electionId))
    .limit(1)

  const election = electionRows[0]

  if (!election) {
    throw createError({ statusCode: 404, statusMessage: 'Election not found' })
  }

  const account = await requireExistingAccount(event)
  assertCanMutateElections(account)
  assertElectionWritableByCreator(election, account.discordId)

  if (election.type !== 'congressional') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Candidates can only be added to congressional elections'
    })
  }

  if (election.totalVotes !== null) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Candidates cannot be added after total votes are set'
    })
  }

  const categoryName = body.category === 'senate' ? 'Senate' : 'Representative'

  const existingCategoryRows = await db
    .select()
    .from(congressionalCategories)
    .where(eq(congressionalCategories.electionId, electionId))

  const existingCategory = existingCategoryRows.find(category =>
    category.name.toLowerCase() === categoryName.toLowerCase()
  )

  let categoryId = existingCategory?.id

  if (!categoryId) {
    const [newCategory] = await db
      .insert(congressionalCategories)
      .values({
        electionId,
        name: categoryName
      })
      .$returningId()

    categoryId = newCategory?.id
  }

  if (!categoryId) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create category' })
  }

  const [candidate] = await db
    .insert(congressionalCandidates)
    .values({
      electionId,
      categoryId,
      name: body.name,
      party: body.party.toUpperCase()
    })
    .$returningId()

  return {
    id: candidate?.id,
    electionId,
    categoryId
  }
})
