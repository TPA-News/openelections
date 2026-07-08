<template>
  <UContainer class="my-6 max-w-3xl space-y-5">
    <div class="space-y-1">
      <p class="text-sm text-muted">
        Election #{{ route.params.id }}
      </p>
      <h1 class="text-2xl font-semibold">
        {{ mode === 'bulk' ? 'Bulk Add Candidates' : 'Add Candidate' }}
      </h1>
      <p class="text-sm text-muted">
        {{ mode === 'bulk' ? 'Paste a candidate on each line and submit them together.' : 'Create a single candidate record.' }}
      </p>
    </div>

    <UCard>
      <div class="mb-4 flex flex-wrap gap-2">
        <UButton
          label="Single Entry"
          color="neutral"
          :variant="mode === 'single' ? 'solid' : 'soft'"
          icon="i-lucide-user-plus"
          :disabled="Boolean(election && !election.canEdit)"
          @click="setMode('single')"
        />
        <UButton
          label="Bulk Entry"
          color="neutral"
          :variant="mode === 'bulk' ? 'solid' : 'soft'"
          icon="i-lucide-list-plus"
          :disabled="Boolean(election && !election.canEdit)"
          @click="setMode('bulk')"
        />
      </div>

      <UAlert
        v-if="election && !election.canEdit"
        color="warning"
        variant="subtle"
        icon="i-lucide-lock"
        title="Read-only election"
        description="Your account role does not allow adding candidates."
        class="mb-4"
      />

      <UForm
        v-if="mode === 'single'"
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Name"
          name="name"
          required
        >
          <UInput
            v-model="state.name"
            placeholder="Candidate name"
          />
        </UFormField>

        <UFormField
          label="Party"
          name="party"
          required
        >
          <UInput
            v-model="state.party"
            maxlength="3"
            placeholder="e.g. IND"
          />
        </UFormField>

        <UFormField
          label="Category"
          name="category"
          required
        >
          <USelect
            v-model="state.category"
            :items="categoryItems"
            placeholder="Select chamber"
          />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton
            label="Back"
            color="neutral"
            variant="ghost"
            :to="`/election/${route.params.id}`"
          />
          <UButton
            type="submit"
            :loading="submitting"
            :disabled="Boolean(election && !election.canEdit)"
            label="Add Candidate"
            icon="i-lucide-plus"
          />
        </div>
      </UForm>

      <div
        v-else
        class="space-y-4"
      >
        <UAlert
          color="info"
          variant="subtle"
          icon="i-lucide-info"
          title="Bulk entry format"
          description="Use one candidate per line in the form: Name | Party | Category. Tabs and commas are also accepted. Example: Jane Doe | IND | Senate"
        />

        <div class="space-y-2">
          <label class="text-sm font-medium">
            Candidates
          </label>
          <UTextarea
            v-model="bulkText"
            :rows="12"
            placeholder="Jane Doe | IND | Senate"
          />
          <p class="text-xs text-muted">
            Blank lines and lines starting with # are ignored.
          </p>
        </div>

        <UAlert
          v-if="bulkPreview.errors.length"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          title="Fix these lines before submitting"
        >
          <ul class="list-disc space-y-1 pl-5">
            <li
              v-for="error in bulkPreview.errors"
              :key="`${error.lineNumber}-${error.message}`"
            >
              Line {{ error.lineNumber }}: {{ error.message }}
            </li>
          </ul>
        </UAlert>

        <UCard
          v-if="bulkPreview.candidates.length"
          variant="subtle"
        >
          <div class="flex items-center justify-between gap-3">
            <p class="font-medium">
              Preview
            </p>
            <span class="text-sm text-muted">
              {{ bulkPreview.candidates.length }} ready
            </span>
          </div>

          <div class="mt-3 space-y-2">
            <div
              v-for="(candidate, index) in bulkPreview.candidates.slice(0, 5)"
              :key="`${candidate.name}-${candidate.party}-${candidate.category}-${index}`"
              class="flex items-center justify-between rounded-lg border border-default px-3 py-2"
            >
              <div>
                <p class="font-medium">
                  {{ candidate.name }}
                </p>
                <p class="text-xs text-muted">
                  {{ formatCategoryName(candidate.category) }} - {{ candidate.party }}
                </p>
              </div>
            </div>

            <p
              v-if="bulkPreview.candidates.length > 5"
              class="text-xs text-muted"
            >
              And {{ bulkPreview.candidates.length - 5 }} more.
            </p>
          </div>
        </UCard>

        <div class="flex justify-end gap-2 pt-2">
          <UButton
            label="Back"
            color="neutral"
            variant="ghost"
            :to="`/election/${route.params.id}`"
          />
          <UButton
            type="button"
            :loading="bulkSubmitting"
            :disabled="Boolean(election && !election.canEdit) || !canSubmitBulk"
            :label="`Add ${bulkPreview.candidates.length} Candidates`"
            icon="i-lucide-list-plus"
            @click="onBulkSubmit"
          />
        </div>
      </div>
    </UCard>
  </UContainer>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

