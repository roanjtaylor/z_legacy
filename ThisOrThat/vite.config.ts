import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

// Dev-only API so the curator Review UI can write items.json back (a browser can't
// touch the filesystem). Only mounted by the dev server, never in a production build.
function reviewApiPlugin(): Plugin {
  return {
    name: 'review-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'POST' || !req.url?.startsWith('/__review/')) return next()
        const [, , branch, id, action] = req.url.split('?')[0].split('/')
        const itemsPath = path.resolve('public/branches', branch, 'items.json')
        try {
          const items = JSON.parse(fs.readFileSync(itemsPath, 'utf8'))
          const idx = items.findIndex((i: { id: string }) => i.id === id)
          if (idx < 0) { res.statusCode = 404; return res.end('not found') }

          if (action === 'accept') {
            items[idx].curation.flagged = false
            items[idx].curation.reviewedBy = 'human'
            items[idx].curation.reviewedAt = new Date().toISOString()
          } else if (action === 'recurate') {
            // Drop the image + record so report.ts marks the item "pending" again;
            // the curator then re-runs /curate-branch <branch> --only <id>.
            for (const f of [
              path.resolve('public/branches', branch, 'images', `${id}.jpg`),
              path.resolve('public/branches', branch, 'thumbs', `${id}.webp`),
            ]) {
              if (fs.existsSync(f)) fs.rmSync(f)
            }
            items.splice(idx, 1)
          } else {
            res.statusCode = 400; return res.end('bad action')
          }

          fs.writeFileSync(itemsPath, JSON.stringify(items, null, 2) + '\n')
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ ok: true }))
        } catch (e) {
          res.statusCode = 500
          res.end(String(e))
        }
      })
    },
  }
}

// Dev-only API to persist taste judgments to disk (a browser can't append to a
// file). Each POST /__judgment/<branch> appends one JSON line to
// data/judgments/<branch>.jsonl — the log the curation pipeline learns from.
function judgmentApiPlugin(): Plugin {
  return {
    name: 'judgment-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'POST' || !req.url?.startsWith('/__judgment/')) return next()
        const [, , branch] = req.url.split('?')[0].split('/')
        if (!branch || !/^[a-z0-9-]+$/.test(branch)) { res.statusCode = 400; return res.end('bad branch') }

        const chunks: Buffer[] = []
        req.on('data', (c) => chunks.push(c))
        req.on('end', () => {
          try {
            const body = Buffer.concat(chunks).toString('utf8')
            JSON.parse(body) // validate it's JSON before we persist it
            const dir = path.resolve('data/judgments')
            fs.mkdirSync(dir, { recursive: true })
            fs.appendFileSync(path.join(dir, `${branch}.jsonl`), body.replace(/\s+$/, '') + '\n')
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ ok: true }))
          } catch (e) {
            res.statusCode = 500
            res.end(String(e))
          }
        })
      })
    },
  }
}

