import type { Meta, StoryObj } from '@storybook/react';
import { UnionIcon } from '@/ui/icons/UnionIcon';

/**
 * UnionIcon component
 *
 * Auto-generated from component inventory
 * Category: icons
 */
const meta = {
  title: 'Icons/UnionIcon',
  component: UnionIcon,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    "size": {
        "control": "select",
        "options": [
            "number",
            "string"
        ],
        "description": "Optional"
    },
    "color": {
        "control": "text",
        "description": "Optional"
    }
},
} satisfies Meta<typeof UnionIcon>;

export default meta;
type Story = StoryObj<typeof meta>;


/**
 * Default UnionIcon example
 */
export const Default: Story = {
  args: {},
};

/**
 * With custom styling
 */
export const WithStyling: Story = {
  args: {
    "className": "shadow-lg border-2"
},
};
