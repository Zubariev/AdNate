import { Link } from 'react-router-dom';

export default function Index() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-6">Welcome to Banner Blog</h1>
      <p className="text-lg text-gray-600 mb-8 text-center max-w-2xl">
        Discover insights about banner design, digital advertising, and more.
      </p>
      <Link
        to="/blog"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Explore Blog
      </Link>
    </div>
  );
} 