import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { elections } from '~~/server/db/schema'
import { assertCanMutateElections, requireExistingAccount } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  const electionId = Number(idParam)

  if (!idParam || !Number.isInteger(electionId) || electionId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid election id' })
  }

  const account = await requireExistingAccount(event)
  assertCanMutateElections(account)

  const electionRows = await db
    .select()
    .from(elections)
    .where(eq(elections.id, electionId))
    .limit(1)

  const election = electionRows[0]

  if (!election) {
    throw createError({ statusCode: 404, statusMessage: 'Election not found' })
  }

  if (election.createdByDiscordId && election.createdByDiscordId !== account.discordId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Election already linked to another creator account'
    })
  }

  if (!election.createdByDiscordId) {
    await db
      .update(elections)
      .set({ createdByDiscordId: account.discordId })
      .where(eq(elections.id, electionId))
  }

  return {
    id: electionId,
    createdByDiscordId: account.discordId,
    canEdit: true
  }
})
