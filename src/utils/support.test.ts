import { describe, it, expect } from 'vitest';

describe('Help & Support Utility Logic', () => {
  it('formats WhatsApp support messages with store context properly', () => {
    const storeName = 'Accra Luxury Wear';
    const tenantId = 'tenant-accra-123';
    const msg = encodeURIComponent(
      `Hello Merchander Support Team! I need assistance with my store dashboard (Store: ${storeName}, ID: ${tenantId}).`
    );

    expect(msg).toContain('Accra%20Luxury%20Wear');
    expect(msg).toContain('tenant-accra-123');
  });

  it('finds relevant help articles by search query', () => {
    const articles = [
      { id: '1', title: 'How to create a pre-order batch?', tags: ['preorder', 'batch'] },
      { id: '2', title: 'How to connect WhatsApp?', tags: ['whatsapp', 'meta'] },
    ];

    const search = 'batch';
    const matches = articles.filter(
      (a) => a.title.toLowerCase().includes(search) || a.tags.some((t) => t.toLowerCase().includes(search))
    );

    expect(matches.length).toBe(1);
    expect(matches[0].id).toBe('1');
  });

  it('correctly weighs ticket priorities for superadmin inbox triage', () => {
    const priorityWeight: Record<string, number> = {
      urgent: 4,
      high: 3,
      normal: 2,
      low: 1,
    };

    expect(priorityWeight['urgent']).toBeGreaterThan(priorityWeight['high']);
    expect(priorityWeight['high']).toBeGreaterThan(priorityWeight['normal']);
  });
});
