import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ConfigItem } from '@kecha/shared-types';
import { ToggleSwitch } from '@kecha/shared-ui';

interface SettingsSectionProps {
  title: string;
  description: string;
  items: ConfigItem[];
  isOwner: boolean;
  onAdd: (val: string) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  placeholder?: string;
}

export function SettingsSection({
  title, description, items, isOwner, onAdd, onToggle, onRemove, placeholder = 'Add new...'
}: SettingsSectionProps) {
  const [val, setVal] = useState('');

  const handleAdd = () => {
    if (!val.trim()) return;
    onAdd(val);
    setVal('');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '32px', padding: '28px 0', borderBottom: '1px solid #f1f5f9' }}>
      <div>
        <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{title}</h4>
        <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5 }}>{description}</p>
      </div>

      <div>
        {isOwner && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="text"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder={placeholder}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
            />
            <button
              type="button"
              onClick={handleAdd}
              style={{ background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '14px', padding: '0 16px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={15} /> Add
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '14px',
                border: '1px solid #f1f5f9',
                background: item.enabled ? '#ffffff' : '#f8fafc',
                opacity: item.enabled ? 1 : 0.55,
                boxShadow: item.enabled ? '0 2px 6px rgba(0,0,0,0.02)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '0.86rem', color: item.enabled ? '#0f172a' : '#94a3b8' }}>
                {item.name}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ToggleSwitch checked={item.enabled} onChange={() => onToggle(item.id)} disabled={!isOwner} />
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    title="Delete permanently"
                    style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: 0, display: 'flex' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