type EntryMode = 'single' | 'bulk'

const route = useRoute()
const toast = useToast()
const submitting = ref(false)
const bulkSubmitting = ref(false)
const mode = ref<EntryMode>(route.query.mode === 'bulk' ? 'bulk' : 'single')
const bulkText = ref('')
const { data: election } = await useFetch<{ canEdit: boolean }>(`/api/elections/${route.params.id}`)

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  party: z.string().trim().min(2, 'Use a 2-3 letter party code').max(3, 'Use a 2-3 letter party code'),
  category: z.enum(['senate', 'representative'])
})

type Schema = z.output<typeof schema>
type BulkCandidate = Schema

const categoryItems = [
  { label: 'Senate', value: 'senate' },
  { label: 'Representative', value: 'representative' }
]

const state = reactive<Partial<Schema>>({
  name: '',
  party: 'IND',
  category: 'senate'
})

const bulkPreview = computed(() => parseBulkCandidates(bulkText.value))

const canSubmitBulk = computed(() => bulkPreview.value.candidates.length > 0 && bulkPreview.value.errors.length === 0)

function formatCategoryName(value: Schema['category']) {
  if (value === 'senate') return 'Senate'
  return 'Representative'
}

function parseCategory(value: string): Schema['category'] | null {
  const lowered = value.trim().toLowerCase()
  if (lowered === 'senate' || lowered === 'sen' || lowered === 's') return 'senate'
  if (lowered === 'representative' || lowered === 'rep' || lowered === 'r') return 'representative'
  return null
}

function splitBulkLine(line: string) {
  if (line.includes('|')) return line.split(/\s*\|\s*/)
  if (line.includes('\t')) return line.split(/\t+/).map(part => part.trim())
  return line.split(/\s*,\s*/)
}

function setMode(nextMode: EntryMode) {
  mode.value = nextMode
}

function parseBulkCandidates(text: string): { candidates: BulkCandidate[]; errors: Array<{ lineNumber: number; message: string }> } {
  const candidates: BulkCandidate[] = []
  const errors: Array<{ lineNumber: number; message: string }> = []

  text.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) return

    const parts = splitBulkLine(trimmed).map(part => part.trim())

    if (parts.length !== 3) {
      errors.push({
        lineNumber: index + 1,
        message: 'Use Name | Party | Category'
      })
      return
    }

    const [name, party, categoryValue] = parts as [string, string, string]
    const category = parseCategory(categoryValue)

    if (!category) {
      errors.push({
        lineNumber: index + 1,
        message: 'Category must be Senate or Representative'
      })
      return
    }

    const candidate = schema.safeParse({
      name: name.trim(),
      party: party.trim(),
      category
    })

    if (!candidate.success) {
      errors.push({
        lineNumber: index + 1,
        message: candidate.error.issues[0]?.message ?? 'Invalid candidate'
      })
      return
    }

    candidates.push(candidate.data)
  })

  return { candidates, errors }
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (election.value && !election.value.canEdit) {
    toast.add({
      title: 'Read-only election',
      description: 'Your account role does not allow adding candidates.',
      color: 'warning',
      icon: 'i-lucide-circle-alert'
    })
    return
  }

  submitting.value = true
  try {
    await $fetch(`/api/elections/${route.params.id}/candidates`, {
      method: 'POST',
      body: event.data
    })

    toast.add({
      title: 'Candidate added',
      color: 'success',
      icon: 'i-lucide-check'
    })

    await navigateTo(`/election/${route.params.id}`)
  } catch {
    toast.add({
      title: 'Failed to add candidate',
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    submitting.value = false
  }
}

async function onBulkSubmit() {
  if (election.value && !election.value.canEdit) {
    toast.add({
      title: 'Read-only election',
      description: 'Your account role does not allow adding candidates.',
      color: 'warning',
      icon: 'i-lucide-circle-alert'
    })
    return
  }

  if (!canSubmitBulk.value) {
    toast.add({
      title: 'Fix the bulk list first',
      description: 'Each line must contain Name | Party | Category.',
      color: 'warning',
      icon: 'i-lucide-circle-alert'
    })
    return
  }

  bulkSubmitting.value = true
  try {
    const result = await $fetch<{ created: number }>(`/api/elections/${route.params.id}/candidates/bulk`, {
      method: 'POST',
      body: { candidates: bulkPreview.value.candidates }
    })

    toast.add({
      title: `${result.created} candidates added`,
      color: 'success',
      icon: 'i-lucide-check'
    })

    await navigateTo(`/election/${route.params.id}`)
  } catch {
    toast.add({
      title: 'Failed to add candidates',
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    bulkSubmitting.value = false
  }
}
</script>
