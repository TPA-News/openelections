import { z } from 'zod'
import { db, schema } from '@nuxthub/db'

const bodySchema = z.object({
  title: z.string().min(3),
  mode: z.enum(['presidential', 'congressional', 'parliamentary'])
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)

  console.log(body)

  const [election] = await db
    .insert(schema.elections)
    .values({
      title: body.title,
      mode: body.mode,
      status: 'ongoing'
    })
    .$returningId()

  if (!election) {
    throw createError({
      statusCode: 500,
      message: 'Failed to create election.'
    })
  }

  // Seed the matching results row so totals exist from the start
  if (body.mode === 'presidential') {
    await db.insert(schema.presidentialResults).values({
      electionId: election.id,
      totalVotes: 0
    })
  } else if (body.mode === 'congressional') {
    await db.insert(schema.congressionalResults).values({
      electionId: election.id,
      totalVotes: 0,
      votesCounted: 0
    })
  } else if (body.mode === 'parliamentary') {
    await db.insert(schema.parliamentaryResults).values({
      electionId: election.id,
      totalVotes: 0
    })
  }

  return { id: election.id }
})
