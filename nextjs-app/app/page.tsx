import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-8 py-16">
        <div className="text-center space-y-8">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
            🎨 AI Design System
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            A component library automatically generated from Figma designs using AI-powered analysis and code generation.
          </p>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/geg"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                📱 Component Gallery
              </Link>

              <a
                href="https://github.com/anthropics/claude-code"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 hover:bg-gray-900 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                📚 Documentation
              </a>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Generated Components
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-300">
              <div>✅ Buttons</div>
              <div>✅ Text Inputs</div>
              <div>✅ Checkboxes</div>
              <div>✅ Radio Buttons</div>
              <div>✅ Switches</div>
              <div>✅ Sliders</div>
              <div>✅ Badges</div>
              <div>✅ Avatars</div>
              <div>✅ Alerts</div>
              <div>✅ Text Areas</div>
              <div>✅ Select Dropdowns</div>
              <div>✅ Icons</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}