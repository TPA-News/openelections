<script setup>
const { loggedIn, user, clear } = useUserSession()

async function logout() {
  await clear()
  await navigateTo('/')
}

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})
</script>

<template>
  <UApp>
    <UHeader>
      <template #left>
        <NuxtLink to="/">
          <AppLogo class="w-auto h-6 shrink-0" />
        </NuxtLink>
      </template>

      <template #right>
        <template v-if="loggedIn">
          <span class="text-sm text-muted hidden md:inline">{{ user?.username || 'Signed in' }}</span>
          <UButton
            label="Logout"
            color="neutral"
            variant="ghost"
            @click="logout"
          />
        </template>

        <UButton
          v-else
          label="Login with Discord"
          color="primary"
          variant="soft"
          href="/auth/discord"
          target="_blank"
          icon="i-simple-icons-discord"
        />

        <UColorModeButton />
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <USeparator icon="i-lucide-chart-bar-big" />

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          © {{ new Date().getFullYear() }} Raz-TPA News LLC - All rights, reserved.
        </p>
      </template>

      <template #right>
        <UButton
          to="https://raz.tpa.lol"
          target="_blank"
          icon="i-lucide-globe"
          aria-label="Website"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UFooter>
  </UApp>
</template>
