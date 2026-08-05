import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '32px', marginBottom: '20px' }}>
      <button
        className="btn-icon"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
      >
        <ChevronLeft size={18} />
      </button>

      {getPages().map((page, index) => (
        <React.Fragment key={index}>
          {page === '...' ? (
            <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '0 4px' }}>
              <MoreHorizontal size={16} />
            </div>
          ) : (
            <button
              onClick={() => onPageChange(page)}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.95rem',
                fontWeight: currentPage === page ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: currentPage === page ? 'none' : '1px solid var(--glass-border)',
                background: currentPage === page ? 'var(--accent-primary)' : 'var(--btn-secondary-bg)',
                color: currentPage === page ? '#ffffff' : 'var(--text-primary)',
                boxShadow: currentPage === page ? 'var(--accent-glow)' : 'none',
              }}
              onMouseOver={(e) => {
                if (currentPage !== page) {
                  e.currentTarget.style.background = 'var(--btn-secondary-hover)';
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                }
              }}
              onMouseOut={(e) => {
                if (currentPage !== page) {
                  e.currentTarget.style.background = 'var(--btn-secondary-bg)';
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                }
              }}
            >
              {page}
            </button>
          )}
        </React.Fragment>
      ))}

      <button
        className="btn-icon"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
