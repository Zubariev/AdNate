import { useState } from "react";
import { BlogCard } from "../../components/blog/BlogCard";
import { CategoryFilter } from "../../components/blog/CategoryFilter";
import { blogPosts } from "../../data/blog-posts";
import { BlogCategory } from "@/types/blog";
import { Input } from "../../components/ui/input";
import { Search, Mail, TrendingUp } from "lucide-react";
import { Button } from "../../components/ui/button";
// Remove toast for now if not critical
// import { toast } from "../../components/ui/use-toast";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<BlogCategory | null>(
    null
  );
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "popular">("newest");
  const [email, setEmail] = useState("");

  const categories = Array.from(
    new Set(blogPosts.map((post) => post.category))
  ) as BlogCategory[];

  // Get popular posts (for now, just the first 3 posts)
  const popularPosts = blogPosts.slice(0, 3);

  const filteredPosts = blogPosts
    .filter((post) => {
      const matchesCategory = !selectedCategory || post.category === selectedCategory;
      const matchesTag = !selectedTag || post.tags.includes(selectedTag);
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchesCategory && matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      // For now, popularity is determined by readTime (just as an example)
      return b.readTime - a.readTime;
    });

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag === selectedTag ? null : tag);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically integrate with a newsletter service
    // toast({
    //   title: "Thanks for subscribing!",
    //   description: "You'll receive our latest updates in your inbox.",
    // });
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12 animate-fade-in">
        <header className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">Blog & Resources</h1>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            Stay updated with the latest digital advertising trends, banner design
            tips, and platform updates.
          </p>
        </header>

        {/* Newsletter Subscription */}
        <div className="p-6 mb-12 border rounded-lg bg-card border-border">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-primary" />
              <div>
                <h3 className="font-semibold">Subscribe to Our Newsletter</h3>
                <p className="text-sm text-muted-foreground">
                  Get the latest design tips and resources directly in your inbox
                </p>
              </div>
            </div>
            <form onSubmit={handleNewsletterSubmit} className="flex w-full gap-2 md:w-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="max-w-xs"
              />
              <Button type="submit">Subscribe</Button>
            </form>
          </div>
        </div>

        {/* Popular Posts Section */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-semibold">Popular Posts</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {popularPosts.map((post) => (
              <BlogCard
                key={post.id}
                post={post}
                onTagClick={handleTagClick}
                selectedTag={selectedTag}
              />
            ))}
          </div>
        </div>

        <div className="max-w-xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search posts by title, content, or tags..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center">
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={(category) => {
              setSelectedCategory(category);
              setSelectedTag(null);
            }}
          />

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "newest" | "popular")}
              className="px-3 py-1 text-sm rounded-full bg-secondary"
            >
              <option value="newest">Newest</option>
              <option value="popular">Popular</option>
            </select>
          </div>
        </div>

        {selectedTag && (
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Filtered by tag:
              </span>
              <button
                onClick={() => setSelectedTag(null)}
                className="flex items-center gap-1 px-3 py-1 text-sm transition-colors rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {selectedTag}
                <span className="ml-1">×</span>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <BlogCard
              key={post.id}
              post={post}
              onTagClick={handleTagClick}
              selectedTag={selectedTag}
            />
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              No posts found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export { Index as BlogIndex };
