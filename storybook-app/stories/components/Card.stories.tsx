import type { Meta, StoryObj } from '@storybook/react';
import { Card } from '@/ui/components/Card';

/**
 * Card component
 *
 * Auto-generated from component inventory
 * Category: components
 */
const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    "content": {
        "control": "text",
        "description": "Required"
    },
    "className": {
        "control": "text",
        "description": "Optional"
    }
},
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;


/**
 * Default Card example
 */
export const Default: Story = {
  args: {
    "content": "Example"
},
};

/**
 * With custom styling
 */
export const WithStyling: Story = {
  args: {
    "content": "Example",
    "className": "shadow-lg border-2"
},
};
