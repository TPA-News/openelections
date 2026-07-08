<template>
  <UContainer class="my-6 max-w-2xl space-y-5">
    <div class="space-y-1">
      <p class="text-sm text-muted">
        Election #{{ route.params.id }}
      </p>
      <h1 class="text-2xl font-semibold">
        Submit Election Return
      </h1>
    </div>

    <UCard>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UAlert
          v-if="election && !election.canEdit"
          color="warning"
          variant="subtle"
          icon="i-lucide-lock"
          title="Read-only election"
          description="Your account role does not allow submitting returns."
        />

        <UAlert
          v-else-if="election?.canSetTotalVotes"
          color="warning"
          variant="subtle"
          icon="i-lucide-circle-alert"
          description="Set total votes from the election overview before submitting returns."
        />

        <UAlert
          v-else-if="election"
          color="neutral"
          variant="subtle"
          icon="i-lucide-lock"
          :description="`Total votes locked at ${formatNumber(election.totalVotes ?? 0)}.`"
        />

        <UFormField
          label="Votes Counted"
          name="votesCounted"
          required
        >
          <UInput
            v-model.number="state.votesCounted"
            type="number"
            :min="minimumVotesCounted"
            placeholder="0"
            :disabled="!election?.canEdit"
          />
          <p class="text-xs text-muted mt-1">
            Minimum allowed is {{ formatNumber(minimumVotesCounted) }} (latest reported count).
          </p>
        </UFormField>

        <UCard
          v-if="election?.type === 'congressional'"
          variant="subtle"
        >
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="font-medium">
                Candidate Statuses For This Return
              </h2>
              <span class="text-xs text-muted">{{ election.candidates.length }} candidates</span>
            </div>
          </template>

          <div
            v-if="!election.candidates.length"
            class="text-sm text-muted"
          >
            No candidates available to report.
          </div>

          <UTabs
            v-else
            v-model="candidateTab"
            :items="candidateTabItems"
          >
            <template #senate>
              <div
                v-if="!senateCandidates.length"
                class="text-sm text-muted"
              >
                No Senate candidates available.
              </div>

              <div
                v-else
                class="space-y-3"
              >
                <div
                  v-for="candidate in senateCandidates"
                  :key="candidate.id"
                  class="grid grid-cols-1 gap-2 md:grid-cols-[1fr_200px] md:items-center"
                >
                  <div>
                    <p class="font-medium">
                      {{ candidate.name }}
                    </p>
                    <p class="text-xs text-muted">
                      {{ candidate.categoryName }} - {{ candidate.party }}
                    </p>
                  </div>
                  <USelect
                    v-model="candidateStatuses[candidate.id]"
                    :items="statusItems"
                    :disabled="!election?.canEdit"
                  />
                </div>
              </div>
            </template>

            <template #representative>
              <div
                v-if="!representativeCandidates.length"
                class="text-sm text-muted"
              >
                No Representative candidates available.
              </div>

              <div
                v-else
                class="space-y-3"
              >
                <div
                  v-for="candidate in representativeCandidates"
                  :key="candidate.id"
                  class="grid grid-cols-1 gap-2 md:grid-cols-[1fr_200px] md:items-center"
                >
                  <div>
                    <p class="font-medium">
                      {{ candidate.name }}
                    </p>
                    <p class="text-xs text-muted">
                      {{ candidate.categoryName }} - {{ candidate.party }}
                    </p>
                  </div>
                  <USelect
                    v-model="candidateStatuses[candidate.id]"
                    :items="statusItems"
                    :disabled="!election?.canEdit"
                  />
                </div>
              </div>
            </template>
          </UTabs>
        </UCard>

        <div class="flex justify-end gap-2 pt-2">
          <UButton
            label="Back"
            color="neutral"
            variant="ghost"
            :to="`/election/${route.params.id}`"
          />
          <UButton
            v-if="election?.canEdit"
            type="submit"
            :loading="submitting"
            :disabled="Boolean(election?.canSetTotalVotes)"
            label="Submit Return"
            icon="i-lucide-clipboard-check"
          />
        </div>
      </UForm>
    </UCard>
  </UContainer>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

type CandidateStatus = 'in' | 'out' | 'undecided'

