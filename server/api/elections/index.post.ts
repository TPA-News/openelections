import { z } from 'zod'
import { db } from '../db'
import { elections } from '~~/server/db/schema'

const bodySchema = z.object({
  title: z.string().min(3),
  mode: z.enum(['presidential', 'congressional', 'parliamentary'])
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)

  try {
    const [election] = await db.insert(elections).values({
      name: body.title,
      type: body.mode
    }).$returningId()
    return election?.id
  } catch (error) {
   throw new H3Error("Error creating an election.", { cause: error }) 
  }
})
