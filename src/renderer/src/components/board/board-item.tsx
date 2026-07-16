import type { JSX } from 'react'
import { useRef, useState } from 'react'
import { TextBlock } from '@/components/blocks/text-block'
import type { BoardItemProps } from '@/components/board/board-item-types'
import { ItemCard } from '@/components/cards/item-card'
import { CloseIcon } from '@/components/icons/close-icon'
import { ContextMenu, type ContextMenuEntry } from '@/components/ui/context-menu'
import { useBoardItemHighlight } from '@/hooks/use-board-item-highlight'
import { useShareActions } from '@/hooks/use-share-actions'

export type { BoardItemProps } from '@/components/board/board-item-types'

export function BoardItem({
  item,
  onDelete,
  onUpdate,
  onNoteSave,
  selected = false,
  onToggleSelect,
  autoFocus
}: BoardItemProps): JSX.Element {
  const elementRef = useRef<HTMLDivElement>(null)
  const { flash, isRecent } = useBoardItemHighlight(item._id, elementRef)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const share = useShareActions({ type: 'items', ids: [item._id] })

  function handleContextMenu(e: React.MouseEvent): void {
    e.preventDefault()
    const MENU_W = 180
    const MENU_H = 220
    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - MENU_W),
      y: Math.min(e.clientY, window.innerHeight - MENU_H)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent): void {
    if (e.key !== 'Delete' && e.key !== 'Backspace') return
    if ((e.target as HTMLElement).closest('textarea,input,[contenteditable]')) return
    e.preventDefault()
    onDelete()
  }

  function handleClick(e: React.MouseEvent): void {
    if (!onToggleSelect) return
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault()
      onToggleSelect()
    }
  }

  function closeMenu(): void {
    setContextMenu(null)
  }

  function menuEntries(): ContextMenuEntry[] {
    return [
      {
        type: 'action',
        id: 'copy-friend',
        label: 'Copy for a friend',
        onClick: () => {
          closeMenu()
          void share.copyForFriend()
        }
      },
      {
        type: 'action',
        id: 'copy-md',
        label: 'Copy as Markdown',
        onClick: () => {
          closeMenu()
          void share.copyMarkdown()
        }
      },
      { type: 'separator', id: 'sep-share' },
      {
        type: 'action',
        id: 'chatgpt',
        label: 'Open in ChatGPT',
        onClick: () => {
          closeMenu()
          share.openInAi('chatgpt')
        }
      },
      {
        type: 'action',
        id: 'claude',
        label: 'Open in Claude',
        onClick: () => {
          closeMenu()
          share.openInAi('claude')
        }
      },
      { type: 'separator', id: 'sep-delete' },
      {
        type: 'action',
        id: 'delete',
        label: 'Delete',
        danger: true,
        onClick: () => {
          closeMenu()
          onDelete()
        }
      }
    ]
  }

  const shellClass = [
    'group relative outline-none',
    flash ? 'ring-2 ring-moss ring-offset-2 ring-offset-surface' : 'min-w-0',
    selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface' : '',
    isRecent ? 'animate-item-enter' : ''
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <div
        ref={elementRef}
        data-item-id={item._id}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: focusable for keyboard delete
        tabIndex={0}
        className={shellClass}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
      >
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete"
          className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center border border-ui bg-card/95 text-muted opacity-0 transition-opacity hover:border-iron hover:text-iron group-hover:opacity-100 group-focus-within:opacity-100"
        >
          <CloseIcon />
        </button>

        {item.type === 'text' ? (
          <div className="border border-ui bg-card p-4 shadow-hard">
            <TextBlock
              item={item}
              onSave={onUpdate ?? (() => undefined)}
              onEmpty={onDelete}
              autoFocus={autoFocus}
            />
          </div>
        ) : (
          <div className="overflow-hidden border border-ui bg-card shadow-hard transition-shadow hover:shadow-hard-hover">
            <ItemCard item={item} onNoteSave={onNoteSave} />
          </div>
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          entries={menuEntries()}
          onDismiss={closeMenu}
        />
      )}
    </>
  )
}
