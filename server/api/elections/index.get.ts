import { sql, inArray, desc } from 'drizzle-orm'
import { elections, electionReturns, congressionalCandidates } from '~~/server/db/schema'
import { db as database } from '../db'

export default defineEventHandler(async () => {
  const list = await database
    .select()
    .from(elections)
    .orderBy(desc(elections.createdAt))

  if (!list.length) return []

  const ids = list.map((election) => election.id)

  const allReturns = await database
    .select({
      electionId: electionReturns.electionId,
      votesCounted: electionReturns.votesCounted,
      reportedAt: electionReturns.reportedAt
    })
    .from(electionReturns)
    .where(inArray(electionReturns.electionId, ids))
    .orderBy(desc(electionReturns.reportedAt))

  const candidateCounts = await database
    .select({
      electionId: congressionalCandidates.electionId,
      count: sql<number>`count(*)`.as('count')
    })
    .from(congressionalCandidates)
    .where(inArray(congressionalCandidates.electionId, ids))
    .groupBy(congressionalCandidates.electionId)

  const latestReturnByElectionId: Record<number, { votesCounted: number }> = {}
  for (const row of allReturns) {
    if (!latestReturnByElectionId[row.electionId]) {
      latestReturnByElectionId[row.electionId] = { votesCounted: row.votesCounted }
    }
  }

  const candidateCountByElectionId = Object.fromEntries(
    candidateCounts.map((row) => [row.electionId, row.count])
  )

  return list.map((election) => ({
    id: election.id,
    name: election.name,
    title: election.name,
    type: election.type,
    mode: election.type,
    status: election.status,
    totalVotes: election.totalVotes,
    votesCounted: latestReturnByElectionId[election.id]?.votesCounted ?? 0,
    candidateCount: candidateCountByElectionId[election.id] ?? 0,
    createdAt: election.createdAt
  }))
})
