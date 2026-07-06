import type { JSX } from 'react'
import type { WorkspaceTab } from '@/stores/workspace-tab'

export interface WorkspaceTabsProps {
  active: WorkspaceTab
  onChange: (tab: WorkspaceTab) => void
}

const TABS: { id: WorkspaceTab; label: string }[] = [
  { id: 'links', label: 'Links' },
  { id: 'notes', label: 'Notes' }
]

export function WorkspaceTabs({ active, onChange }: WorkspaceTabsProps): JSX.Element {
  return (
    <div className="flex justify-center gap-10">
      {TABS.map((tab) => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`border-b-2 pb-1.5 font-mono text-[12px] uppercase tracking-[0.2em] transition-colors ${
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-secondary'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
