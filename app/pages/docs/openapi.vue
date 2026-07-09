<template>
  <UContainer class="my-8">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-semibold">OpenAPI / Swagger UI</h1>
        <p class="text-sm text-muted">Interactive API documentation generated from <code>/openapi.json</code>.</p>
      </div>
      <UButton size="sm" variant="ghost" @click="openSpec">Open raw spec</UButton>
    </div>

    <UCard class="bg-white">
      <div id="swagger-ui" style="height: 70vh; overflow-y: scroll;"></div>
    </UCard>
  </UContainer>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

function openSpec() {
  window.open('/openapi.json', '_blank')
}

onMounted(async () => {
  // load swagger ui assets from CDN
  const cssHref = 'https://unpkg.com/swagger-ui-dist@4/swagger-ui.css'
  const scriptSrc = 'https://unpkg.com/swagger-ui-dist@4/swagger-ui-bundle.js'

  if (!document.querySelector(`link[href="${cssHref}"]`)) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = cssHref
    document.head.appendChild(link)
  }

  if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement('script')
      s.src = scriptSrc
      s.async = true
      s.onload = () => resolve()
      s.onerror = () => reject(new Error('Failed to load swagger-ui script'))
      document.head.appendChild(s)
    })
  }

  // @ts-ignore
  const ui = (window as any).SwaggerUIBundle({
    url: '/openapi.json',
    dom_id: '#swagger-ui',
    presets: [(window as any).SwaggerUIBundle.presets.apis],
    layout: 'BaseLayout'
  })

  // attach to window for debugging
  // @ts-ignore
  window.__swaggerUi = ui
})
</script>
