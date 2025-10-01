import type { Meta, StoryObj } from '@storybook/react';
import { Frame633719Icon } from '@/ui/icons/Frame633719Icon';

/**
 * Frame633719Icon component
 *
 * Auto-generated from component inventory
 * Category: icons
 */
const meta = {
  title: 'Icons/Frame633719Icon',
  component: Frame633719Icon,
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
} satisfies Meta<typeof Frame633719Icon>;

export default meta;
type Story = StoryObj<typeof meta>;


/**
 * Default Frame633719Icon example
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
