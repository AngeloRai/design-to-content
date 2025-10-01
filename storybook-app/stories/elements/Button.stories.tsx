import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/ui/elements/Button';

/**
 * Button component
 *
 * Auto-generated from component inventory
 * Category: elements
 */
const meta = {
  title: 'Elements/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    "of": {
        "description": "Required"
    },
    "variant": {
        "control": "select",
        "options": [
            "solid-black",
            "solid-white",
            "outline-black",
            "outline-white",
            "customize"
        ],
        "description": "Required"
    },
    "iconPosition": {
        "control": "select",
        "options": [
            "icon-left",
            "icon-right"
        ],
        "description": "Optional"
    },
    "state": {
        "control": "select",
        "options": [
            "default",
            "hover",
            "inactive"
        ],
        "description": "Required"
    },
    "className": {
        "control": "text",
        "description": "Optional"
    },
    "iconStart": {
        "description": "Optional"
    },
    "iconEnd": {
        "description": "Optional"
    }
},
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;


/**
 * Default Button example
 */
export const Default: Story = {
  args: {
    "variant": "solid-black",
    "state": "default",
    "children": "Example"
},
};

/**
 * With custom styling
 */
export const WithStyling: Story = {
  args: {
    "variant": "solid-black",
    "state": "default",
    "children": "Example",
    "className": "shadow-lg border-2"
},
};
