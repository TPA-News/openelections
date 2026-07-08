export default defineOAuthDiscordEventHandler({
  config: {
    scope: ['identify']
  },
  async onSuccess(event, { user }) {
    await setUserSession(event, {
      user: {
        discordId: String(user.id),
        username: user.global_name || user.username || `discord-${user.id}`,
        avatar: user.avatar
      },
      loggedInAt: new Date().toISOString()
    })

    return sendRedirect(event, '/dashboard')
  },
  onError(event) {
    return sendRedirect(event, '/?auth=failed')
  }
})
