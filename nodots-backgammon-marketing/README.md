# Nodots Backgammon Marketing Site

A modern, responsive static website for marketing the Nodots Backgammon platform. Built with vanilla HTML, CSS, and JavaScript for optimal performance and easy deployment.

## Features

- **Modern Design**: Clean, professional layout with smooth animations
- **Fully Responsive**: Optimized for desktop, tablet, and mobile devices
- **Performance Optimized**: Static HTML with minimal JavaScript for fast loading
- **SEO Ready**: Proper meta tags, semantic HTML, and structured content
- **Accessibility**: WCAG compliant with keyboard navigation support
- **Mobile-First**: Responsive design with hamburger menu for mobile

## Design Highlights

- **Hero Section**: Eye-catching landing with animated backgammon board preview
- **Features Grid**: Showcases key platform capabilities with icons
- **Technology Stack**: Detailed breakdown of the technical architecture
- **Call-to-Action**: Strategic placement to drive user engagement
- **Professional Footer**: Complete site navigation and contact information

## Development

### Prerequisites

- Node.js (for development server and build tools)
- npm (comes with Node.js)

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```
   This opens the site at `http://localhost:3001`

### Build for Production

```bash
npm run build
```

This will:

- Minify CSS and JavaScript
- Create optimized files in the `dist/` directory
- Prepare assets for deployment

### Project Structure

```
nodots-backgammon-marketing/
├── index.html          # Main HTML file
├── src/
│   ├── style.css       # All CSS styles
│   └── script.js       # JavaScript functionality
├── assets/
│   ├── images/         # Image assets
│   └── icons/          # Icon files
├── dist/               # Built files (created by build script)
└── README.md
```

## Content Sections

### 1. Navigation

- Fixed header with smooth scrolling navigation
- Mobile hamburger menu
- Call-to-action button in nav

### 2. Hero Section

- Compelling headline and value proposition
- Animated backgammon board preview
- Key statistics (6 languages, 24/7 AI, etc.)
- Primary call-to-action buttons

### 3. Features

- 6 key feature cards with icons:
  - Global multilingual platform
  - World-class AI opponents
  - Mobile-optimized design
  - Low eye-strain interface
  - Real-time online play
  - Practice & training tools

### 4. About Section

- Target audience focus (serious players)
- Technical credibility highlights
- Statistical proof points

### 5. Technology Stack

- Frontend, Backend, and Game Engine details
- Modern technology showcase
- Developer-focused content

### 6. Call-to-Action

- Final conversion opportunity
- Links to app and GitHub
- Open source messaging

### 7. Footer

- Complete site navigation
- Contact information
- Legal and licensing info

## Key Features

### Responsive Design

- Mobile-first CSS with breakpoints at 768px and 480px
- Flexible grid layouts that adapt to screen size
- Touch-friendly navigation and buttons

### Performance

- Vanilla JavaScript (no framework overhead)
- CSS custom properties for consistent theming
- Optimized images and minimal external dependencies
- Lazy loading support for future image additions

### Accessibility

- Semantic HTML structure
- Proper heading hierarchy
- Keyboard navigation support
- Focus states for interactive elements
- Alt text for images (when added)
- Reduced motion support

### SEO Optimization

- Meta descriptions and keywords
- Open Graph tags for social sharing
- Structured content with proper headings
- Clean URLs and semantic markup

## Customization

### Colors

The site uses CSS custom properties for easy theming. Main colors:

- Primary: `#2563eb` (blue)
- Secondary: `#64748b` (slate)
- Accent: `#f59e0b` (amber)

### Typography

- Font: Inter (Google Fonts)
- Responsive font sizes
- Consistent spacing scale

### Layout

- CSS Grid for major layouts
- Flexbox for component alignment
- Consistent spacing using CSS custom properties

## Deployment

This static site can be deployed to any static hosting service:

- **Netlify**: Drag and drop the `dist/` folder
- **Vercel**: Connect to GitHub repository
- **GitHub Pages**: Enable in repository settings
- **AWS S3**: Upload files to S3 bucket with static hosting
- **Cloudflare Pages**: Connect to repository

### Build and Deploy Script Example

```bash
# Build the site
npm run build

# Deploy to your chosen platform
# (specific commands depend on your hosting provider)
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- iOS Safari (latest 2 versions)
- Android Chrome (latest 2 versions)

## License

MIT License - See LICENSE file for details

## Author

Ken Riley <kenr@nodots.com>
