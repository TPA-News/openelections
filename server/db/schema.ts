import { defineRelations } from 'drizzle-orm'
import {
  mysqlTable,
  mysqlEnum,
  int,
  varchar,
  timestamp
} from 'drizzle-orm/mysql-core'

export const elections = mysqlTable('election', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  status: mysqlEnum('status', ['open', 'closed', 'paused']).default('open').notNull(),
  type: mysqlEnum('type', ['congressional', 'presidential', 'parliamentary']).default('congressional').notNull(),
  totalVotes: int(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const user = mysqlTable('users', {
  discordId: int('discord_id').notNull().primaryKey(),
  role: mysqlEnum('role', ['admin', 'pollbody', 'viewer']).default('pollbody').notNull()
})

export const congressionalCandidates = mysqlTable('congressional_candidate', {
  id: int('id').autoincrement().primaryKey(),
  electionId: int('election_id').notNull().references(() => elections.id, { onDelete: 'cascade' }),
  categoryId: int('category_id').notNull().references(() => congressionalCategories.id, { onDelete: 'cascade' }),
  name: varchar({ length: 100 }).notNull(),
  party: varchar({ length: 3 }).default('IND').notNull()
})

export const congressionalCategories = mysqlTable('congressional_category', {
  id: int('id').autoincrement().primaryKey(),
  electionId: int('election_id').notNull().references(() => elections.id, { onDelete: 'cascade' }),
  name: varchar({ length: 100 }).notNull()
})

export const electionReturns = mysqlTable('election_return', {
  id: int('id').autoincrement().primaryKey(),
  electionId: int('election_id').notNull().references(() => elections.id, { onDelete: 'cascade' }),
  votesCounted: int('votes_counted').default(0).notNull(),
  reportedAt: timestamp('reported_at').defaultNow().notNull()
})

export const electionReturnCandidateStatuses = mysqlTable('election_return_candidate_status', {
  id: int('id').autoincrement().primaryKey(),
  returnId: int('return_id').notNull().references(() => electionReturns.id, { onDelete: 'cascade' }),
  candidateId: int('candidate_id').notNull().references(() => congressionalCandidates.id, { onDelete: 'cascade' }),
  status: mysqlEnum('status', ['in', 'out', 'undecided']).default('undecided').notNull()
})

export const relations = defineRelations({
  elections,
  congressionalCategories,
  congressionalCandidates,
  electionReturns,
  electionReturnCandidateStatuses
}, (r) => ({
  congressionalCategories: {
    election: r.one.elections({
      from: r.congressionalCategories.electionId,
      to: r.elections.id
    })
  },
  congressionalCandidates: {
    election: r.one.elections({
      from: r.congressionalCandidates.electionId,
      to: r.elections.id
    }),
    category: r.one.congressionalCategories({
      from: r.congressionalCandidates.categoryId,
      to: r.congressionalCategories.id
    })
  },
  electionReturns: {
    election: r.one.elections({
      from: r.electionReturns.electionId,
      to: r.elections.id
    })
  },
  electionReturnCandidateStatuses: {
    return: r.one.electionReturns({
      from: r.electionReturnCandidateStatuses.returnId,
      to: r.electionReturns.id
    }),
    candidate: r.one.congressionalCandidates({
      from: r.electionReturnCandidateStatuses.candidateId,
      to: r.congressionalCandidates.id
    })
  }
}))