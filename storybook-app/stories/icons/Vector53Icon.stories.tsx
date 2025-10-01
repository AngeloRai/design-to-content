import type { Meta, StoryObj } from '@storybook/react';
import { Vector53Icon } from '@/ui/icons/Vector53Icon';

/**
 * Vector53Icon component
 *
 * Auto-generated from component inventory
 * Category: icons
 */
const meta = {
  title: 'Icons/Vector53Icon',
  component: Vector53Icon,
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
} satisfies Meta<typeof Vector53Icon>;

export default meta;
type Story = StoryObj<typeof meta>;


/**
 * Default Vector53Icon example
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
