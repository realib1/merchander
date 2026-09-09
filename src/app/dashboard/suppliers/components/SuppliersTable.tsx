'use client';

import { useState } from 'react';
import { Container } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { RecordPaymentModal } from './RecordPaymentModal';
import { SupplierPerformanceScore } from '@/types/intelligence-demand';
import { SupplierScorecardBadge } from './SupplierScorecardBadge';
import { SupplierScorecardModal } from './SupplierScorecardModal';

interface Supplier {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  outstanding_balance: number;
}

export function SuppliersTable({
  suppliers,
  scorecards = {},
}: {
  suppliers: Supplier[];
  scorecards?: Record<string, SupplierPerformanceScore>;
}) {
  const [selectedScorecard, setSelectedScorecard] = useState<SupplierPerformanceScore | null>(null);

  if (suppliers.length === 0) {
    return (
      <div className="p-12 text-center">
        <Container size={48} className="mx-auto mb-4 text-muted" />
        <p className="font-medium">No suppliers found</p>
        <p className="text-sm mt-1 text-muted">Get started by adding your first supplier.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="font-medium text-muted text-body-sm border-b border-separator bg-surface-elevated/20">
              <th className="px-4 py-3 font-medium">Supplier Name</th>
              <th className="px-4 py-3 font-medium">Contact Person</th>
              <th className="px-4 py-3 font-medium">Email / Phone</th>
              <th className="px-4 py-3 font-medium">Country</th>
              <th className="px-4 py-3 font-medium">Reliability</th>
              <th className="px-4 py-3 font-medium text-right">Balance</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-separator">
            {suppliers.map((supplier) => {
              const scorecard = scorecards[supplier.id];
              return (
                <tr key={supplier.id} className="hover:bg-surface-elevated/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{supplier.name}</div>
                  </td>
                  <td className="px-4 py-3 text-muted">{supplier.contact_name || '-'}</td>
                  <td className="px-4 py-3 text-muted">
                    <div>{supplier.email || '-'}</div>
                    <div className="text-xs">{supplier.phone || ''}</div>
                  </td>
                  <td className="px-4 py-3 text-muted">{supplier.country || '-'}</td>
                  <td className="px-4 py-3">
                    {scorecard ? (
                      <SupplierScorecardBadge
                        grade={scorecard.grade}
                        score={scorecard.compositeScore}
                        onClick={() => setSelectedScorecard(scorecard)}
                      />
                    ) : (
                      <SupplierScorecardBadge
                        grade="Unrated"
                        onClick={() =>
                          setSelectedScorecard({
                            supplierId: supplier.id,
                            supplierName: supplier.name,
                            country: supplier.country,
                            totalPOs: 0,
                            completedPOs: 0,
                            onTimeDeliveryRate: 100,
                            averageLeadTimeDays: 14,
                            fulfillmentAccuracy: 100,
                            defectCount: 0,
                            averageQualityRating: null,
                            compositeScore: 100,
                            grade: 'Unrated',
                            outstandingBalance: supplier.outstanding_balance || 0,
                          })
                        }
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums text-foreground">
                    {formatCurrency(supplier.outstanding_balance)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <RecordPaymentModal supplierId={supplier.id} supplierName={supplier.name} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Scorecard Modal */}
      <SupplierScorecardModal
        scorecard={selectedScorecard}
        isOpen={Boolean(selectedScorecard)}
        onClose={() => setSelectedScorecard(null)}
      />
    </>
  );
}
