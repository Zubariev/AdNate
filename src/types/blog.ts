
export type BlogCategory = "tips" | "updates" | "news" | "design" | "tutorial";

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: BlogCategory;
  date: string;
  author: {
    name: string;
    avatar: string;
  };
  tags: string[];
  readTime: number;
}
