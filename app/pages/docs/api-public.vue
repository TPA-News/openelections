<script setup lang="ts">
const toast = useToast()

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.add({ title: 'Copied', description: 'Copied to clipboard', color: 'success' })
  } catch (err) {
    toast.add({ title: 'Copy failed', description: String(err), color: 'error' })
  }
}

const curlListElections = 'curl -sS https://web.openelections.tpa.lol/api/elections'
const curlGetElection = 'curl -sS https://web.openelections.tpa.lol/api/elections/42'
const curlListReturns = 'curl -sS "https://web.openelections.tpa.lol/api/elections/42/returns?limit=10"'
const curlGetReturn = 'curl -sS https://web.openelections.tpa.lol/api/elections/42/returns/7'

const exampleListElections = `[
  {
    "id": 42,
    "name": "Mayoral Election",
    "type": "congressional",
    "status": "open",
    "totalVotes": null,
    "votesCounted": 1200,
    "candidateCount": 6,
    "createdAt": "2026-07-01T12:34:56.000Z"
  }
]`

const exampleGetElection = `{
  "id": 42,
  "name": "Mayoral Election",
  "type": "congressional",
  "status": "open",
  "totalVotes": null,
  "createdByDiscordId": null,
  "isReadOnly": true,
  "canEdit": false,
  "canClaim": true,
  "createdAt": "2026-07-01T12:34:56.000Z",
  "return": null,
  "categories": [],
  "candidates": []
}`

const exampleListReturns = `{
  "electionId": 42,
  "count": 2,
  "returns": [ { "id": 8, "votesCounted": 1500 }, { "id": 7, "votesCounted": 1200 } ]
}`

const exampleGetReturn = `{
  "electionId": 42,
  "return": { "id": 7, "votesCounted": 1200, "candidateStatuses": [] }
}`
</script>

<template>
  <UContainer class="my-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold">Public API Reference</h1>
        <p class="text-sm text-muted">Read-only API routes that require no authentication. Examples and expected responses included.</p>
      </div>
      <UBadge label="Public" color="success" />
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <UCard>
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-medium">GET /api/elections</h2>
            <p class="text-sm text-muted mt-1">List elections ordered by newest first.</p>
          </div>
          <div class="text-right">
            <div class="text-xs text-muted">Response</div>
            <div class="font-medium">Array</div>
          </div>
        </div>

        <hr class="my-4" />

        <div>
          <div class="flex items-center justify-between">
            <div class="text-sm font-medium">Request</div>
            <UButton size="sm" variant="ghost" @click="copyToClipboard(curlListElections)">Copy</UButton>
          </div>
          <pre><code class="language-bash">{{ curlListElections }}</code></pre>

          <div class="flex items-center justify-between mt-4">
            <div class="text-sm font-medium">Example response</div>
            <UButton size="sm" variant="ghost" @click="copyToClipboard(exampleListElections)">Copy</UButton>
          </div>
          <pre class="rounded-md bg-surface p-3"><code class="language-json">{{ exampleListElections }}</code></pre>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-medium">GET /api/elections/[id]</h2>
            <p class="text-sm text-muted mt-1">Get full election details, candidates and latest return.</p>
          </div>
          <UBadge label="200" color="primary" />
        </div>

        <hr class="my-4" />

        <div>
          <div class="flex items-center justify-between">
            <div class="text-sm font-medium">Request</div>
            <UButton size="sm" variant="ghost" @click="copyToClipboard(curlGetElection)">Copy</UButton>
          </div>
          <pre><code class="language-bash">{{ curlGetElection }}</code></pre>

          <div class="flex items-center justify-between mt-4">
            <div class="text-sm font-medium">Example response</div>
            <UButton size="sm" variant="ghost" @click="copyToClipboard(exampleGetElection)">Copy</UButton>
          </div>
          <pre class="rounded-md bg-surface p-3"><code class="language-json">{{ exampleGetElection }}</code></pre>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-medium">GET /api/elections/[id]/returns</h2>
            <p class="text-sm text-muted mt-1">List recent returns for an election (supports <code>limit</code>).</p>
          </div>
          <div class="text-right">
            <div class="text-xs text-muted">Query</div>
            <div class="font-medium">limit (optional)</div>
          </div>
        </div>

        <hr class="my-4" />

        <div>
          <div class="flex items-center justify-between">
            <div class="text-sm font-medium">Request</div>
            <UButton size="sm" variant="ghost" @click="copyToClipboard(curlListReturns)">Copy</UButton>
          </div>
          <pre><code class="language-bash">{{ curlListReturns }}</code></pre>

          <div class="flex items-center justify-between mt-4">
            <div class="text-sm font-medium">Example response</div>
            <UButton size="sm" variant="ghost" @click="copyToClipboard(exampleListReturns)">Copy</UButton>
          </div>
          <pre class="rounded-md bg-surface p-3"><code class="language-json">{{ exampleListReturns }}</code></pre>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-medium">GET /api/elections/[id]/returns/[returnId]</h2>
            <p class="text-sm text-muted mt-1">Get a single return and its candidate statuses.</p>
          </div>
          <UBadge label="200" color="primary" />
        </div>

        <hr class="my-4" />

        <div>
          <div class="flex items-center justify-between">
            <div class="text-sm font-medium">Request</div>
            <UButton size="sm" variant="ghost" @click="copyToClipboard(curlGetReturn)">Copy</UButton>
          </div>
          <pre><code class="language-bash">{{ curlGetReturn }}</code></pre>

          <div class="flex items-center justify-between mt-4">
            <div class="text-sm font-medium">Example response</div>
            <UButton size="sm" variant="ghost" @click="copyToClipboard(exampleGetReturn)">Copy</UButton>
          </div>
          <pre class="rounded-md bg-surface p-3"><code class="language-json">{{ exampleGetReturn }}</code></pre>
        </div>
      </UCard>
    </div>

    <div class="mt-6">
      <UCard>
        <h3 class="font-medium">Notes & security</h3>
        <ul class="mt-2 list-disc list-inside text-sm text-muted">
          <li>These endpoints are read-only for anonymous users. Mutations require authentication.</li>
          <li>Shapes may evolve; treat responses as the source of truth.</li>
        </ul>
      </UCard>
    </div>
  </UContainer>
</template>