type ElectionDetail = {
  type: 'presidential' | 'congressional' | 'parliamentary'
  totalVotes: number | null
  canEdit: boolean
  canSetTotalVotes: boolean
  return: null | {
    votesCounted: number
    candidateStatuses: Array<{
      candidateId: number
      status: CandidateStatus
    }>
  }
  candidates: Array<{
    id: number
    name: string
    party: string
    categoryName: string
  }>
}

const route = useRoute()
const toast = useToast()
const submitting = ref(false)

const { data: election } = await useFetch<ElectionDetail>(`/api/elections/${route.params.id}`)

const schema = z.object({
  votesCounted: z.number().int().min(0, 'Votes counted must be 0 or higher')
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  votesCounted: undefined
})

const minimumVotesCounted = computed(() => election.value?.return?.votesCounted ?? 0)

const candidateTab = ref<'senate' | 'representative'>('senate')

const statusItems = [
  { label: 'In', value: 'in' },
  { label: 'Out', value: 'out' },
  { label: 'Undecided', value: 'undecided' }
]

const candidateTabItems = [
  { label: 'Senate', value: 'senate', slot: 'senate' },
  { label: 'Representative', value: 'representative', slot: 'representative' }
]

const senateCandidates = computed(() => {
  return (election.value?.candidates ?? []).filter(candidate => normalizeCategory(candidate.categoryName) === 'senate')
})

const representativeCandidates = computed(() => {
  return (election.value?.candidates ?? []).filter(candidate => normalizeCategory(candidate.categoryName) === 'representative')
})

const latestStatusByCandidateId = computed(() => {
  const rows = election.value?.return?.candidateStatuses ?? []
  return Object.fromEntries(rows.map((row) => [row.candidateId, row.status])) as Record<number, CandidateStatus>
})

const candidateStatuses = reactive<Record<number, CandidateStatus>>({})

watchEffect(() => {
  const list = election.value?.candidates ?? []
  for (const candidate of list) {
    if (!candidateStatuses[candidate.id]) {
      candidateStatuses[candidate.id] = latestStatusByCandidateId.value[candidate.id] ?? 'undecided'
    }
  }

  if (state.votesCounted === undefined || state.votesCounted === null) {
    state.votesCounted = minimumVotesCounted.value
  }
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (election.value?.canSetTotalVotes) {
    toast.add({
      title: 'Set total votes first',
      description: 'Set total votes from the election overview before creating a return.',
      color: 'warning',
      icon: 'i-lucide-circle-alert'
    })
    return
  }

  if (election.value && !election.value.canEdit) {
    toast.add({
      title: 'Read-only election',
      description: 'Only the linked election creator account can submit returns.',
      color: 'warning',
      icon: 'i-lucide-circle-alert'
    })
    return
  }

  if (event.data.votesCounted < minimumVotesCounted.value) {
    toast.add({
      title: 'Votes counted too low',
      description: `Votes counted cannot be lower than ${formatNumber(minimumVotesCounted.value)}.`,
      color: 'warning',
      icon: 'i-lucide-circle-alert'
    })
    return
  }

  submitting.value = true
  try {
    const statuses = (election.value?.type === 'congressional'
      ? (election.value?.candidates ?? []).map(candidate => ({
        candidateId: candidate.id,
        status: candidateStatuses[candidate.id] ?? 'undecided'
      }))
      : [])

    await $fetch(`/api/elections/${route.params.id}/returns`, {
      method: 'POST',
      body: {
        ...event.data,
        candidateStatuses: statuses
      }
    })

    toast.add({
      title: 'Election return submitted',
      color: 'success',
      icon: 'i-lucide-check'
    })

    await navigateTo(`/election/${route.params.id}`)
  } catch {
    toast.add({
      title: 'Failed to submit return',
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    submitting.value = false
  }
}

function formatNumber(value: number) {
  return value.toLocaleString('en-US')
}

function normalizeCategory(value: string): 'senate' | 'representative' | 'other' {
  const normalized = value.trim().toLowerCase()

  if (normalized === 'senate') return 'senate'
  if (normalized === 'representative') return 'representative'

  return 'other'
}
</script>
