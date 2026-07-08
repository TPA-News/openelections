<template>
  <UContainer class="my-6 max-w-2xl space-y-5">
    <div class="space-y-1">
      <p class="text-sm text-muted">
        Election #{{ route.params.id }}
      </p>
      <h1 class="text-2xl font-semibold">
        Add Candidate
      </h1>
    </div>

    <UCard>
      <UForm
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
            @click="navigateTo(`/election/${route.params.id}`)"
          />
          <UButton
            type="submit"
            :loading="submitting"
            label="Add Candidate"
            icon="i-lucide-plus"
          />
        </div>
      </UForm>
    </UCard>
  </UContainer>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const route = useRoute()
const toast = useToast()
const submitting = ref(false)

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  party: z.string().trim().min(2, 'Use a 2-3 letter party code').max(3, 'Use a 2-3 letter party code'),
  category: z.enum(['senate', 'representative'])
})

type Schema = z.output<typeof schema>

const categoryItems = [
  { label: 'Senate', value: 'senate' },
  { label: 'Representative', value: 'representative' }
]

const state = reactive<Partial<Schema>>({
  name: '',
  party: 'IND',
  category: undefined
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
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
</script>
