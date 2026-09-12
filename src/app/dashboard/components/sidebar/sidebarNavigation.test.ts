
import {
  navGroups,
  NAV_ITEM_MODULE_MAP,
  getFilteredNavGroups,
} from './sidebarNavigation';
import { CheckSquare } from 'lucide-react';

describe('sidebarNavigation', () => {
  it('registers Approvals & Inquiries with CheckSquare icon for /dashboard/conversations', () => {
    const commandGroup = navGroups.find((g) => g.title === 'COMMAND');
    expect(commandGroup).toBeDefined();

    const approvalsItem = commandGroup?.items.find(
      (item) => item.href === '/dashboard/conversations'
    );
    expect(approvalsItem).toBeDefined();
    expect(approvalsItem?.name).toBe('Approvals & Inquiries');
    expect(approvalsItem?.icon).toBe(CheckSquare);
  });

  it('maps /dashboard/conversations to the intelligence module', () => {
    expect(NAV_ITEM_MODULE_MAP['/dashboard/conversations']).toBe('intelligence');
  });

  it('returns all nav groups intact when enabledModules is null or empty', () => {
    const defaultFiltered = getFilteredNavGroups(navGroups, null);
    expect(defaultFiltered.length).toBe(navGroups.length);

    const emptyFiltered = getFilteredNavGroups(navGroups, []);
    expect(emptyFiltered.length).toBe(navGroups.length);
  });

  it('filters out module-gated links when their module is not enabled', () => {
    // Enable only storefront and shipments; omit intelligence
    const filtered = getFilteredNavGroups(navGroups, ['storefront', 'shipments']);

    const allItems = filtered.flatMap((g) => g.items);
    const hasApprovals = allItems.some((item) => item.href === '/dashboard/conversations');
    expect(hasApprovals).toBe(false);

    const hasStorefront = allItems.some((item) => item.href === '/dashboard/online-store');
    expect(hasStorefront).toBe(true);
  });

  it('preserves Approvals & Inquiries when intelligence module is enabled', () => {
    const filtered = getFilteredNavGroups(navGroups, ['intelligence']);
    const allItems = filtered.flatMap((g) => g.items);

    const approvalsItem = allItems.find((item) => item.href === '/dashboard/conversations');
    expect(approvalsItem).toBeDefined();
    expect(approvalsItem?.name).toBe('Approvals & Inquiries');
  });
});
