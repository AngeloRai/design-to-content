/* eslint-disable @typescript-eslint/no-explicit-any */
import CTA from "@/ui/components/CTA";
import Hero from "@/ui/modules/Hero";
import Grid from "@/ui/modules/Grid";
import ImageText from "@/ui/modules/ImageText";
import ImageCarousel from "@/ui/modules/ImageCarousel";

export default function GEGPage() {

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-brand-primary text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-heading text-5xl mb-4">Graphic Example Guide (GEG)</h1>
          <p className="text-xl">Complete design system reference for authors and developers</p>
        </div>
      </div>

      {/* Typography Section */}
      <section className="py-16 px-6 bg-surface-pure">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-heading text-4xl mb-8 text-neutral-dark">Typography</h2>
          
          {/* Font Families */}
          <div className="mb-12">
            <h3 className="font-body-bold text-2xl mb-6 text-brand-primary">Font Families</h3>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600 mb-2">font-heading (Caliburn Bold)</p>
                <p className="font-heading text-3xl">The quick brown fox jumps over the lazy dog</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600 mb-2">font-body (Visby Medium)</p>
                <p className="font-body text-xl">The quick brown fox jumps over the lazy dog</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600 mb-2">font-body-bold (Visby Bold)</p>
                <p className="font-body-bold text-xl">The quick brown fox jumps over the lazy dog</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600 mb-2">font-body-light (Visby Light)</p>
                <p className="font-body-light text-xl">The quick brown fox jumps over the lazy dog</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600 mb-2">font-accent (Freight Neo)</p>
                <p className="font-accent text-xl">The quick brown fox jumps over the lazy dog</p>
              </div>
            </div>
          </div>

          {/* Font Sizes */}
          <div className="mb-12">
            <h3 className="font-body-bold text-2xl mb-6 text-brand-primary">Font Sizes</h3>
            <div className="space-y-3">
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-gray-600 w-20">text-xs</span>
                <p className="text-xs">The quick brown fox jumps (12px)</p>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-gray-600 w-20">text-sm</span>
                <p className="text-sm">The quick brown fox jumps (14px)</p>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-gray-600 w-20">text-base</span>
                <p className="text-base">The quick brown fox jumps (16px)</p>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-gray-600 w-20">text-lg</span>
                <p className="text-lg">The quick brown fox jumps (18px)</p>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-gray-600 w-20">text-xl</span>
                <p className="text-xl">The quick brown fox jumps (20px)</p>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-gray-600 w-20">text-2xl</span>
                <p className="text-2xl">The quick brown fox (24px)</p>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-gray-600 w-20">text-3xl</span>
                <p className="text-3xl">The quick brown fox (30px)</p>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-gray-600 w-20">text-4xl</span>
                <p className="text-4xl">The quick brown (36px)</p>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-gray-600 w-20">text-5xl</span>
                <p className="text-5xl">The quick (48px)</p>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-gray-600 w-20">text-6xl</span>
                <p className="text-6xl">Quick (64px)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Colors Section */}
      <section className="py-16 px-6 bg-surface-soft">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-heading text-4xl mb-8 text-neutral-dark">Brand Colors</h2>
          
          {/* Color Palette */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="bg-brand-primary p-8 rounded-lg">
              <p className="text-white font-body-bold">Brand Primary</p>
              <p className="text-white/80 text-sm">#09351E</p>
              <p className="text-white/60 text-xs mt-2">brand-primary</p>
            </div>
            <div className="bg-brand-secondary p-8 rounded-lg">
              <p className="text-white font-body-bold">Brand Secondary</p>
              <p className="text-white/80 text-sm">#3A5D4B</p>
              <p className="text-white/60 text-xs mt-2">brand-secondary</p>
            </div>
            <div className="bg-brand-accent p-8 rounded-lg">
              <p className="text-neutral-dark font-body-bold">Brand Accent</p>
              <p className="text-neutral-dark/70 text-sm">#6B8678</p>
              <p className="text-neutral-dark/60 text-xs mt-2">brand-accent</p>
            </div>
            <div className="bg-neutral-dark p-8 rounded-lg">
              <p className="text-white font-body-bold">Neutral Dark</p>
              <p className="text-white/80 text-sm">#1A1A1A</p>
              <p className="text-white/60 text-xs mt-2">neutral-dark</p>
            </div>
            <div className="bg-surface-soft p-8 rounded-lg border border-gray-200">
              <p className="text-neutral-dark font-body-bold">Surface Soft</p>
              <p className="text-neutral-dark/70 text-sm">#FAECE3</p>
              <p className="text-neutral-dark/60 text-xs mt-2">surface-soft</p>
            </div>
            <div className="bg-surface-pure p-8 rounded-lg border border-gray-200">
              <p className="text-neutral-dark font-body-bold">Surface Pure</p>
              <p className="text-neutral-dark/70 text-sm">#FFFFFF</p>
              <p className="text-neutral-dark/60 text-xs mt-2">surface-pure</p>
            </div>
          </div>

          {/* Background Examples with Text */}
          <h3 className="font-body-bold text-2xl mb-6 text-brand-primary">Text on Backgrounds</h3>
          <div className="space-y-4">
            <div className="bg-brand-primary p-6 rounded-lg">
              <h4 className="font-heading text-2xl text-white mb-2">Heading on Brand Primary</h4>
              <p className="text-white">Body text on dark forest green background</p>
              <p className="text-white/80">Subtext with opacity on dark forest green</p>
            </div>
            <div className="bg-brand-secondary p-6 rounded-lg">
              <h4 className="font-heading text-2xl text-white mb-2">Heading on Brand Secondary</h4>
              <p className="text-white">Body text on medium forest green background</p>
              <p className="text-white/80">Subtext with opacity on medium forest green</p>
            </div>
            <div className="bg-brand-accent p-6 rounded-lg">
              <h4 className="font-heading text-2xl text-neutral-dark mb-2">Heading on Brand Accent</h4>
              <p className="text-neutral-dark">Body text on light forest green background</p>
              <p className="text-neutral-dark/70">Subtext with opacity on light forest green</p>
            </div>
            <div className="bg-neutral-dark p-6 rounded-lg">
              <h4 className="font-heading text-2xl text-white mb-2">Heading on Neutral Dark</h4>
              <p className="text-white">Body text on charcoal gray background</p>
              <p className="text-white/80">Subtext with opacity on charcoal gray</p>
            </div>
            <div className="bg-surface-soft p-6 rounded-lg">
              <h4 className="font-heading text-2xl text-neutral-dark mb-2">Heading on Surface Soft</h4>
              <p className="text-neutral-dark">Body text on warm cream background</p>
              <p className="text-brand-accent">Subtext on warm cream</p>
            </div>
            <div className="bg-surface-pure p-6 rounded-lg border">
              <h4 className="font-heading text-2xl text-neutral-dark mb-2">Heading on Surface Pure</h4>
              <p className="text-neutral-dark">Body text on pure white background</p>
              <p className="text-brand-accent">Subtext on pure white</p>
            </div>
          </div>
        </div>
      </section>

      {/* Components Section */}
      <section className="py-16 px-6 bg-surface-pure">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-heading text-4xl mb-8 text-neutral-dark">Components</h2>
          
          {/* CTA Buttons */}
          <div className="mb-12">
            <h3 className="font-body-bold text-2xl mb-6 text-brand-primary">CTA Buttons</h3>
            <div className="space-y-8">
              {/* Primary Variants */}
              <div>
                <p className="text-sm text-gray-600 mb-4">Primary Variants</p>
                <div className="flex flex-wrap gap-4">
                  <CTA label="Primary Default" url="#" variant="primary" />
                  <CTA label="Primary Outline" url="#" variant="outline" />
                </div>
              </div>
              
              {/* Secondary Variants */}
              <div>
                <p className="text-sm text-gray-600 mb-4">Secondary Variants</p>
                <div className="flex flex-wrap gap-4">
                  <CTA label="Secondary Default" url="#" variant="secondary" />
                  <CTA label="Secondary Outline" url="#" variant="outline-dark" />
                </div>
              </div>

              {/* On Different Backgrounds */}
              <div>
                <p className="text-sm text-gray-600 mb-4">CTAs on Different Backgrounds</p>
                <div className="space-y-4">
                  <div className="bg-brand-primary p-6 rounded-lg">
                    <CTA label="CTA on Dark Forest" url="#" variant="outline" />
                  </div>
                  <div className="bg-brand-secondary p-6 rounded-lg">
                    <CTA label="CTA on Medium Forest" url="#" variant="outline" />
                  </div>
                  <div className="bg-surface-soft p-6 rounded-lg">
                    <CTA label="CTA on Surface Soft" url="#" variant="primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Component Showcase */}
          <div className="mb-12">
            <h3 className="font-body-bold text-2xl mb-6 text-brand-primary">Grid Module Variations</h3>
            
            {/* Grid with Cards */}
            <div className="mb-8">
              <p className="text-sm text-gray-600 mb-4 px-6 lg:px-8">Grid with Cards</p>
              <div style={{marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)'}}>
                <Grid
                  heading="Our Services"
                  backgroundColor="surface-pure"
                  items={[
                    {
                      sys: { contentType: { sys: { id: "componentCard" } }, id: "card1" },
                      fields: {
                        icon: "piano",
                        heading: "Piano Lessons",
                        subheading: "Professional instruction",
                        body: "Learn from experienced instructors with personalized lesson plans designed for your skill level and goals."
                      }
                    },
                    {
                      sys: { contentType: { sys: { id: "componentCard" } }, id: "card2" },
                      fields: {
                        icon: "music",
                        heading: "Music Theory",
                        subheading: "Comprehensive curriculum", 
                        body: "Master the fundamentals of music theory to enhance your understanding and performance abilities."
                      }
                    },
                    {
                      sys: { contentType: { sys: { id: "componentCard" } }, id: "card3" },
                      fields: {
                        icon: "music",
                        heading: "Performance Training",
                        subheading: "Stage preparation",
                        body: "Build confidence and stage presence through our specialized performance training programs."
                      }
                    }
                  ] as any}
                />
              </div>
            </div>

            {/* Grid with Image Cards */}
            <div className="mb-8">
              <p className="text-sm text-gray-600 mb-4 px-6 lg:px-8">Grid with Image Cards</p>
              <div style={{marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)'}}>
                <Grid
                  heading="Featured Programs"
                  backgroundColor="surface-soft"
                  items={[
                    {
                      sys: { contentType: { sys: { id: "componentImageCard" } }, id: "image-card-1" },
                      fields: {
                        heading: "Advanced Certification",
                        description: "Complete our comprehensive certification program and earn recognition for your expertise in piano performance and pedagogy.",
                        image: {
                          fields: {
                            file: {
                              url: "https://images.ctfassets.net/dyrv8i15m4hq/6TExr7UDAYKy7bZpTfbbNH/e582457da68b47857da9a9b6c72315c4/photo-1680070568461-0342ba529988?fm=webp&w=1200&q=75"
                            },
                            title: "Advanced Certification"
                          }
                        }
                      }
                    },
                    {
                      sys: { contentType: { sys: { id: "componentImageCard" } }, id: "image-card-2" },
                      fields: {
                        heading: "Master Classes",
                        description: "Attend exclusive master classes with world-renowned pianists and learn advanced techniques from the best in the industry.",
                        image: {
                          fields: {
                            file: {
                              url: "https://images.ctfassets.net/dyrv8i15m4hq/6TExr7UDAYKy7bZpTfbbNH/e582457da68b47857da9a9b6c72315c4/photo-1680070568461-0342ba529988?fm=webp&w=1200&q=75"
                            },
                            title: "Master Classes"
                          }
                        }
                      }
                    },
                    {
                      sys: { contentType: { sys: { id: "componentImageCard" } }, id: "image-card-3" },
                      fields: {
                        heading: "Youth Programs",
                        description: "Specialized programs designed for young musicians to develop their skills in a supportive and encouraging environment.",
                        image: {
                          fields: {
                            file: {
                              url: "https://images.ctfassets.net/dyrv8i15m4hq/6TExr7UDAYKy7bZpTfbbNH/e582457da68b47857da9a9b6c72315c4/photo-1680070568461-0342ba529988?fm=webp&w=1200&q=75"
                            },
                            title: "Youth Programs"
                          }
                        }
                      }
                    }
                  ] as any}
                />
              </div>
            </div>

            {/* Grid with Testimonials */}
            <div className="mb-8">
              <p className="text-sm text-gray-600 mb-4 px-6 lg:px-8">Grid with Testimonials</p>
              <div style={{marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)'}}>
                <Grid
                  heading="What Our Students Say"
                  backgroundColor="brand-accent"
                  items={[
                    {
                      sys: { contentType: { sys: { id: "componentTestimonial" } }, id: "testimonial1" },
                      fields: {
                        name: "Sarah Johnson",
                        testimonial: "The instruction I received was exceptional. My technique improved dramatically, and I gained the confidence to perform in public for the first time.",
                        role: "Advanced Student"
                      }
                    },
                    {
                      sys: { contentType: { sys: { id: "componentTestimonial" } }, id: "testimonial2" },
                      fields: {
                        name: "Michael Chen",
                        testimonial: "The master classes provided insights I couldn't get anywhere else. Learning from world-class pianists was truly inspiring.",
                        role: "Professional Pianist"
                      }
                    },
                    {
                      sys: { contentType: { sys: { id: "componentTestimonial" } }, id: "testimonial3" },
                      fields: {
                        name: "Emily Rodriguez",
                        testimonial: "The youth program created a supportive environment where my daughter could explore her musical talents without pressure.",
                        role: "Parent"
                      }
                    }
                  ] as any}
                />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border mt-8">
              <h4 className="font-body-bold text-lg mb-3 text-brand-primary">Grid Module Features</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• <strong>Auto-Detection:</strong> Automatically detects and displays Cards, Image Cards, or Testimonials</li>
                <li>• <strong>Responsive Columns:</strong> 1-4 columns that adapt to screen size</li>
                <li>• <strong>Mixed Content:</strong> Can display different content types in the same grid</li>
                <li>• <strong>Background Colors:</strong> All 6 brand colors supported</li>
                <li>• <strong>Consistent Spacing:</strong> Uniform gaps and padding across all variations</li>
                <li>• <strong>Accessibility:</strong> Proper keyboard navigation and screen reader support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="bg-brand-accent">
        <div className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-heading text-4xl mb-8 text-neutral-dark">Modules</h2>
          </div>
        </div>
        
        {/* Full-width module examples without container constraints */}
        <div>
          
          {/* Hero Component Showcase */}
          <div className="mb-16">
            <div className="px-6 mb-8">
              <div className="max-w-7xl mx-auto">
                <h3 className="font-body-bold text-2xl mb-6 text-neutral-dark">Hero Module Variations</h3>
              </div>
            </div>
            <div className="space-y-8">
              {/* Hero with Brand Primary Background - Center Layout */}
              <div>
                <div className="px-6 mb-4">
                  <div className="max-w-7xl mx-auto">
                    <p className="text-sm text-gray-600">Brand Primary Background - Center Layout</p>
                  </div>
                </div>
                <div>
                  <Hero
                    heading="Transform Your Future"
                    subheading={{
                      nodeType: "document",
                      data: {},
                      content: [{
                        nodeType: "paragraph",
                        data: {},
                        content: [{
                          nodeType: "text",
                          value: "Join our comprehensive program designed to unlock your potential and accelerate your growth in today's competitive landscape.",
                          marks: [],
                          data: {}
                        }]
                      }]
                    } as any}
                    copy={{
                      nodeType: "document", 
                      data: {},
                      content: [{
                        nodeType: "paragraph",
                        data: {},
                        content: [{
                          nodeType: "text",
                          value: "Start your journey today with expert guidance and proven methodologies.",
                          marks: [],
                          data: {}
                        }]
                      }]
                    } as any}
                    backgroundColor="brand-primary"
                    image={{
                      fields: {
                        file: {
                          url: "https://images.ctfassets.net/dyrv8i15m4hq/6TExr7UDAYKy7bZpTfbbNH/e582457da68b47857da9a9b6c72315c4/photo-1680070568461-0342ba529988?fm=webp&w=1200&q=75"
                        },
                        title: "GEG Hero Image"
                      }
                    } as any}
                    imagePosition="center"
                    primaryCta={{
                      fields: {
                        label: "Get Started",
                        url: "#",
                        variant: "primary",
                        size: "large"
                      }
                    } as any}
                    secondaryCta={{
                      fields: {
                        label: "Learn More",
                        url: "#",
                        variant: "outline",
                        size: "large"
                      }
                    } as any}
                    height="full screen"
                  />
                </div>
              </div>

              {/* Hero with Image Overlay */}
              <div>
                <div className="px-6 mb-4">
                  <div className="max-w-7xl mx-auto">
                    <p className="text-sm text-gray-600">Image Overlay Variation</p>
                  </div>
                </div>
                <div>
                  <Hero
                    heading="Excellence Through Innovation"
                    subheading={{
                      nodeType: "document",
                      data: {},
                      content: [{
                        nodeType: "paragraph",
                        data: {},
                        content: [{
                          nodeType: "text",
                          value: "Pushing boundaries with cutting-edge solutions and forward-thinking strategies.",
                          marks: [],
                          data: {}
                        }]
                      }]
                    } as any}
                    copy={{
                      nodeType: "document", 
                      data: {},
                      content: [{
                        nodeType: "paragraph",
                        data: {},
                        content: [{
                          nodeType: "text",
                          value: "Where innovation meets execution for extraordinary results.",
                          marks: [],
                          data: {}
                        }]
                      }]
                    } as any}
                    backgroundColor="brand-primary"
                    image={{
                      fields: {
                        file: {
                          url: "https://images.ctfassets.net/dyrv8i15m4hq/6TExr7UDAYKy7bZpTfbbNH/e582457da68b47857da9a9b6c72315c4/photo-1680070568461-0342ba529988?fm=webp&w=1200&q=75"
                        },
                        title: "GEG Hero Image"
                      }
                    } as any}
                    imagePosition="overlay"
                    primaryCta={{
                      fields: {
                        label: "Start Your Journey",
                        url: "#",
                        variant: "primary",
                        size: "large"
                      }
                    } as any}
                    height="full screen"
                  />
                </div>
              </div>

              {/* Hero with Brand Secondary Background */}
              <div>
                <p className="text-sm text-gray-600 mb-4">Brand Secondary Background</p>
                <div>
                  <Hero
                    heading="Build Your Skills"
                    subheading={{
                      nodeType: "document",
                      data: {},
                      content: [{
                        nodeType: "paragraph",
                        data: {},
                        content: [{
                          nodeType: "text",
                          value: "Develop expertise through hands-on learning and personalized mentorship programs.",
                          marks: [],
                          data: {}
                        }]
                      }]
                    } as any}
                    copy={{
                      nodeType: "document", 
                      data: {},
                      content: [{
                        nodeType: "paragraph",
                        data: {},
                        content: [{
                          nodeType: "text",
                          value: "Master new skills with our structured approach to professional growth.",
                          marks: [],
                          data: {}
                        }]
                      }]
                    } as any}
                    backgroundColor="brand-secondary"
                    image={{
                      fields: {
                        file: {
                          url: "https://images.ctfassets.net/dyrv8i15m4hq/6TExr7UDAYKy7bZpTfbbNH/e582457da68b47857da9a9b6c72315c4/photo-1680070568461-0342ba529988?fm=webp&w=1200&q=75"
                        },
                        title: "GEG Hero Image"
                      }
                    } as any}
                    imagePosition="center"
                    primaryCta={{
                      fields: {
                        label: "View Programs",
                        url: "#",
                        variant: "primary",
                        size: "large"
                      }
                    } as any}
                    height="full screen"
                  />
                </div>
              </div>

              {/* Hero with Brand Accent Background */}
              <div>
                <p className="text-sm text-gray-600 mb-4">Brand Accent Background</p>
                <div>
                  <Hero
                    heading="Discover Excellence"
                    subheading={{
                      nodeType: "document",
                      data: {},
                      content: [{
                        nodeType: "paragraph",
                        data: {},
                        content: [{
                          nodeType: "text",
                          value: "Uncover opportunities for growth and achieve remarkable outcomes with dedicated support.",
                          marks: [],
                          data: {}
                        }]
                      }]
                    } as any}
                    copy={{
                      nodeType: "document", 
                      data: {},
                      content: [{
                        nodeType: "paragraph",
                        data: {},
                        content: [{
                          nodeType: "text",
                          value: "Excellence is within reach when you have the right guidance and resources.",
                          marks: [],
                          data: {}
                        }]
                      }]
                    } as any}
                    backgroundColor="brand-accent"
                    image={{
                      fields: {
                        file: {
                          url: "https://images.ctfassets.net/dyrv8i15m4hq/6TExr7UDAYKy7bZpTfbbNH/e582457da68b47857da9a9b6c72315c4/photo-1680070568461-0342ba529988?fm=webp&w=1200&q=75"
                        },
                        title: "GEG Hero Image"
                      }
                    } as any}
                    imagePosition="center"
                    primaryCta={{
                      fields: {
                        label: "Get Started Today",
                        url: "#",
                        variant: "primary",
                        size: "large"
                      }
                    } as any}
                    height="full screen"
                  />
                </div>
              </div>

              {/* Hero with Neutral Dark Background and Image Overlay */}
              <div>
                <p className="text-sm text-gray-600 mb-4">Neutral Dark with Image Overlay</p>
                <div>
                  <Hero
                    heading="Professional Excellence"
                    subheading={{
                      nodeType: "document",
                      data: {},
                      content: [{
                        nodeType: "paragraph",
                        data: {},
                        content: [{
                          nodeType: "text",
                          value: "Elevate your professional standing with advanced training and industry recognition.",
                          marks: [],
                          data: {}
                        }]
                      }]
                    } as any}
                    copy={{
                      nodeType: "document", 
                      data: {},
                      content: [{
                        nodeType: "paragraph",
                        data: {},
                        content: [{
                          nodeType: "text",
                          value: "Professional excellence begins with the right foundation and continuous improvement.",
                          marks: [],
                          data: {}
                        }]
                      }]
                    } as any}
                    backgroundColor="neutral-dark"
                    image={{
                      fields: {
                        file: {
                          url: "https://images.ctfassets.net/dyrv8i15m4hq/6TExr7UDAYKy7bZpTfbbNH/e582457da68b47857da9a9b6c72315c4/photo-1680070568461-0342ba529988?fm=webp&w=1200&q=75"
                        },
                        title: "GEG Hero Image"
                      }
                    } as any}
                    imagePosition="overlay"
                    primaryCta={{
                      fields: {
                        label: "Learn More",
                        url: "#",
                        variant: "primary",
                        size: "large"
                      }
                    } as any}
                    height="full screen"
                  />
                </div>
              </div>

              {/* Hero with Surface Soft Background */}
              <div>
                <p className="text-sm text-gray-600 mb-4">Surface Soft Background</p>
                <div>
                  <Hero
                    heading="Warm & Welcoming"
                    subheading={{
                      nodeType: "document",
                      data: {},
                      content: [{
                        nodeType: "paragraph",
                        data: {},
                        content: [{
                          nodeType: "text",
                          value: "Join a supportive community where learning thrives and connections flourish.",
                          marks: [],
                          data: {}
                        }]
                      }]
                    } as any}
                    copy={{
                      nodeType: "document", 
                      data: {},
                      content: [{
                        nodeType: "paragraph",
                        data: {},
                        content: [{
                          nodeType: "text",
                          value: "Experience the warmth of a community dedicated to mutual growth and success.",
                          marks: [],
                          data: {}
                        }]
                      }]
                    } as any}
                    backgroundColor="surface-soft"
                    image={{
                      fields: {
                        file: {
                          url: "https://images.ctfassets.net/dyrv8i15m4hq/6TExr7UDAYKy7bZpTfbbNH/e582457da68b47857da9a9b6c72315c4/photo-1680070568461-0342ba529988?fm=webp&w=1200&q=75"
                        },
                        title: "GEG Hero Image"
                      }
                    } as any}
                    imagePosition="center"
                    primaryCta={{
                      fields: {
                        label: "Join Community",
                        url: "#",
                        variant: "primary",
                        size: "large"
                      }
                    } as any}
                    height="full screen"
                  />
                </div>
              </div>

              {/* Hero with Surface Pure Background */}
              <div>
                <p className="text-sm text-gray-600 mb-4">Surface Pure Background</p>
                <div>
                  <Hero
                    heading="Clean & Modern"
                    subheading={{
                      nodeType: "document",
                      data: {},
                      content: [{
                        nodeType: "paragraph",
                        data: {},
                        content: [{
                          nodeType: "text",
                          value: "Embrace simplicity with modern design principles and streamlined workflows.",
                          marks: [],
                          data: {}
                        }]
                      }]
                    } as any}
                    copy={{
                      nodeType: "document", 
                      data: {},
                      content: [{
                        nodeType: "paragraph",
                        data: {},
                        content: [{
                          nodeType: "text",
                          value: "Clean design and modern functionality create the perfect foundation for success.",
                          marks: [],
                          data: {}
                        }]
                      }]
                    } as any}
                    backgroundColor="surface-pure"
                    image={{
                      fields: {
                        file: {
                          url: "https://images.ctfassets.net/dyrv8i15m4hq/6TExr7UDAYKy7bZpTfbbNH/e582457da68b47857da9a9b6c72315c4/photo-1680070568461-0342ba529988?fm=webp&w=1200&q=75"
                        },
                        title: "GEG Hero Image"
                      }
                    } as any}
                    imagePosition="center"
                    primaryCta={{
                      fields: {
                        label: "Book Consultation",
                        url: "#",
                        variant: "primary",
                        size: "large"
                      }
                    } as any}
                    height="full screen"
                  />
                </div>
              </div>

              {/* Hero with Split Layout - Brand Primary Background */}
              <div>
                <p className="text-sm text-gray-600 mb-4">Split Layout - Content Left, Image Right</p>
                <div>
                  <Hero
                    heading="Where Craftsmanship Meets Musical Excellence"
                    subheading={{
                      nodeType: "document",
                      data: {},
                      content: [
                        {
                          nodeType: "paragraph",
                          data: {},
                          content: [
                            {
                              nodeType: "text",
                              value: "Discover your passion for piano with world-class instruction at the Raimondi Institute. Our tailored lessons and vibrant community events are designed to inspire mastery and connection.",
                              marks: [],
                              data: {}
                            }
                          ]
                        }
                      ]
                    } as any}
                    copy={{
                      nodeType: "document",
                      data: {},
                      content: [
                        {
                          nodeType: "paragraph",
                          data: {},
                          content: [
                            {
                              nodeType: "text",
                              value: "Your journey to mastery begins here.",
                              marks: [],
                              data: {}
                            }
                          ]
                        }
                      ]
                    } as any}
                    image={{
                      fields: {
                        file: {
                          url: "https://images.ctfassets.net/dyrv8i15m4hq/6TExr7UDAYKy7bZpTfbbNH/e582457da68b47857da9a9b6c72315c4/photo-1680070568461-0342ba529988?fm=webp&w=1200&q=75"
                        },
                        title: "GEG Hero Split Layout"
                      }
                    } as any}
                    imagePosition="split"
                    backgroundColor="brand-primary"
                    primaryCta={{
                      fields: {
                        text: "Explore Lessons",
                        link: "#",
                        variant: "primary",
                        size: "large"
                      }
                    } as any}
                    secondaryCta={{
                      fields: {
                        text: "Contact Us",
                        link: "#",
                        variant: "outline",
                        size: "large"
                      }
                    } as any}
                    height="full screen"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border mt-8">
              <h4 className="font-body-bold text-lg mb-3 text-brand-primary">Hero Module Features</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• <strong>Background Colors:</strong> All 6 brand colors supported</li>
                <li>• <strong>Image Positions:</strong> Overlay (with dark overlay), Center (stacked), or Split (content left, image right)</li>
                <li>• <strong>Typography:</strong> Automatic text color contrast based on background</li>
                <li>• <strong>CTA Integration:</strong> Optional call-to-action buttons with proper styling</li>
                <li>• <strong>Responsive:</strong> Adapts layout and typography for mobile devices</li>
                <li>• <strong>Accessibility:</strong> Proper contrast ratios and screen reader support</li>
              </ul>
            </div>
          </div>

          {/* ImageText Component Showcase */}
          <div className="mb-16">
            <h3 className="font-body-bold text-2xl mb-6 text-neutral-dark">ImageText Module Variations</h3>
            <div className="space-y-8">
              {/* ImageText with Image Left */}
              <div>
                <p className="text-sm text-gray-600 mb-4">Image Left Position</p>
                <div>
                  <ImageText
                    heading="Discover Excellence"
                    subheading={{
                      nodeType: "document",
                      data: {},
                      content: [
                        {
                          nodeType: "paragraph",
                          data: {},
                          content: [
                            {
                              nodeType: "text",
                              value: "Join a community dedicated to fostering growth, innovation, and academic achievement. Our comprehensive programs are designed to help you reach your full potential.",
                              marks: [],
                              data: {}
                            }
                          ]
                        }
                      ]
                    } as any}
                    image={{
                      fields: {
                        file: {
                          url: "https://images.ctfassets.net/dyrv8i15m4hq/6TExr7UDAYKy7bZpTfbbNH/e582457da68b47857da9a9b6c72315c4/photo-1680070568461-0342ba529988?fm=webp&w=1200&q=75"
                        },
                        title: "GEG Image"
                      }
                    } as any}
                    imagePosition="left"
                    backgroundColor="surface-pure"
                    primaryCta={{
                      fields: {
                        label: "Learn More",
                        url: "#",
                        variant: "primary",
                        size: "large"
                      }
                    } as any}
                  />
                </div>
              </div>

              {/* ImageText with Image Right */}
              <div>
                <p className="text-sm text-gray-600 mb-4">Image Right Position</p>
                <div>
                  <ImageText
                    heading="Build Your Skills"
                    subheading={{
                      nodeType: "document",
                      data: {},
                      content: [
                        {
                          nodeType: "paragraph",
                          data: {},
                          content: [
                            {
                              nodeType: "text",
                              value: "Develop expertise through our comprehensive programs designed for modern professionals. Access world-class resources and mentorship.",
                              marks: [],
                              data: {}
                            }
                          ]
                        }
                      ]
                    } as any}
                    image={{
                      fields: {
                        file: {
                          url: "https://images.ctfassets.net/dyrv8i15m4hq/6TExr7UDAYKy7bZpTfbbNH/e582457da68b47857da9a9b6c72315c4/photo-1680070568461-0342ba529988?fm=webp&w=1200&q=75"
                        },
                        title: "GEG Image"
                      }
                    } as any}
                    imagePosition="right"
                    backgroundColor="surface-soft"
                    primaryCta={{
                      fields: {
                        label: "Get Started",
                        url: "#",
                        variant: "primary",
                        size: "large"
                      }
                    } as any}
                  />
                </div>
              </div>

              {/* ImageText with Overlay */}
              <div>
                <p className="text-sm text-gray-600 mb-4">Overlay Position</p>
                <div>
                  <ImageText
                    heading="Professional Excellence"
                    subheading={{
                      nodeType: "document",
                      data: {},
                      content: [
                        {
                          nodeType: "paragraph",
                          data: {},
                          content: [
                            {
                              nodeType: "text",
                              value: "Elevate your career with advanced training and certification programs from industry leaders. Join thousands of successful graduates.",
                              marks: [],
                              data: {}
                            }
                          ]
                        }
                      ]
                    } as any}
                    image={{
                      fields: {
                        file: {
                          url: "https://images.ctfassets.net/dyrv8i15m4hq/6TExr7UDAYKy7bZpTfbbNH/e582457da68b47857da9a9b6c72315c4/photo-1680070568461-0342ba529988?fm=webp&w=1200&q=75"
                        },
                        title: "GEG Image"
                      }
                    } as any}
                    imagePosition="overlay"
                    backgroundColor="neutral-dark"
                    primaryCta={{
                      fields: {
                        label: "Explore Programs",
                        url: "#",
                        variant: "primary",
                        size: "large"
                      }
                    } as any}
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border mt-8">
              <h4 className="font-body-bold text-lg mb-3 text-brand-primary">ImageText Module Features</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• <strong>Image Positions:</strong> Left, Right, or Overlay</li>
                <li>• <strong>Background Colors:</strong> All 6 brand colors supported</li>
                <li>• <strong>Rich Text:</strong> Supports formatted content with links and lists</li>
                <li>• <strong>CTA Integration:</strong> Primary and secondary buttons with smart styling</li>
                <li>• <strong>Responsive:</strong> Stacks vertically on mobile devices</li>
                <li>• <strong>Accessibility:</strong> Proper heading hierarchy and contrast</li>
              </ul>
            </div>
          </div>

          {/* ImageCarousel Module Showcase */}
          <div className="mb-16">
            <h3 className="font-body-bold text-2xl mb-6 text-neutral-dark">ImageCarousel Module</h3>
            <div className="space-y-8">
              {/* Basic ImageCarousel */}
              <div>
                <p className="text-sm text-gray-600 mb-4">Basic Image Carousel with Multiple Images</p>
                <div>
                  <ImageCarousel
                    heading="Our Gallery"
                    images={[
                      {
                        fields: {
                          file: {
                            url: "https://images.ctfassets.net/dyrv8i15m4hq/6TExr7UDAYKy7bZpTfbbNH/e582457da68b47857da9a9b6c72315c4/photo-1680070568461-0342ba529988?fm=webp&w=1200&q=75"
                          },
                          title: "Piano Performance",
                          description: "Student performing at the annual recital"
                        }
                      },
                      {
                        fields: {
                          file: {
                            url: "https://images.ctfassets.net/dyrv8i15m4hq/6TExr7UDAYKy7bZpTfbbNH/e582457da68b47857da9a9b6c72315c4/photo-1680070568461-0342ba529988?fm=webp&w=1200&q=75"
                          },
                          title: "Master Class",
                          description: "World-renowned pianist teaching advanced techniques"
                        }
                      },
                      {
                        fields: {
                          file: {
                            url: "https://images.ctfassets.net/dyrv8i15m4hq/6TExr7UDAYKy7bZpTfbbNH/e582457da68b47857da9a9b6c72315c4/photo-1680070568461-0342ba529988?fm=webp&w=1200&q=75"
                          },
                          title: "Concert Hall",
                          description: "Our beautiful performance venue"
                        }
                      }
                    ] as any}
                    backgroundColor="surface-pure"
                  />
                </div>
              </div>

              {/* ImageCarousel with Dark Background */}
              <div>
                <p className="text-sm text-gray-600 mb-4">Carousel with Brand Primary Background</p>
                <div>
                  <ImageCarousel
                    heading="Featured Moments"
                    images={[
                      {
                        fields: {
                          file: {
                            url: "https://images.ctfassets.net/dyrv8i15m4hq/6TExr7UDAYKy7bZpTfbbNH/e582457da68b47857da9a9b6c72315c4/photo-1680070568461-0342ba529988?fm=webp&w=1200&q=75"
                          },
                          title: "Excellence in Practice",
                          description: "Daily dedication leads to mastery"
                        }
                      },
                      {
                        fields: {
                          file: {
                            url: "https://images.ctfassets.net/dyrv8i15m4hq/6TExr7UDAYKy7bZpTfbbNH/e582457da68b47857da9a9b6c72315c4/photo-1680070568461-0342ba529988?fm=webp&w=1200&q=75"
                          },
                          title: "Community Events",
                          description: "Building connections through music"
                        }
                      }
                    ] as any}
                    backgroundColor="brand-primary"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border mt-8">
              <h4 className="font-body-bold text-lg mb-3 text-brand-primary">ImageCarousel Module Features</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• <strong>Multiple Images:</strong> Display 2-10 images in a slideshow format</li>
                <li>• <strong>Navigation:</strong> Previous/Next buttons and dot indicators</li>
                <li>• <strong>Touch Support:</strong> Swipe gestures on mobile devices</li>
                <li>• <strong>Auto-play:</strong> Optional automatic slide progression</li>
                <li>• <strong>Captions:</strong> Title and description for each image</li>
                <li>• <strong>Background Colors:</strong> All 6 brand colors supported</li>
                <li>• <strong>Responsive:</strong> Adapts to different screen sizes</li>
                <li>• <strong>Accessibility:</strong> Keyboard navigation and ARIA labels</li>
              </ul>
            </div>
          </div>

          {/* Module Structure Reference */}
          <div className="mb-16">
            <h3 className="font-body-bold text-2xl mb-6 text-neutral-dark">Available Modules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border">
                <h4 className="font-body-bold text-lg mb-3 text-brand-primary">Hero Module</h4>
                <p className="text-sm text-gray-600 mb-3">Full-width banner with heading, subheading, and CTA</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Supports all brand colors</li>
                  <li>• Optional background image</li>
                  <li>• Responsive typography</li>
                  <li>• CTA button integration</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg border">
                <h4 className="font-body-bold text-lg mb-3 text-brand-primary">Grid Module</h4>
                <p className="text-sm text-gray-600 mb-3">Flexible grid layout for cards, testimonials, or image cards</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Auto-detects content type</li>
                  <li>• Responsive columns (1-4)</li>
                  <li>• Mixed content support</li>
                  <li>• Background color options</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg border">
                <h4 className="font-body-bold text-lg mb-3 text-brand-primary">ImageText Module</h4>
                <p className="text-sm text-gray-600 mb-3">Split layout with image and rich text content</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Left/right image positioning</li>
                  <li>• Rich text support</li>
                  <li>• Optional CTA button</li>
                  <li>• Responsive stacking</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg border">
                <h4 className="font-body-bold text-lg mb-3 text-brand-primary">ImageCarousel Module</h4>
                <p className="text-sm text-gray-600 mb-3">Image slideshow with navigation controls</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Swipe/touch navigation</li>
                  <li>• Auto-play options</li>
                  <li>• Caption support</li>
                  <li>• Responsive sizing</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border">
                <h4 className="font-body-bold text-lg mb-3 text-brand-primary">ContactForm Module</h4>
                <p className="text-sm text-gray-600 mb-3">Formspree-powered contact form with validation</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Multi-language support</li>
                  <li>• Field validation</li>
                  <li>• Success/error states</li>
                  <li>• Accessibility compliant</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border">
                <h4 className="font-body-bold text-lg mb-3 text-brand-primary">Navbar & Footer</h4>
                <p className="text-sm text-gray-600 mb-3">Global navigation and footer components</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Mobile-responsive menu</li>
                  <li>• Logo integration</li>
                  <li>• Multi-language switching</li>
                  <li>• Social media links</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Module Usage Examples */}
          <div className="mb-16">
            <h3 className="font-body-bold text-2xl mb-6 text-neutral-dark">Module Usage Patterns</h3>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border">
                <h4 className="font-body-bold text-lg mb-3 text-brand-secondary">Typical Page Structure</h4>
                <ol className="text-sm text-gray-600 space-y-2">
                  <li>1. Hero Module - Page introduction with CTA</li>
                  <li>2. ImageText Module - Key messaging with visual</li>
                  <li>3. Grid Module - Services/features showcase</li>
                  <li>4. Grid Module - Testimonials or case studies</li>
                  <li>5. ContactForm Module - Lead capture</li>
                </ol>
              </div>

              <div className="bg-white p-6 rounded-lg border">
                <h4 className="font-body-bold text-lg mb-3 text-brand-secondary">Background Color Strategy</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Alternate between light and dark sections for visual rhythm</li>
                  <li>• Use dark backgrounds for hero sections and important CTAs</li>
                  <li>• Light backgrounds work well for content-heavy sections</li>
                  <li>• Medium colors provide subtle emphasis without overwhelming</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spacing & Layout Section */}
      <section className="py-16 px-6 bg-brand-accent">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-heading text-4xl mb-8 text-neutral-dark">Spacing & Layout</h2>
          
          {/* Spacing Scale */}
          <div className="mb-12">
            <h3 className="font-body-bold text-2xl mb-6 text-neutral-dark">Spacing Scale</h3>
            <div className="space-y-3 bg-white p-6 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-20">spacing-xs</span>
                <div className="bg-brand-primary h-4" style={{ width: '4px' }}></div>
                <span className="text-xs text-gray-500">4px</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-20">spacing-sm</span>
                <div className="bg-brand-primary h-4" style={{ width: '8px' }}></div>
                <span className="text-xs text-gray-500">8px</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-20">spacing-md</span>
                <div className="bg-brand-primary h-4" style={{ width: '16px' }}></div>
                <span className="text-xs text-gray-500">16px</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-20">spacing-lg</span>
                <div className="bg-brand-primary h-4" style={{ width: '24px' }}></div>
                <span className="text-xs text-gray-500">24px</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-20">spacing-xl</span>
                <div className="bg-brand-primary h-4" style={{ width: '32px' }}></div>
                <span className="text-xs text-gray-500">32px</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-20">spacing-2xl</span>
                <div className="bg-brand-primary h-4" style={{ width: '48px' }}></div>
                <span className="text-xs text-gray-500">48px</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-20">spacing-3xl</span>
                <div className="bg-brand-primary h-4" style={{ width: '64px' }}></div>
                <span className="text-xs text-gray-500">64px</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-20">spacing-4xl</span>
                <div className="bg-brand-primary h-4" style={{ width: '96px' }}></div>
                <span className="text-xs text-gray-500">96px</span>
              </div>
            </div>
          </div>

          {/* Border Radius */}
          <div className="mb-12">
            <h3 className="font-body-bold text-2xl mb-6 text-neutral-dark">Border Radius</h3>
            <div className="flex flex-wrap gap-6 bg-white p-6 rounded-lg">
              <div className="text-center">
                <div className="w-24 h-24 bg-brand-primary rounded-none mb-2"></div>
                <p className="text-sm">rounded-none</p>
                <p className="text-xs text-gray-500">0px</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 bg-brand-primary rounded-sm mb-2"></div>
                <p className="text-sm">rounded-sm</p>
                <p className="text-xs text-gray-500">2px</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 bg-brand-primary rounded-md mb-2"></div>
                <p className="text-sm">rounded-md</p>
                <p className="text-xs text-gray-500">4px</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 bg-brand-primary rounded-lg mb-2"></div>
                <p className="text-sm">rounded-lg</p>
                <p className="text-xs text-gray-500">8px</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 bg-brand-primary rounded-xl mb-2"></div>
                <p className="text-sm">rounded-xl</p>
                <p className="text-xs text-gray-500">12px</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 bg-brand-primary rounded-full mb-2"></div>
                <p className="text-sm">rounded-full</p>
                <p className="text-xs text-gray-500">9999px</p>
              </div>
            </div>
          </div>

          {/* Shadows */}
          <div>
            <h3 className="font-body-bold text-2xl mb-6 text-neutral-dark">Shadows</h3>
            <div className="flex flex-wrap gap-6 bg-white p-6 rounded-lg">
              <div className="text-center">
                <div className="w-32 h-32 bg-white shadow-sm rounded-lg mb-2"></div>
                <p className="text-sm">shadow-sm</p>
              </div>
              <div className="text-center">
                <div className="w-32 h-32 bg-white shadow-md rounded-lg mb-2"></div>
                <p className="text-sm">shadow-md</p>
              </div>
              <div className="text-center">
                <div className="w-32 h-32 bg-white shadow-lg rounded-lg mb-2"></div>
                <p className="text-sm">shadow-lg</p>
              </div>
              <div className="text-center">
                <div className="w-32 h-32 bg-white shadow-xl rounded-lg mb-2"></div>
                <p className="text-sm">shadow-xl</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Layouts Section */}
      <section className="py-16 px-6 bg-surface-soft">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-heading text-4xl mb-8 text-neutral-dark">Grid Layouts</h2>
          
          <div className="space-y-8">
            <div>
              <p className="text-sm text-gray-600 mb-4">2 Column Grid</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border">Column 1</div>
                <div className="bg-white p-6 rounded-lg border">Column 2</div>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-4">3 Column Grid</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg border">Column 1</div>
                <div className="bg-white p-6 rounded-lg border">Column 2</div>
                <div className="bg-white p-6 rounded-lg border">Column 3</div>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-4">4 Column Grid</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg border">Column 1</div>
                <div className="bg-white p-6 rounded-lg border">Column 2</div>
                <div className="bg-white p-6 rounded-lg border">Column 3</div>
                <div className="bg-white p-6 rounded-lg border">Column 4</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Usage Guidelines */}
      <section className="py-16 px-6 bg-neutral-dark">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-heading text-4xl mb-8 text-white">Usage Guidelines</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/10 p-6 rounded-lg">
              <h3 className="font-body-bold text-xl mb-4 text-white">Typography Usage</h3>
              <ul className="space-y-2 text-white/80">
                <li>• Display font for main headings</li>
                <li>• Sans for body text and UI elements</li>
                <li>• Sans-bold for emphasis and subheadings</li>
                <li>• Serif for testimonials and quotes</li>
                <li>• Sans-light for subtle text</li>
              </ul>
            </div>

            <div className="bg-white/10 p-6 rounded-lg">
              <h3 className="font-body-bold text-xl mb-4 text-white">Color Usage</h3>
              <ul className="space-y-2 text-white/80">
                <li>• Brand Primary for primary actions</li>
                <li>• Brand Secondary for secondary elements</li>
                <li>• Brand Accent for subtle backgrounds</li>
                <li>• Neutral Dark for text and strong contrast</li>
                <li>• Surface Soft for soft backgrounds</li>
                <li>• Surface Pure for clean sections</li>
              </ul>
            </div>

            <div className="bg-white/10 p-6 rounded-lg">
              <h3 className="font-body-bold text-xl mb-4 text-white">Component Guidelines</h3>
              <ul className="space-y-2 text-white/80">
                <li>• Cards adapt to background colors</li>
                <li>• CTAs change style based on context</li>
                <li>• Image cards show descriptions on interaction</li>
                <li>• Testimonials use serif font for quotes</li>
              </ul>
            </div>

            <div className="bg-white/10 p-6 rounded-lg">
              <h3 className="font-body-bold text-xl mb-4 text-white">Accessibility</h3>
              <ul className="space-y-2 text-white/80">
                <li>• Maintain proper color contrast ratios</li>
                <li>• Use semantic HTML elements</li>
                <li>• Provide alt text for images</li>
                <li>• Ensure touch targets are 44x44px minimum</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}