import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '@/ui/elements/Badge';

/**
 * Badge component
 *
 * Auto-generated from component inventory
 * Category: elements
 */
const meta = {
  title: 'Elements/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    "type": {
        "control": "select",
        "options": [
            "numeric",
            "status"
        ],
        "description": "Required"
    },
    "className": {
        "control": "text",
        "description": "Optional"
    }
},
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;


/**
 * Numeric variant
 */
export const Numeric: Story = {
  args: {
    "type": "numeric"
},
};

/**
 * Status variant
 */
export const Status: Story = {
  args: {
    "type": "status"
},
};
