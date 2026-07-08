import { and, eq } from 'drizzle-orm'
import { db } from '../../../db'
import {
  congressionalCandidates,
  electionReturnCandidateStatuses,
  electionReturns,
  elections
} from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  const returnIdParam = getRouterParam(event, 'returnId')
  const electionId = Number(idParam)
  const returnId = Number(returnIdParam)

  if (!idParam || !Number.isInteger(electionId) || electionId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid election id' })
  }

  if (!returnIdParam || !Number.isInteger(returnId) || returnId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid return id' })
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

  const returnRows = await db
    .select()
    .from(electionReturns)
    .where(and(
      eq(electionReturns.id, returnId),
      eq(electionReturns.electionId, electionId)
    ))
    .limit(1)

  const electionReturn = returnRows[0]

  if (!electionReturn) {
    throw createError({ statusCode: 404, statusMessage: 'Return not found' })
  }

  const statuses = await db
    .select()
    .from(electionReturnCandidateStatuses)
    .where(eq(electionReturnCandidateStatuses.returnId, returnId))

  const candidates = election.type === 'congressional'
    ? await db
      .select()
      .from(congressionalCandidates)
      .where(eq(congressionalCandidates.electionId, electionId))
    : []

  const candidateById = Object.fromEntries(candidates.map((candidate) => [candidate.id, candidate]))

  return {
    electionId,
    return: {
      id: electionReturn.id,
      votesCounted: electionReturn.votesCounted,
      reportedAt: electionReturn.reportedAt,
      candidateStatuses: statuses.map((row) => {
        const candidate = candidateById[row.candidateId]
        return {
          candidateId: row.candidateId,
          status: row.status,
          candidateName: candidate?.name ?? null,
          party: candidate?.party ?? null,
          categoryId: candidate?.categoryId ?? null
        }
      })
    }
  }
})
