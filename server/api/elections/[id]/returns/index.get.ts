import { desc, eq, inArray } from 'drizzle-orm'
import { db } from '../../../db'
import {
  congressionalCandidates,
  electionReturnCandidateStatuses,
  electionReturns,
  elections
} from '~~/server/db/schema'

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

  const query = getQuery(event)
  const parsedLimit = Number(query.limit)
  const limit = Number.isInteger(parsedLimit) && parsedLimit > 0
    ? Math.min(parsedLimit, 100)
    : 20

  const returns = await db
    .select()
    .from(electionReturns)
    .where(eq(electionReturns.electionId, electionId))
    .orderBy(desc(electionReturns.reportedAt), desc(electionReturns.id))
    .limit(limit)

  if (!returns.length) {
    return {
      electionId,
      count: 0,
      returns: []
    }
  }

  const returnIds = returns.map((row) => row.id)

  const statuses = await db
    .select()
    .from(electionReturnCandidateStatuses)
    .where(inArray(electionReturnCandidateStatuses.returnId, returnIds))

  const candidates = election.type === 'congressional'
    ? await db
      .select()
      .from(congressionalCandidates)
      .where(eq(congressionalCandidates.electionId, electionId))
    : []

  const candidateById = Object.fromEntries(candidates.map((candidate) => [candidate.id, candidate]))

  const statusesByReturnId = statuses.reduce<Record<number, Array<{
    candidateId: number
    status: 'in' | 'out' | 'undecided'
    candidateName: string | null
    party: string | null
    categoryId: number | null
  }>>>((acc, row) => {
    const candidate = candidateById[row.candidateId]
    const bucket = acc[row.returnId] ?? []
    bucket.push({
      candidateId: row.candidateId,
      status: row.status,
      candidateName: candidate?.name ?? null,
      party: candidate?.party ?? null,
      categoryId: candidate?.categoryId ?? null
    })
    acc[row.returnId] = bucket
    return acc
  }, {})

  return {
    electionId,
    count: returns.length,
    returns: returns.map((row) => ({
      id: row.id,
      votesCounted: row.votesCounted,
      reportedAt: row.reportedAt,
      candidateStatuses: statusesByReturnId[row.id] ?? []
    }))
  }
})
