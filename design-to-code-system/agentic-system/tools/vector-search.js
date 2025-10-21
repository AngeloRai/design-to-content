/**
 * Vector Search
 * Semantic similarity search using OpenAI embeddings
 * Helps find similar components based on descriptions
 */

import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";

/**
 * Calculate cosine similarity between two vectors
 */
const cosineSimilarity = (a, b) => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Create simple in-memory vector store using closures
 * MemoryVectorStore was removed in langchain v1.0
 */
const createSimpleVectorStore = async (texts, metadatas, embeddings) => {
  // Convert texts to documents
  const documents = texts.map((text, i) => new Document({
    pageContent: text,
    metadata: metadatas[i]
  }));

  // Generate embeddings for all documents
  const documentTexts = documents.map(d => d.pageContent);
  const vectors = await embeddings.embedDocuments(documentTexts);

  // Mutable state captured in closure
  let storedDocuments = [...documents];
  let storedVectors = [...vectors];

  // Return API with closure over mutable state
  return {
    async similaritySearch(query, k = 3) {
      if (storedDocuments.length === 0) return [];

      const queryVector = await embeddings.embedQuery(query);

      // Calculate similarities
      const similarities = storedVectors.map((vec, i) => ({
        index: i,
        similarity: cosineSimilarity(queryVector, vec)
      }));

      // Sort and return top k
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, k)
        .map(s => storedDocuments[s.index]);
    },

    async addDocuments(newDocs) {
      const newTexts = newDocs.map(d => d.pageContent);
      const newVectors = await embeddings.embedDocuments(newTexts);

      storedDocuments = [...storedDocuments, ...newDocs];
      storedVectors = [...storedVectors, ...newVectors];
    }
  };
};

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

    // Create rich searchable text from each component
    const texts = components.map(comp => {
      const parts = [
        comp.name,
        comp.type,
        comp.description || '',
        comp.purpose || '',
        comp.props?.join(', ') || '',
        comp.hasVariants ? 'has variants' : '',
        comp.isInteractive ? 'interactive' : '',
        comp.dependencies?.join(', ') || '',
        // New enriched fields for better semantic matching
        comp.variants?.length ? `variants: ${comp.variants.join(' ')}` : '',
        comp.sizes?.length ? `sizes: ${comp.sizes.join(' ')}` : '',
        comp.states?.length ? `states: ${comp.states.join(' ')}` : '',
        comp.features?.length ? `features: ${comp.features.join(' ')}` : '',
        comp.patterns?.length ? `patterns: ${comp.patterns.join(' ')}` : ''
      ].filter(Boolean);

      return parts.join(' ');
    });

    // Store enriched metadata for retrieval
    const metadatas = components.map(comp => ({
      name: comp.name,
      type: comp.type,
      path: comp.path || '',
      relativePath: comp.relativePath || '',
      description: comp.description || '',
      props: comp.props || [],
      hasVariants: comp.hasVariants || false,
      isInteractive: comp.isInteractive || false,
      dependencies: comp.dependencies || [],
      purpose: comp.purpose || '',
      variants: comp.variants || [],
      sizes: comp.sizes || [],
      states: comp.states || [],
      features: comp.features || [],
      patterns: comp.patterns || []
    }));

    // Create vector store using our functional implementation
    // (MemoryVectorStore was removed in LangChain v1.0)
    const vectorStore = await createSimpleVectorStore(
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
          // Build rich text for new component
          const parts = [
            component.name,
            component.type,
            component.description || '',
            component.purpose || '',
            component.props?.join(', ') || '',
            component.hasVariants ? 'has variants' : '',
            component.isInteractive ? 'interactive' : '',
            component.dependencies?.join(', ') || '',
            // New enriched fields
            component.variants?.length ? `variants: ${component.variants.join(' ')}` : '',
            component.sizes?.length ? `sizes: ${component.sizes.join(' ')}` : '',
            component.states?.length ? `states: ${component.states.join(' ')}` : '',
            component.features?.length ? `features: ${component.features.join(' ')}` : '',
            component.patterns?.length ? `patterns: ${component.patterns.join(' ')}` : ''
          ].filter(Boolean);

          const text = parts.join(' ');

          await vectorStore.addDocuments([new Document({
            pageContent: text,
            metadata: {
              name: component.name,
              type: component.type,
              path: component.path || '',
              relativePath: component.relativePath || '',
              description: component.description || '',
              props: component.props || [],
              hasVariants: component.hasVariants || false,
              isInteractive: component.isInteractive || false,
              dependencies: component.dependencies || [],
              purpose: component.purpose || '',
              variants: component.variants || [],
              sizes: component.sizes || [],
              states: component.states || [],
              features: component.features || [],
              patterns: component.patterns || []
            }
          })]);
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
  search: async (query, _k = 3) => {
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
