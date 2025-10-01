/**
 * UI SHOWCASE PAGE
 *
 * Auto-generated from component inventory
 * Displays all available UI components with examples
 *
 * Generated: 2025-10-01T15:39:25.908Z
 * Total Components: 17
 */

import Link from 'next/link';

import { Badge } from '@/ui/elements/Badge';
import { Button } from '@/ui/elements/Button';
import { IconButton } from '@/ui/elements/IconButton';
import { PlayButton } from '@/ui/elements/PlayButton';
import { Card } from '@/ui/components/Card';
import { ChatBar } from '@/ui/components/ChatBar';
import { ChatButton } from '@/ui/components/ChatButton';
import { CloseIcon } from '@/ui/icons/CloseIcon';
import { Frame633719Icon } from '@/ui/icons/Frame633719Icon';
import { LongArrowIcon } from '@/ui/icons/LongArrowIcon';
import { NounPaint1539578Icon } from '@/ui/icons/NounPaint1539578Icon';
import { PhchatIcon } from '@/ui/icons/PhchatIcon';
import { PlayIcon } from '@/ui/icons/PlayIcon';
import { Property1secondaryCtaIconLeftIcon } from '@/ui/icons/Property1secondaryCtaIconLeftIcon';
import { UnionIcon } from '@/ui/icons/UnionIcon';
import { Vector53Icon } from '@/ui/icons/Vector53Icon';
import { VectorstrokeIcon } from '@/ui/icons/VectorstrokeIcon';

