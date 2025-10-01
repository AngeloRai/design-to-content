import type { Meta, StoryObj } from '@storybook/react';
import { PlayButton } from '@/ui/elements/PlayButton';

/**
 * PlayButton component
 *
 * Auto-generated from component inventory
 * Category: elements
 */
const meta = {
  title: 'Elements/PlayButton',
  component: PlayButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    "state": {
        "control": "select",
        "options": [
            "default",
            "hover"
        ],
        "description": "Required"
    },
    "className": {
        "control": "text",
        "description": "Optional"
    }
},
} satisfies Meta<typeof PlayButton>;

export default meta;
type Story = StoryObj<typeof meta>;


/**
 * Default PlayButton example
 */
export const Default: Story = {
  args: {
    "state": "default"
},
};

/**
 * With custom styling
 */
export const WithStyling: Story = {
  args: {
    "state": "default",
    "className": "shadow-lg border-2"
},
};
