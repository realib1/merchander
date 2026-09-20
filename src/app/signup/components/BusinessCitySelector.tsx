'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, MapPin, X } from 'lucide-react';
import { COMMERCIAL_HUBS, POPULAR_CHIPS } from './commercial-hubs';

interface BusinessCitySelectorProps {
  city: string;
  setCity: (city: string) => void;
}

export function BusinessCitySelector({ city, setCity }: BusinessCitySelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredCities = useMemo(() => {
    const query = city.trim().toLowerCase();
    if (!query) return COMMERCIAL_HUBS;
    return COMMERCIAL_HUBS.filter(
      (c) => c.name.toLowerCase().includes(query) || c.region.toLowerCase().includes(query)
    );
  }, [city]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label className="block text-xs font-semibold text-foreground">Operating city / town</label>

      <div className="relative">
        <div className="relative rounded-xl border border-separator bg-background flex items-center shadow-2xs focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20 transition-all">
          <input
            type="text"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder="Type city or select below"
            className="w-full py-2.5 pl-3.5 pr-8 bg-transparent border-0 outline-none text-sm font-medium text-foreground placeholder:text-muted/50 min-w-0"
          />
          {city ? (
            <button
              type="button"
              onClick={() => {
                setCity('');
                setIsDropdownOpen(true);
              }}
              className="absolute right-2.5 p-1 text-muted hover:text-foreground cursor-pointer transition-colors"
            >
              <X size={13} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="absolute right-2.5 p-1 text-muted hover:text-foreground cursor-pointer transition-colors"
            >
              <ChevronDown size={14} />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown List */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 max-h-52 overflow-y-auto rounded-xl border border-separator bg-surface shadow-md z-30 p-1 divide-y divide-separator/40 animate-in fade-in-50 zoom-in-95">
            {filteredCities.length > 0 ? (
              filteredCities.map((item) => {
                const isSelected = city.toLowerCase() === item.name.toLowerCase();
                return (
                  <button
                    key={`${item.region}-${item.name}`}
                    type="button"
                    onClick={() => {
                      setCity(item.name);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-brand-primary/10 text-brand-primary font-semibold'
                        : 'hover:bg-surface-elevated text-foreground'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-muted shrink-0" />
                      <span>{item.name}</span>
                    </span>
                    <span className="text-[10px] text-muted">{item.region}</span>
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-muted">
                <span>
                  Will use &ldquo;<strong>{city}</strong>&rdquo; as your store location
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick-Pick Popular Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] text-muted mr-1">Popular:</span>
        {POPULAR_CHIPS.map((chip) => {
          const isActive = city.toLowerCase() === chip.toLowerCase();
          return (
            <button
              key={chip}
              type="button"
              onClick={() => {
                setCity(chip);
                setIsDropdownOpen(false);
              }}
              className={`text-[11px] px-2.5 py-0.5 rounded-full border cursor-pointer transition-all ${
                isActive
                  ? 'bg-brand-primary text-white border-brand-primary font-semibold shadow-2xs'
                  : 'bg-surface/80 border-separator/80 text-muted hover:text-foreground hover:bg-surface'
              }`}
            >
              {chip}
            </button>
          );
        })}
      </div>
    </div>
  );
}
