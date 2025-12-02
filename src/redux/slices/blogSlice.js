import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000';

// Async thunks for blog operations
export const fetchAllBlogs = createAsyncThunk(
  'blog/fetchAllBlogs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/blogs`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch blogs');
    }
  }
);

export const fetchLatestBlogs = createAsyncThunk(
  'blog/fetchLatestBlogs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/blogs/latest`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch latest blogs');
    }
  }
);

export const fetchFeaturedBlog = createAsyncThunk(
  'blog/fetchFeaturedBlog',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/blogs/featured`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch featured blog');
    }
  }
);

export const fetchBlogById = createAsyncThunk(
  'blog/fetchBlogById',
  async (blogId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/blogs/${blogId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch blog');
    }
  }
);

export const fetchRecentBlogs = createAsyncThunk(
  'blog/fetchRecentBlogs',
  async (excludeId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/blogs/latest`);
      if (response.data.success && response.data.blogs) {
        // Filter out the current blog if excludeId is provided
        const blogs = excludeId 
          ? response.data.blogs.filter(blog => blog.blogId !== excludeId)
          : response.data.blogs;
        return { ...response.data, blogs };
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch recent blogs');
    }
  }
);

const initialState = {
  blogs: [],
  latestBlogs: [],
  featuredBlog: null,
  currentBlog: null,
  recentBlogs: [],
  loading: false,
  error: null,
  fetchingLatest: false,
  fetchingFeatured: false,
  fetchingCurrent: false,
  fetchingRecent: false,
};

const blogSlice = createSlice({
  name: 'blog',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentBlog: (state) => {
      state.currentBlog = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all blogs
      .addCase(fetchAllBlogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllBlogs.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.blogs = action.payload.blogs || [];
        }
      })
      .addCase(fetchAllBlogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch latest blogs
      .addCase(fetchLatestBlogs.pending, (state) => {
        state.fetchingLatest = true;
        state.error = null;
      })
      .addCase(fetchLatestBlogs.fulfilled, (state, action) => {
        state.fetchingLatest = false;
        if (action.payload.success) {
          state.latestBlogs = action.payload.blogs || [];
        }
      })
      .addCase(fetchLatestBlogs.rejected, (state, action) => {
        state.fetchingLatest = false;
        state.error = action.payload;
      })

      // Fetch featured blog
      .addCase(fetchFeaturedBlog.pending, (state) => {
        state.fetchingFeatured = true;
        state.error = null;
      })
      .addCase(fetchFeaturedBlog.fulfilled, (state, action) => {
        state.fetchingFeatured = false;
        if (action.payload.success) {
          state.featuredBlog = action.payload.blog || null;
        }
      })
      .addCase(fetchFeaturedBlog.rejected, (state, action) => {
        state.fetchingFeatured = false;
        state.error = action.payload;
      })

      // Fetch blog by ID
      .addCase(fetchBlogById.pending, (state) => {
        state.fetchingCurrent = true;
        state.error = null;
      })
      .addCase(fetchBlogById.fulfilled, (state, action) => {
        state.fetchingCurrent = false;
        if (action.payload.success) {
          state.currentBlog = action.payload.blog || null;
        }
      })
      .addCase(fetchBlogById.rejected, (state, action) => {
        state.fetchingCurrent = false;
        state.error = action.payload;
      })

      // Fetch recent blogs
      .addCase(fetchRecentBlogs.pending, (state) => {
        state.fetchingRecent = true;
        state.error = null;
      })
      .addCase(fetchRecentBlogs.fulfilled, (state, action) => {
        state.fetchingRecent = false;
        if (action.payload.success) {
          state.recentBlogs = action.payload.blogs || [];
        }
      })
      .addCase(fetchRecentBlogs.rejected, (state, action) => {
        state.fetchingRecent = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCurrentBlog } = blogSlice.actions;
export default blogSlice.reducer;
