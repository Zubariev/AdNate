
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
- **AI Brief Generation**: Google Gemini-powered concept generation from creative briefs
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
   - Create a `.env` file in the root directory
   - Add your API credentials:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # AI Services
   VITE_HUGGINGFACE_API_KEY=your_huggingface_api_key
   GEMINI_API_KEY=your_gemini_api_key
   
   # Server Configuration
   PORT=5001
   NODE_ENV=development

   # Python Image Generation API
   PYTHON_API_URL=http://127.0.0.1:8000
   ```
   
   **Getting API Keys:**
   - **Supabase**: Create a project at [supabase.com](https://supabase.com)
   - **Google Gemini**: Get API key from [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) (required for AI-generated design concepts)

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

6. **Start Python Image Generation Server**
   This is a separate server that handles AI image generation.
   Open a new terminal for this process.

   ```bash
   # Navigate to the python script directory
   cd server/lib

   # Install python dependencies
   pip install -r requirements.txt

   # Run the server
   uvicorn api:app --reload --port 8000
   ```

### Deployment on Replit

This project is optimized for deployment on Replit:

1. **Fork this Repl** or import from GitHub
2. **Configure Secrets** in Replit:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` 
   - `GEMINI_API_KEY` (optional, for AI-generated design concepts)
3. **Run the project** - It will automatically install dependencies and start

## 📁 Project Structure

```
src/
├── api/              # External API integrations (AI, Supabase, HuggingFace)
├── components/       # React components
│   ├── auth/         # Authentication components (AuthProvider, ProtectedRoute)
│   ├── blog/         # Blog-related components (BlogCard, CommentSection)
│   ├── ui/           # shadcn/ui components
│   └── ...           # Design editor components (Canvas, DesignEditor, LayerPanel, PropertiesPanel, Toolbar, etc.)
├── data/             # Static data (e.g., blog posts)
├── hooks/            # Reusable React hooks
├── integrations/     # Third-party service integrations (e.g., Supabase client)
├── lib/              # Utility libraries (API client, database operations, validations, etc.)
├── pages/            # Page components (Admin, Blog, Brief, LandingPage)
├── stores/           # State management with Zustand (e.g., designStore)
├── styles/           # Global styles and component-specific styles
├── types/            # TypeScript type definitions
└── ...               # Main application files (App.tsx, main.tsx, routes.tsx)

server/
├── api/              # Server-side API endpoints (briefs)
├── lib/              # Server-side utility libraries (Gemini, Python Image Generation)
├── index.ts          # Main server entry point
└── ...               # Other server-side files (db.ts, routes.ts, storage.ts)

shared/
├── briefs/           # Shared brief definitions
├── schema.ts         # Shared Zod schemas for validation
└── types/            # Shared TypeScript type definitions

supabase/
├── migrations/       # Database migration files
└── config.toml       # Supabase CLI configuration

public/
└── ...               # Static assets (icons, images)

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

---

# Application Logic

1. **User Registration / Login**

   * The user registers in the application or logs in if already registered.

2. **Redirect to Design List**

   * After a successful login, the user is redirected to the **Design List** page.

3. **Create a New Design**

   * The user clicks the **“+”** button to add a new design.

4. **Brief Page**

   * The user is redirected to the **Brief** page.
   * The user fills in the brief form.

5. **Brief Enhancement & Concept Generation**

   * The LLM automatically improves the submitted brief.
   * The LLM generates **three design concepts** based on the improved brief.

6. **Concept Selection**

   * The user selects **one concept**.
   * The user is redirected to a **Loading** page.

7. **Reference Image Creation**

   * While the user waits, the LLM generates a **reference image** for the selected concept.

8. **Element Specification & Image Generation**

   * The LLM creates a **detailed specification** for each design element based on:

     * the reference image,
     * the brief,
     * the selected concept.
   * Using this specification, element images are generated.
   * If an element image is not a “background,” a **background removal model** is applied.

9. **Design Assembly**

   * The processed element images (with transparent backgrounds) are placed on the **Design Editor** canvas according to their specifications.
   * The user is redirected to the **Design Editor** page with the assembled design elements.

10. **Design Editing & Management**

    * On the **Design Editor** page, the user can:

      * Edit design elements.
      * Save the design as a single card.
      * Import the design into **Figma**.
      * Save the current design state.
      * Delete the design from the application.
      * Share the design link with other registered users.

11. **Design List Access**

    * On the **Design List** page, the user can:

      * View all created designs.
      * Open any design to continue editing in the **Design Editor**.
      * Create a new design by clicking the **“+”** button.

---

flowchart TD

A[User registers or logs in] --> B[Redirect to Design List page]
B --> C[Click + to add new design]
C --> D[Redirect to Brief page]
D --> E[User fills in the brief]
E --> F[LLM improves brief]
F --> G[LLM generates 3 design concepts]
G --> H[User selects 1 concept]
H --> I[Redirect to Loading page]

I --> J[LLM creates reference image]
J --> K[LLM creates element specifications]
K --> L[LLM generates element images]
L --> M{Element is background?}
M -- No --> N[Apply background removal model]
M -- Yes --> O[Skip background removal]

N --> P[Place elements on canvas]
O --> P[Place elements on canvas]

P --> Q[Redirect to Design Editor page]

Q --> R[User edits design]
R --> S[Save as card / Save state / Delete design]
R --> T[Import design into Figma]
R --> U[Share link with other users]

Q --> V[Return to Design List page]
V --> B

