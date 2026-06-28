import {
  mysqlTable,
  mysqlEnum,
  int,
  varchar,
  timestamp
} from 'drizzle-orm/mysql-core'
import { relations } from 'drizzle-orm'

// ─── Elections ────────────────────────────────────────────────────────────────

export const elections = mysqlTable('elections', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  mode: mysqlEnum('mode', ['presidential', 'congressional', 'parliamentary']).notNull(),
  status: mysqlEnum('status', ['ongoing', 'closed']).notNull().default('ongoing'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
})

// ─── Presidential ─────────────────────────────────────────────────────────────

export const presidentialResults = mysqlTable('presidential_results', {
  id: int('id').autoincrement().primaryKey(),
  electionId: int('election_id').notNull().references(() => elections.id),
  totalVotes: int('total_votes').notNull().default(0)
})

export const presidentialCandidates = mysqlTable('presidential_candidates', {
  id: int('id').autoincrement().primaryKey(),
  electionId: int('election_id').notNull().references(() => elections.id),
  presidentialName: varchar('presidential_name', { length: 100 }).notNull(),
  viceName: varchar('vice_name', { length: 100 }).notNull(),
  partyAbbr: varchar('party_abbr', { length: 20 }).notNull(),
  votes: int('votes').notNull().default(0)
})

// ─── Congressional ────────────────────────────────────────────────────────────

export const congressionalResults = mysqlTable('congressional_results', {
  id: int('id').autoincrement().primaryKey(),
  electionId: int('election_id').notNull().references(() => elections.id),
  totalVotes: int('total_votes').notNull().default(0),
  votesCounted: int('votes_counted').notNull().default(0)
})

export const congressionalCandidates = mysqlTable('congressional_candidates', {
  id: int('id').autoincrement().primaryKey(),
  electionId: int('election_id').notNull().references(() => elections.id),
  name: varchar('name', { length: 100 }).notNull(),
  partyAbbr: varchar('party_abbr', { length: 20 }).notNull(),
  status: mysqlEnum('status', ['IN', 'OUT', 'UNCOUNTED']).notNull().default('UNCOUNTED')
})

// ─── Parliamentary ────────────────────────────────────────────────────────────

export const parliamentaryResults = mysqlTable('parliamentary_results', {
  id: int('id').autoincrement().primaryKey(),
  electionId: int('election_id').notNull().references(() => elections.id),
  totalVotes: int('total_votes').notNull().default(0)
})

export const parliamentaryPartyVotes = mysqlTable('parliamentary_party_votes', {
  id: int('id').autoincrement().primaryKey(),
  electionId: int('election_id').notNull().references(() => elections.id),
  // null partyAbbr = independent votes
  partyAbbr: varchar('party_abbr', { length: 20 }),
  partyName: varchar('party_name', { length: 100 }),
  votes: int('votes').notNull().default(0)
})

// ─── Relations ────────────────────────────────────────────────────────────────

export const electionsRelations = relations(elections, ({ one, many }) => ({
  presidentialResult: one(presidentialResults, { fields: [elections.id], references: [presidentialResults.electionId] }),
  presidentialCandidates: many(presidentialCandidates),
  congressionalResult: one(congressionalResults, { fields: [elections.id], references: [congressionalResults.electionId] }),
  congressionalCandidates: many(congressionalCandidates),
  parliamentaryResult: one(parliamentaryResults, { fields: [elections.id], references: [parliamentaryResults.electionId] }),
  parliamentaryPartyVotes: many(parliamentaryPartyVotes)
}))

export const presidentialResultsRelations = relations(presidentialResults, ({ one }) => ({
  election: one(elections, { fields: [presidentialResults.electionId], references: [elections.id] })
}))

export const presidentialCandidatesRelations = relations(presidentialCandidates, ({ one }) => ({
  election: one(elections, { fields: [presidentialCandidates.electionId], references: [elections.id] })
}))

export const congressionalResultsRelations = relations(congressionalResults, ({ one }) => ({
  election: one(elections, { fields: [congressionalResults.electionId], references: [elections.id] })
}))

export const congressionalCandidatesRelations = relations(congressionalCandidates, ({ one }) => ({
  election: one(elections, { fields: [congressionalCandidates.electionId], references: [elections.id] })
}))

export const parliamentaryResultsRelations = relations(parliamentaryResults, ({ one }) => ({
  election: one(elections, { fields: [parliamentaryResults.electionId], references: [elections.id] })
}))

export const parliamentaryPartyVotesRelations = relations(parliamentaryPartyVotes, ({ one }) => ({
  election: one(elections, { fields: [parliamentaryPartyVotes.electionId], references: [elections.id] })
}))
