
import { BlogPost } from "@/types/blog";
import { BlogCard } from "./BlogCard";

interface RelatedPostsProps {
  currentPost: BlogPost;
  posts: BlogPost[];
  onTagClick: (tag: string) => void;
  selectedTag: string | null;
}

export function RelatedPosts({
  currentPost,
  posts,
  onTagClick,
  selectedTag,
}: RelatedPostsProps) {
  const relatedPosts = posts
    .filter(
      (post) =>
        post.id !== currentPost.id &&
        (post.category === currentPost.category ||
          post.tags.some((tag) => currentPost.tags.includes(tag)))
    )
    .slice(0, 3);

  if (relatedPosts.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-semibold mb-6">Related Posts</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {relatedPosts.map((post) => (
          <BlogCard
            key={post.id}
            post={post}
            onTagClick={onTagClick}
            selectedTag={selectedTag}
          />
        ))}
      </div>
    </div>
  );
}
