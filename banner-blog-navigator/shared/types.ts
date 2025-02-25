export interface BriefFormData {
  title: string;
  description: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  date: string;
  author: {
    name: string;
    avatar: string;
  };
} 