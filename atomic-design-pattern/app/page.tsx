export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <main className="flex flex-col items-center gap-6 p-8">
        <h1 className="text-4xl font-bold text-foreground">
          Atomic Design Pattern
        </h1>
        <p className="text-lg text-muted-foreground max-w-md text-center">
          This app contains generated components from the design-to-code system.
          View components in Storybook or the test page.
        </p>
        <div className="flex gap-4 mt-4">
          <a
            href="/test-components"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            View Test Components
          </a>
        </div>
      </main>
    </div>
  );
}
