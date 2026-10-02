import { ChartEntry } from '@kecha/shared-types';
import { Badge } from '@kecha/shared-ui';
import { Trash2, Maximize2, Edit3 } from 'lucide-react';

interface ChartCardProps {
  entry: ChartEntry;
  isOwner: boolean;
  onView: (entry: ChartEntry) => void;
  onEdit: (entry: ChartEntry) => void;
  onDelete: (id: string) => void;
}

const CATEGORY_NAMES: Record<string, string> = {
  internal_up_to_down: 'Internal Up->Down',
  internal_down_to_up: 'Internal Down->Up',
  external_uptrend: 'External Uptrend',
  external_downtrend: 'External Downtrend'
};

export function ChartCard({ entry, isOwner, onView, onEdit, onDelete }: ChartCardProps) {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      <div style={{ position: 'relative', width: '100%', height: '160px', backgroundColor: '#0f172a', cursor: 'pointer' }} onClick={() => onView(entry)}>
        <img src={entry.imageUrl} alt={entry.pair} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(15,23,42,0.6)', borderRadius: '8px', padding: '4px 6px', color: '#ffffff', display: 'flex', alignItems: 'center' }}>
          <Maximize2 size={12} />
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{entry.pair}</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <Badge label={entry.timeframe} variant="primary" size="sm" />
            <Badge label={entry.session} variant="session" size="sm" />
          </div>
        </div>

        <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
          {CATEGORY_NAMES[entry.category] || entry.category}
        </div>

        {entry.notes && (
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#475569', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {entry.notes}
          </p>
        )}

        <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            {new Date(entry.createdAt).toLocaleDateString()}
          </span>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => onView(entry)} title="Preview Chart" type="button" style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px', display: 'flex' }}>
              <Maximize2 size={14} />
            </button>
            {isOwner && (
              <>
                <button onClick={() => onEdit(entry)} title="Edit Chart" type="button" style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px', display: 'flex' }}>
                  <Edit3 size={14} />
                </button>
                <button onClick={() => onDelete(entry.id)} title="Delete Chart" type="button" style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '2px', display: 'flex' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')} onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}>
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
