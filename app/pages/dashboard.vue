<template>
  <UContainer class="my-6 space-y-6">
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

    <div class="flex flex-wrap gap-2">
      <UButton
        v-for="tab in tabs"
        :key="tab.value"
        :label="tab.label"
        size="sm"
        :variant="activeTab === tab.value ? 'solid' : 'ghost'"
        :color="activeTab === tab.value ? 'primary' : 'neutral'"
        @click="activeTab = tab.value"
      />
    </div>

    <UAlert
      v-if="error"
      color="error"
      icon="i-lucide-circle-alert"
      title="Failed to load dashboard"
      :description="String(error.statusMessage || error.message || 'Unknown error')"
    />

    <div
      v-else-if="pending"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <UCard
        v-for="n in 6"
        :key="n"
      >
        <div class="space-y-3 animate-pulse">
          <div class="h-4 bg-elevated rounded" />
          <div class="h-4 w-1/2 bg-elevated/70 rounded" />
          <div class="h-4 w-2/3 bg-elevated/50 rounded" />
        </div>
      </UCard>
    </div>

    <div
      v-else-if="!filteredElections.length"
      class="py-20 text-center"
    >
      <UIcon
        name="i-lucide-clipboard-list"
        class="w-10 h-10 mx-auto text-muted mb-3"
      />
      <p class="font-medium">
        No elections found
      </p>
      <p class="text-sm text-muted mt-1">
        Create an election to get started.
      </p>
    </div>

    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <NuxtLink
        v-for="election in filteredElections"
        :key="election.id"
        :to="`/election/${election.id}`"
        class="block"
      >
        <UCard variant="soft">
          <div class="space-y-3">
            <div class="flex items-start justify-between gap-2">
              <h2 class="font-semibold leading-snug line-clamp-2">
                {{ election.name }}
              </h2>
              <UBadge
                :label="statusLabel(election.status)"
                :color="statusColor(election.status)"
                variant="subtle"
                size="xs"
              />
            </div>

            <div class="text-sm text-muted capitalize">
              {{ election.type }}
            </div>

            <div class="flex items-center gap-4 text-sm text-muted">
              <span class="flex items-center gap-1">
                <UIcon
                  name="i-lucide-users"
                  class="w-4 h-4"
                />
                {{ election.candidateCount }} candidates
              </span>
              <span class="flex items-center gap-1">
                <UIcon
                  name="i-lucide-bar-chart-3"
                  class="w-4 h-4"
                />
                {{ formatVotes(election.totalVotes) }} total
              </span>
            </div>

            <p
              v-if="election.type === 'congressional'"
              class="text-xs text-muted"
            >
              {{ formatVotes(election.votesCounted) }} counted
            </p>

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
type ElectionStatus = 'open' | 'closed' | 'paused'

type ElectionListItem = {
  id: number
  name: string
  type: 'presidential' | 'congressional' | 'parliamentary'
  status: ElectionStatus
  totalVotes: number | null
  votesCounted: number
  candidateCount: number
  createdAt: string
}

const tabs = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Paused', value: 'paused' },
  { label: 'Closed', value: 'closed' }
] as const

const activeTab = ref<'all' | ElectionStatus>('all')

const { data: elections, pending, error, refresh } = await useFetch<ElectionListItem[]>('/api/elections')

const filteredElections = computed(() => {
  const list = elections.value ?? []
  if (activeTab.value === 'all') return list
  return list.filter(election => election.status === activeTab.value)
})

function onDialogClose(created: boolean) {
  if (created) refresh()
}

function statusColor(status: ElectionStatus): 'success' | 'warning' | 'neutral' {
  if (status === 'open') return 'success'
  if (status === 'paused') return 'warning'
  return 'neutral'
}

function statusLabel(status: ElectionStatus) {
  if (status === 'open') return 'Open'
  if (status === 'paused') return 'Paused'
  return 'Closed'
}

function formatVotes(value: number | null) {
  if (value === null) return 'Not set'
  return value.toLocaleString('en-US')
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
</script>
