<template>
  <UContainer class="my-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-medium">
          Dashboard
        </h1>
        <p class="text-sm text-muted">
          See all current and past elections.
        </p>
      </div>
      <DashboardCreateDialog @close="onDialogClose" />
    </div>

    <!-- Filter tabs -->
    <div class="flex gap-2">
      <UButton
        v-for="tab in tabs"
        :key="tab.value"
        :variant="activeTab === tab.value ? 'solid' : 'ghost'"
        :color="activeTab === tab.value ? 'primary' : 'neutral'"
        size="sm"
        :label="tab.label"
        @click="activeTab = tab.value"
      />
    </div>

    <!-- Loading skeletons -->
    <div
      v-if="pending"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <UCard
        v-for="n in 3"
        :key="n"
      >
        <div class="space-y-3 animate-pulse">
          <div class="h-4 bg-elevated-2/3" />
          <div class="h-3 bg-elevated rounded w-1/3" />
          <div class="h-3 bg-elevated-1/2" />
        </div>
      </UCard>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!filteredElections.length"
      class="flex flex-col items-center justify-center py-24 text-center"
    >
      <UIcon
        name="i-lucide-clipboard-list"
        class="w-10 h-10 text-muted mb-3"
      />
      <p class="font-medium">
        No elections found
      </p>
      <p class="text-sm text-muted mt-1">
        {{ activeTab === 'all' ? 'Create your first election to get started.' : `No ${activeTab} elections.` }}
      </p>
    </div>

    <!-- Election grid -->
    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <NuxtLink
        v-for="election in filteredElections"
        :key="election.id"
        :to="`/election/${election.id}`"
        class="group block"
      >
        <UCard variant="soft">
          <div class="flex-1 p-2 space-y-3">
            <!-- Title + status -->
            <div class="flex items-start justify-between gap-2">
              <h2 class="font-semibold leading-snug line-clamp-2">
                {{ election.title }}
              </h2>
              <UBadge
                :color="election.status === 'ongoing' ? 'success' : 'neutral'"
                variant="subtle"
                size="xs"
                :label="election.status === 'ongoing' ? 'Ongoing' : 'Closed'"
                class="shrink-0"
              />
            </div>

            <!-- Mode badge -->
            <UBadge
              :color="modeColor(election.mode)"
              variant="soft"
              size="xs"
              :label="modeLabel(election.mode)"
            />

            <!-- Stats -->
            <div class="flex items-center gap-4 text-sm text-muted">
              <span class="flex items-center gap-1">
                <UIcon
                  name="i-lucide-users"
                  class="w-4 h-4"
                />
                {{ election.candidateCount ?? 0 }}
                {{ election.mode === 'parliamentary' ? 'parties' : 'candidates' }}
              </span>
              <span class="flex items-center gap-1">
                <UIcon
                  name="i-lucide-bar-chart-2"
                  class="w-4 h-4"
                />
                {{ formatVotes(election.totalVotes) }} votes
              </span>
            </div>

            <!-- Congressional votes counted -->
            <div
              v-if="election.mode === 'congressional' && election.votesCounted !== undefined"
              class="text-xs text-muted"
            >
              {{ formatVotes(election.votesCounted) }} of {{ formatVotes(election.totalVotes) }} counted
            </div>

            <p class="text-xs text-muted">
              Created {{ formatDate(election.createdAt) }}
            </p>
          </div>
        </UCard>
      </NuxtLink>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
type Mode = 'presidential' | 'congressional' | 'parliamentary'

const activeTab = ref<'all' | 'ongoing' | 'closed'>('all')

const tabs = [
  { label: 'All', value: 'all' },
  { label: 'Ongoing', value: 'ongoing' },
  { label: 'Closed', value: 'closed' }
] as const

const { data: elections, pending, refresh } = await useFetch('/api/elections')

const filteredElections = computed(() => {
  const list = elections.value ?? []
  if (activeTab.value === 'all') return list
  return list.filter(e => e.status === activeTab.value)
})

function onDialogClose(created: boolean) {
  if (created) refresh()
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function modeLabel(mode: Mode) {
  const map: Record<Mode, string> = {
    presidential: 'Presidential',
    congressional: 'Congressional',
    parliamentary: 'Parliamentary'
  }
  return map[mode]
}

function modeColor(mode: Mode): 'info' | 'warning' | 'success' {
  const map: Record<Mode, 'info' | 'warning' | 'success'> = {
    presidential: 'info',
    congressional: 'warning',
    parliamentary: 'success'
  }
  return map[mode]
}

function formatVotes(n?: number) {
  if (!n) return '0'
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>
