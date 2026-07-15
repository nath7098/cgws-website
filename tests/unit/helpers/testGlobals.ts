/**
 * Stubs des globals Nitro (auto-imports h3/`#imports`) pour tester les routes
 * `server/api/**` et les utilitaires `server/utils/**` en dehors du runtime
 * Nuxt/Nitro (vitest "léger", sans @nuxt/test-utils — voir vitest.config.ts).
 *
 * `getAdminSupabase`, `useRuntimeConfig`, `getStripe`, `defineEventHandler`,
 * `readBody`, `readRawBody`, `getHeader`, `setResponseStatus`, `createError`
 * ne sont JAMAIS importés explicitement dans le code serveur (auto-import
 * Nitro) : ce sont de simples identifiants globaux résolus par le moteur JS
 * via `globalThis` — `vi.stubGlobal` les intercepte donc sans toucher au code
 * source. `defineEventHandler` doit être stubbé (passthrough) AVANT que le
 * module de la route ne soit importé, car il s'exécute au chargement du
 * module (`export default defineEventHandler(...)`) — d'où l'usage d'un
 * `import()` dynamique dans les specs plutôt qu'un `import` statique.
 */
import { vi } from 'vitest'

export interface FakeCreatedError extends Error {
  statusCode?: number
  statusMessage?: string
  data?: unknown
}

export interface ServerGlobalsState {
  supabase: unknown
  config: unknown
  stripe: unknown
  body: unknown
  headers: Record<string, string | undefined>
  rawBody: string | undefined
  responseStatuses: number[]
}

/**
 * Installe les stubs globaux et retourne l'état mutable partagé (à
 * réassigner dans chaque test — `beforeEach`) ainsi qu'un `restore()` à
 * appeler en `afterEach`/`afterAll` (`vi.unstubAllGlobals`).
 */
export function stubServerGlobals(): ServerGlobalsState & { restore: () => void } {
  const state: ServerGlobalsState = {
    supabase: undefined,
    config: undefined,
    stripe: undefined,
    body: undefined,
    headers: {},
    rawBody: undefined,
    responseStatuses: [],
  }

  const passthrough = <T>(fn: T): T => fn

  vi.stubGlobal('defineEventHandler', passthrough)
  vi.stubGlobal('useRuntimeConfig', () => state.config)
  vi.stubGlobal('getAdminSupabase', () => state.supabase)
  vi.stubGlobal('getStripe', () => state.stripe)
  vi.stubGlobal('readBody', async () => state.body)
  vi.stubGlobal('readRawBody', async () => state.rawBody)
  vi.stubGlobal('getHeader', (_event: unknown, name: string) => state.headers[name])
  vi.stubGlobal('setResponseStatus', (_event: unknown, code: number) => {
    state.responseStatuses.push(code)
  })
  vi.stubGlobal('createError', (opts: { statusCode?: number, statusMessage?: string, data?: unknown }): FakeCreatedError => {
    const err = new Error(opts.statusMessage ?? 'Error') as FakeCreatedError
    err.statusCode = opts.statusCode
    err.statusMessage = opts.statusMessage
    err.data = opts.data
    return err
  })

  // `Object.assign` (et non un spread `{ ...state, restore }`) : les stubs
  // ci-dessus capturent la référence `state` par closure — un spread
  // renverrait une COPIE que les tests muteraient sans effet sur les stubs.
  return Object.assign(state, { restore: () => vi.unstubAllGlobals() })
}
