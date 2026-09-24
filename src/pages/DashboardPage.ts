import { BasePage } from './BasePage';
import { ListPage } from './ListPage';

export class DashboardPage extends BasePage {
  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async openList(name: string): Promise<ListPage> {
    await this.goto();
    await this.page.getByRole('link', { name }).first().click();
    return new ListPage(this.page);
  }
}
