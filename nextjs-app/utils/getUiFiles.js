import fs from 'fs';
import path from 'path';

export function getUiFiles() {
  const uiDir = path.join(process.cwd(), 'ui');
  const components = {};

  // Recursively read all files in the ui directory
  function readDirectory(dir, relativePath = '') {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      const relativeFilePath = path.join(relativePath, file);

      if (stat.isDirectory()) {
        // Recursively read subdirectories
        readDirectory(fullPath, relativeFilePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
        // Get the category (folder name) and component name
        const pathParts = relativeFilePath.split(path.sep);
        const category = pathParts.length > 1 ? pathParts[0] : 'root';
        const componentName = file.replace(/\.(tsx|jsx)$/, '');

        // Read file content
        const content = fs.readFileSync(fullPath, 'utf-8');

        // Try to extract props interface/type
        const propsMatch = content.match(/(?:interface|type)\s+(\w+Props)\s*=?\s*{([^}]+)}/);

        if (!components[category]) {
          components[category] = [];
        }

        components[category].push({
          name: componentName,
          path: relativeFilePath,
          fullPath: fullPath,
          hasProps: !!propsMatch,
          propsName: propsMatch ? propsMatch[1] : null,
          // Extract first 200 chars of component for preview
          preview: content.substring(0, 200)
        });
      }
    });
  }

  readDirectory(uiDir);

  return components;
}

// Get a flat list of all component files
export function getFlatUiFilesList() {
  const components = getUiFiles();
  const flatList = [];

  Object.entries(components).forEach(([category, files]) => {
    files.forEach(file => {
      flatList.push({
        ...file,
        category
      });
    });
  });

  return flatList.sort((a, b) => a.name.localeCompare(b.name));
}