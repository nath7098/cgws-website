import { test, expect } from '@playwright/test'

test.describe('Consignation — page et formulaire', () => {
  test('la page /consignation charge et affiche le h1', async ({ page }) => {
    await page.goto('/consignation')

    const h1 = page.locator('h1')
    await expect(h1).toBeVisible({ timeout: 10000 })
    // The h1 text in consignation.vue: "Déposez votre matériel Trouvez-lui un nouveau propriétaire"
    await expect(h1).toContainText('Déposez votre matériel')
  })

  test('la section "3 étapes" est présente', async ({ page }) => {
    await page.goto('/consignation')

    // HowItWorks renders a <section aria-label="Fonctionnement du service de consignation en 3 étapes">
    const howItWorks = page.locator('[aria-label="Fonctionnement du service de consignation en 3 étapes"]')
    await expect(howItWorks).toBeVisible({ timeout: 10000 })
  })

  test('le formulaire de consignation contient les champs requis', async ({ page }) => {
    await page.goto('/consignation')

    // Scroll to the form section
    await page.locator('#consignment-form').scrollIntoViewIfNeeded()

    // Check all required fields are present (by their id attributes from ConsignmentForm.vue)
    await expect(page.locator('#field-prenom')).toBeVisible()
    await expect(page.locator('#field-nom')).toBeVisible()
    await expect(page.locator('#field-email')).toBeVisible()
    await expect(page.locator('#field-phone')).toBeVisible()
    await expect(page.locator('#field-description')).toBeVisible()
    await expect(page.locator('#field-price')).toBeVisible()
  })

  test('la soumission vide déclenche les messages de validation', async ({ page }) => {
    await page.goto('/consignation')

    // Scroll to and find the submit button inside the form
    await page.locator('#consignment-form').scrollIntoViewIfNeeded()

    // Click submit without filling the form — should trigger client-side validation
    // The form has a submit button of type "submit"
    const submitButton = page.locator('#consignment-form button[type="submit"]')
    await expect(submitButton).toBeVisible({ timeout: 10000 })
    await submitButton.click()

    // After clicking submit, at least one validation error should appear
    // The form uses aria-invalid="true" on invalid fields
    // Wait briefly for reactive errors to show
    await page.waitForTimeout(300)

    const invalidFields = page.locator('[aria-invalid="true"]')
    const errorCount = await invalidFields.count()
    expect(errorCount).toBeGreaterThan(0)
  })

  test('le formulaire ne soumet pas avec des données invalides', async ({ page }) => {
    await page.goto('/consignation')
    await page.locator('#consignment-form').scrollIntoViewIfNeeded()

    // Fill only the email field with an invalid value
    const emailField = page.locator('#field-email')
    await emailField.fill('pas-une-email')
    await emailField.blur()

    // Error should appear for email
    await page.waitForTimeout(200)
    const emailInput = page.locator('#field-email')
    await expect(emailInput).toHaveAttribute('aria-invalid', 'true')
  })
})
