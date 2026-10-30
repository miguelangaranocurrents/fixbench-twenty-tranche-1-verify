import { type Page, type Response } from '@playwright/test';
import { expect, test } from '../lib/fixtures/screenshot';
import { postBackendGraphQL } from '../lib/requests/post-backend-graphql';

const isRecordQueryFilteringOn = (response: Response, fieldName: string) => {
  if (!response.url().includes('/graphql')) {
    return false;
  }
  try {
    const body = JSON.parse(response.request().postData() ?? '{}') as {
      variables?: { filter?: unknown };
    };
    return JSON.stringify(body.variables?.filter ?? {}).includes(
      `"${fieldName}"`,
    );
  } catch {
    return false;
  }
};

const openFilterDropdown = async (page: Page) => {
  await page.getByText('Filter', { exact: true }).click();
  await expect(page.getByPlaceholder('Search fields')).toBeVisible();
};

test.describe('Record filters', () => {
  test('Employees "Is not" filter lists companies without an employee count', async ({
    page,
  }) => {
    const name = `No headcount ${Date.now()}`;

    const created = await postBackendGraphQL<{ createCompany: { id: string } }>(
      {
        page,
        data: {
          query: `mutation CreateCompany($input: CompanyCreateInput!) {
            createCompany(data: $input) { id }
          }`,
          variables: { input: { name } },
        },
      },
    );
    expect(created.body.errors).toBeUndefined();

    await page.goto('/objects/companies');
    await expect(
      page.getByRole('button', { name: /^All Companies · / }),
    ).toBeVisible();
    await expect(page.getByText(name, { exact: true })).toBeVisible();

    await openFilterDropdown(page);
    await page.getByPlaceholder('Search fields').fill('Employees');
    await page.getByText('Employees', { exact: true }).last().click();

    const valueInput = page.getByPlaceholder('Employees');
    await expect(valueInput).toBeVisible();
    await page
      .getByRole('listbox')
      .filter({ has: valueInput })
      .getByText('Is', { exact: true })
      .click();
    await page
      .getByRole('dialog', { name: 'Operand' })
      .getByRole('button', { name: 'Is not', exact: true })
      .click();

    const filteredQuery = page.waitForResponse((response) =>
      isRecordQueryFilteringOn(response, 'employees'),
    );
    await valueInput.fill('50');
    await filteredQuery;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(2000);

    await expect(page.getByText(name, { exact: true })).toBeVisible();
  });

  test('Currency "is not empty" filter keeps records that have a currency but no amount', async ({
    page,
  }) => {
    const name = `Unpriced deal ${Date.now()}`;

    const created = await postBackendGraphQL<{
      createOpportunity: { id: string };
    }>({
      page,
      data: {
        query: `mutation CreateOpportunity($input: OpportunityCreateInput!) {
          createOpportunity(data: $input) { id amount { amountMicros currencyCode } }
        }`,
        variables: {
          input: { name, amount: { amountMicros: null, currencyCode: 'USD' } },
        },
      },
    });
    expect(created.body.errors).toBeUndefined();

    await page.goto('/objects/opportunities');
    await expect(
      page.getByRole('button', { name: /^All Opportunities · / }),
    ).toBeVisible();
    await expect(page.getByText(name, { exact: true })).toBeVisible();

    await openFilterDropdown(page);
    await page.getByText('Advanced filter', { exact: true }).click();

    const advancedFilter = page
      .getByRole('listbox')
      .filter({ hasText: 'Where' });
    await expect(advancedFilter).toBeVisible();
    await advancedFilter.getByText('Name', { exact: true }).click();

    const fieldPicker = page.getByRole('dialog', { name: 'Select field' });
    await fieldPicker.getByPlaceholder('Search fields').fill('Amount');
    await fieldPicker.getByText('Amount', { exact: true }).first().click();
    await fieldPicker.getByText('Currency', { exact: true }).click();

    await advancedFilter.getByText('Is', { exact: true }).click();
    const filteredQuery = page.waitForResponse((response) =>
      isRecordQueryFilteringOn(response, 'amount'),
    );
    await page
      .getByRole('dialog', { name: 'Select operand' })
      .getByText('Is not empty', { exact: true })
      .click();
    await filteredQuery;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(2000);

    await expect(page.getByText(name, { exact: true })).toBeVisible();
  });
});
