export default defineNuxtRouteMiddleware(async (to) => {
  const isProtected = to.path.startsWith('/dashboard') || to.path.startsWith('/election')
  if (!isProtected) return

  const { fetch, loggedIn } = useUserSession()

  await fetch()

  if (!loggedIn.value) {
    return navigateTo('/auth/discord', { external: true })
  }

  try {
    if (import.meta.server) {
      const requestFetch = useRequestFetch()
      await requestFetch('/api/account/me')
    } else {
      await $fetch('/api/account/me')
    }
  } catch (error) {
    const statusCode = Number((error as { statusCode?: number })?.statusCode ?? 500)

    if (statusCode === 401) {
      return navigateTo('/auth/discord', { external: true })
    }

    if (statusCode === 403) {
      return navigateTo('/?account=required')
    }

    throw error
  }
})
