import React from 'react'

interface IconProps {
  className?: string
}

export default function PianoIcon({ className = "w-8 h-8" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {/* Piano body */}
      <rect x="4" y="8" width="16" height="12" rx="1" strokeWidth={2} />
      {/* White keys */}
      <line x1="6" y1="8" x2="6" y2="20" strokeWidth={1} />
      <line x1="8" y1="8" x2="8" y2="20" strokeWidth={1} />
      <line x1="10" y1="8" x2="10" y2="20" strokeWidth={1} />
      <line x1="12" y1="8" x2="12" y2="20" strokeWidth={1} />
      <line x1="14" y1="8" x2="14" y2="20" strokeWidth={1} />
      <line x1="16" y1="8" x2="16" y2="20" strokeWidth={1} />
      <line x1="18" y1="8" x2="18" y2="20" strokeWidth={1} />
      {/* Black keys */}
      <rect x="5" y="8" width="1.5" height="6" fill="currentColor" strokeWidth={0} />
      <rect x="7.5" y="8" width="1.5" height="6" fill="currentColor" strokeWidth={0} />
      <rect x="11" y="8" width="1.5" height="6" fill="currentColor" strokeWidth={0} />
      <rect x="13.5" y="8" width="1.5" height="6" fill="currentColor" strokeWidth={0} />
      <rect x="16.5" y="8" width="1.5" height="6" fill="currentColor" strokeWidth={0} />
      {/* Piano legs */}
      <line x1="6" y1="20" x2="6" y2="22" strokeWidth={2} strokeLinecap="round" />
      <line x1="18" y1="20" x2="18" y2="22" strokeWidth={2} strokeLinecap="round" />
    </svg>
  )
}