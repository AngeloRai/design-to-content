/**
 * LangSmith Configuration
 * Sets up LangSmith tracing for observability
 *
 * Required environment variables:
 * - LANGCHAIN_TRACING_V2=true (enable tracing)
 * - LANGCHAIN_API_KEY=<your-api-key> (from https://smith.langchain.com)
 * - LANGSMITH_WORKSPACE_ID=<workspace-id> (required for org-scoped API keys)
 * - LANGCHAIN_PROJECT=<project-name> (optional, defaults to "design-to-code")
 */

export function configureLangSmith() {
  const tracingEnabled = process.env.LANGCHAIN_TRACING_V2 === 'true';

  if (tracingEnabled) {
    const hasApiKey = !!process.env.LANGCHAIN_API_KEY;
    const workspaceId = process.env.LANGSMITH_WORKSPACE_ID;
    const projectName = process.env.LANGCHAIN_PROJECT || 'design-to-code';

    if (!hasApiKey) {
      console.warn('⚠️  LANGCHAIN_TRACING_V2 is enabled but LANGCHAIN_API_KEY is missing');
      console.warn('   LangSmith tracing will not work. Get your API key from https://smith.langchain.com');
      return { enabled: false };
    }

    if (!workspaceId) {
      console.warn('⚠️  LANGSMITH_WORKSPACE_ID is missing');
      console.warn('   This is required for org-scoped API keys');
      console.warn('   Get your workspace ID from: https://smith.langchain.com/settings');
      console.warn('   Add to .env: LANGSMITH_WORKSPACE_ID=<your-workspace-id>');
      return { enabled: false };
    }

    console.log('✅ LangSmith tracing enabled');
    console.log(`   Workspace: ${workspaceId}`);
    console.log(`   Project: ${projectName}`);
    console.log(`   View traces: https://smith.langchain.com/o/${workspaceId}/projects/p/${projectName}`);
    console.log('');

    return {
      enabled: true,
      workspaceId,
      projectName
    };
  }

  console.log('💡 LangSmith tracing disabled');
  console.log('   To enable: Set LANGCHAIN_TRACING_V2=true and LANGCHAIN_API_KEY in .env');
  console.log('   Get API key: https://smith.langchain.com');
  console.log('');

  return { enabled: false };
}

/**
 * Print LangSmith setup instructions
 */
export function printLangSmithSetup() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 LangSmith Observability Setup');
  console.log('='.repeat(60));
  console.log(`
LangSmith provides detailed tracing and observability for your workflow.

To enable LangSmith:

1. Sign up at https://smith.langchain.com
2. Get your API key and workspace ID from settings
3. Add to your .env file:

   LANGCHAIN_TRACING_V2=true
   LANGCHAIN_API_KEY=<your-api-key>
   LANGSMITH_WORKSPACE_ID=<your-workspace-id>  # Required for org-scoped keys
   LANGCHAIN_PROJECT=design-to-code            # Optional

4. Run your workflow - traces will appear in LangSmith dashboard

Benefits:
- View all LLM calls with inputs/outputs
- Track token usage and costs
- Debug agent reasoning steps
- Monitor performance and errors
- Share traces with team
  `);
  console.log('='.repeat(60) + '\n');
}
