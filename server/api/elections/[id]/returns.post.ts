import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db'
import {
  elections,
  electionReturns,
  congressionalCandidates,
  electionReturnCandidateStatuses
} from '~~/server/db/schema'
import { assertCanMutateElections, assertElectionWritableByCreator, requireExistingAccount } from '~~/server/utils/auth'

const bodySchema = z.object({
  votesCounted: z.coerce.number().int().min(0),
  candidateStatuses: z.array(z.object({
    candidateId: z.number().int().positive(),
    status: z.enum(['in', 'out', 'undecided'])
  })).default([])
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

  if (election.totalVotes === null) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Set total votes before submitting returns'
    })
  }

  if (election.totalVotes !== null && body.votesCounted > election.totalVotes) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Votes counted cannot exceed total votes'
    })
  }

  const latestReturnRows = await db
    .select({
      votesCounted: electionReturns.votesCounted
    })
    .from(electionReturns)
    .where(eq(electionReturns.electionId, electionId))
    .orderBy(desc(electionReturns.reportedAt), desc(electionReturns.id))
    .limit(1)

  const minimumVotesCounted = latestReturnRows[0]?.votesCounted ?? 0

  if (body.votesCounted < minimumVotesCounted) {
    throw createError({
      statusCode: 400,
      statusMessage: `Votes counted cannot be lower than the latest reported count (${minimumVotesCounted})`
    })
  }

  if (body.candidateStatuses.length && election.type !== 'congressional') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Candidate statuses can only be reported for congressional elections'
    })
  }

  const electionCandidateRows = election.type === 'congressional'
    ? await db
      .select({ id: congressionalCandidates.id })
      .from(congressionalCandidates)
      .where(eq(congressionalCandidates.electionId, electionId))
    : []

  const validCandidateIds = new Set(electionCandidateRows.map(candidate => candidate.id))

  for (const row of body.candidateStatuses) {
    if (!validCandidateIds.has(row.candidateId)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Candidate ${row.candidateId} does not belong to election ${electionId}`
      })
    }
  }

  const [newReturn] = await db
    .insert(electionReturns)
    .values({
      electionId,
      votesCounted: body.votesCounted
    })
    .$returningId()

  if (newReturn?.id && body.candidateStatuses.length) {
    await db
      .insert(electionReturnCandidateStatuses)
      .values(body.candidateStatuses.map((row) => ({
        returnId: newReturn.id,
        candidateId: row.candidateId,
        status: row.status
      })))
  }

  return {
    id: newReturn?.id,
    electionId,
    votesCounted: body.votesCounted,
    totalVotes: election.totalVotes,
    minimumVotesCounted
  }
})
