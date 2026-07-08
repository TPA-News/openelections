import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db'
import { elections } from '~~/server/db/schema'

const bodySchema = z.object({
  status: z.enum(['open', 'closed', 'paused'])
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

  if (election.status !== body.status) {
    await db
      .update(elections)
      .set({ status: body.status })
      .where(eq(elections.id, electionId))
  }

  return {
    id: electionId,
    status: body.status
  }
})
