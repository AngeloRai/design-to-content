import type { Meta, StoryObj } from '@storybook/react';
import { ChatButton } from '@/ui/components/ChatButton';

/**
 * ChatButton component
 *
 * Auto-generated from component inventory
 * Category: components
 */
const meta = {
  title: 'Components/ChatButton',
  component: ChatButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    "children": {
        "description": "Required"
    },
    "className": {
        "control": "text",
        "description": "Optional"
    }
},
} satisfies Meta<typeof ChatButton>;

export default meta;
type Story = StoryObj<typeof meta>;


/**
 * Default ChatButton example
 */
export const Default: Story = {
  args: {
    "children": "Example content"
},
};

/**
 * With custom styling
 */
export const WithStyling: Story = {
  args: {
    "children": "Example content",
    "className": "shadow-lg border-2"
},
};
