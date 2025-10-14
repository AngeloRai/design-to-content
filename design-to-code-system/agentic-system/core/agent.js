/**
 * Autonomous Agent
 * Single agent that decides how to generate components using available tools
 */

import 'dotenv/config';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { scanReferenceComponents } from '../tools/reference-scanner.js';
import { createVectorSearch } from '../tools/vector-search.js';
import { buildRegistry } from '../tools/registry.js';
import { AGENT_SYSTEM_PROMPT } from './prompts.js';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
            description: 'Component type: elements, components, modules, or icons',
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
        // Run TypeScript compiler check
        const output = execSync(`npx tsc --noEmit ${file_path} 2>&1`, {
          encoding: 'utf-8',
          cwd: path.dirname(outputDir)
        });

        return {
          path: file_path,
          valid: true,
          output: output || 'No errors'
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
export const runAgent = async (designSpec, outputDir = '../nextjs-app/ui') => {
  console.log('🤖 Starting autonomous agent...\n');

  // 1. Initialize resources
  console.log('📦 Initializing resources...');
  const referenceComponents = await scanReferenceComponents(null, false);
  const vectorSearch = await createVectorSearch(referenceComponents);
  const registry = await buildRegistry(outputDir);
  console.log(`✅ Loaded ${referenceComponents.length} reference components\n`);

  // 2. Setup agent tools
  const toolExecutor = createToolExecutor(vectorSearch, registry, outputDir);

  // 3. Setup conversation
  const systemPrompt = await AGENT_SYSTEM_PROMPT();
  const messages = [
    {
      role: 'system',
      content: systemPrompt
    },
    {
      role: 'user',
      content: `Generate a React component based on this design specification:\n\n${designSpec}`
    }
  ];

  let continueLoop = true;
  let iterationCount = 0;
  const maxIterations = 15; // Safety limit

  console.log('💭 Agent thinking...\n');

  // 4. Agent loop - keep going until agent says it's done
  while (continueLoop && iterationCount < maxIterations) {
    iterationCount++;

    console.log(`\n📨 Iteration ${iterationCount} - Sending ${messages.length} messages to GPT-4o...\n`);

    const response = await client.chat.completions.create({
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

  return {
    success: true,
    iterations: iterationCount,
    messages
  };
};

export default runAgent;
