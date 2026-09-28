import React from 'react';

export function DataTable({ columns = [], data = [], keyField = 'id', emptyMessage = 'No records found' }) {
  const containerStyle = {
    width: '100%',
    overflowX: 'auto',
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-card)',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: 'var(--font-size-sm)',
  };

  const thStyle = {
    padding: '12px 16px',
    backgroundColor: 'var(--color-page-bg)',
    color: 'var(--color-muted)',
    fontWeight: '600',
    borderBottom: '1px solid var(--color-border)',
  };

  const tdStyle = {
    padding: '14px 16px',
    borderBottom: '1px solid var(--color-border)',
    color: 'var(--color-ink)',
  };

  if (!data || data.length === 0) {
    return (
      <div style={{ ...containerStyle, padding: '32px', textAlign: 'center', color: 'var(--color-muted)' }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} style={thStyle}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row[keyField]}>
              {columns.map((col, idx) => (
                <td key={idx} style={tdStyle}>
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
