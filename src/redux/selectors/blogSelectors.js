// Blog selectors for easy state access
export const selectAllBlogs = (state) => state.blog.blogs;
export const selectLatestBlogs = (state) => state.blog.latestBlogs;
export const selectFeaturedBlog = (state) => state.blog.featuredBlog;
export const selectCurrentBlog = (state) => state.blog.currentBlog;
export const selectRecentBlogs = (state) => state.blog.recentBlogs;
export const selectBlogLoading = (state) => state.blog.loading;
export const selectBlogError = (state) => state.blog.error;

// Derived selectors
export const selectBlogsByCategory = (state, category) => {
  if (category === 'All') return state.blog.blogs;
  return state.blog.blogs.filter(blog => blog.category === category);
};

export const selectPublishedBlogs = (state) => 
  state.blog.blogs.filter(blog => blog.status === 'published');

export const selectBlogById = (state, blogId) => 
  state.blog.blogs.find(blog => blog.blogId === blogId) || 
  state.blog.currentBlog;
