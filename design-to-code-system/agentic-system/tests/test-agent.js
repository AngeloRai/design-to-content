/**
 * Test the autonomous agent with a simple design specification
 */

import { runAgent } from '../core/agent.js';

const SIMPLE_DESIGN_SPEC = `
# Component Design Specification

**Component Type**: Button (Primary CTA)

**Visual Properties**:
- Background: Blue gradient (#3b82f6 to #2563eb)
- Text: White, bold, 16px
- Border radius: 12px (rounded-xl)
- Padding: 16px horizontal, 12px vertical
- Shadow: Medium drop shadow
- Hover: Slightly darker blue, scale up 2%
- Active: Pressed state with reduced shadow

**Variants**:
- Primary (default): Blue background, white text
- Secondary: White background, blue text, blue border

**Props Needed**:
- label: string (button text)
- onClick: function (click handler)
- variant: 'primary' | 'secondary' (default: 'primary')
- disabled: boolean (optional)
- className: string (optional, for additional styles)

**Behavior**:
- Interactive button element
- Should use Next.js Link if URL is provided (prop: href)
- Should render as <button> if no href
- Handle disabled state with reduced opacity

**Component Name**: ActionButton
**Component Type**: elements
`;

console.log('🧪 Testing Autonomous Agent');
console.log('='.repeat(60));
console.log('\nDesign Specification:');
console.log(SIMPLE_DESIGN_SPEC);
console.log('='.repeat(60));
console.log('\n');

// Run the agent
runAgent(SIMPLE_DESIGN_SPEC, '../nextjs-app/ui')
  .then(result => {
    console.log('\n' + '='.repeat(60));
    console.log('✅ Test completed successfully!');
    console.log(`\nIterations: ${result.iterations}`);
    console.log('='.repeat(60));
  })
  .catch(error => {
    console.error('\n' + '='.repeat(60));
    console.error('❌ Test failed:', error);
    console.error('='.repeat(60));
    process.exit(1);
  });
