import { eq } from 'drizzle-orm'
import { db } from '~~/server/api/db'
import { user } from '~~/server/db/schema'

type ExistingAccount = {
  discordId: string
  role: 'admin' | 'pollbody' | 'viewer'
}

type WritableRole = 'admin' | 'pollbody'

export async function requireExistingAccount(event: Parameters<typeof requireUserSession>[0]): Promise<ExistingAccount> {
  const session = await requireUserSession(event)
  const discordId = String(session.user?.discordId ?? '').trim()

  if (!discordId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Discord login is required'
    })
  }

  const accountRows = await db
    .select()
    .from(user)
    .where(eq(user.discordId, discordId))
    .limit(1)

  const account = accountRows[0]

  if (!account) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Existing account required'
    })
  }

  return account
}

export function assertElectionWritableByCreator(election: { createdByDiscordId: string | null }, _accountDiscordId: string) {
  if (!election.createdByDiscordId) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Election is read-only until the creator links an account'
    })
  }
}

export function assertCanMutateElections(account: ExistingAccount) {
  if (account.role === 'viewer') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Viewer accounts cannot modify elections'
    })
  }
}

export function assertHasRole(account: ExistingAccount, allowedRoles: WritableRole[]) {
  if (!allowedRoles.includes(account.role as WritableRole)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Insufficient role for this action'
    })
  }
}
