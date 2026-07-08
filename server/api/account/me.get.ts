import { requireExistingAccount } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const account = await requireExistingAccount(event)
  const session = await getUserSession(event)

  return {
    account,
    user: {
      discordId: account.discordId,
      username: String(session.user?.username ?? ''),
      avatar: String(session.user?.avatar ?? '') || null
    }
  }
})
