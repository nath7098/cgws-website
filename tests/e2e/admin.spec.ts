import { test, expect } from '@playwright/test'

test.describe('Admin — protection par middleware auth', () => {
  test.beforeEach(async ({ page }) => {
    /**
     * Intercept Supabase auth calls so they return no session.
     * The admin middleware calls supabase.auth.getSession() client-side.
     * Returning null ensures the middleware redirects to /admin/login.
     */
    await page.route('**/auth/v1/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access_token: null, refresh_token: null, user: null }),
      })
    })
  })

  test('/admin redirige vers /admin/login sans session', async ({ page }) => {
    await page.goto('/admin')

    // The admin middleware (client-side) redirects unauthenticated users to /admin/login.
    // Note: SSR skips the middleware check (import.meta.server guard),
    // so the redirect happens after client-side hydration.
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10000 })
  })

  test('/admin/dashboard redirige vers /admin/login sans session', async ({ page }) => {
    await page.goto('/admin/dashboard')

    // Same middleware protection applies to all /admin/** routes
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10000 })
  })

  test('la page /admin/login affiche le formulaire de connexion', async ({ page }) => {
    await page.goto('/admin/login')

    // The login page has a heading
    const heading = page.locator('h1')
    await expect(heading).toBeVisible({ timeout: 10000 })
    await expect(heading).toContainText('Connexion')

    // Email input (id="admin-email" in login.vue)
    await expect(page.locator('#admin-email')).toBeVisible()
    await expect(page.locator('#admin-email')).toHaveAttribute('type', 'email')

    // Password input (id="admin-password" in login.vue)
    await expect(page.locator('#admin-password')).toBeVisible()
    await expect(page.locator('#admin-password')).toHaveAttribute('type', 'password')

    // Submit button
    const submitButton = page.locator('form button[type="submit"]')
    await expect(submitButton).toBeVisible()
    await expect(submitButton).toContainText('Se connecter')
  })

  test('le formulaire de login est accessible au clavier', async ({ page }) => {
    await page.goto('/admin/login')

    // Tab into email, type, tab to password, type, tab to submit
    await page.locator('#admin-email').focus()
    await page.locator('#admin-email').fill('test@example.com')

    await page.keyboard.press('Tab')
    await expect(page.locator('#admin-password')).toBeFocused()

    await page.locator('#admin-password').fill('motdepasse')
    await page.keyboard.press('Tab')

    // Submit button should now be focused
    const submitButton = page.locator('form button[type="submit"]')
    await expect(submitButton).toBeFocused()
  })
})
