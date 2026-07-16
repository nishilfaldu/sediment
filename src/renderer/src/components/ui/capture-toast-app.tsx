import type { CaptureToastShow } from '@shared/clipboard-capture'
import { type JSX, useEffect, useState } from 'react'

export function CaptureToastApp(): JSX.Element {
  const [toast, setToast] = useState<CaptureToastShow | null>(null)

  useEffect(() => {
    const unsub = window.api.on.captureToastShow((payload) => {
      setToast(payload)
    })
    void window.api.captureToast.ready()
    return unsub
  }, [])

  if (!toast) {
    return <div className="h-screen w-screen bg-transparent" />
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-transparent px-1">
      <div className="flex max-w-full items-center gap-3 bg-primary p-2 pr-3 font-mono text-surface shadow-toast">
        {toast.thumbnailUrl ? (
          <img
            src={toast.thumbnailUrl}
            alt=""
            className="h-14 w-[5.25rem] shrink-0 object-cover"
            draggable={false}
          />
        ) : null}

        <div className="min-w-0 flex-1 py-0.5">
          <p className="truncate text-[12px] font-medium leading-tight">
            {toast.message}
            {toast.tagLabel ? (
              <span className="text-surface/70">
                {' · '}
                {toast.tagLabel}
              </span>
            ) : null}
          </p>
          {toast.detail ? (
            <p className="mt-0.5 truncate text-[11px] leading-tight text-surface/65">
              {toast.detail}
            </p>
          ) : null}
        </div>

        {toast.canUndo && (
          <button
            type="button"
            onClick={() => {
              void window.api.captureToast.undo()
            }}
            className="shrink-0 bg-iron px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.1em] text-surface hover:brightness-110"
          >
            Undo
          </button>
        )}
      </div>
    </div>
  )
}
