import type { Meta, StoryObj } from '@storybook/react';
import { ChatBar } from '@/ui/components/ChatBar';

/**
 * ChatBar component
 *
 * Auto-generated from component inventory
 * Category: components
 */
const meta = {
  title: 'Components/ChatBar',
  component: ChatBar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    "message": {
        "control": "text",
        "description": "Required"
    }
},
} satisfies Meta<typeof ChatBar>;

export default meta;
type Story = StoryObj<typeof meta>;


/**
 * Default ChatBar example
 */
export const Default: Story = {
  args: {
    "message": "Example"
},
};

/**
 * With custom styling
 */
export const WithStyling: Story = {
  args: {
    "message": "Example",
    "className": "shadow-lg border-2"
},
};
