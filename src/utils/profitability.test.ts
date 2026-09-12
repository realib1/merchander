

describe('Profitability & Unit Economics Logic', () => {
  it('correctly computes gross profit and margin percentages', () => {
    const revenue = 1000;
    const cogs = 600;
    const grossProfit = revenue - cogs;
    const marginPct = (grossProfit / revenue) * 100;

    expect(grossProfit).toBe(400);
    expect(marginPct).toBe(40);
  });

  it('correctly computes net profit after operating expenses and fees', () => {
    const grossProfit = 400;
    const opex = 150;
    const freight = 50;
    const fees = 10;
    const totalExpenses = opex + freight + fees;
    const netProfit = grossProfit - totalExpenses;
    const netMarginPct = (netProfit / 1000) * 100;

    expect(totalExpenses).toBe(210);
    expect(netProfit).toBe(190);
    expect(netMarginPct).toBe(19);
  });

  it('handles zero revenue gracefully without division by zero', () => {
    const revenue = 0;
    const cogs = 0;
    const grossProfit = revenue - cogs;
    const marginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    expect(grossProfit).toBe(0);
    expect(marginPct).toBe(0);
  });

  it('correctly categorizes margin health statuses', () => {
    function getHealth(margin: number) {
      if (margin >= 40) return 'healthy';
      if (margin >= 20) return 'moderate';
      if (margin >= 0) return 'warning';
      return 'negative';
    }

    expect(getHealth(55)).toBe('healthy');
    expect(getHealth(40)).toBe('healthy');
    expect(getHealth(30)).toBe('moderate');
    expect(getHealth(15)).toBe('warning');
    expect(getHealth(0)).toBe('warning');
    expect(getHealth(-5)).toBe('negative');
  });
});
