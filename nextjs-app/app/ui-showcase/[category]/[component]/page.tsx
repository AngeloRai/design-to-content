'use client';

import dynamic from 'next/dynamic';
import React, { use, useMemo } from 'react';

interface PageProps {
  params: Promise<{
    category: string;
    component: string;
  }>;
}

// Helper to dynamically import components
function DynamicComponentLoader({ category, componentName }: { category: string; componentName: string }) {
  const Component = useMemo(
    () => dynamic(
      async () => {
        try {
          // Try to import from the category folder
          const mod = await import(`@/ui/${category}/${componentName}`);
          // Handle both default and named exports
          return mod.default || mod;
        } catch (error) {
          // Try without category for root level components
          try {
            const mod = await import(`@/ui/${componentName}`);
            return mod.default || mod;
          } catch {
            // Return a fallback component if import fails
            return () => <div className="text-red-500">Component not found: {componentName}</div>;
          }
        }
      },
      {
        loading: () => <div>Loading component...</div>,
        ssr: false
      }
    ),
    [category, componentName]
  );

  // Render without Suspense since dynamic handles loading
  return (
    <div className="p-8 bg-white rounded-lg shadow-lg">
      <Component />
    </div>
  );
}

export default function ComponentDetailPage({ params }: PageProps) {
  const { category, component } = use(params);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <a href="/ui-showcase" className="hover:text-gray-700">UI Showcase</a>
            <span>/</span>
            <span className="capitalize">{category}</span>
            <span>/</span>
            <span>{component}</span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900">{component}</h1>
          <p className="mt-2 text-lg text-gray-600">
            Component from {category}/{component}.tsx
          </p>
        </div>

        <div className="space-y-8">
          {/* Live Preview Section */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Live Preview</h2>
            <div className="bg-gray-100 p-8 rounded-lg">
              <DynamicComponentLoader category={category} componentName={component} />
            </div>
          </section>

          {/* Component Info */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Component Info</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">File Path</dt>
                  <dd className="mt-1 text-sm text-gray-900">ui/{category}/{component}.tsx</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Category</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">{category}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Component Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{component}</dd>
                </div>
              </dl>
            </div>
          </section>
        </div>

        {/* Navigation */}
        <div className="mt-12 flex justify-between">
          <a
            href="/ui-showcase"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            ← Back to Showcase
          </a>
        </div>
      </div>
    </div>
  );
}