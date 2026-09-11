import { NextRequest, NextResponse } from 'next/server';
import { getPlatformAuditLogsAction } from '@/app/actions/platform-audit';

function escapeCsvField(field: unknown): string {
  if (field === null || field === undefined) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const targetType = searchParams.get('targetType') && searchParams.get('targetType') !== 'all' ? searchParams.get('targetType')! : undefined;
    const actorEmail = searchParams.get('actorEmail') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    // Fetch up to 10000 records for the export
    const { logs, error } = await getPlatformAuditLogsAction({
      limit: 10000,
      offset: 0,
      targetType,
      actorEmail,
      startDate,
      endDate,
    });

    if (error) {
      return new NextResponse(`Error fetching logs: ${error}`, { status: 500 });
    }

    const headers = [
      'Timestamp',
      'Actor Email',
      'Actor Role',
      'Action',
      'Target Type',
      'Target ID',
      'Target Name',
      'Reason',
      'IP Address'
    ];

    const rows = logs.map((log) => [
      new Date(log.created_at).toISOString(),
      log.actor_email,
      log.actor_role,
      log.action,
      log.target_type,
      log.target_id,
      log.target_name || '',
      log.reason || '',
      log.ip_address || ''
    ]);

    const csvContent = [
      headers.map(escapeCsvField).join(','),
      ...rows.map(row => row.map(escapeCsvField).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="audit-logs.csv"',
      },
    });
  } catch (err) {
    console.error('Export error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
