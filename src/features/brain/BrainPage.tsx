import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/icons/Icon'
import { Pill } from '@/components/primitives/Pill'
import { Button } from '@/components/primitives/Button'
import { DashedPlaceholder } from '@/components/primitives/DashedPlaceholder'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/primitives/Tabs'
import { IdeaCard } from '@/components/content/IdeaCard'
import { DraftCard } from '@/components/content/DraftCard'
import { useContent } from '@/state/ContentContext'
import { selectActiveDrafts, selectActiveIdeas } from '@/features/brain/brainFilters'

/** The "bucket" view of everything still active — saved ideas not yet
 * turned into a draft, and drafts not yet published or archived. Separate
 * from the working dashboard, which caps/filters both lists for a
 * compact, todo-shaped view; this page is the uncapped, full-inventory
 * counterpart. `Tabs.tsx`'s first real consumer. */
export function BrainPage() {
  const navigate = useNavigate()
  const { ideas, drafts } = useContent()

  const activeIdeas = selectActiveIdeas(ideas)
  const activeDrafts = selectActiveDrafts(drafts)

  return (
    <div className="flex flex-col gap-4.5 px-7 py-6">
      <div>
        <p className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">Brain</p>
        <h1 className="text-[26px] font-bold tracking-tight">Ideas &amp; drafts, all in one place</h1>
        <p className="mt-1.5 text-[13px] text-body">
          Everything active, not yet posted — Archive is for what went stale.
        </p>
      </div>

      <TabsRoot defaultValue="ideas">
        <TabsList className="border-b border-border-soft">
          <TabsTrigger value="ideas" className="flex items-center gap-2">
            <Icon name="bulb" className="h-[15px] w-[15px]" />
            Ideas
            <Pill>{activeIdeas.length}</Pill>
          </TabsTrigger>
          <TabsTrigger value="drafts" className="flex items-center gap-2">
            <Icon name="pen" className="h-[15px] w-[15px]" />
            Drafts
            <Pill>{activeDrafts.length}</Pill>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ideas" className="mt-4 grid grid-cols-3 gap-3">
          {activeIdeas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
          {activeIdeas.length === 0 && (
            <DashedPlaceholder className="col-span-3 p-6 text-center">
              No ideas yet — brain-dump one from the Create dashboard.
            </DashedPlaceholder>
          )}
        </TabsContent>

        <TabsContent value="drafts" className="mt-4 grid grid-cols-3 gap-3">
          {activeDrafts.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              actions={
                <Button size="sm" variant="secondary" onClick={() => navigate(`/create/drafts/${draft.id}`)}>
                  Edit
                </Button>
              }
            />
          ))}
          {activeDrafts.length === 0 && (
            <DashedPlaceholder className="col-span-3 p-6 text-center">
              No drafts waiting — everything's either published or archived.
            </DashedPlaceholder>
          )}
        </TabsContent>
      </TabsRoot>
    </div>
  )
}
