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
