import type { Meta, StoryObj } from '@storybook/react';
import { IconButton } from '@/ui/elements/IconButton';

/**
 * IconButton component
 *
 * Auto-generated from component inventory
 * Category: elements
 */
const meta = {
  title: 'Elements/IconButton',
  component: IconButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    "icon": {
        "control": "text",
        "description": "Required"
    },
    "variant": {
        "control": "select",
        "options": [
            "solid",
            "outline",
            "arrow-right",
            "arrow-left"
        ],
        "description": "Required"
    },
    "className": {
        "control": "text",
        "description": "Optional"
    },
    "size": {
        "description": "Optional"
    }
},
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;


/**
 * Default IconButton example
 */
export const Default: Story = {
  args: {
    "icon": "Example",
    "variant": "solid"
},
};

/**
 * With custom styling
 */
export const WithStyling: Story = {
  args: {
    "icon": "Example",
    "variant": "solid",
    "className": "shadow-lg border-2"
},
};
