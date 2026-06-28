<template>
  <UModal
    title="Create Election"
    description="Create a new election."
  >
    <UButton
      label="Create"
      icon="i-lucide-plus"
      color="success"
      variant="solid"
      size="xl"
    />

    <template #body>
      <!-- Form -->
      <UForm
        id="create-election-form"
        :schema="schema"
        :state="form"
        class="space-y-5"
        @submit="onSubmit"
      >
        <UFormField
          label="Title"
          name="title"
          required
        >
          <UInput
            v-model="form.title"
            placeholder="e.g. 2025 Presidential Election"
            autofocus
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Election Mode"
          name="mode"
          required
        >
          <div class="grid grid-cols-3 gap-2 mt-1">
            <button
              v-for="option in modeOptions"
              :key="option.value"
              type="button"
              :class="[
                'flex flex-col items-center gap-1.5 rounded-lg border-2 px-3 py-3 text-center transition-colors',
                form.mode === option.value
                  ? option.activeClass
                  : 'border-default(text-muted:border-(--ui-border-accented)'
              ]"
              @click="form.mode = option.value"
            >
              <UIcon
                :name="option.icon"
                class="w-5 h-5"
              />
              <span class="text-xs font-medium leading-tight">{{ option.label }}</span>
            </button>
          </div>
        </UFormField>

        <!-- Mode hint -->
        <UAlert
          v-if="selectedMode"
          :icon="selectedMode.icon"
          :color="selectedMode.alertColor"
          variant="subtle"
          :description="selectedMode.hint"
        />

        <!-- Footer -->
        <div class="flex justify-end gap-2 w-full">
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            @click="emit('close', false)"
          />
          <UButton
            type="submit"
            form="create-election-form"
            label="Create Election"
            :loading="submitting"
            icon="i-heroicons-plus"
          />
        </div>
      </uform>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const emit = defineEmits<{ close: [boolean] }>()

// ── Form ──────────────────────────────────────────────────────────────────────

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  mode: z.enum(['presidential', 'congressional', 'parliamentary'])
})

type Schema = z.output<typeof schema>

const form = reactive<Partial<Schema>>({ title: '', mode: undefined })
const submitting = ref(false)

// ── Mode options ──────────────────────────────────────────────────────────────

const modeOptions = [
  {
    value: 'presidential' as const,
    label: 'Presidential',
    icon: 'i-lucide-landmark',
    activeClass:
      'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950',
    alertColor: 'info' as const,
    hint: 'Tracks running mate tickets (President / Vice President), party affiliation, and vote totals.'
  },
  {
    value: 'congressional' as const,
    label: 'Congressional',
    icon: 'i-lucide-users',
    activeClass:
      'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950',
    alertColor: 'warning' as const,
    hint: 'Tracks individual candidates with the classic In or Out status and votes counted vs total.'
  },
  {
    value: 'parliamentary' as const,
    label: 'Parliamentary',
    icon: 'i-lucide-chart-pie',
    activeClass:
      'border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950',
    alertColor: 'success' as const,
    hint: 'Tracks votes by party. Supports independent candidates without party affiliation.'
  }
]

const selectedMode = computed(() =>
  modeOptions.find(o => o.value === form.mode)
)

// ── Submit ────────────────────────────────────────────────────────────────────

const toast = useToast()

async function onSubmit(event: FormSubmitEvent<Schema>) {
  submitting.value = true
  try {
    await $fetch('/api/elections', {
      method: 'POST',
      body: event.data
    })
    toast.add({
      title: 'Election created',
      color: 'success',
      icon: 'i-lucide-circle-check'
    })
    Object.assign(form, { title: '', mode: undefined })
  } catch {
    toast.add({
      title: 'Failed to create election',
      color: 'error',
      icon: 'i-heroicons-x-circle'
    })
  } finally {
    submitting.value = false
    emit('close', true)
  }
}
</script>
