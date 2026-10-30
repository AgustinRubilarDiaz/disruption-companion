// brain/features/UX-01_pantalla-moderna.feature — escenarios @visual, en un navegador real.
import { expect, test } from '@playwright/test';

const SHOTS = '../Docs/img';
const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 900 };

test.describe('Característica: Pantalla moderna del pasajero (UX-01) · navegador real', () => {
  test('Escenario: Recorrido real en el navegador', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/?booking=ABC123');
    await expect(page.getByText('Tu vuelo LA500 sale ahora a las 17:10.')).toBeVisible();
    await expect(page.getByTestId('missed')).toHaveText('Conexión perdida');
    await page.screenshot({ path: `${SHOTS}/ux01-mobile-abc123.png`, fullPage: true });

    await page.getByRole('button', { name: 'Aceptar este cambio' }).click();
    const dialog = page.getByRole('dialog', { name: 'Confirmar el cambio de vuelo' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Sí, solicitar el cambio' })).toBeFocused();
    // animations: 'disabled' lleva la animación de entrada al final antes de capturar.
    await page.screenshot({ path: `${SHOTS}/ux01-mobile-confirm.png`, animations: 'disabled' });

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('button', { name: 'Aceptar este cambio' })).toBeFocused();

    await page.getByRole('button', { name: 'Aceptar este cambio' }).click();
    await dialog.getByRole('button', { name: 'Sí, solicitar el cambio' }).click();
    await expect(page.getByText(/Solicitud enviada: pendiente de confirmación/)).toBeVisible();
    await expect(page.getByText('N.º de la solicitud: RBK-88231')).toBeVisible();
    expect(await page.locator('body').innerText()).not.toMatch(/confirmado|confirmada/i);
    await page.screenshot({ path: `${SHOTS}/ux01-mobile-requested.png`, fullPage: true });
  });

  test('capturas: escritorio, sin confirmar y modo oscuro', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/?booking=ABC123');
    await expect(page.getByTestId('status-hero')).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/ux01-desktop-abc123.png`, fullPage: true });

    await page.setViewportSize(MOBILE);
    await page.goto('/?booking=DEMOCONF');
    await expect(page.getByText('No pudimos confirmar el estado de tu viaje.')).toBeVisible();
    await expect(page.getByTestId('missed')).toHaveCount(0);
    await page.screenshot({ path: `${SHOTS}/ux01-mobile-democonf.png`, fullPage: true });

    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/?booking=ABC123');
    await expect(page.getByTestId('status-hero')).toBeVisible();
    const bg = await page.locator('main').evaluate((el) => getComputedStyle(el.parentElement!).backgroundColor);
    expect(bg).not.toBe('rgb(245, 245, 244)'); // el fondo claro (stone-100) no se usa en modo oscuro
    await page.screenshot({ path: `${SHOTS}/ux01-mobile-dark.png`, fullPage: true });
  });

  test('Escenario: Con movimiento reducido no hay transiciones', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?booking=ABC123');
    const button = page.getByRole('button', { name: 'Aceptar este cambio' });
    await expect(button).toBeVisible();
    expect(await button.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s');

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    expect(await button.evaluate((el) => getComputedStyle(el).transitionDuration)).not.toBe('0s');
  });
});
