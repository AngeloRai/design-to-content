/**
 * Autonomous Agent
 * Single agent that decides how to generate components using available tools
 */

import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { scanReferenceComponents } from '../tools/reference-scanner.js';
import { createVectorSearch } from '../tools/vector-search.js';
import { buildRegistry } from '../tools/registry.js';
import { AGENT_SYSTEM_PROMPT } from './prompts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy-load OpenAI client to ensure env vars are loaded first
let client = null;
const getClient = () => {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return client;
};

/**
 * Tool definitions for OpenAI function calling
 */
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'find_similar_components',
      description: 'Search reference components semantically to find similar patterns. Use this to discover which reference components match your design needs.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Semantic search query describing the component you need (e.g., "primary button with variants", "card with image and text")'
          },
          limit: {
            type: 'number',
            description: 'Number of results to return (default: 3)',
            default: 3
          }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read a file from the filesystem. Use this to read reference component code to understand implementation patterns.',
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Absolute or relative path to the file'
          }
        },
        required: ['file_path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'write_component',
      description: 'Write a generated component to the filesystem. Use this when you have finalized the component code.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Component name (e.g., "PrimaryButton")'
          },
          type: {
            type: 'string',
            description: 'Folder type: elements (for atoms), components (for molecules), modules (for organisms), or icons',
            enum: ['elements', 'components', 'modules', 'icons']
          },
          code: {
            type: 'string',
            description: 'Complete component code including imports'
          }
        },
        required: ['name', 'type', 'code']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'validate_typescript',
      description: 'Validate TypeScript compilation for a file. Use this to check for type errors before finalizing.',
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Path to the file to validate'
          }
        },
        required: ['file_path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_registry',
      description: 'Get the current registry of generated components. Use this to check what components exist for imports.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  }
];

/**
 * Tool execution handlers (functional approach)
 */
const createToolExecutor = (vectorSearch, registry, outputDir) => {
  const tools = {
    async find_similar_components({ query, limit = 3 }) {
      const results = await vectorSearch.search(query, limit);
      console.log("🚀 ~ find_similar_components ~ results:", results)
      return {
        query,
        results: results.map(r => ({
          name: r.name,
          type: r.type,
          path: r.relativePath,
          description: r.description,
          purpose: r.purpose,
          isInteractive: r.isInteractive,
          hasVariants: r.hasVariants
        }))
      };
    },

    async read_file({ file_path }) {
      try {
        const content = await fs.readFile(file_path, 'utf-8');
        return {
          path: file_path,
          content,
          success: true
        };
      } catch (error) {
        return {
          path: file_path,
          error: error.message,
          success: false
        };
      }
    },

    async write_component({ name, type, code }) {
      try {
        const fileName = `${name}.tsx`;
        const dir = path.join(outputDir, type);
        await fs.mkdir(dir, { recursive: true });

        const filePath = path.join(dir, fileName);
        await fs.writeFile(filePath, code, 'utf-8');

        return {
          name,
          type,
          path: filePath,
          success: true
        };
      } catch (error) {
        return {
          name,
          type,
          error: error.message,
          success: false
        };
      }
    },

    async validate_typescript({ file_path }) {
      try {
        // Run tsc from design-to-code-system where TypeScript is installed
        // Must explicitly pass --jsx and --esModuleInterop flags for React/JSX support
        const designToCodeDir = path.resolve(__dirname, '..', '..');
        const projectRoot = path.resolve(outputDir, '..');

        // Run TypeScript compiler with explicit flags
        const output = execSync(
          `cd ${projectRoot} && npx --prefix ${designToCodeDir} tsc --noEmit --jsx react-jsx --esModuleInterop ${file_path} 2>&1`,
          {
            encoding: 'utf-8',
            shell: '/bin/bash'
          }
        );

        return {
          path: file_path,
          valid: true,
          output: output || 'No TypeScript errors'
        };
      } catch (error) {
        return {
          path: file_path,
          valid: false,
          errors: error.stdout || error.message
        };
      }
    },

    async get_registry() {
      return {
        components: registry.components,
        importMap: registry.importMap
      };
    }
  };

  return {
    execute: async (toolName, toolInput) => {
      if (typeof tools[toolName] === 'function') {
        return await tools[toolName](toolInput);
      }
      throw new Error(`Unknown tool: ${toolName}`);
    }
  };
};

/**
 * Run autonomous agent
 */
