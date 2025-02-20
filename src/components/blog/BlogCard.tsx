import { BlogPost } from "@/types/blog";
import { format } from "date-fns";
import { Clock, Tag } from "lucide-react";
import { cn } from "../../lib/utils";
import { Link } from "react-router-dom";

interface BlogCardProps {
  post: BlogPost;
  onTagClick: (tag: string) => void;
  selectedTag: string | null;
}

export const BlogCard = ({ post, onTagClick, selectedTag }: BlogCardProps) => {
  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.preventDefault(); // Prevent navigation when clicking tags
    onTagClick(tag);
  };

  return (
    <Link to={`/blog/post/${post.id}`}>
      <article className="overflow-hidden transition-all duration-300 border rounded-lg group bg-card border-border hover:shadow-lg animate-fade-up">
        <div className="p-6">
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
          
          <h3 className="mb-2 text-xl font-semibold transition-colors group-hover:text-primary">
            {post.title}
          </h3>
          
          <p className="mb-4 text-muted-foreground">{post.excerpt}</p>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-sm">{post.author.name}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{post.readTime} min read</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <button
                key={tag}
                onClick={(e) => handleTagClick(e, tag)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 text-xs rounded-full transition-colors",
                  selectedTag === tag
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80"
                )}
              >
                <Tag className="w-3 h-3" />
                {tag}
              </button>
            ))}
          </div>
        </div>
      </article>
    </Link>
  );
};
