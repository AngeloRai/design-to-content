import type { Meta, StoryObj } from '@storybook/react';
import { Property1secondaryCtaIconLeftIcon } from '@/ui/icons/Property1secondaryCtaIconLeftIcon';

/**
 * Property1secondaryCtaIconLeftIcon component
 *
 * Auto-generated from component inventory
 * Category: icons
 */
const meta = {
  title: 'Icons/Property1secondaryCtaIconLeftIcon',
  component: Property1secondaryCtaIconLeftIcon,
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
} satisfies Meta<typeof Property1secondaryCtaIconLeftIcon>;

export default meta;
type Story = StoryObj<typeof meta>;


/**
 * Default Property1secondaryCtaIconLeftIcon example
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
