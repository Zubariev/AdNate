import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/queryClient';
import type { BlogPost } from '@shared/types';

export default function Blog() {
  const { data: posts, isLoading, error } = useQuery<BlogPost[]>({
    queryKey: ['posts'],
    queryFn: () => fetchApi('/api/blog/posts'),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading posts</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Blog Posts</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts?.map((post) => (
          <div key={post.id} className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
            <p className="text-gray-600">{post.content}</p>
            <div className="mt-4 flex items-center">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-8 h-8 rounded-full mr-2"
              />
              <span className="text-sm text-gray-500">{post.author.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 