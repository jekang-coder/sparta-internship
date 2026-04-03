import { ApplicationStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: ApplicationStatus;
}

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { bg: string; color: string; label: string }
> = {
  pending: { bg: '#FFF8E1', color: '#F59E0B', label: '승인 대기' },
  approved: { bg: '#E8F4FD', color: '#2563EB', label: '면접 확정' },
  rejected: { bg: '#FEE2E2', color: '#DC2626', label: '거절됨' },
  interview_done: { bg: '#F3E8FF', color: '#7C3AED', label: '면접 완료' },
  passed: { bg: '#ECFDF5', color: '#059669', label: '최종 합격' },
  failed: { bg: '#F5F5F5', color: '#8C8C8C', label: '불합격' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { bg: '#F5F5F5', color: '#8C8C8C', label: status };

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: 100,
        fontSize: 12,
        fontWeight: 700,
        background: config.bg,
        color: config.color,
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </span>
  );
}
