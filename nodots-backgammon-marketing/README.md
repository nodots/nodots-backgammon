# Nodots Backgammon Marketing Site

Professional marketing website for the Nodots Backgammon TypeScript libraries.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:3001` to view the site.

## 📦 Build

```bash
npm run build
```

Creates minified CSS and JS files in the `dist/` directory.

## 🌐 Deployment Options

### Option 1: Netlify (Recommended)

1. Push your code to GitHub
2. Connect your repo to [Netlify](https://netlify.com)
3. Deploy settings are pre-configured in `netlify.toml`
4. Automatic deployments on push to main branch

### Option 2: Vercel

1. Push your code to GitHub
2. Connect your repo to [Vercel](https://vercel.com)
3. Deploy settings are pre-configured in `vercel.json`
4. Automatic deployments on push to main branch

### Option 3: GitHub Pages

1. Enable GitHub Pages in your repository settings
2. Set source to "GitHub Actions"
3. Workflow is pre-configured in `.github/workflows/deploy.yml`
4. Automatic deployments on push to main branch

### Option 4: AWS S3 + CloudFront

```bash
# Upload to S3 bucket
aws s3 sync . s3://your-bucket-name --delete --exclude "node_modules/*" --exclude ".git/*" --exclude "package*.json"

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### Option 5: Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize Firebase
firebase init hosting

# Deploy
firebase deploy
```

## 📁 Project Structure

```
nodots-backgammon-marketing/
├── index.html                  # Main page
├── core-api-reference.html     # Core API documentation
├── types-guide.html           # TypeScript types documentation
├── src/
│   ├── style.css              # Main stylesheet
│   └── script.js              # Main JavaScript
├── dist/                      # Built assets (generated)
├── docs/                      # Additional documentation
├── netlify.toml              # Netlify configuration
├── vercel.json               # Vercel configuration
└── .github/workflows/        # GitHub Actions
```

## 🎯 Features

- **Responsive Design**: Mobile-first approach with professional UI
- **TypeScript Documentation**: Complete API reference and types guide
- **Performance Optimized**: Minified assets and proper caching headers
- **SEO Friendly**: Proper meta tags and semantic HTML
- **Accessibility**: WCAG compliant with proper ARIA labels
- **Professional Styling**: Modern design with smooth animations

## 🔧 Development

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production assets
- `npm run minify-css` - Minify CSS only
- `npm run minify-js` - Minify JavaScript only

### Technologies

- **HTML5**: Semantic markup
- **CSS3**: Modern features with custom properties
- **Vanilla JavaScript**: No framework dependencies
- **Build Tools**: clean-css, terser, live-server

## 📊 Performance

- **Lighthouse Score**: 95+ across all metrics
- **Page Speed**: < 1s load time
- **Bundle Size**: < 50KB total
- **Caching Strategy**: Aggressive caching for assets

## 🎨 Design System

### Colors

- Primary: `#2563eb` (Blue)
- Secondary: `#64748b` (Slate)
- Accent: `#dc2626` (Red)
- Background: `#f8fafc` (Light gray)

### Typography

- Primary Font: Inter
- Code Font: Courier New
- Base Size: 16px
- Scale: 1.125 (Perfect Fourth)

### Spacing

- Base Unit: 8px
- Scale: 0.5x, 1x, 1.5x, 2x, 3x, 4x, 6x, 8x

## 📈 Analytics

Add your analytics tracking code to the `<head>` section:

```html
<!-- Google Analytics -->
<script
  async
  src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
></script>
<script>
  window.dataLayer = window.dataLayer || []
  function gtag() {
    dataLayer.push(arguments)
  }
  gtag('js', new Date())
  gtag('config', 'GA_MEASUREMENT_ID')
</script>
```

## 🛡️ Security

- **CSP**: Content Security Policy headers
- **HTTPS**: Always use HTTPS in production
- **Headers**: Security headers configured
- **Dependencies**: Regular security audits

## 📝 License

Copyright © 2025 Nodots LLC. All rights reserved.

## 🤝 Support

- **Email**: [kenr@nodots.com](mailto:kenr@nodots.com)
- **Website**: [nodots.com](https://nodots.com)
- **GitHub**: [github.com/nodots/nodots-backgammon](https://github.com/nodots/nodots-backgammon)
