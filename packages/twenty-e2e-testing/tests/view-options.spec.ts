import { expect, test } from '../lib/fixtures/screenshot';

test.describe('View options', () => {
  test('Rename a view from the Options menu and press Enter', async ({
    page,
  }) => {
    const viewName = `Team tasks ${Date.now()}`;
    const renamedViewName = `${viewName} renamed`;

    await page.goto('/objects/tasks');
    await page.getByRole('button', { name: /^All Tasks · / }).click();
    await page.getByText('Add view').click();
    await page.getByRole('textbox').press('ControlOrMeta+a');
    await page.getByRole('textbox').fill(viewName);
    await page.getByRole('button', { name: 'Create new view' }).click();
    await expect(page).toHaveURL(/viewId=/);
    await expect(
      page.getByRole('button', { name: new RegExp(`^${viewName} · `) }),
    ).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole('button', { name: new RegExp(`^${viewName} · `) }),
    ).toBeVisible();

    await page.getByText('Options', { exact: true }).click();
    const nameInput = page.getByRole('listbox').getByRole('textbox').first();
    await expect(nameInput).toHaveValue(viewName);

    page.on('response', async (r) => {
      const body = r.request().postData() ?? '';
      if (/UpdateView/.test(body)) {
        console.log('DEBUG req', body.slice(0, 400));
        console.log('DEBUG res', (await r.text().catch(() => '')).slice(0, 400));
      }
    });
    page.on('console', (m) => { if (m.type() === 'error') console.log('DEBUG console', m.text().slice(0, 300)); });
    const viewUpdated = page.waitForResponse(
      (response) =>
        /"operationName":\s*"UpdateView"/.test(
          response.request().postData() ?? '',
        ),
    );
    await nameInput.fill(renamedViewName);
    await nameInput.press('Enter');
    await viewUpdated;
    await page.waitForTimeout(1500);
    // DEBUG
    console.log('DEBUG region', await page.getByRole('region', { name: 'Notifications' }).innerHTML());
    console.log('DEBUG statuses', await page.locator('[role="status"], [role="alert"]').allInnerTexts());

    await expect(
      page
        .getByRole('region', { name: 'Notifications' })
        .locator('[role="status"], [role="alert"]'),
    ).toHaveCount(0);

    await page.reload();
    await expect(
      page.getByRole('button', {
        name: new RegExp(`^${renamedViewName} · `),
      }),
    ).toBeVisible();
  });
});
