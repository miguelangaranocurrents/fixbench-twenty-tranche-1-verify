import { expect, test } from '../lib/fixtures/screenshot';

test.describe('Navigation folders', () => {
  test('Create a folder whose name has spaces', async ({ page }) => {
    const folderName = `QA Space Test ${Date.now()}`;

    await page.goto('/objects/companies');
    await expect(
      page.getByRole('button', { name: /^All Companies · / }),
    ).toBeVisible();

    await page.getByText('Workspace', { exact: true }).hover();
    await page.getByRole('button', { name: 'Edit navigation' }).click();
    await expect(page.getByText('Layout customization')).toBeVisible();

    await page.locator('button[aria-label="Add"]').click();
    await page.getByText('Folder', { exact: true }).click();

    const nameInput = page.locator('input:focus');
    await expect(nameInput).toHaveValue('New folder');
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type(folderName);
    await page.keyboard.press('Enter');

    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Layout customization')).not.toBeVisible();

    await expect(page.getByText(folderName, { exact: true })).toBeVisible();
  });
});
