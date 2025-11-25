# PDRV Frontend Application

Modern React-based web application for the Appointment Management System (Prise de Rendez-vous) with real-time notifications, multilingual support, and responsive design.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Build & Deployment](#build--deployment)
- [Features Guide](#features-guide)
- [Internationalization](#internationalization)
- [Performance](#performance)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

The PDRV Frontend is a comprehensive React TypeScript application that provides a modern user interface for appointment management. It features role-based access control, multilingual support (Arabic, English, French), real-time notifications, and a responsive design optimized for desktop and mobile devices.

## ✨ Features

- **🔐 Authentication & Authorization** - Secure JWT-based login with role-based access control
- **📅 Appointment Management** - Create, view, edit, and cancel appointments
- **👥 Client Management** - Manage client profiles and interaction history
- **📄 Document Management** - Upload and view documents with OCR text extraction
- **🔔 Real-time Notifications** - Push notifications and in-app alerts
- **📊 Dashboard Analytics** - View statistics and appointment data
- **🌍 Multilingual Support** - Arabic, English, French with i18n integration
- **📱 Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **🎨 Dark/Light Theme** - Toggle between light and dark modes
- **📈 Data Visualization** - Charts and graphs using Recharts & ApexCharts
- **🔍 Advanced Search & Filtering** - Global search and sophisticated filters
- **📋 Data Tables** - Paginated tables with sorting and filtering
- **🎯 Calendar Integration** - Full calendar for appointment scheduling
- **⚡ Performance Optimized** - Code splitting, lazy loading, and optimization

## 🛠 Tech Stack

| Component | Technology |
|-----------|-----------|
| **Framework** | React 18 |
| **Language** | TypeScript |
| **State Management** | Redux Toolkit + Redux Thunk |
| **UI Library** | Ant Design (antd) 5.x |
| **Styling** | SCSS + Bootstrap 5 |
| **HTTP Client** | Axios |
| **Internationalization** | i18next |
| **Charts** | Recharts, ApexCharts |
| **Calendar** | Full Calendar 6.x |
| **Testing** | Jest, React Testing Library |
| **Build Tool** | Create React App |
| **Icons** | Ant Design Icons, Lucide React |

## 📂 Project Structure

```
pdrv-front/src/
├── App.tsx                           # Root component
├── index.tsx                         # Entry point
├── config.js                         # App configuration
├── react-app-env.d.ts               # CRA type definitions
├── setupTests.ts                     # Test configuration
│
├── assets/                           # Static assets
│   ├── fonts/                        # Custom fonts
│   ├── images/                       # Images & SVGs
│   └── scss/                         # Global SCSS files
│
├── Common/                           # Shared components
│   ├── BreadCrumb.tsx               # Breadcrumb navigation
│   ├── DataTablePagination.js       # Pagination component
│   ├── Filter.tsx                   # Filter component
│   ├── GlobalSearchFilter.tsx       # Global search
│   ├── Pagination.tsx               # Pagination utility
│   ├── TableContainer.tsx           # Table wrapper
│   ├── Toast.tsx                    # Toast notifications
│   ├── ProfileDropdown.tsx          # User profile menu
│   ├── NotificationDropdown.tsx     # Notifications menu
│   ├── LayoutModeDropdown.tsx       # Theme selector
│   ├── i18n.tsx                     # i18n configuration
│   ├── constants/                   # App constants
│   ├── locales/                     # Translation files (ar, en, fr)
│   └── alerte_extensions/           # Alert extensions
│
├── Components/                       # Feature components
│   ├── Admin/                       # Admin-specific components
│   ├── Public/                      # Public-facing components
│   ├── Shared/                      # Shared feature components
│   ├── SupAdmin/                    # Super admin components
│   └── User/                        # User-specific components
│
├── Layout/                           # Layout components
│   ├── Header.tsx                   # Header component
│   ├── Sidebar.tsx                  # Sidebar navigation
│   ├── TopBar.tsx                   # Top bar/navbar
│   ├── LayoutMenuData.tsx           # Menu configuration
│   ├── NonAuthLayout.tsx            # Non-authenticated layout
│   ├── admin/                       # Admin layout variants
│   ├── HorizontalLayout/            # Horizontal navigation layout
│   ├── TwoColumnLayout/             # Two-column layout
│   └── VerticalLayouts/             # Vertical navigation layouts
│
├── Routes/                           # Routing configuration
│   ├── Index.tsx                    # Route configuration
│   └── allRoutes.tsx                # All route definitions
│
├── slices/                           # Redux slices
│   ├── index.ts                     # Slice exports
│   ├── thunk.ts                     # Async thunks
│   ├── auth/                        # Authentication state
│   ├── layouts/                     # Layout state
│   └── alerts/                      # Alert state
│
├── types/                            # TypeScript definitions
│   └── types.ts                     # Global type definitions
│
├── util/                             # Utility functions
│   ├── PushService.js               # Push notification service
│   ├── customHooks/                 # Custom React hooks
│   ├── modals/                      # Modal components
│   ├── services/                    # API services
│   ├── alerte_extensions/           # Alert utilities
│   └── scss/                        # Utility SCSS files
│
├── helpers/                          # Helper functions
│   ├── api_helper.ts                # API helper functions
│   ├── countryDialCodeHelper.ts     # Country dial codes
│   ├── dialToCountryCode.tsx        # Dial code utilities
│   ├── masksPhoneNumbers.json       # Phone number masks
│   ├── skeletonTable.tsx            # Skeleton loading
│   ├── stringHelper.ts              # String utilities
│   └── jwt-token-access/            # JWT token management
│
├── configs/                          # Configuration files
│   └── site.config.js               # Site configuration
│
└── public/                           # Static public files
    ├── index.html                   # HTML entry point
    ├── manifest.json                # PWA manifest
    └── robots.txt                   # SEO robots file
```

## 🚀 Installation

### Prerequisites

- **Node.js**: v16 or higher
- **npm**: v8 or higher
- **npm or yarn**: Package manager
- **Modern Browser**: Chrome, Firefox, Safari, Edge

### Quick Start

1. **Navigate to frontend directory**:
   ```bash
   cd pdrv-front
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   - Copy `.env.example` to `.env.local` (if exists)
   - Update API endpoint: `REACT_APP_API_URL=http://localhost:3000/api`
   - Set other required variables

4. **Start development server**:
   ```bash
   npm start
   ```
   Application opens at `http://localhost:3000`

5. **Build for production**:
   ```bash
   npm run build
   ```
   Optimized build is in `build/` directory

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_API_TIMEOUT=30000

# App Configuration
REACT_APP_APP_NAME=PDRV
REACT_APP_VERSION=0.1.0

# Feature Flags
REACT_APP_ENABLE_NOTIFICATIONS=true
REACT_APP_ENABLE_OCR=true
REACT_APP_ENABLE_ANALYTICS=false

# Default Settings
REACT_APP_DEFAULT_LANGUAGE=en
REACT_APP_DEFAULT_THEME=light

# Build Configuration
REACT_APP_SOURCE_MAP=false
REACT_APP_GENERATE_SOURCEMAP=false
```

### `src/config.js`

```javascript
export const apiConfig = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000
};

export const appConfig = {
  appName: process.env.REACT_APP_APP_NAME || 'PDRV',
  version: process.env.REACT_APP_VERSION || '0.1.0',
  defaultLanguage: process.env.REACT_APP_DEFAULT_LANGUAGE || 'en',
  defaultTheme: process.env.REACT_APP_DEFAULT_THEME || 'light'
};
```

## 🧪 Development

### Available Scripts

```bash
npm start              # Start development server (port 3000)
npm run build          # Production build
npm test               # Run test suite
npm test:coverage      # Run tests with coverage report
npm run eject          # Eject from Create React App (irreversible)
npm run lint           # Run ESLint
npm run type-check     # Run TypeScript type checking
npm run format         # Format code with Prettier
```

### Development Server

The development server runs on `http://localhost:3000` with hot module reloading:

```bash
npm start
```

### TypeScript Compilation

TypeScript is configured in `tsconfig.json` for strict type checking:

```bash
npm run type-check
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Fix linting issues automatically
npm run lint --fix
```

## 🏗 Build & Deployment

### Production Build

```bash
npm run build
```

This creates an optimized production build in the `build/` directory with:
- Minified JavaScript and CSS
- Code splitting and lazy loading
- Optimized images
- Source maps (optional)

### Deployment

#### Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:

```bash
docker build -t pdrv-frontend .
docker run -p 80:80 pdrv-frontend
```

#### Vercel/Netlify

```bash
# Vercel
npm i -g vercel
vercel

# Netlify
npm run build
# Upload 'build' folder to Netlify
```

#### Traditional Server

1. Build the application: `npm run build`
2. Upload `build/` folder to your web server
3. Configure server to serve `index.html` for SPA routing

## 📚 Features Guide

### Authentication

Login with credentials:

```typescript
// API call handled by Redux thunk
dispatch(loginUser({ email, password }))
```

### Appointment Management

Create, view, and manage appointments through the appointment dashboard.

### Document Upload

Upload documents with automatic OCR:

1. Navigate to Documents section
2. Click "Upload Document"
3. Select file and language
4. OCR text is automatically extracted

### Notifications

Enable push notifications:
- Desktop notifications
- In-app toast notifications
- Email notifications (backend)

### Search & Filtering

Use global search or advanced filters:
- Filter by date range
- Filter by status
- Filter by client
- Sort by multiple fields

## 🌍 Internationalization

### Supported Languages

- 🇸🇦 **Arabic** (ar)
- 🇬🇧 **English** (en)
- 🇫🇷 **French** (fr)

### Translation Files

Located in `src/Common/locales/`:

```
locales/
├── ar.json
├── en.json
└── fr.json
```

### Using Translations

In components:

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <button onClick={() => i18n.changeLanguage('ar')}>
        العربية
      </button>
    </div>
  );
}
```

### Adding Translations

1. Update translation files in `src/Common/locales/`
2. Use consistent key naming convention
3. Reload application to see changes

## ⚡ Performance

### Optimization Techniques

✅ **Implemented**:
- Code splitting with React.lazy()
- Image optimization
- CSS minification
- Bundle size monitoring
- Redux state normalization
- Memoization of components
- Virtual scrolling for large lists

### Performance Monitoring

```bash
npm run build
npm install -g serve
serve -s build
```

### Performance Budget

- **Main bundle**: < 200KB (gzipped)
- **CSS bundle**: < 50KB (gzipped)
- **First Contentful Paint**: < 2s
- **Time to Interactive**: < 4s

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Writing Tests

Test files use `.test.tsx` or `.test.ts` extension:

```typescript
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

test('renders welcome message', () => {
  render(<MyComponent />);
  expect(screen.getByText(/welcome/i)).toBeInTheDocument();
});
```

## 🆘 Troubleshooting

### Common Issues

**API Connection Error**
```
Error: Network error connecting to http://localhost:3000/api
```
Solution: Ensure backend is running and `REACT_APP_API_URL` is correct.

**Blank Page After Build**
```
Issue: Application shows blank page in production
```
Solution: Check browser console for errors, verify `PUBLIC_URL` in `.env`.

**Slow Performance**
```
Issue: Application is sluggish
```
Solutions:
- Check Redux DevTools for state size
- Use performance profiler
- Enable code splitting
- Optimize images

**TypeScript Errors**
```
Error: Object is of type 'unknown'
```
Solution: Update type definitions in `src/types/types.ts`.

### Debug Checklist

- [ ] Backend is running on correct port
- [ ] Environment variables are set correctly
- [ ] Node.js version matches package.json
- [ ] Dependencies are installed (`npm install`)
- [ ] Browser cache is cleared
- [ ] Console shows no JavaScript errors
- [ ] Redux DevTools extension installed (optional but helpful)
- [ ] Check network tab for API errors

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Redux Toolkit Guide](https://redux-toolkit.js.org/)
- [Ant Design Components](https://ant.design/components/overview/)
- [i18next Documentation](https://www.i18next.com/)
- [React Testing Library](https://testing-library.com/react)

## 🤝 Contributing

### Development Workflow

1. Create a feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. Make your changes and commit:
   ```bash
   git commit -m 'Add amazing feature'
   ```

3. Push to branch:
   ```bash
   git push origin feature/amazing-feature
   ```

4. Create a Pull Request with detailed description

### Code Style

- Follow ESLint rules
- Use TypeScript strict mode
- Use SCSS for styling
- Write descriptive commit messages
- Add tests for new features

## 📝 License

This project is proprietary and confidential. All rights reserved.

---

**Need Help?** Contact the development team or check the project documentation.

**Last Updated**: November 2024
