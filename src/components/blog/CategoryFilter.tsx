
import { BlogCategory } from "@/types/blog";
import { cn } from "../../lib/utils";

interface CategoryFilterProps {
  categories: BlogCategory[];
  selectedCategory: BlogCategory | null;
  onSelectCategory: (category: BlogCategory | null) => void;
}

export const CategoryFilter = ({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <button
        onClick={() => onSelectCategory(null)}
        className={cn(
          "px-4 py-2 rounded-full text-sm font-medium transition-colors",
          !selectedCategory
            ? "bg-primary text-primary-foreground"
            : "bg-secondary hover:bg-secondary/80"
        )}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelectCategory(category)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-colors",
            selectedCategory === category
              ? "bg-primary text-primary-foreground"
              : "bg-secondary hover:bg-secondary/80"
          )}
        >
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </button>
      ))}
    </div>
  );
};
