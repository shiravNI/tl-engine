import {
  AlertTriangle,
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  BarChart3,
  Bell,
  Building2,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Eye,
  Filter,
  Flag,
  Flame,
  Folder,
  Gem,
  Heart,
  Inbox,
  Layers,
  Lightbulb,
  Link2,
  Lock,
  MapPin,
  MessageCircle,
  PenLine,
  Plus,
  RotateCw,
  Scissors,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trophy,
  Upload,
  User,
  Users,
  Video,
  X,
  type LucideProps,
} from 'lucide-react'
import type { ComponentType } from 'react'

/**
 * Maps the wireframe's semantic icon names (`#i-pen`, `#i-flame`, …) to
 * lucide-react components, so swapping icon sets later touches this file
 * only.
 */
const registry = {
  bulb: Lightbulb,
  core: Gem,
  send: Send,
  pen: PenLine,
  chart: BarChart3,
  flame: Flame,
  trophy: Trophy,
  users: Users,
  bldg: Building2,
  cal: Calendar,
  bell: Bell,
  search: Search,
  plus: Plus,
  check: Check,
  chev: ChevronRight,
  up: ArrowUp,
  down: ArrowDown,
  spark: Sparkles,
  clock: Clock,
  alert: AlertTriangle,
  lock: Lock,
  user: User,
  heart: Heart,
  msg: MessageCircle,
  eye: Eye,
  switch: ArrowLeftRight,
  filter: Filter,
  flag: Flag,
  shield: ShieldCheck,
  inbox: Inbox,
  video: Video,
  pin: MapPin,
  link: Link2,
  scissors: Scissors,
  folder: Folder,
  upload: Upload,
  refresh: RotateCw,
  layers: Layers,
  close: X,
} satisfies Record<string, ComponentType<LucideProps>>

export type IconName = keyof typeof registry

interface IconProps extends LucideProps {
  name: IconName
}

export function Icon({ name, ...props }: IconProps) {
  const Component = registry[name]
  return <Component {...props} />
}
