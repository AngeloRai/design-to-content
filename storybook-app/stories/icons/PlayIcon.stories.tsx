import type { Meta, StoryObj } from '@storybook/react';
import { PlayIcon } from '@/ui/icons/PlayIcon';

/**
 * PlayIcon component
 *
 * Auto-generated from component inventory
 * Category: icons
 */
const meta = {
  title: 'Icons/PlayIcon',
  component: PlayIcon,
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
} satisfies Meta<typeof PlayIcon>;

export default meta;
type Story = StoryObj<typeof meta>;


/**
 * Default PlayIcon example
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
