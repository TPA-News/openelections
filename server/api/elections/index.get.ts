import { sql, inArray } from 'drizzle-orm'
import { db, schema } from '@nuxthub/db'

export default defineEventHandler(async () => {
  const allElections = await db
    .select()
    .from(schema.elections)
    .orderBy(schema.elections.createdAt)

  if (!allElections.length) return []

  const ids = allElections.map(e => e.id)

  // ── Presidential ───────────────────────────────────────────────────────────

  const presidentialTotals = await db
    .select({
      electionId: schema.presidentialResults.electionId,
      totalVotes: schema.presidentialResults.totalVotes
    })
    .from(schema.presidentialResults)
    .where(inArray(schema.presidentialResults.electionId, ids))

  const presidentialCandidateCounts = await db
    .select({
      electionId: schema.presidentialCandidates.electionId,
      count: sql<number>`COUNT(*)`.as('count')
    })
    .from(schema.presidentialCandidates)
    .where(inArray(schema.presidentialCandidates.electionId, ids))
    .groupBy(schema.presidentialCandidates.electionId)

  // ── Congressional ──────────────────────────────────────────────────────────

  const congressionalTotals = await db
    .select({
      electionId: schema.congressionalResults.electionId,
      totalVotes: schema.congressionalResults.totalVotes,
      votesCounted: schema.congressionalResults.votesCounted
    })
    .from(schema.congressionalResults)
    .where(inArray(schema.congressionalResults.electionId, ids))

  const congressionalCandidateCounts = await db
    .select({
      electionId: schema.congressionalCandidates.electionId,
      count: sql<number>`COUNT(*)`.as('count')
    })
    .from(schema.congressionalCandidates)
    .where(inArray(schema.congressionalCandidates.electionId, ids))
    .groupBy(schema.congressionalCandidates.electionId)

  // ── Parliamentary ──────────────────────────────────────────────────────────

  const parliamentaryTotals = await db
    .select({
      electionId: schema.parliamentaryResults.electionId,
      totalVotes: schema.parliamentaryResults.totalVotes
    })
    .from(schema.parliamentaryResults)
    .where(inArray(schema.parliamentaryResults.electionId, ids))

  const parliamentaryPartyCounts = await db
    .select({
      electionId: schema.parliamentaryPartyVotes.electionId,
      count: sql<number>`COUNT(*)`.as('count')
    })
    .from(schema.parliamentaryPartyVotes)
    .where(inArray(schema.parliamentaryPartyVotes.electionId, ids))
    .groupBy(schema.parliamentaryPartyVotes.electionId)

  // ── Index maps ─────────────────────────────────────────────────────────────

  const presTotal = Object.fromEntries(presidentialTotals.map(r => [r.electionId, r.totalVotes]))
  const presCount = Object.fromEntries(presidentialCandidateCounts.map(r => [r.electionId, r.count]))
  const congTotal = Object.fromEntries(congressionalTotals.map(r => [r.electionId, r]))
  const congCount = Object.fromEntries(congressionalCandidateCounts.map(r => [r.electionId, r.count]))
  const parlTotal = Object.fromEntries(parliamentaryTotals.map(r => [r.electionId, r.totalVotes]))
  const parlCount = Object.fromEntries(parliamentaryPartyCounts.map(r => [r.electionId, r.count]))

  // ── Assemble ───────────────────────────────────────────────────────────────

  return allElections.map((election) => {
    const id = election.id
    let totalVotes = 0
    let votesCounted: number | undefined
    let candidateCount = 0

    if (election.mode === 'presidential') {
      totalVotes = presTotal[id] ?? 0
      candidateCount = presCount[id] ?? 0
    } else if (election.mode === 'congressional') {
      totalVotes = congTotal[id]?.totalVotes ?? 0
      votesCounted = congTotal[id]?.votesCounted ?? 0
      candidateCount = congCount[id] ?? 0
    } else if (election.mode === 'parliamentary') {
      totalVotes = parlTotal[id] ?? 0
      candidateCount = parlCount[id] ?? 0
    }

    return {
      id: election.id,
      title: election.title,
      mode: election.mode,
      status: election.status,
      totalVotes,
      ...(votesCounted !== undefined && { votesCounted }),
      candidateCount,
      createdAt: election.createdAt,
      updatedAt: election.updatedAt
    }
  })
})