export const runAgent = async (structuredAnalysis, outputDir = '../nextjs-app/ui') => {
  console.log('🤖 Starting autonomous agent...\n');

  // 1. Initialize resources
  console.log('📦 Initializing resources...');
  const referenceComponents = await scanReferenceComponents(null, false);
  const vectorSearch = await createVectorSearch(referenceComponents);
  const registry = await buildRegistry(outputDir);
  console.log(`✅ Loaded ${referenceComponents.length} reference components\n`);

  // 2. Setup agent tools
  const toolExecutor = createToolExecutor(vectorSearch, registry, outputDir);

  // 3. Setup conversation with structured component data
  const systemPrompt = await AGENT_SYSTEM_PROMPT();

  // Format component list for agent
  const componentSummary = structuredAnalysis.components.map((comp, i) =>
    `${i + 1}. ${comp.name} (${comp.atomicLevel} - ${comp.type}): ${comp.description}`
  ).join('\n');

  const messages = [
    {
      role: 'system',
      content: systemPrompt
    },
    {
      role: 'user',
      content: `Generate React components following the ATOMIC DESIGN pattern based on this structured analysis from Figma:

📊 ANALYSIS SUMMARY:
- Total Components Identified: ${structuredAnalysis.analysis.totalComponents}
- Sections: ${structuredAnalysis.analysis.sections.map(s => `${s.name} (${s.componentCount} components)`).join(', ')}

🔬 COMPONENT LIST (from Figma analysis):
${componentSummary}

⚠️ CRITICAL INSTRUCTIONS:

1. **Component Consolidation**:
   - Review the list above and group related components intelligently
   - If components differ only in styling/size/color → consolidate into ONE file with variant props
   - Example: "PrimaryButton", "SecondaryButton", "OutlineButton" → Button.tsx with variant prop
   - If components have different behavior/structure → separate files
   - Example: TextInput vs SelectDropdown → separate files

2. **File Organization (CRITICAL - use correct type parameter)**:
   - **Atoms** → type='elements' (Button.tsx, Input.tsx, Heading.tsx)
   - **Molecules** → type='components' (SearchBar.tsx, FormField.tsx)
   - **Organisms** → type='modules' (Navigation.tsx, Header.tsx)
   - Use PascalCase for file names
   - One component per file (but multiple variants per component via props)

3. **Component Quality**:
   - Each component must be standalone and reusable
   - Include ALL variants, states, and visual properties from specs
   - Follow reference patterns (use find_similar_components)
   - Use TypeScript properly
   - Use Tailwind for all styling

4. **Process**:
   - Start by analyzing which components to consolidate
   - For each component/group, find similar reference patterns
   - Generate the component with all variants
   - Validate TypeScript
   - Move to next component

FULL COMPONENT SPECIFICATIONS:
${JSON.stringify(structuredAnalysis.components, null, 2)}

Begin by planning which components to consolidate, then generate them systematically.`
    }
  ];

  let continueLoop = true;
  let iterationCount = 0;
  const maxIterations = 50; // Safety limit - increased for multi-component generation

  console.log('💭 Agent thinking...\n');

  // 4. Agent loop - keep going until agent says it's done
  while (continueLoop && iterationCount < maxIterations) {
    iterationCount++;

    console.log(`\n📨 Iteration ${iterationCount} - Sending ${messages.length} messages to GPT-4o...\n`);

    const response = await getClient().chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools: TOOLS,
      tool_choice: 'auto'
    });

    const message = response.choices[0].message;
    messages.push(message);

    // Process response
    if (message.content) {
      console.log(`\n💬 Agent: ${message.content}\n`);
    }

    if (message.tool_calls) {
      // Execute all tool calls
      for (const toolCall of message.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        console.log(`🔧 Using tool: ${functionName}`);
        console.log(`   Input: ${JSON.stringify(functionArgs, null, 2)}`);

        // Execute tool
        const result = await toolExecutor.execute(functionName, functionArgs);
        console.log(`   Result: ${JSON.stringify(result, null, 2).slice(0, 200)}${JSON.stringify(result).length > 200 ? '...' : ''}\n`);

        // CRITICAL: If write_component was called, auto-validate immediately
        if (functionName === 'write_component' && result.success) {
          console.log('   🔍 Auto-validating component...');
          const filePath = path.relative(path.resolve(outputDir, '..'), result.path);
          const validation = await toolExecutor.execute('validate_typescript', { file_path: filePath });

          if (validation.valid) {
            console.log('   ✅ Validation passed - component is complete\n');
            // Add validation result to the tool response
            result.validated = true;
            result.validation = 'passed';
          } else {
            console.log('   ❌ Validation failed - fix required before proceeding\n');
            console.log(`   Errors: ${validation.errors?.split('\n').slice(0, 3).join('\n   ')}\n`);

            // Embed validation failure in the result
            result.validated = false;
            result.validation = 'failed';
            result.validationErrors = validation.errors;
            result.message = `⚠️ VALIDATION FAILED - TypeScript errors must be fixed before proceeding:\n\n${validation.errors}\n\nUse write_component again with corrected code.`;
          }
        }

        // Add tool result to conversation
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result)
        });
      }
    } else {
      // No tool calls, agent is done
      continueLoop = false;
      console.log('✅ Agent completed task\n');
    }
  }

  if (iterationCount >= maxIterations) {
    console.log('⚠️  Reached maximum iterations limit\n');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Conversation Summary:');
  console.log('='.repeat(60));
  messages.forEach((msg, i) => {
    if (msg.role === 'system') {
      console.log(`\n[${i}] SYSTEM: ${msg.content.substring(0, 100)}...`);
    } else if (msg.role === 'user') {
      console.log(`\n[${i}] USER: ${msg.content.substring(0, 100)}...`);
    } else if (msg.role === 'assistant') {
      console.log(`\n[${i}] ASSISTANT:`);
      if (msg.content) console.log(`   Content: ${msg.content.substring(0, 100)}...`);
      if (msg.tool_calls) console.log(`   Tool calls: ${msg.tool_calls.map(t => t.function.name).join(', ')}`);
    } else if (msg.role === 'tool') {
      console.log(`\n[${i}] TOOL RESULT: ${msg.content.substring(0, 100)}...`);
    }
  });
  console.log('\n' + '='.repeat(60) + '\n');

  // Count actual generated components
  const finalRegistry = await buildRegistry(outputDir);

  return {
    success: true,
    iterations: iterationCount,
    messages,
    componentsGenerated: finalRegistry.components.length
  };
};

export default runAgent;
