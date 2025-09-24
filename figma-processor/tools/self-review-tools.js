#!/usr/bin/env node

/**
 * SELF-REVIEW TOOLS FOR AI
 * Tools for AI to examine and analyze its own generated components
 * Enables AI to read files, compare outputs, and identify improvements
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Create self-review tools scoped to a project
 */
export const createSelfReviewTools = (projectRoot = null) => {
  const baseDir = projectRoot || join(__dirname, '..', '..');
  const uiDir = join(baseDir, 'nextjs-app', 'ui');

  const tools = {
    projectRoot: baseDir,
    uiDirectory: uiDir,

    /**
     * Read a specific component file
     */
    readComponentFile(filePath) {
      try {
        console.log(`🔍 AI Tool: Reading component file ${filePath}`);

        // Handle both absolute and relative paths
        const fullPath = filePath.startsWith('/') ? filePath : join(uiDir, filePath);

        if (!existsSync(fullPath)) {
          return {
            success: false,
            error: `File not found: ${filePath}`,
            path: fullPath
          };
        }

        const content = readFileSync(fullPath, 'utf8');
        const stats = statSync(fullPath);

        return {
          success: true,
          path: fullPath,
          relativePath: filePath,
          content,
          metadata: {
            size: stats.size,
            modified: stats.mtime,
            lines: content.split('\n').length,
            isTypeScript: fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')
          },
          timestamp: Date.now()
        };
      } catch (error) {
        console.error(`❌ AI Tool Error (readComponentFile):`, error.message);
        return { success: false, error: error.message };
      }
    },

    /**
     * List all component files in a directory
     */
    listComponentFiles(directory = '') {
      try {
        const targetDir = directory ? join(uiDir, directory) : uiDir;
        console.log(`🔍 AI Tool: Listing components in ${targetDir}`);

        if (!existsSync(targetDir)) {
          return {
            success: false,
            error: `Directory not found: ${directory || 'ui/'}`,
            path: targetDir
          };
        }

        const components = [];

        // Recursively find all .tsx/.ts files
        const scanDirectory = (dir, relativePath = '') => {
          const entries = readdirSync(dir, { withFileTypes: true });

          entries.forEach(entry => {
            const fullPath = join(dir, entry.name);
            const currentRelativePath = join(relativePath, entry.name);

            if (entry.isDirectory()) {
              // Scan subdirectories
              scanDirectory(fullPath, currentRelativePath);
            } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
              const stats = statSync(fullPath);
              components.push({
                name: entry.name,
                nameWithoutExt: basename(entry.name, entry.name.endsWith('.tsx') ? '.tsx' : '.ts'),
                relativePath: currentRelativePath,
                fullPath,
                directory: relativePath,
                size: stats.size,
                modified: stats.mtime,
                isTypeScript: entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')
              });
            }
          });
        };

        scanDirectory(targetDir);

        // Sort by directory, then by name
        components.sort((a, b) => {
          if (a.directory !== b.directory) {
            return a.directory.localeCompare(b.directory);
          }
          return a.name.localeCompare(b.name);
        });

        return {
          success: true,
          directory: directory || 'ui/',
          components,
          totalCount: components.length,
          byDirectory: this.groupComponentsByDirectory(components),
          timestamp: Date.now()
        };
      } catch (error) {
        console.error(`❌ AI Tool Error (listComponentFiles):`, error.message);
        return { success: false, error: error.message };
      }
    },

    /**
     * Group components by directory for easier analysis
     */
    groupComponentsByDirectory(components) {
      const grouped = {};

      components.forEach(component => {
        const dir = component.directory || 'root';
        if (!grouped[dir]) {
          grouped[dir] = [];
        }
        grouped[dir].push(component);
      });

      return grouped;
    },

    /**
     * Analyze component structure and extract metadata
     */
    analyzeComponent(filePath) {
      try {
        const fileResult = this.readComponentFile(filePath);
        if (!fileResult.success) {
          return fileResult;
        }

        const { content } = fileResult;
        const analysis = {
          hasInterface: content.includes('interface '),
          hasProps: content.includes('Props'),
          usesClassName: content.includes('className'),
          usesCn: content.includes('cn('),
          hasVariants: content.includes('variant'),
          hasStates: this.detectStates(content),
          imports: this.extractImports(content),
          exports: this.extractExports(content),
          componentName: this.extractComponentName(content),
          complexity: this.assessComplexity(content)
        };

        return {
          success: true,
          filePath,
          analysis,
          content,
          metadata: fileResult.metadata,
          timestamp: Date.now()
        };
      } catch (error) {
        console.error(`❌ AI Tool Error (analyzeComponent):`, error.message);
        return { success: false, error: error.message };
      }
    },

    /**
     * Compare intended component specs with actual implementation
     */
    compareWithIntent(intended, actualFilePath) {
      try {
        console.log(`🔍 AI Tool: Comparing intent vs actual for ${actualFilePath}`);

        const actualResult = this.analyzeComponent(actualFilePath);
        if (!actualResult.success) {
          return actualResult;
        }

        const { analysis, content } = actualResult;

        const comparison = {
          name: {
            intended: intended.name || 'Unknown',
            actual: analysis.componentName,
            matches: intended.name === analysis.componentName
          },
          variants: {
            intended: intended.variants || null,
            actual: analysis.hasVariants,
            implemented: this.checkVariantImplementation(content, intended.variants)
          },
          states: {
            intended: intended.specifications?.states || [],
            actual: analysis.hasStates,
            coverage: this.checkStateCoverage(content, intended.specifications?.states)
          },
          structure: {
            hasProperInterface: analysis.hasInterface,
            usesPropsPattern: analysis.hasProps,
            followsConventions: analysis.usesClassName && analysis.usesCn
          },
          completeness: this.assessCompleteness(intended, analysis, content)
        };

        return {
          success: true,
          intended,
          actual: actualResult,
          comparison,
          recommendations: this.generateRecommendations(comparison),
          timestamp: Date.now()
        };
      } catch (error) {
        console.error(`❌ AI Tool Error (compareWithIntent):`, error.message);
        return { success: false, error: error.message };
      }
    },

    // Helper methods for component analysis
    detectStates(content) {
      const states = [];
      const statePatterns = [
        { name: 'hover', pattern: /hover:|:hover/ },
        { name: 'focus', pattern: /focus-visible|:focus/ },
        { name: 'active', pattern: /active:|:active/ },
        { name: 'disabled', pattern: /disabled|:disabled/ }
      ];

      statePatterns.forEach(({ name, pattern }) => {
        if (pattern.test(content)) {
          states.push(name);
        }
      });

      return states;
    },

    extractImports(content) {
      const importLines = content.match(/^import.*$/gm) || [];
      return importLines.map(line => line.trim());
    },

    extractExports(content) {
      const exportLines = content.match(/^export.*$/gm) || [];
      return exportLines.map(line => line.trim());
    },

    extractComponentName(content) {
      // Look for function or const component declarations
      const functionMatch = content.match(/export\s+function\s+([A-Z]\w*)/);
      const constMatch = content.match(/(?:export\s+)?const\s+([A-Z]\w*)\s*[:=]/);

      return functionMatch?.[1] || constMatch?.[1] || 'Unknown';
    },

    assessComplexity(content) {
      const lines = content.split('\n').length;
      const hasConditionals = /if\s*\(|switch\s*\(|\?/.test(content);
      const hasLoops = /\.map\s*\(|\.forEach\s*\(|for\s*\(/.test(content);
      const hasMultipleProps = (content.match(/\w+\s*[,}]/g) || []).length;

      let complexity = 'atom';
      if (lines > 100 || hasLoops || hasMultipleProps > 8) {
        complexity = 'organism';
      } else if (lines > 50 || hasConditionals || hasMultipleProps > 4) {
        complexity = 'molecule';
      }

      return complexity;
    },

    checkVariantImplementation(content, intendedVariants) {
      if (!intendedVariants) return { implemented: true, details: 'No variants specified' };

      const hasVariantType = content.includes('variant');
      const hasVariantLogic = /variant\s*===|variant\s*!==|\[variant\]/.test(content);

      return {
        implemented: hasVariantType && hasVariantLogic,
        hasType: hasVariantType,
        hasLogic: hasVariantLogic,
        details: hasVariantType && hasVariantLogic ? 'Variants properly implemented' : 'Variant implementation incomplete'
      };
    },

    checkStateCoverage(content, intendedStates) {
      if (!intendedStates || intendedStates.length === 0) {
        return { coverage: 1, details: 'No specific states required' };
      }

      const implementedStates = this.detectStates(content);
      const coveredStates = intendedStates.filter(state => implementedStates.includes(state));

      return {
        coverage: coveredStates.length / intendedStates.length,
        implemented: implementedStates,
        required: intendedStates,
        missing: intendedStates.filter(state => !implementedStates.includes(state)),
        details: `${coveredStates.length}/${intendedStates.length} states implemented`
      };
    },

    assessCompleteness(intended, analysis, content) {
      let score = 0;
      const checks = [];

      // Basic structure
      if (analysis.hasInterface) { score += 20; checks.push('✅ Has TypeScript interface'); }
      else { checks.push('❌ Missing TypeScript interface'); }

      if (analysis.hasProps) { score += 15; checks.push('✅ Uses Props pattern'); }
      else { checks.push('❌ Missing Props pattern'); }

      if (analysis.usesClassName && analysis.usesCn) { score += 15; checks.push('✅ Follows className conventions'); }
      else { checks.push('❌ Missing className/cn utilities'); }

      // Variant implementation
      if (intended.variants && analysis.hasVariants) { score += 25; checks.push('✅ Implements variants'); }
      else if (intended.variants) { checks.push('❌ Missing variant implementation'); }
      else { score += 25; checks.push('✅ No variants required'); }

      // States implementation
      if (intended.specifications?.states?.length > 0) {
        const stateCoverage = this.checkStateCoverage(content, intended.specifications.states);
        score += Math.round(25 * stateCoverage.coverage);
        checks.push(`${stateCoverage.coverage === 1 ? '✅' : '⚠️'} States: ${stateCoverage.details}`);
      } else {
        score += 25;
        checks.push('✅ No specific states required');
      }

      return {
        score,
        percentage: score,
        grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
        checks
      };
    },

    generateRecommendations(comparison) {
      const recommendations = [];

      if (!comparison.name.matches) {
        recommendations.push({
          type: 'naming',
          priority: 'high',
          issue: `Component name mismatch: expected "${comparison.name.intended}", got "${comparison.name.actual}"`,
          suggestion: `Rename component to "${comparison.name.intended}"`
        });
      }

      if (comparison.variants.intended && !comparison.variants.implemented.implemented) {
        recommendations.push({
          type: 'variants',
          priority: 'high',
          issue: 'Variant implementation missing or incomplete',
          suggestion: 'Add proper variant props and implementation logic'
        });
      }

      if (comparison.states.intended?.length > 0 && comparison.states.coverage.coverage < 1) {
        recommendations.push({
          type: 'states',
          priority: 'medium',
          issue: `Missing states: ${comparison.states.coverage.missing.join(', ')}`,
          suggestion: `Add CSS classes or logic for: ${comparison.states.coverage.missing.join(', ')}`
        });
      }

      if (!comparison.structure.followsConventions) {
        recommendations.push({
          type: 'structure',
          priority: 'medium',
          issue: 'Not following project conventions',
          suggestion: 'Add className prop and use cn() utility for class merging'
        });
      }

      return recommendations;
    }
  };

  return tools;
};

/**
 * Get available tool descriptions for AI
 */
export const getSelfReviewToolDescriptions = () => {
  return [
    {
      name: 'readComponentFile',
      description: 'Read and analyze a specific component file',
      parameters: 'filePath (string) - relative path from ui/ directory'
    },
    {
      name: 'listComponentFiles',
      description: 'List all component files in a directory',
      parameters: 'directory (string, optional) - subdirectory within ui/'
    },
    {
      name: 'analyzeComponent',
      description: 'Deep analysis of component structure and patterns',
      parameters: 'filePath (string) - relative path from ui/ directory'
    },
    {
      name: 'compareWithIntent',
      description: 'Compare intended component specs with actual implementation',
      parameters: 'intended (object), actualFilePath (string)'
    }
  ];
};

const selfReviewTools = {
  createSelfReviewTools,
  getSelfReviewToolDescriptions
};

export default selfReviewTools;