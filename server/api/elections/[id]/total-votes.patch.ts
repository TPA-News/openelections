import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db'
import { elections } from '~~/server/db/schema'
import { assertCanMutateElections, assertElectionWritableByCreator, requireExistingAccount } from '~~/server/utils/auth'

const bodySchema = z.object({
  totalVotes: z.coerce.number().int().min(0)
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

  if (election.totalVotes !== null) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Total votes are already set and cannot be changed'
    })
  }

  await db
    .update(elections)
    .set({ totalVotes: body.totalVotes })
    .where(eq(elections.id, electionId))


  return {
    id: electionId,
    totalVotes: body.totalVotes,
    canSetTotalVotes: false
  }
})
