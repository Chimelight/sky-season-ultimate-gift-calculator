import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/context/I18nContext'
import { useAppState } from '@/context/StateContext'
import { genPost } from '@/lib/genPost'
import type { Rules, Spirit } from '@/data/seasons'
import type { SolveResult } from '@/lib/solver'

export function DiscordPost({ result, spirits, rules }: { result: SolveResult; spirits: Spirit[]; rules: Rules }) {
  const { t, lang } = useI18n()
  const { state } = useAppState()
  const [copied, setCopied] = useState(false)

  const post = genPost({
    seasonName: state.seasonName,
    startDate: state.startDate,
    rules: rules,
    spirits: spirits,
    best: result.best,
    cumHearts: result.cumHearts,
    targetIdx: result.targetIdx,
    lang,
    t,
  })

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(post)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = post
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    }
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{t('section_discord')}</h3>
      <Card>
        <CardHeader>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleCopy}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? t('copy_copied') : t('btn_copy')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words font-mono bg-muted/50 rounded-md p-3 max-h-80 overflow-y-auto">
            {post}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
