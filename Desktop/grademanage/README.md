# Student Grade Management System

A responsive web application built with Tailwind CSS for managing student grades, courses, and academic records.

## Features

- **Responsive Design**: Fully responsive layout that works on desktop, tablet, and mobile devices
- **Modern UI**: Clean, professional interface using Tailwind CSS
- **Interactive Elements**: Hover effects, animations, and smooth transitions
- **Role-Based System**: Designed for both students and professors
- **Mobile-First**: Optimized for mobile experience with collapsible navigation

## Screenshots

The application features a comprehensive dashboard with multiple sections:

1. **Student Grade Management Challenge** - Project overview and learning objectives
2. **Key Features** - Authentication, course management, and grade management
3. **Student Dashboard** - Personal dashboard, UX features, and security
4. **Implementation Process** - Development phases and bonus challenges

## Getting Started

### Option 1: Simple Python Server (Recommended)

```bash
# Navigate to the project directory
cd grademanage

# Start the Python server
python serve.py
```

The application will be available at `http://localhost:3000`

### Option 2: Node.js Server (requires dependencies)

```bash
# Install dependencies
npm install

# Start the server
npm start
```

### Option 3: Static File Server

You can also serve the files from the `public` directory using any static file server.

## Project Structure

```
grademanage/
├── public/
│   ├── css/
│   │   ├── input.css       # Tailwind CSS source
│   │   └── styles.css      # Compiled styles
│   ├── js/
│   │   └── main.js         # Interactive JavaScript
│   └── index.html          # Main dashboard page
├── models/                 # Backend models (existing)
├── routes/                 # Backend routes (existing)
├── middleware/            # Backend middleware (existing)
├── tailwind.config.js     # Tailwind configuration
├── postcss.config.js      # PostCSS configuration
├── serve.py              # Python development server
├── package.json          # Node.js dependencies
└── server.js             # Main server file (existing)
```

## Responsive Features

### Mobile (< 768px)
- Hamburger menu for navigation
- Stacked card layout
- Full-width buttons
- Optimized touch targets

### Tablet (768px - 1024px)
- Two-column grid layout
- Responsive navigation bar
- Balanced content distribution

### Desktop (> 1024px)
- Four-column grid layout
- Full horizontal navigation
- Maximum content visibility
- Hover effects and animations

## Customization

### Colors
The application uses a custom color palette defined in `tailwind.config.js`:

- Primary blue: `#2563eb`
- Supporting colors: Purple, Green, Orange
- Neutral grays for text and backgrounds

### Typography
- Font family: Inter
- Responsive text sizing
- Proper contrast ratios for accessibility

### Layout
- 12-column CSS Grid system
- Responsive breakpoints
- Flexible spacing system

## Interactive Features

- **Mobile Menu**: Collapsible navigation for mobile devices
- **Card Animations**: Hover effects with smooth transitions
- **Button Ripples**: Material Design-inspired click effects
- **Scroll Animations**: Fade-in effects for cards on scroll
- **Typing Effect**: Animated title typing (optional)

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive design works on all screen sizes

## Development

To modify the design:

1. Edit the HTML in `public/index.html`
2. Modify styles in `public/css/input.css`
3. Add interactions in `public/js/main.js`
4. Run the development server to see changes

For production builds with proper Tailwind CSS compilation:

```bash
# Install dependencies first
npm install

# Build CSS
npm run build-css-prod
```

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test responsive design on multiple devices
5. Submit a pull request

---

Built with ❤️ using Tailwind CSS and modern web technologies.

---

Environment & Deployment

Backend environment variables (create backend/.env):

```
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/student_grade_management
JWT_SECRET=change_this_secret
JWT_EXPIRE=30d
BCRYPT_ROUNDS=12
FRONTEND_URL=http://localhost:3000
```

Run locally:

- Backend: `cd backend && npm install && npm start`
- Frontend: `cd frontend && npm install && npm start`

Deploy backend on Render:

- Build command: `npm install`
- Start command: `node server.js`
- Health check path: `/api/health`
- Add environment variables above

Deploy frontend on Vercel:

- Framework: Create React App (frontend folder)
- Build command: `npm run build`
- Output directory: `build`
- If you host backend on a different domain, remove CRA proxy and use an `axios` baseURL

Tailwind CSS note:

- The current React app uses Tailwind with CRA. Tailwind v4 migration in CRA requires moving to a compatible bundler (e.g., Vite/Next) or custom setup. I can migrate to Tailwind v4 in a follow-up.