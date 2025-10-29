'use client';

import Button from '@/ui/elements/Button';
import Heading from '@/ui/elements/Heading';
import TextInput from '@/ui/elements/TextInput';

export default function TestComponentsPage() {
  return (
    <div className="p-8 space-y-8  mx-auto ">
      <div>
        <h1 className="text-3xl font-bold mb-4">Component Test Page</h1>
        <p className="text-gray-600">Testing Tailwind CSS styling for generated components</p>
      </div>

      {/* Button Component Tests */}
      <section className="space-y-4">
        <Heading level={2}>Button Component</Heading>

        <div className="space-y-2">
          <p className="text-sm text-gray-500">Primary Button:</p>
          <Button variant="primary">Primary Button</Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-500">Secondary Button:</p>
          <Button variant="secondary">Secondary Button</Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-500">Outline Button:</p>
          <Button variant="outline">Outline Button</Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-500">Ghost Button:</p>
          <Button variant="ghost">Ghost Button</Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-500">Destructive Button:</p>
          <Button variant="destructive">Destructive Button</Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-500">Disabled Button:</p>
          <Button variant="primary" disabled>Disabled Button</Button>
        </div>
      </section>

      {/* Heading Component Tests */}
      <section className="space-y-4">
        <Heading level={2}>Heading Component</Heading>

        <div className="space-y-4">
          <Heading level={1}>Level 1 Heading</Heading>
          <Heading level={2}>Level 2 Heading</Heading>
          <Heading level={3}>Level 3 Heading</Heading>
          <Heading level={4}>Level 4 Heading</Heading>
        </div>
      </section>

      {/* TextInput Component Tests */}
      <section className="space-y-4">
        <Heading level={2}>TextInput Component</Heading>

        <div className="space-y-2">
          <p className="text-sm text-gray-500">Default Input:</p>
          <TextInput
            value=""
            placeholder="Enter text here..."
            aria-label="Default input"
            onChange={() => {}}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-500">Input with Value:</p>
          <TextInput
            value="Preset value"
            aria-label="Input with value"
            onChange={() => {}}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-500">Disabled Input:</p>
          <TextInput
            value=""
            placeholder="Disabled input"
            disabled
            aria-label="Disabled input"
            onChange={() => {}}
          />
        </div>
      </section>

      {/* Testing specific Tailwind utilities */}
      <section className="space-y-4">
        <Heading level={2}>Tailwind Utility Tests</Heading>

        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded-md">
            <p>This div should have padding (p-4) and rounded corners (rounded-md)</p>
          </div>

          <div className="px-4 py-2 bg-black text-white rounded-md">
            <p>This div has px-4 py-2 padding and should look like a button</p>
          </div>

          <button className="font-sans font-semibold rounded-md transition-all duration-200 px-4 py-2 bg-black text-white hover:bg-gray-800">
            Native button with same classes as Button component
          </button>
        </div>
      </section>
    </div>
  );
}