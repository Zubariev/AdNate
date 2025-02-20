import { useParams, Link } from "react-router-dom";
import { blogPosts } from "../../data/blog-posts";
import { format } from "date-fns";
import { ArrowLeft, Clock, Tag } from "lucide-react";

const PostDetail = () => {
  const { id } = useParams();
  const post = blogPosts.find((p) => p.id === id);

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-12">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold">Post not found</h1>
            <Link
              to="/"
              className="inline-flex items-center text-primary hover:underline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12 animate-fade-in">
        <Link
          to="/blog"
          className="inline-flex items-center mb-8 text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to blog
        </Link>

        <article>
          <div className="flex items-center gap-2 mb-4">
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full text-white bg-tag-${post.category}`}
            >
              {post.category}
            </span>
            <span className="text-sm text-muted-foreground">
              {format(new Date(post.date), "MMM dd, yyyy")}
            </span>
          </div>

          <h1 className="mb-6 text-4xl font-bold">{post.title}</h1>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-8 h-8 rounded-full"
              />
              <span>{post.author.name}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{post.readTime} min read</span>
            </div>
          </div>

          <div className="mb-8 prose prose-lg max-w-none">
            {post.content}
          </div>

          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <div
                key={tag}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-secondary"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
};

export default PostDetail;
