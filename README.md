
# Design Studio

A modern, full-featured design editor and blog platform built with React, TypeScript, and Supabase. Create stunning graphics, banners, and designs with an intuitive drag-and-drop interface, while also managing a complete blog system.

![Design Studio](public/placeholder.svg)

## 🚀 Features

### 🎨 Design Editor
- **Intuitive Canvas Interface**: Drag-and-drop design elements with precision
- **Rich Element Library**: Text, shapes, images, and custom elements
- **Layer Management**: Complete layer control with drag-and-drop reordering
- **Properties Panel**: Fine-tune colors, fonts, sizes, and positioning
- **AI Image Generation**: Powered by Hugging Face for creative assets
- **Multiple Export Formats**: PNG, JPG, SVG with quality options
- **Auto-save**: Never lose your work with automatic saving
- **Version Control**: Track changes and rollback to previous versions
- **Design Sharing**: Share designs with customizable permissions

### 📝 Blog System
- **Full-Featured CMS**: Create, edit, and manage blog posts
- **Category System**: Organize content with flexible categorization
- **Comment System**: Real-time commenting with moderation
- **SEO Optimized**: Clean URLs and meta tag management
- **Responsive Design**: Mobile-first responsive layout

### 🔐 Security & Authentication
- **Supabase Authentication**: Secure user management
- **Row-Level Security (RLS)**: Database-level security policies
- **Input Validation**: Comprehensive data validation with Zod
- **XSS Protection**: HTML sanitization with DOMPurify
- **Rate Limiting**: API protection against abuse
- **Secure File Upload**: Validated image uploads with type checking

### ⚡ Performance
- **Code Splitting**: Route-based lazy loading
- **State Management**: Optimized with Zustand
- **React Optimizations**: Memoization and performance best practices
- **Bundle Optimization**: Tree-shaking and dependency optimization

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for lightning-fast development
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Router** for navigation
- **Zustand** for state management
- **React Query** for data fetching

### Backend & Database
- **Supabase** for backend services
- **PostgreSQL** with real-time subscriptions
- **Row-Level Security (RLS)** for data protection

### External APIs
- **Hugging Face** for AI image generation

### Development Tools
- **TypeScript** for type safety
- **ESLint** for code quality
- **PostCSS** for CSS processing

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/design-studio.git
   cd design-studio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_HUGGINGFACE_API_KEY=your_huggingface_api_key
   ```

4. **Database Setup**
   ```bash
   # Run Supabase migrations
   npx supabase migration up
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:5173`

### Deployment on Replit

This project is optimized for deployment on Replit:

1. **Fork this Repl** or import from GitHub
2. **Configure Secrets** in Replit:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` 
   - `VITE_HUGGINGFACE_API_KEY`
3. **Run the project** - It will automatically install dependencies and start

## 📁 Project Structure

```
src/
├── api/              # External API integrations
├── components/       # React components
│   ├── auth/         # Authentication components
│   ├── blog/         # Blog-related components
│   ├── ui/           # shadcn/ui components
│   └── ...           # Design editor components
├── lib/              # Utility libraries
├── pages/            # Page components
├── stores/           # State management
├── types/            # TypeScript type definitions
└── styles/           # Global styles

supabase/
├── migrations/       # Database migrations
└── config.toml       # Supabase configuration
```

## 🎯 Usage

### Design Editor

1. **Create New Design**: Click "New Design" or select a template
2. **Add Elements**: Use the element panel to add text, shapes, or images
3. **Customize**: Use the properties panel to adjust colors, fonts, and positioning
4. **Layer Management**: Organize elements using the layer panel
5. **Save & Export**: Auto-save keeps your work safe, export in multiple formats

### Blog Management

1. **Admin Access**: Navigate to `/admin/blog` (requires authentication)
2. **Create Posts**: Use the rich text editor to create engaging content
3. **Manage Comments**: Moderate comments with real-time updates
4. **Categories**: Organize posts with the category system

## 🔧 API Reference

### Design Operations
```typescript
// Save design
await saveDesign({
  title: string,
  elements: DesignElement[],
  canvasSize: { width: number, height: number }
});

// Load design
const design = await loadDesign(designId);

// Share design  
const shareUrl = await shareDesign(designId, permissions);
```

### Blog Operations
```typescript
// Create blog post
await createBlogPost({
  title: string,
  content: string,
  category: string,
  published: boolean
});

// Add comment
await addComment(postId, content);
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use Prettier for code formatting
- Write tests for new features
- Update documentation as needed

## 🐛 Bug Reports

If you find a bug, please create an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Browser/environment details

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Supabase](https://supabase.com/) for the amazing backend platform
- [Hugging Face](https://huggingface.co/) for AI capabilities
- [Tailwind CSS](https://tailwindcss.com/) for styling framework

## 📞 Support

- 📧 Email: support@designstudio.dev
- 💬 Discord: [Join our community](https://discord.gg/designstudio)
- 📚 Documentation: [docs.designstudio.dev](https://docs.designstudio.dev)

---

Made with ❤️ by the Design Studio team
