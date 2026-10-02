import { useState } from 'react';
import { ChartEntry } from '@kecha/shared-types';
import { Badge, TablePagination } from '@kecha/shared-ui';
import { Trash2, Edit3, Search, ImageOff, Eye } from 'lucide-react';

interface ChartGalleryProps {
  entries: ChartEntry[];
  isOwner: boolean;
  onView: (entry: ChartEntry) => void;
  onEdit: (entry: ChartEntry) => void;
  onDelete: (id: string) => void;
  onOpenAddModal: () => void;
}

const CATEGORY_NAMES: Record<string, string> = {
  internal_up_to_down: 'Internal Up->Down',
  internal_down_to_up: 'Internal Down->Up',
  external_uptrend: 'External Uptrend',
  external_downtrend: 'External Downtrend'
};

export function ChartGallery({
  entries,
  isOwner,
  onView,
  onEdit,
  onDelete,
  onOpenAddModal
}: ChartGalleryProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filtered = entries.filter((e) =>
    e.pair.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase()) ||
    e.session.toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  if (entries.length === 0) {
    return (
      <div style={{ backgroundColor: '#ffffff', borderRadius: '28px', padding: '60px 24px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0, 0, 0, 0.02)' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f1f5f9', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <ImageOff size={28} />
        </div>
        <h4 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>No pattern records found</h4>
        <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: '#64748b' }}>Upload your first chart screenshot to advance your Level 1 Quest.</p>
        {isOwner && (
          <button onClick={onOpenAddModal} type="button" style={{ background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '14px', padding: '10px 22px', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}>
            Record Screenshot
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '28px', border: '1px solid #f1f5f9', boxShadow: '0 4px 25px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Level 1 Pattern Ledger</h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>400 Target quest progression catalog</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '8px 14px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <Search size={15} color="#94a3b8" />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search pair, category..." style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.84rem', width: '180px' }} />
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
          <thead>
            <tr style={{ background: '#fafbfc', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '14px 24px', fontWeight: 700 }}>ASSET</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>CHART</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>STRUCTURE CATEGORY</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>TIMEFRAME</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>SESSION</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>RECORDED DATE</th>
              <th style={{ padding: '14px 24px', fontWeight: 700, textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((entry) => (
              <tr key={entry.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.15s ease' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#fcfdfe')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '14px 24px' }}>
                  <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>{entry.pair}</span>
                </td>

                <td style={{ padding: '14px 16px' }}>
                  <button onClick={() => onView(entry)} type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', border: 'none', borderRadius: '10px', padding: '5px 10px', fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>
                    <Eye size={13} color="#0284c7" /> View
                  </button>
                </td>

                <td style={{ padding: '14px 16px' }}><Badge label={CATEGORY_NAMES[entry.category] || entry.category} variant="primary" size="sm" /></td>
                <td style={{ padding: '14px 16px' }}><Badge label={entry.timeframe} variant="neutral" size="sm" /></td>
                <td style={{ padding: '14px 16px' }}><Badge label={entry.session} variant="session" size="sm" /></td>
                <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.8rem', fontWeight: 500 }}>{new Date(entry.createdAt).toLocaleDateString()}</td>

                <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    {isOwner && (
                      <>
                        <button onClick={() => onEdit(entry)} title="Edit Pattern (Full Page)" type="button" style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}><Edit3 size={15} /></button>
                        <button onClick={() => onDelete(entry.id)} title="Delete Pattern" type="button" style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '4px' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')} onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}><Trash2 size={15} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination currentPage={page} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} />
    </div>
  );
}
