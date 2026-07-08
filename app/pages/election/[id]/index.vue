<template>
  <UContainer class="my-6 space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-sm text-muted">
          Election #{{ route.params.id }}
        </p>
        <h1 class="text-2xl font-semibold">
          {{ election?.name || 'Election' }}
        </h1>
      </div>
      <UBadge
        v-if="election"
        :label="election.status"
        :color="statusColor(election.status)"
        variant="subtle"
      />
    </div>

    <div class="flex flex-wrap gap-2">
      <UButton
        icon="i-lucide-clipboard-check"
        label="New Return"
        color="primary"
        variant="soft"
        :to="`/election/${route.params.id}/return`"
      />
      <UButton
        v-if="election?.type === 'congressional' && election.canSetTotalVotes"
        icon="i-lucide-user-plus"
        label="Add Candidate"
        color="neutral"
        variant="soft"
        :to="`/election/${route.params.id}/candidate`"
      />
    </div>

    <UCard v-if="election" variant="subtle">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_auto] md:items-end">
        <UFormField
          label="Election Status"
          name="status"
        >
          <USelect
            v-model="statusForm"
            :items="statusItems"
          />
        </UFormField>

        <UButton
          label="Save Status"
          icon="i-lucide-save"
          :loading="updatingStatus"
          :disabled="statusForm === election.status"
          @click="updateStatus"
        />

        <UButton
          label="Delete Election"
          icon="i-lucide-trash-2"
          color="error"
          variant="soft"
          :loading="deletingElection"
          @click="deleteElection"
        />
      </div>
    </UCard>

    <UAlert
      v-if="error"
      color="error"
      icon="i-lucide-circle-alert"
      title="Failed to load election"
      :description="String(error.statusMessage || error.message || 'Unknown error')"
    />

    <div
      v-else-if="pending"
      class="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      <UCard
        v-for="n in 3"
        :key="n"
      >
        <div class="space-y-3 animate-pulse">
          <div class="h-4 bg-elevated rounded" />
          <div class="h-4 bg-elevated/70 rounded" />
          <div class="h-4 bg-elevated/50 rounded" />
        </div>
      </UCard>
    </div>

    <template v-else-if="election">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UCard>
          <p class="text-sm text-muted mb-1">
            Type
          </p>
          <p class="text-lg font-semibold capitalize">
            {{ election.type }}
          </p>
        </UCard>

        <UCard>
          <p class="text-sm text-muted mb-1">
            Total Votes
          </p>
          <p class="text-lg font-semibold">
            {{ election.totalVotes === null ? 'Not set' : formatNumber(election.totalVotes) }}
          </p>

          <div
            v-if="election.canSetTotalVotes"
            class="mt-3 space-y-2"
          >
            <UInput
              v-model.number="totalVotesForm"
              type="number"
              min="0"
              placeholder="Set once"
            />
            <UButton
              label="Set Total Votes"
              icon="i-lucide-check"
              :loading="settingTotalVotes"
              :disabled="!canSetTotalVotes"
              @click="setTotalVotes"
            />
          </div>

          <p
            v-else
            class="text-xs text-muted mt-2"
          >
            Total votes are locked.
          </p>
        </UCard>

        <UCard>
          <p class="text-sm text-muted mb-1">
            Votes Counted
          </p>
          <p class="text-lg font-semibold">
            {{ formatNumber(election.return?.votesCounted ?? 0) }}
          </p>
          <p class="text-xs text-muted mt-1">
            {{ election.return ? `Reported ${formatDate(election.return.reportedAt)}` : 'No return submitted yet' }}
          </p>
        </UCard>
      </div>

      <UCard v-if="election.type === 'congressional'">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold">
              Candidates
            </h2>
            <span class="text-sm text-muted">{{ election.candidates.length }} total</span>
          </div>
        </template>

        <div
          v-if="!election.candidates.length"
          class="text-sm text-muted"
        >
          No candidates added yet.
        </div>

        <div
          v-else
          class="space-y-5"
        >
          <section
            v-for="group in candidateGroups"
            :key="group.key"
            class="space-y-2"
          >
            <div class="flex items-center justify-between border-b border-default pb-1">
              <h3 class="text-sm font-semibold">
                {{ group.label }}
              </h3>
              <span class="text-xs text-muted">{{ group.items.length }} candidates</span>
            </div>

            <p
              v-if="!group.items.length"
              class="text-xs text-muted"
            >
              No candidates in this category yet.
            </p>

            <div
              v-for="candidate in group.items"
              :key="candidate.id"
              class="flex items-center justify-between rounded-lg border border-default p-3"
            >
              <div>
                <p class="font-medium">
                  {{ candidate.name }}
                </p>
                <p class="text-xs text-muted">
                  {{ formatCategoryName(candidate.categoryName) }} - {{ candidate.party }}
                </p>
              </div>

              <div class="flex items-center gap-2">
                <UBadge
                  :label="candidate.status"
                  :color="candidateStatusColor(candidate.status)"
                  variant="subtle"
                />

                <UButton
                  v-if="election.canSetTotalVotes"
                  icon="i-lucide-trash-2"
                  color="error"
                  variant="ghost"
                  :loading="deletingCandidateId === candidate.id"
                  @click="deleteCandidate(candidate.id, candidate.name)"
                />
              </div>
            </div>
          </section>
        </div>
      </UCard>
    </template>
  </UContainer>
</template>

<script setup lang="ts">
type ElectionStatus = 'open' | 'closed' | 'paused'
type CandidateStatus = 'in' | 'out' | 'undecided'

