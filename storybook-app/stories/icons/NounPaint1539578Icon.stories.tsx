import type { Meta, StoryObj } from '@storybook/react';
import { NounPaint1539578Icon } from '@/ui/icons/NounPaint1539578Icon';

/**
 * NounPaint1539578Icon component
 *
 * Auto-generated from component inventory
 * Category: icons
 */
const meta = {
  title: 'Icons/NounPaint1539578Icon',
  component: NounPaint1539578Icon,
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
} satisfies Meta<typeof NounPaint1539578Icon>;

export default meta;
type Story = StoryObj<typeof meta>;


/**
 * Default NounPaint1539578Icon example
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
