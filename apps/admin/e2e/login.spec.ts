import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? 'e2e-test@bienenhaus.local';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? 'e2e-test-password-123';

test.describe('Login', () => {
  test('muestra error con credenciales inválidas', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill('noexiste@bienenhaus.local');
    await page.getByLabel('Contraseña').fill('password-incorrecta');
    await page.getByRole('button', { name: /entrar/i }).click();

    await expect(page.getByText(/credenciales incorrectas/i)).toBeVisible();
  });

  test('loguea correctamente y redirige al dashboard', async ({ page }) => {
    // Start at the login page
    await page.goto('/admin/login');
    
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Contraseña').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /entrar/i }).click();

    // Wait for navigation after login
    await page.waitForURL(/\/admin(\/|#\/)?$/, { timeout: 60000 });
    
    // Wait for Dashboard to be visible
    await expect(page.getByText('Dashboard')).toBeVisible({ timeout: 30000 });
  });
});