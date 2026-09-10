import { useState } from 'react'
import { Card } from '@/components/primitives/Card'
import { Pill } from '@/components/primitives/Pill'
import { Button } from '@/components/primitives/Button'
import { ProgressBar } from '@/components/primitives/ProgressBar'
import { Avatar } from '@/components/primitives/Avatar'
import { Skeleton } from '@/components/primitives/Skeleton'
import { Switcher } from '@/components/primitives/Switcher'
import { DashedPlaceholder } from '@/components/primitives/DashedPlaceholder'
import { Checkbox } from '@/components/primitives/Checkbox'
import { Dialog } from '@/components/primitives/Dialog'
import { Tooltip } from '@/components/primitives/Tooltip'
import { Icon } from '@/components/icons/Icon'

/** Throwaway route for eyeballing every primitive in isolation before
 * wiring real screens. Not linked from the app chrome. */
export function PrimitivesSanityPage() {
  const [checked, setChecked] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [tab, setTab] = useState<'a' | 'b'>('a')

  return (
    <div className="flex flex-col gap-6 p-8">
      <h1 className="text-2xl font-bold">Primitives sanity check</h1>

      <section className="flex flex-wrap gap-3">
        <Pill>Neutral</Pill>
        <Pill tone="accent">Accent</Pill>
        <Pill tone="success">Success</Pill>
        <Pill tone="warn">Warn</Pill>
        <Pill tone="danger">Danger</Pill>
      </section>

      <section className="flex flex-wrap gap-3">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="soft">Soft</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
      </section>

      <Card className="w-80 p-4">
        <ProgressBar value={62} />
      </Card>

      <section className="flex items-center gap-2">
        <Avatar initials="SH" />
        <Avatar initials="DL" tone="neutral" />
        <Avatar initials="MK" tone="warn" size={40} />
      </section>

      <section className="flex w-80 flex-col gap-2">
        <Skeleton width={140} height={12} />
        <Skeleton height={60} rounded="md" />
      </section>

      <Switcher
        value={tab}
        onChange={setTab}
        options={[
          { value: 'a', label: 'Tab A' },
          { value: 'b', label: 'Tab B' },
        ]}
      />

      <DashedPlaceholder className="h-24 w-64">Dashed placeholder</DashedPlaceholder>

      <Checkbox checked={checked} onCheckedChange={setChecked} aria-label="sample" />

      <Tooltip content="A helpful tooltip">
        <Button variant="secondary">Hover me</Button>
      </Tooltip>

      <Button variant="secondary" onClick={() => setDialogOpen(true)}>
        Open dialog
      </Button>
      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Sample dialog"
        description="Radix Dialog skinned with Tailwind."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setDialogOpen(false)}>
              Confirm
            </Button>
          </>
        }
      />

      <section className="flex flex-wrap gap-2">
        {(['bulb', 'pen', 'flame', 'trophy', 'chart', 'send'] as const).map((name) => (
          <Icon key={name} name={name} className="h-5 w-5" />
        ))}
      </section>
    </div>
  )
}
