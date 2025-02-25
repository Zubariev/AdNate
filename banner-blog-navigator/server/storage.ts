import { BlogPost } from '../shared/types';

class Storage {
  private posts: BlogPost[] = [];

  async getBlogPosts(): Promise<BlogPost[]> {
    return this.posts;
  }

  async createBlogPost(post: BlogPost): Promise<BlogPost> {
    this.posts.push(post);
    return post;
  }
}

export const storage = new Storage(); 