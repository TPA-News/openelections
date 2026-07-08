import { and, eq } from 'drizzle-orm'
import { db } from '../../../db'
import { elections, congressionalCandidates } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  const candidateIdParam = getRouterParam(event, 'candidateId')
  const electionId = Number(idParam)
  const candidateId = Number(candidateIdParam)

  if (!idParam || !Number.isInteger(electionId) || electionId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid election id' })
  }

  if (!candidateIdParam || !Number.isInteger(candidateId) || candidateId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid candidate id' })
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

  if (election.type !== 'congressional') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Candidate deletion is only supported for congressional elections'
    })
  }

  if (election.totalVotes !== null) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Candidates cannot be deleted after total votes are set'
    })
  }

  const candidateRows = await db
    .select()
    .from(congressionalCandidates)
    .where(and(
      eq(congressionalCandidates.id, candidateId),
      eq(congressionalCandidates.electionId, electionId)
    ))
    .limit(1)

  const candidate = candidateRows[0]

  if (!candidate) {
    throw createError({ statusCode: 404, statusMessage: 'Candidate not found' })
  }

  await db
    .delete(congressionalCandidates)
    .where(eq(congressionalCandidates.id, candidateId))

  return {
    id: candidateId,
    deleted: true
  }
})
