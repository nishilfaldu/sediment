import { getLinkPresentation, youtubeVideoId } from '@shared/link-presentation'
import type { JSX } from 'react'
import { CardOpenButton } from '@/components/cards/card-open-button'
import { CardThumbnail } from '@/components/cards/card-thumbnail'
import { LinkNote } from '@/components/cards/link-note'
import { PlayIcon } from '@/components/icons/play-icon'
import { SpecimenTag } from '@/components/ui/specimen-tag'
import type { Item } from '@/types'

export interface LinkCardProps {
  item: Item
  onNoteSave?: (note: string | null) => void
}

function domain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function LinkCard({ item, onNoteSave }: LinkCardProps): JSX.Element {
  const url = item.sourceUrl ?? ''
  const presentation = url ? getLinkPresentation(url) : { kind: 'link' as const, tagLabel: 'link' }
  const isVideo = presentation.kind === 'video'
  const hasMeta = Boolean(item.title)

  const ytId = presentation.platform === 'youtube' ? youtubeVideoId(url) : null
  const thumbnail =
    item.thumbnail ?? (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null)

  function open(): void {
    window.open(url, '_blank')
  }

  return (
    <div className="flex flex-col">
      {thumbnail && (
        <CardThumbnail
          src={thumbnail}
          onClick={isVideo ? open : undefined}
          buttonLabel={isVideo ? `Play on ${presentation.tagLabel}` : undefined}
          badge={<SpecimenTag overlay>{presentation.tagLabel}</SpecimenTag>}
          overlay={
            isVideo ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-primary/10">
                <PlayIcon />
              </div>
            ) : undefined
          }
        />
      )}

      <div className="flex flex-col gap-2 p-4">
        {hasMeta ? (
          <p className="text-sm font-medium leading-snug text-primary line-clamp-2">{item.title}</p>
        ) : (
          <p className="text-sm text-muted break-all line-clamp-2">{url}</p>
        )}

        {item.description && (
          <p className="text-xs leading-relaxed text-secondary line-clamp-3">{item.description}</p>
        )}

        {onNoteSave && <LinkNote value={item.content} onSave={onNoteSave} />}

        <div className="flex items-center justify-between pt-1">
          {!thumbnail ? (
            <SpecimenTag>{presentation.tagLabel}</SpecimenTag>
          ) : !isVideo ? (
            <span className="font-mono text-[10.5px] text-muted">{domain(url)}</span>
          ) : (
            <span />
          )}
          <CardOpenButton url={url} />
        </div>
      </div>
    </div>
  )
}
