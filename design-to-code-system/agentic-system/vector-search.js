/**
 * Vector Search
 * Semantic similarity search using OpenAI embeddings
 * Helps find similar components based on descriptions
 */

import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

/**
 * Create vector search from components
 * @param {Array} components - Array of component objects with name, type, etc.
 * @returns {Object} - Object with search() and addComponent() functions
 */
export const createVectorSearch = async (components) => {
  if (!components || components.length === 0) {
    console.log('⚠️  No components provided for vector search');
    return createEmptyVectorSearch();
  }

  try {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "text-embedding-3-small" // Cost-effective model
    });

    // Create searchable text from each component
    const texts = components.map(comp =>
      `${comp.name}: ${comp.type} component located in ${comp.type} folder`
    );

    // Store metadata for retrieval
    const metadatas = components.map(comp => ({
      name: comp.name,
      type: comp.type,
      path: comp.path || '',
      relativePath: comp.relativePath || ''
    }));

    // Create vector store
    const vectorStore = await MemoryVectorStore.fromTexts(
      texts,
      metadatas,
      embeddings
    );

    // Return search interface
    return {
      /**
       * Search for similar components
       * @param {string} query - Search query (e.g., "button with icon")
       * @param {number} k - Number of results to return
       */
      search: async (query, k = 3) => {
        try {
          const results = await vectorStore.similaritySearch(query, k);
          return results.map(r => r.metadata);
        } catch (error) {
          console.error('Vector search error:', error);
          return [];
        }
      },

      /**
       * Add new component to vector store
       * @param {Object} component - Component to add
       */
      addComponent: async (component) => {
        try {
          const text = `${component.name}: ${component.type} component located in ${component.type} folder`;
          await vectorStore.addDocuments([{
            pageContent: text,
            metadata: {
              name: component.name,
              type: component.type,
              path: component.path || '',
              relativePath: component.relativePath || ''
            }
          }]);
        } catch (error) {
          console.error('Error adding component to vector store:', error);
        }
      }
    };
  } catch (error) {
    console.error('Error creating vector search:', error);
    return createEmptyVectorSearch();
  }
};

/**
 * Create empty vector search (fallback)
 */
const createEmptyVectorSearch = () => ({
  search: async (query, k = 3) => {
    console.log(`⚠️  Vector search not available, returning empty results for: "${query}"`);
    return [];
  },
  addComponent: async (component) => {
    console.log(`⚠️  Vector search not available, cannot add: ${component.name}`);
  }
});

/**
 * CLI - Test vector search
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🔍 Testing vector search...\n');

  const testComponents = [
    { name: 'Button', type: 'elements', path: 'ui/elements/Button.tsx' },
    { name: 'CTA', type: 'components', path: 'ui/components/CTA.tsx' },
    { name: 'Input', type: 'elements', path: 'ui/elements/Input.tsx' },
    { name: 'Card', type: 'components', path: 'ui/components/Card.tsx' },
    { name: 'Icon', type: 'icons', path: 'ui/icons/Icon.tsx' }
  ];

  createVectorSearch(testComponents).then(async vectorSearch => {
    console.log('✅ Vector search created\n');

    // Test searches
    const queries = [
      'interactive button element',
      'text input field',
      'container card component'
    ];

    for (const query of queries) {
      console.log(`Query: "${query}"`);
      const results = await vectorSearch.search(query, 2);
      console.log('Results:');
      results.forEach(r => console.log(`  - ${r.name} (${r.type})`));
      console.log('');
    }

    // Test adding component
    console.log('Testing addComponent...');
    await vectorSearch.addComponent({
      name: 'Link',
      type: 'elements',
      path: 'ui/elements/Link.tsx'
    });
    console.log('✅ Component added');

    // Search again
    console.log('\nQuery after adding Link: "clickable link element"');
    const newResults = await vectorSearch.search('clickable link element', 3);
    console.log('Results:');
    newResults.forEach(r => console.log(`  - ${r.name} (${r.type})`));

  }).catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}
