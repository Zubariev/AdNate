import { useState } from "react";
import { BlogCard } from "../../components/blog/BlogCard";
import { blogPosts } from "../../data/blog-posts";
import { BlogCategory } from "@/types/blog";
import { Input } from "../../components/ui/input";
import { Search, Mail, TrendingUp } from "lucide-react";
import { Button } from "../../components/ui/button";
import { BlogNav } from "../../components/blog/BlogNav";
import { useNavigate } from "react-router-dom";
// Remove toast for now if not critical
// import { toast } from "../../components/ui/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<BlogCategory | null>(null);
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
    <div className="space-y-8 text-gray-300">
      <nav className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/')}
          className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 hover:opacity-90"
        >
          AdNate
        </button>
      </nav>

      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-white">Blog & Resources</h1>
        <p className="text-xl">
          Stay updated with the latest digital advertising trends, banner design tips, and platform updates.
        </p>
      </div>

      {/* Search and Navigation */}
      <div className="space-y-6">
        <div className="relative w-full">
          <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts by title, content, or tags..."
            className="w-full px-12 py-3 text-gray-300 transition-all duration-300 border rounded-lg bg-white/5 border-white/10 focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder:text-gray-400"
          />
        </div>
        <div className="space-y-4">
          <BlogNav 
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
          {selectedTag && (
            <div className="flex items-center gap-2 px-4 py-2 text-gray-300">
              <span>Filtered by tag:</span>
              <button
                onClick={() => setSelectedTag(null)}
                className="flex items-center gap-1 px-3 py-1 text-sm transition-colors rounded-full bg-white/10 hover:bg-white/20"
              >
                {selectedTag}
                <span className="ml-1">×</span>
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="min-h-screen bg-background">
        <div className="container py-12 animate-fade-in">
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
    </div>
  );
};

export default Index;
