import React from 'react'

interface IconProps {
  className?: string
}

export default function LogoLight({ className = "h-14 w-auto" }: IconProps) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 2145.97 2500"
      fill="currentColor"
    >
      <path
        d="M2041.47,818a355.41,355.41,0,0,0-252.14-104.5h-66.57a356.87,356.87,0,0,1-335.63-235.59,29.91,29.91,0,0,1-1.3-3.72A713.28,713.28,0,0,0,1217.92,209C1088.88,80,910.56,0,713.46,0,516.55,0,338.05,80,209,209,80,338.23,0,516.55,0,713.46V2435.11A64.84,64.84,0,0,0,64.9,2500H2081.07a64.84,64.84,0,0,0,64.9-64.89V1070.29A355.09,355.09,0,0,0,2041.47,818ZM1073.08,2142.25,357.76,1427.11H1788.21Z"
        fill="#3a5d4b"
      />
    </svg>
  )
}