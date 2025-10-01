import { getUiFiles } from '@/utils/getUiFiles';
import Link from 'next/link';

export default function UiShowcasePage() {
  const components = getUiFiles();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">UI Components Showcase</h1>
          <p className="mt-2 text-lg text-gray-600">
            All components in the /ui directory
          </p>
        </div>

        {Object.entries(components).map(([category, files]) => (
          <div key={category} className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 capitalize">
              {category === 'root' ? 'Root Level' : category.replace(/-/g, ' ')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {files.map((file) => (
                <div
                  key={file.path}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {file.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {file.path}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {file.hasProps && (
                      <div className="flex items-center text-sm">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-700">
                          Props: {file.propsName}
                        </span>
                      </div>
                    )}

                    <div className="text-xs text-gray-600 font-mono bg-gray-100 p-2 rounded overflow-hidden">
                      <pre className="whitespace-pre-wrap break-all">
                        {file.preview.substring(0, 100)}...
                      </pre>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Link
                      href={`/ui-showcase/${category}/${file.name}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Component →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-12 p-6 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Total Categories:</span>
              <span className="ml-2 text-gray-900">{Object.keys(components).length}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Total Components:</span>
              <span className="ml-2 text-gray-900">
                {Object.values(components).reduce((acc, files) => acc + files.length, 0)}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">With Props:</span>
              <span className="ml-2 text-gray-900">
                {Object.values(components).flat().filter(f => f.hasProps).length}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Categories:</span>
              <span className="ml-2 text-gray-900">
                {Object.keys(components).filter(c => c !== 'root').join(', ')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}