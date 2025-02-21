import { BlogCategory } from "@/types/blog";

interface BlogNavProps {
  selectedCategory: BlogCategory | null;
  onSelectCategory: (category: BlogCategory | null) => void;
  sortBy: "newest" | "popular";
  onSortChange: (sort: "newest" | "popular") => void;
}

export function BlogNav({ selectedCategory, onSelectCategory, sortBy, onSortChange }: BlogNavProps) {
  const categories: BlogCategory[] = ["tips", "updates", "tutorial", "news", "design"];

  return (
    <div className="flex items-center gap-8 mb-8">
      <div className="flex items-center gap-6">
        <button 
          onClick={() => onSelectCategory(null)}
          className={`px-4 py-2 text-gray-300 transition-all rounded-lg ${
            !selectedCategory ? 'bg-white/10' : 'hover:bg-white/10'
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`px-4 py-2 text-gray-300 transition-all rounded-lg ${
              selectedCategory === category ? 'bg-white/10' : 'hover:bg-white/10'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 text-gray-300">
        <span>Sort by:</span>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as "newest" | "popular")}
          className="px-3 py-2 transition-all border rounded-lg bg-white/5 border-white/10 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
        >
          <option value="newest">Newest</option>
          <option value="popular">Popular</option>
        </select>
      </div>
    </div>
  );
} 