export default function UIShowcasePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">UI Component Library</h1>
          <p className="text-gray-600">
            Showcasing 17 components: 4 elements, 3 components, 0 modules, 10 icons
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </p>
        </header>

        {/* Navigation */}
        <nav className="mb-8 flex gap-4 border-b border-gray-200 pb-4">
          <Link href="#elements" className="text-blue-600 hover:text-blue-800 font-medium">Elements</Link>
          <Link href="#components" className="text-blue-600 hover:text-blue-800 font-medium">Components</Link>
          <Link href="#modules" className="text-blue-600 hover:text-blue-800 font-medium">Modules</Link>
          <Link href="#icons" className="text-blue-600 hover:text-blue-800 font-medium">Icons</Link>
        </nav>

        {/* Elements Section */}
        
        {/* Elements Section */}
        <section id="elements" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Elements</h2>
          <div className="space-y-8">
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Badge</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
              <div className="flex flex-col gap-2">
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <Badge type="numeric"></Badge>
                </div>
                <p className="text-xs text-gray-500">Variant: numeric</p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <Badge type="status"></Badge>
                </div>
                <p className="text-xs text-gray-500">Variant: status</p>
              </div>
              </div>
              
            <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Props:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li><code className="bg-white px-1 py-0.5 rounded">type</code>: <span className="text-gray-500">'numeric' | 'status'</span> <span className="text-red-500">*required</span></li>
                <li><code className="bg-white px-1 py-0.5 rounded">className</code>: <span className="text-gray-500">string</span></li>
              </ul>
            </div>
            </div>


            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Button</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
              <div className="flex flex-col gap-2">
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <Button of="value" variant="solid-black" state="default">Example</Button>
                </div>
                <p className="text-xs text-gray-500">Default configuration</p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <Button of="value" variant="solid-black" state="default" className="shadow-lg">Styled</Button>
                </div>
                <p className="text-xs text-gray-500">With custom styling</p>
              </div>
              </div>
              
            <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Props:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li><code className="bg-white px-1 py-0.5 rounded">of</code>: <span className="text-gray-500">'solid-black'</span> <span className="text-red-500">*required</span></li>
                <li><code className="bg-white px-1 py-0.5 rounded">variant</code>: <span className="text-gray-500">'solid-black' | 'solid-white' | 'outline-black' | 'outline-white' | 'customize'</span> <span className="text-red-500">*required</span></li>
                <li><code className="bg-white px-1 py-0.5 rounded">iconPosition</code>: <span className="text-gray-500">'icon-left' | 'icon-right'</span></li>
                <li><code className="bg-white px-1 py-0.5 rounded">of</code>: <span className="text-gray-500">'default'</span> <span className="text-red-500">*required</span></li>
                <li><code className="bg-white px-1 py-0.5 rounded">state</code>: <span className="text-gray-500">'default' | 'hover' | 'inactive'</span> <span className="text-red-500">*required</span></li>
                <li><code className="bg-white px-1 py-0.5 rounded">className</code>: <span className="text-gray-500">string</span></li>
                <li><code className="bg-white px-1 py-0.5 rounded">iconStart</code>: <span className="text-gray-500">React.ReactNode</span></li>
                <li><code className="bg-white px-1 py-0.5 rounded">iconEnd</code>: <span className="text-gray-500">React.ReactNode</span></li>
              </ul>
            </div>
            </div>


            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">IconButton</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
              <div className="flex flex-col gap-2">
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <IconButton icon="IconComponent" variant="solid"></IconButton>
                </div>
                <p className="text-xs text-gray-500">Default configuration</p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <IconButton icon="IconComponent" variant="solid" className="shadow-lg"></IconButton>
                </div>
                <p className="text-xs text-gray-500">With custom styling</p>
              </div>
              </div>
              
            <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Props:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li><code className="bg-white px-1 py-0.5 rounded">icon</code>: <span className="text-gray-500">string</span> <span className="text-red-500">*required</span></li>
                <li><code className="bg-white px-1 py-0.5 rounded">variant</code>: <span className="text-gray-500">'solid' | 'outline' | 'arrow-right' | 'arrow-left'</span> <span className="text-red-500">*required</span></li>
                <li><code className="bg-white px-1 py-0.5 rounded">className</code>: <span className="text-gray-500">string</span></li>
                <li><code className="bg-white px-1 py-0.5 rounded">size</code>: <span className="text-gray-500">'small'</span></li>
              </ul>
            </div>
            </div>


            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">PlayButton</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
              <div className="flex flex-col gap-2">
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <PlayButton state="default"></PlayButton>
                </div>
                <p className="text-xs text-gray-500">Default configuration</p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <PlayButton state="default" className="shadow-lg"></PlayButton>
                </div>
                <p className="text-xs text-gray-500">With custom styling</p>
              </div>
              </div>
              
            <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Props:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li><code className="bg-white px-1 py-0.5 rounded">state</code>: <span className="text-gray-500">'default' | 'hover'</span> <span className="text-red-500">*required</span></li>
                <li><code className="bg-white px-1 py-0.5 rounded">className</code>: <span className="text-gray-500">string</span></li>
              </ul>
            </div>
            </div>
          </div>
        </section>

        {/* Components Section */}
        
        {/* Components Section */}
        <section id="components" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Components</h2>
          <div className="space-y-8">
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Card</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
              <div className="flex flex-col gap-2">
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <Card content="Example"></Card>
                </div>
                <p className="text-xs text-gray-500">Default configuration</p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <Card content="Example" className="shadow-lg"></Card>
                </div>
                <p className="text-xs text-gray-500">With custom styling</p>
              </div>
              </div>
              
            <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Props:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li><code className="bg-white px-1 py-0.5 rounded">content</code>: <span className="text-gray-500">string</span> <span className="text-red-500">*required</span></li>
                <li><code className="bg-white px-1 py-0.5 rounded">className</code>: <span className="text-gray-500">string</span></li>
              </ul>
            </div>
            </div>


            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">ChatBar</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
              <div className="flex flex-col gap-2">
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <ChatBar message="Example"></ChatBar>
                </div>
                <p className="text-xs text-gray-500">Default configuration</p>
              </div>
              </div>
              
            <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Props:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li><code className="bg-white px-1 py-0.5 rounded">message</code>: <span className="text-gray-500">string</span> <span className="text-red-500">*required</span></li>
              </ul>
            </div>
            </div>


            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">ChatButton</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
              <div className="flex flex-col gap-2">
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <ChatButton children="Content">Example</ChatButton>
                </div>
                <p className="text-xs text-gray-500">Default configuration</p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <ChatButton children="Content" className="shadow-lg">Styled</ChatButton>
                </div>
                <p className="text-xs text-gray-500">With custom styling</p>
              </div>
              </div>
              
            <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Props:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li><code className="bg-white px-1 py-0.5 rounded">children</code>: <span className="text-gray-500">React.ReactNode</span> <span className="text-red-500">*required</span></li>
                <li><code className="bg-white px-1 py-0.5 rounded">className</code>: <span className="text-gray-500">string</span></li>
              </ul>
            </div>
            </div>
          </div>
        </section>

        {/* Modules Section */}
        
        {/* Modules Section */}
        <section id="modules" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Modules</h2>
          <p className="text-gray-500">No modules available yet.</p>
        </section>

        {/* Icons Section */}
        
        {/* Icons Section */}
        <section id="icons" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Icons</h2>
          <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-4">
            
              <div className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <CloseIcon className="w-6 h-6" />
                <span className="text-xs text-gray-600">CloseIcon</span>
              </div>

              <div className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <Frame633719Icon className="w-6 h-6" />
                <span className="text-xs text-gray-600">Frame633719Icon</span>
              </div>

              <div className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <LongArrowIcon className="w-6 h-6" />
                <span className="text-xs text-gray-600">LongArrowIcon</span>
              </div>

              <div className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <NounPaint1539578Icon className="w-6 h-6" />
                <span className="text-xs text-gray-600">NounPaint1539578Icon</span>
              </div>

              <div className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <PhchatIcon className="w-6 h-6" />
                <span className="text-xs text-gray-600">PhchatIcon</span>
              </div>

              <div className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <PlayIcon className="w-6 h-6" />
                <span className="text-xs text-gray-600">PlayIcon</span>
              </div>

              <div className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <Property1secondaryCtaIconLeftIcon className="w-6 h-6" />
                <span className="text-xs text-gray-600">Property1secondaryCtaIconLeftIcon</span>
              </div>

              <div className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <UnionIcon className="w-6 h-6" />
                <span className="text-xs text-gray-600">UnionIcon</span>
              </div>

              <div className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <Vector53Icon className="w-6 h-6" />
                <span className="text-xs text-gray-600">Vector53Icon</span>
              </div>

              <div className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <VectorstrokeIcon className="w-6 h-6" />
                <span className="text-xs text-gray-600">VectorstrokeIcon</span>
              </div>
          </div>
        </section>
      </div>
    </div>
  );
}