// Dev-only API backing the Dataset console: read briefs, report curation status,
// edit the brief item list, and scaffold new branches. The actual image curation
// still runs through the Claude Code /curate-branch skill — this is the authoring
// and management surface only. Never mounted in a production build.
function datasetApiPlugin(): Plugin {
  const ID_RE = /^[a-z0-9-]+$/

  const readBody = (req: import('node:http').IncomingMessage): Promise<string> =>
    new Promise((resolve) => {
      const chunks: Buffer[] = []
      req.on('data', (c) => chunks.push(c))
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    })

  const briefPath = (b: string) => path.resolve('data/branches', b, 'brief.json')
  const itemsPath = (b: string) => path.resolve('public/branches', b, 'items.json')
  const branchCfgPath = (b: string) => path.resolve('public/branches', b, 'branch.json')
  const registryPath = () => path.resolve('public/registry.json')
  const imagePath = (b: string, id: string) => path.resolve('public/branches', b, 'images', `${id}.jpg`)

  const readJson = (p: string, fallback: unknown = null) =>
    fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : fallback
  const writeJson = (p: string, value: unknown) => {
    fs.mkdirSync(path.dirname(p), { recursive: true })
    fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n')
  }

  interface BriefItem { id: string }

  function statusFor(branch: string) {
    const brief = readJson(briefPath(branch), { items: [] }) as { items?: BriefItem[] }
    const items = (readJson(itemsPath(branch), []) as Array<{ id: string; curation?: { flagged?: boolean } }>) || []
    const byId = new Map(items.map((i) => [i.id, i]))
    const counts = { pending: 0, done: 0, flagged: 0 }
    for (const bi of brief.items ?? []) {
      const it = byId.get(bi.id)
      const imgPresent = fs.existsSync(imagePath(branch, bi.id))
      if (it?.curation?.flagged) counts.flagged++
      else if (it && imgPresent) counts.done++
      else counts.pending++
    }
    return { briefCount: (brief.items ?? []).length, ...counts }
  }

  return {
    name: 'dataset-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/__dataset/')) return next()
        const url = req.url.split('?')[0]
        const parts = url.split('/').filter(Boolean) // ["__dataset", ...]
        const json = (value: unknown, code = 200) => {
          res.statusCode = code
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify(value))
        }

        try {
          // GET /__dataset/list — registry + per-branch curation status.
          if (req.method === 'GET' && parts[1] === 'list') {
            const registry = (readJson(registryPath(), []) as Array<{ id: string }>) || []
            return json(registry.map((b) => ({ ...b, status: statusFor(b.id) })))
          }

          // GET /__dataset/brief/<branch> — the full brief.
          if (req.method === 'GET' && parts[1] === 'brief' && parts[2]) {
            const brief = readJson(briefPath(parts[2]))
            if (!brief) return json({ error: 'no brief' }, 404)
            return json({ brief, status: statusFor(parts[2]) })
          }

          // POST /__dataset/brief/<branch>/add  { items: BriefItem[] } — upsert by id.
          if (req.method === 'POST' && parts[1] === 'brief' && parts[2] && parts[3] === 'add') {
            const branch = parts[2]
            if (!ID_RE.test(branch)) return json({ error: 'bad branch' }, 400)
            const brief = readJson(briefPath(branch)) as { items: BriefItem[] } | null
            if (!brief) return json({ error: 'no brief' }, 404)
            const { items } = JSON.parse(await readBody(req)) as { items: BriefItem[] }
            if (!Array.isArray(items)) return json({ error: 'items must be an array' }, 400)
            const byId = new Map(brief.items.map((i) => [i.id, i]))
            for (const it of items) {
              if (!it?.id || !ID_RE.test(it.id)) return json({ error: `bad item id: ${it?.id}` }, 400)
              byId.set(it.id, { ...byId.get(it.id), ...it })
            }
            brief.items = [...byId.values()]
            writeJson(briefPath(branch), brief)
            return json({ ok: true, briefCount: brief.items.length, status: statusFor(branch) })
          }

          // POST /__dataset/brief/<branch>/remove  { id } — drop one brief item.
          if (req.method === 'POST' && parts[1] === 'brief' && parts[2] && parts[3] === 'remove') {
            const branch = parts[2]
            const brief = readJson(briefPath(branch)) as { items: BriefItem[] } | null
            if (!brief) return json({ error: 'no brief' }, 404)
            const { id } = JSON.parse(await readBody(req)) as { id: string }
            brief.items = brief.items.filter((i) => i.id !== id)
            writeJson(briefPath(branch), brief)
            return json({ ok: true, briefCount: brief.items.length, status: statusFor(branch) })
          }

          // POST /__dataset/create  { branch: {...branch.json}, brief: {...brief.json} }
          if (req.method === 'POST' && parts[1] === 'create') {
            const { branch, brief } = JSON.parse(await readBody(req)) as {
              branch: { id: string; label: string; tagline?: string }
              brief: { branch: string; items?: BriefItem[] }
            }
            const id = branch?.id
            if (!id || !ID_RE.test(id)) return json({ error: 'bad branch id' }, 400)
            if (fs.existsSync(branchCfgPath(id))) return json({ error: 'branch already exists' }, 409)

            writeJson(branchCfgPath(id), branch)
            writeJson(briefPath(id), { ...brief, branch: id })
            const registry = (readJson(registryPath(), []) as Array<Record<string, unknown>>) || []
            if (!registry.some((b) => b.id === id)) {
              registry.push({
                id,
                label: branch.label,
                tagline: branch.tagline ?? '',
                status: 'curating',
                itemCount: 0,
              })
              writeJson(registryPath(), registry)
            }
            return json({ ok: true, status: statusFor(id) })
          }

          return json({ error: 'not found' }, 404)
        } catch (e) {
          return json({ error: String(e) }, 500)
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), reviewApiPlugin(), judgmentApiPlugin(), datasetApiPlugin()],
})
