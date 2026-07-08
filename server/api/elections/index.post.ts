import { z } from 'zod'
import { db } from '../db'
import { elections } from '~~/server/db/schema'
import { assertCanMutateElections, requireExistingAccount } from '~~/server/utils/auth'

const bodySchema = z.object({
  title: z.string().min(3),
  mode: z.enum(['presidential', 'congressional', 'parliamentary'])
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const account = await requireExistingAccount(event)
  assertCanMutateElections(account)

  try {
    const [election] = await db.insert(elections).values({
      name: body.title,
      type: body.mode,
      createdByDiscordId: account.discordId
    }).$returningId()
    return election?.id
  } catch (error) {
   throw new H3Error("Error creating an election.", { cause: error }) 
  }
})
