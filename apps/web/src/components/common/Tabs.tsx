import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div role="tablist" className={`flex items-center gap-5 border-b border-rule ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            className={`-mb-px flex items-center gap-2 border-b-2 py-2 text-data font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
              isActive ? 'border-signal text-ink' : 'border-transparent text-mute hover:text-ink'
            }`}
          >
            {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && <span className="num text-mute">{tab.badge}</span>}
          </button>
        );
      })}
    </div>
  );
};
