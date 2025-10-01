const path = require('path');

/** @type { import('@storybook/nextjs').StorybookConfig } */
const config = {
  stories: [
    '../stories/**/*.mdx',
    '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'
  ],

  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-docs',
    '@storybook/addon-onboarding',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest'
  ],

  framework: {
    name: '@storybook/nextjs',
    options: {}
  },

  webpackFinal: async (config) => {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@/ui': path.resolve(__dirname, '../../nextjs-app/ui'),
        '@/lib': path.resolve(__dirname, '../../nextjs-app/lib'),
      };
    }
    return config;
  },
};

module.exports = config;
