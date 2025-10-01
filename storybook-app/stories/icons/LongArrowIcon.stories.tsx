import type { Meta, StoryObj } from '@storybook/react';
import { LongArrowIcon } from '@/ui/icons/LongArrowIcon';

/**
 * LongArrowIcon component
 *
 * Auto-generated from component inventory
 * Category: icons
 */
const meta = {
  title: 'Icons/LongArrowIcon',
  component: LongArrowIcon,
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
} satisfies Meta<typeof LongArrowIcon>;

export default meta;
type Story = StoryObj<typeof meta>;


/**
 * Default LongArrowIcon example
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
