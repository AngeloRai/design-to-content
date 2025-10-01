import type { Meta, StoryObj } from '@storybook/react';
import { VectorstrokeIcon } from '@/ui/icons/VectorstrokeIcon';

/**
 * VectorstrokeIcon component
 *
 * Auto-generated from component inventory
 * Category: icons
 */
const meta = {
  title: 'Icons/VectorstrokeIcon',
  component: VectorstrokeIcon,
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
} satisfies Meta<typeof VectorstrokeIcon>;

export default meta;
type Story = StoryObj<typeof meta>;


/**
 * Default VectorstrokeIcon example
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
