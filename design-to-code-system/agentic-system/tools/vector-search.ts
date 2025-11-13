/**
 * Vector Search
 * Semantic similarity search using OpenAI embeddings
 * Helps find similar components based on descriptions
 */

import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";

interface ComponentMetadataForSearch {
  name: string;
  type: string;
  path?: string;
  relativePath?: string;
  description?: string;
  props?: string[] | Array<{ name: string; type: string; required: boolean; description?: string }>;
  hasVariants?: boolean;
  isInteractive?: boolean;
  dependencies?: string[];
  purpose?: string;
  variants?: string[];
  sizes?: string[];
  states?: string[];
  features?: string[];
  patterns?: string[];
}

interface VectorSearchResult {
  name: string;
  type: string;
  path: string;
  relativePath: string;
  description: string;
  props: string[];
  hasVariants: boolean;
  isInteractive: boolean;
  dependencies: string[];
  purpose: string;
  variants: string[];
  sizes: string[];
  states: string[];
  features: string[];
  patterns: string[];
}

interface VectorStore {
  similaritySearch(query: string, k: number): Promise<Array<Document<VectorSearchResult>>>;
  addDocuments(docs: Array<Document<VectorSearchResult>>): Promise<void>;
}

export interface VectorSearch {
  search(query: string, k?: number): Promise<VectorSearchResult[]>;
  addComponent(component: ComponentMetadataForSearch): Promise<void>;
}

/**
 * Calculate cosine similarity between two vectors
 */
const cosineSimilarity = (a: number[], b: number[]): number => {
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
const createSimpleVectorStore = async (
  texts: string[],
  metadatas: VectorSearchResult[],
  embeddings: OpenAIEmbeddings
): Promise<VectorStore> => {
  // Convert texts to documents
  const documents: Array<Document<VectorSearchResult>> = texts.map((text, i) => new Document<VectorSearchResult>({
    pageContent: text,
    metadata: metadatas[i]
  }));

  // Generate embeddings for all documents
  const documentTexts = documents.map(d => d.pageContent);
  const vectors = await embeddings.embedDocuments(documentTexts);

  // Mutable state captured in closure
  let storedDocuments: Array<Document<VectorSearchResult>> = [...documents];
  let storedVectors = [...vectors];

  // Return API with closure over mutable state
  return {
    async similaritySearch(query: string, k: number = 3): Promise<Array<Document<VectorSearchResult>>> {
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

    async addDocuments(newDocs: Array<Document<VectorSearchResult>>): Promise<void> {
      const newTexts = newDocs.map(d => d.pageContent);
      const newVectors = await embeddings.embedDocuments(newTexts);

      storedDocuments = [...storedDocuments, ...newDocs];
      storedVectors = [...storedVectors, ...newVectors];
    }
  };
};

/**
 * Normalize props to string array
 */
const normalizeProps = (props?: string[] | Array<{ name: string; type: string; required: boolean; description?: string }>): string[] => {
  if (!props) return [];
  if (Array.isArray(props) && props.length > 0 && typeof props[0] === 'string') {
    return props as string[];
  }
  if (Array.isArray(props) && props.length > 0 && typeof props[0] === 'object') {
    return (props as Array<{ name: string }>).map(p => p.name);
  }
  return [];
};

/**
 * Create vector search from components
 */
export const createVectorSearch = async (
  components: ComponentMetadataForSearch[]
): Promise<VectorSearch> => {
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
      const normalizedProps = normalizeProps(comp.props);
      const parts = [
        comp.name,
        comp.type,
        comp.description || '',
        comp.purpose || '',
        normalizedProps.join(', '),
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
    const metadatas: VectorSearchResult[] = components.map(comp => {
      const normalizedProps = normalizeProps(comp.props);
      return {
        name: comp.name,
        type: comp.type,
        path: comp.path || '',
        relativePath: comp.relativePath || '',
        description: comp.description || '',
        props: normalizedProps,
        hasVariants: comp.hasVariants || false,
        isInteractive: comp.isInteractive || false,
        dependencies: comp.dependencies || [],
        purpose: comp.purpose || '',
        variants: comp.variants || [],
        sizes: comp.sizes || [],
        states: comp.states || [],
        features: comp.features || [],
        patterns: comp.patterns || []
      };
    });

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
       */
      search: async (query: string, k: number = 3): Promise<VectorSearchResult[]> => {
        try {
          const results = await vectorStore.similaritySearch(query, k);
          return results.map(r => r.metadata as VectorSearchResult);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('Vector search error:', errorMessage);
          return [];
        }
      },

      /**
       * Add new component to vector store
       */
      addComponent: async (component: ComponentMetadataForSearch): Promise<void> => {
        try {
          // Build rich text for new component
          const normalizedProps = normalizeProps(component.props);
          const parts = [
            component.name,
            component.type,
            component.description || '',
            component.purpose || '',
            normalizedProps.join(', '),
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

          const metadata: VectorSearchResult = {
            name: component.name,
            type: component.type,
            path: component.path || '',
            relativePath: component.relativePath || '',
            description: component.description || '',
            props: normalizedProps,
            hasVariants: component.hasVariants || false,
            isInteractive: component.isInteractive || false,
            dependencies: component.dependencies || [],
            purpose: component.purpose || '',
            variants: component.variants || [],
            sizes: component.sizes || [],
            states: component.states || [],
            features: component.features || [],
            patterns: component.patterns || []
          };

          await vectorStore.addDocuments([new Document<VectorSearchResult>({
            pageContent: text,
            metadata
          })]);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('Error adding component to vector store:', errorMessage);
        }
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error creating vector search:', errorMessage);
    return createEmptyVectorSearch();
  }
};

/**
 * Create empty vector search (fallback)
 */
const createEmptyVectorSearch = (): VectorSearch => ({
  search: async (query: string, _k: number = 3): Promise<VectorSearchResult[]> => {
    console.log(`⚠️  Vector search not available, returning empty results for: "${query}"`);
    return [];
  },
  addComponent: async (component: ComponentMetadataForSearch): Promise<void> => {
    console.log(`⚠️  Vector search not available, cannot add: ${component.name}`);
  }
});

/**
 * CLI - Test vector search
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🔍 Testing vector search...\n');

  const testComponents: ComponentMetadataForSearch[] = [
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Test failed:', errorMessage);
    process.exit(1);
  });
}
