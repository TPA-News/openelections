
import { desc, eq } from 'drizzle-orm'
import {
	elections,
	congressionalCandidates,
	congressionalCategories,
	electionReturns,
	electionReturnCandidateStatuses
} from '~~/server/db/schema'
import { db as database } from '../db'

export default defineEventHandler(async (event) => {
	const idParam = getRouterParam(event, 'id')
	const id = Number(idParam)

	if (!idParam || !Number.isInteger(id) || id <= 0) {
		throw createError({ statusCode: 400, statusMessage: 'Invalid election id' })
	}

	const electionRows = await database
		.select()
		.from(elections)
		.where(eq(elections.id, id))
		.limit(1)

	const election = electionRows[0]

	if (!election) {
		throw createError({ statusCode: 404, statusMessage: 'Election not found' })
	}

	const latestReturnRows = await database
		.select()
		.from(electionReturns)
		.where(eq(electionReturns.electionId, id))
		.orderBy(desc(electionReturns.reportedAt))
		.limit(1)

	const latestReturn = latestReturnRows[0]

	const categories = election.type === 'congressional'
		? await database
			.select()
			.from(congressionalCategories)
			.where(eq(congressionalCategories.electionId, id))
			.orderBy(congressionalCategories.name)
		: []

	const candidates = election.type === 'congressional'
		? await database
			.select()
			.from(congressionalCandidates)
			.where(eq(congressionalCandidates.electionId, id))
			.orderBy(congressionalCandidates.name)
		: []

	const returnCandidateStatuses = latestReturn && election.type === 'congressional'
		? await database
			.select()
			.from(electionReturnCandidateStatuses)
			.where(eq(electionReturnCandidateStatuses.returnId, latestReturn.id))
		: []

	const statusByCandidateId = Object.fromEntries(
		returnCandidateStatuses.map((row) => [row.candidateId, row.status])
	)

	const categoryById = Object.fromEntries(
		categories.map((category) => [category.id, category])
	)

	return {
		id: election.id,
		name: election.name,
		type: election.type,
		status: election.status,
		totalVotes: election.totalVotes,
		createdAt: election.createdAt,
		canSetTotalVotes: election.totalVotes === null,
		return: latestReturn
			? {
				id: latestReturn.id,
				votesCounted: latestReturn.votesCounted,
				reportedAt: latestReturn.reportedAt
			}
			: null,
		categories: categories.map((category) => ({
			id: category.id,
			name: category.name
		})),
		candidates: candidates.map(candidate => ({
			id: candidate.id,
			name: candidate.name,
			party: candidate.party,
			categoryId: candidate.categoryId,
			categoryName: categoryById[candidate.categoryId]?.name ?? 'Uncategorized',
			status: statusByCandidateId[candidate.id] ?? 'undecided'
		}))
	}
})
