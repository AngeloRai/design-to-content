import type { Meta, StoryObj } from '@storybook/react';
import { PhchatIcon } from '@/ui/icons/PhchatIcon';

/**
 * PhchatIcon component
 *
 * Auto-generated from component inventory
 * Category: icons
 */
const meta = {
  title: 'Icons/PhchatIcon',
  component: PhchatIcon,
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
} satisfies Meta<typeof PhchatIcon>;

export default meta;
type Story = StoryObj<typeof meta>;


/**
 * Default PhchatIcon example
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
