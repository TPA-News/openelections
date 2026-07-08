import { eq } from 'drizzle-orm'
import { db } from '../db'
import { elections } from '~~/server/db/schema'
import { assertCanMutateElections, assertElectionWritableByCreator, requireExistingAccount } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  const electionId = Number(idParam)

  if (!idParam || !Number.isInteger(electionId) || electionId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid election id' })
  }

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

  await db
    .delete(elections)
    .where(eq(elections.id, electionId))

  return {
    id: electionId,
    deleted: true
  }
})
