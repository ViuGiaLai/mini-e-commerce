const API_BASE = 'https://api.render.com/v1'
const apiKey = process.env.RENDER_API_KEY
const serviceId = process.env.RENDER_SERVICE_ID
const commitId = process.env.GITHUB_SHA
const timeoutMs = Number(process.env.RENDER_DEPLOY_TIMEOUT_MS || 35 * 60 * 1000)
const pollMs = Number(process.env.RENDER_DEPLOY_POLL_MS || 15 * 1000)

if (!apiKey || !serviceId || !commitId) {
  throw new Error('Missing RENDER_API_KEY, RENDER_SERVICE_ID, or GITHUB_SHA.')
}

const headers = {
  Accept: 'application/json',
  Authorization: `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
}

async function renderRequest(path, options = {}, attempt = 0) {
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers: { ...headers, ...options.headers } })

  if (response.status === 429 && attempt < 5) {
    const resetAt = Number(response.headers.get('ratelimit-reset')) * 1000
    const delay = Number.isFinite(resetAt) ? Math.max(1_000, resetAt - Date.now()) : 2 ** attempt * 2_000
    await new Promise(resolve => setTimeout(resolve, Math.min(delay, 60_000)))
    return renderRequest(path, options, attempt + 1)
  }

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(`Render API ${response.status}: ${JSON.stringify(body)}`)
  }
  return body
}

console.log(`Triggering Render deploy for commit ${commitId.slice(0, 12)}...`)
const created = await renderRequest(`/services/${serviceId}/deploys`, {
  method: 'POST',
  body: JSON.stringify({ commitId, clearCache: 'do_not_clear' }),
})

const deploy = created.deploy || created
const deployId = deploy.id
if (!deployId) throw new Error(`Render did not return a deploy ID: ${JSON.stringify(created)}`)

const successful = new Set(['live'])
const failed = new Set(['build_failed', 'update_failed', 'pre_deploy_failed', 'canceled', 'deactivated'])
const deadline = Date.now() + timeoutMs
let previousStatus = ''

while (Date.now() < deadline) {
  const currentResponse = await renderRequest(`/services/${serviceId}/deploys/${deployId}`)
  const current = currentResponse.deploy || currentResponse
  const status = current.status || 'unknown'

  if (status !== previousStatus) {
    console.log(`Render deploy ${deployId}: ${status}`)
    previousStatus = status
  }

  if (successful.has(status)) {
    console.log(`Render deploy is live: ${deployId}`)
    process.exit(0)
  }
  if (failed.has(status)) {
    throw new Error(`Render deploy ${deployId} ended with status: ${status}`)
  }

  await new Promise(resolve => setTimeout(resolve, pollMs))
}

throw new Error(`Render deploy ${deployId} did not finish within ${Math.round(timeoutMs / 60_000)} minutes.`)
