import { ThemeProvider } from 'next-themes'
import { StateProvider } from '@/context/StateContext'
import { I18nProvider } from '@/context/I18nContext'
import { useI18n } from '@/context/I18nContext'
import { Header } from '@/components/layout/Header'
import { SeasonConfig } from '@/components/config/SeasonConfig'
import { RulesCard } from '@/components/config/RulesCard'
import { SpiritsSection } from '@/components/spirits/SpiritsSection'
import { UltimatesSection } from '@/components/ultimates/UltimatesSection'
import { ResultSection } from '@/components/result/ResultSection'

function AppContent() {
  const { t } = useI18n()
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto w-full max-w-[min(64rem,100%-2rem)] px-[clamp(0.75rem,2vw,1.5rem)] py-6 space-y-6 [container-type:inline-size] [container-name:page]">
        <SeasonConfig />
        <RulesCard />
        <SpiritsSection />
        <UltimatesSection />
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">{t('section_result')}</h2>
          <ResultSection />
        </section>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <StateProvider>
        <I18nProvider>
          <AppContent />
        </I18nProvider>
      </StateProvider>
    </ThemeProvider>
  )
}
