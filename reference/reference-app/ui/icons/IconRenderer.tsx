import React from 'react'
import MusicIcon from './MusicIcon'
import CraftsmanIcon from './CraftsmanIcon'
import ServiceIcon from './ServiceIcon'
import HeartIcon from './HeartIcon'
import PianoIcon from './PianoIcon'
import GrandPianoIcon from './GrandPianoIcon'
import PlayingPianoIcon from './PlayingPianoIcon'
import ChevronLeft from './ChevronLeft'
import ChevronRight from './ChevronRight'
import Instagram from './Instagram'
import Facebook from './Facebook'
import YouTube from './YouTube'
import Twitter from './Twitter'
import Menu from './Menu'
import X from './X'

// Icon mapping
const iconMap = {
  music: MusicIcon,
  craftsman: CraftsmanIcon,
  service: ServiceIcon,
  heart: HeartIcon,
  piano: PianoIcon,
  grandPiano: GrandPianoIcon,
  playingPiano: PlayingPianoIcon,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  instagram: Instagram,
  facebook: Facebook,
  youtube: YouTube,
  twitter: Twitter,
  menu: Menu,
  x: X,
} as const

export type IconName = keyof typeof iconMap

interface IconRendererProps {
  name: IconName
  className?: string
}

export default function IconRenderer({ name, className }: IconRendererProps) {
  const IconComponent = iconMap[name]
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in iconMap`)
    return null
  }
  
  return <IconComponent className={className} />
}

// Export the type for use in other components
export { type IconName as IconType }