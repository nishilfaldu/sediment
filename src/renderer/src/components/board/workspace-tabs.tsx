import type { JSX } from 'react'
import { useLayoutEffect, useRef, useState } from 'react'
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
  const containerRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Partial<Record<WorkspaceTab, HTMLButtonElement>>>({})
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  useLayoutEffect(() => {
    const button = tabRefs.current[active]
    const container = containerRef.current
    if (!button || !container) return
    setIndicator({
      left: button.offsetLeft - container.offsetLeft,
      width: button.offsetWidth
    })
  }, [active])

  return (
    <div className="flex justify-center px-6 pb-3 pt-5">
      <div
        ref={containerRef}
        className="relative inline-flex rounded-full border border-stone-200/80 bg-white p-1.5 shadow-md dark:border-stone-700 dark:bg-stone-900"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute top-1.5 bottom-1.5 rounded-full bg-stone-900 shadow-sm transition-[left,width] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] dark:bg-stone-100"
          style={{ left: indicator.left, width: indicator.width }}
        />
        {TABS.map((tab) => {
          const isActive = tab.id === active
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[tab.id] = el ?? undefined
              }}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`relative z-10 min-w-[8.5rem] rounded-full px-10 py-3 text-[15px] font-medium transition-colors duration-300 ${
                isActive
                  ? 'text-white dark:text-stone-900'
                  : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
