import React, { useState, useRef, useEffect, useCallback } from 'react';

const removeDiacritics = (str) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

export function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = '-- Chọn --',
  searchPlaceholder = 'Tìm kiếm...',
  customOption = null,
  required = false,
  disabled = false,
  countLabel = 'món',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  const filteredOptions = options.filter(opt => {
    const normalizedLabel = removeDiacritics(opt.label.toLowerCase());
    const normalizedSearch = removeDiacritics(search.toLowerCase());
    return normalizedLabel.includes(normalizedSearch);
  });

  const allItems = customOption
    ? [...filteredOptions, { value: customOption.value, label: customOption.label, isCustom: true }]
    : filteredOptions;

  const selectedOption = options.find(opt => opt.value === value);

  const open = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    setSearch('');
    setHighlightIndex(-1);
    requestAnimationFrame(() => searchInputRef.current?.focus());
  }, [disabled]);

  const close = useCallback(() => {
    setIsOpen(false);
    setSearch('');
    setHighlightIndex(-1);
  }, []);

  const handleSelect = useCallback((item) => {
    onChange(item.value);
    close();
  }, [onChange, close]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        close();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, close]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        open();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex(prev => {
          const next = prev < allItems.length - 1 ? prev + 1 : 0;
          scrollToItem(next);
          return next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex(prev => {
          const next = prev > 0 ? prev - 1 : allItems.length - 1;
          scrollToItem(next);
          return next;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < allItems.length) {
          handleSelect(allItems[highlightIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
      default:
        break;
    }
  }, [isOpen, highlightIndex, allItems, handleSelect, open, close]);

  const scrollToItem = (index) => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[index];
    if (item) {
      item.scrollIntoView({ block: 'nearest' });
    }
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="ss-highlight">{text.slice(idx, idx + query.length)}</mark>
        {text.slice(idx + query.length)}
      </>
    );
  };

  // Hidden input for form validation
  const hiddenValue = value || '';

  return (
    <div
      className={`ss-container ${isOpen ? 'ss-open' : ''} ${disabled ? 'ss-disabled' : ''}`}
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      {required && (
        <input
          type="text"
          value={hiddenValue}
          required
          tabIndex={-1}
          className="ss-hidden-input"
          onChange={() => {}}
        />
      )}

      <button
        type="button"
        className={`ss-trigger ${isOpen ? 'ss-trigger-active' : ''} ${value ? 'ss-has-value' : ''}`}
        onClick={() => isOpen ? close() : open()}
        disabled={disabled}
      >
        <span className="ss-trigger-text">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg className={`ss-chevron ${isOpen ? 'ss-chevron-up' : ''}`} width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {isOpen && (
        <div className="ss-dropdown">
          <div className="ss-search-wrapper">
            <svg className="ss-search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              className="ss-search-input"
              placeholder={searchPlaceholder}
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setHighlightIndex(-1);
              }}
            />
            {search && (
              <button
                type="button"
                className="ss-search-clear"
                onClick={() => {
                  setSearch('');
                  searchInputRef.current?.focus();
                }}
              >
                ✕
              </button>
            )}
          </div>

          <ul className="ss-list" ref={listRef}>
            {filteredOptions.length === 0 && !customOption && (
              <li className="ss-empty">Không tìm thấy kết quả</li>
            )}

            {allItems.map((item, idx) => (
              <li
                key={item.value}
                className={`ss-item ${item.value === value ? 'ss-item-selected' : ''} ${idx === highlightIndex ? 'ss-item-highlighted' : ''} ${item.isCustom ? 'ss-item-custom' : ''}`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setHighlightIndex(idx)}
              >
                {item.isCustom ? (
                  <span className="ss-custom-label">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    {item.label}
                  </span>
                ) : (
                  <span className="ss-item-text">{highlightMatch(item.label, search)}</span>
                )}
                {item.value === value && !item.isCustom && (
                  <svg className="ss-check" width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </li>
            ))}
          </ul>

          <div className="ss-footer">
            <span className="ss-count">{filteredOptions.length} {countLabel}</span>
          </div>
        </div>
      )}
    </div>
  );
}