type ElectionDetail = {
  id: number
  name: string
  type: 'presidential' | 'congressional' | 'parliamentary'
  status: ElectionStatus
  totalVotes: number | null
  createdAt: string
  canSetTotalVotes: boolean
  categories: Array<{
    id: number
    name: string
  }>
  return: null | {
    id: number
    votesCounted: number
    reportedAt: string
  }
  candidates: Array<{
    id: number
    name: string
    party: string
    categoryId: number
    categoryName: string
    status: CandidateStatus
  }>
}

const route = useRoute()
const toast = useToast()

const { data: election, pending, error, refresh } = await useFetch<ElectionDetail>(
  `/api/elections/${route.params.id}`
)

const statusItems = [
  { label: 'Open', value: 'open' },
  { label: 'Paused', value: 'paused' },
  { label: 'Closed', value: 'closed' }
]

const statusForm = ref<ElectionStatus>('open')
const totalVotesForm = ref<number | null>(null)
const updatingStatus = ref(false)
const settingTotalVotes = ref(false)
const deletingElection = ref(false)
const deletingCandidateId = ref<number | null>(null)

watchEffect(() => {
  if (election.value) {
    statusForm.value = election.value.status
    totalVotesForm.value = election.value.totalVotes
  }
})

const canSetTotalVotes = computed(() => {
  if (!election.value?.canSetTotalVotes) return false
  if (totalVotesForm.value === null) return false
  return Number.isInteger(totalVotesForm.value) && totalVotesForm.value >= 0
})

const candidateGroups = computed(() => {
  const list = election.value?.candidates ?? []

  const groups = {
    senate: [] as typeof list,
    representative: [] as typeof list,
    other: [] as typeof list
  }

  for (const candidate of list) {
    const normalizedCategory = normalizeCategory(candidate.categoryName)
    groups[normalizedCategory].push(candidate)
  }

  const ordered = [
    { key: 'senate', label: 'Senate', items: groups.senate },
    { key: 'representative', label: 'Representative', items: groups.representative }
  ]

  if (groups.other.length) {
    ordered.push({ key: 'other', label: 'Other', items: groups.other })
  }

  return ordered
})

function statusColor(status: ElectionStatus): 'success' | 'neutral' | 'warning' {
  if (status === 'open') return 'success'
  if (status === 'paused') return 'warning'
  return 'neutral'
}

function candidateStatusColor(status: CandidateStatus): 'success' | 'error' | 'warning' {
  if (status === 'in') return 'success'
  if (status === 'out') return 'error'
  return 'warning'
}

function formatNumber(value: number) {
  return value.toLocaleString('en-US')
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function formatCategoryName(value: string) {
  const lowered = value.toLowerCase()
  if (lowered === 'senate') return 'Senate'
  if (lowered === 'representative') return 'Representative'
  return value
}

function normalizeCategory(value: string): 'senate' | 'representative' | 'other' {
  const lowered = value.toLowerCase()
  if (lowered === 'senate') return 'senate'
  if (lowered === 'representative') return 'representative'
  return 'other'
}

async function updateStatus() {
  if (!election.value) return

  updatingStatus.value = true
  try {
    await $fetch(`/api/elections/${route.params.id}/status`, {
      method: 'PATCH',
      body: { status: statusForm.value }
    })

    election.value.status = statusForm.value
    toast.add({
      title: 'Election status updated',
      color: 'success',
      icon: 'i-lucide-check'
    })
  } catch {
    toast.add({
      title: 'Failed to update status',
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    updatingStatus.value = false
  }
}

async function setTotalVotes() {
  if (!election.value || !canSetTotalVotes.value || totalVotesForm.value === null) return

  settingTotalVotes.value = true
  try {
    await $fetch(`/api/elections/${route.params.id}/total-votes`, {
      method: 'PATCH',
      body: { totalVotes: totalVotesForm.value }
    })

    election.value.totalVotes = totalVotesForm.value
    election.value.canSetTotalVotes = false

    toast.add({
      title: 'Total votes set',
      color: 'success',
      icon: 'i-lucide-check'
    })
  } catch {
    toast.add({
      title: 'Failed to set total votes',
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    settingTotalVotes.value = false
  }
}

async function deleteElection() {
  if (!election.value) return

  const confirmed = window.confirm(
    `Delete election \"${election.value.name}\"? This cannot be undone.`
  )

  if (!confirmed) return

  deletingElection.value = true
  try {
    await $fetch(`/api/elections/${route.params.id}`, {
      method: 'DELETE'
    })

    toast.add({
      title: 'Election deleted',
      color: 'success',
      icon: 'i-lucide-trash-2'
    })

    await navigateTo('/dashboard')
  } catch {
    toast.add({
      title: 'Failed to delete election',
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    deletingElection.value = false
  }
}

async function deleteCandidate(candidateId: number, candidateName: string) {
  if (!election.value) return

  const confirmed = window.confirm(
    `Delete candidate \"${candidateName}\"?`
  )

  if (!confirmed) return

  deletingCandidateId.value = candidateId
  try {
    await $fetch(`/api/elections/${route.params.id}/candidates/${candidateId}`, {
      method: 'DELETE'
    })

    toast.add({
      title: 'Candidate deleted',
      color: 'success',
      icon: 'i-lucide-trash-2'
    })

    await refresh()
  } catch {
    toast.add({
      title: 'Failed to delete candidate',
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    deletingCandidateId.value = null
  }
}
</script>
