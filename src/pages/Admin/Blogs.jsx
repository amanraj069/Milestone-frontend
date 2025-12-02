import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, FieldArray, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import DashboardPage from '../../components/DashboardPage';

// Validation Schema
const blogValidationSchema = Yup.object().shape({
  title: Yup.string()
    .min(10, 'Title must be at least 10 characters')
    .max(200, 'Title must be less than 200 characters')
    .required('Title is required'),
  tagline: Yup.string()
    .min(20, 'Tagline must be at least 20 characters')
    .max(300, 'Tagline must be less than 300 characters')
    .required('Tagline is required'),
  category: Yup.string().required('Category is required'),
  imageUrl: Yup.string()
    .url('Must be a valid URL')
    .required('Image URL is required'),
  author: Yup.string().default('FreelancerHub Team'),
  readTime: Yup.number()
    .min(1, 'Read time must be at least 1 minute')
    .max(60, 'Read time must be less than 60 minutes')
    .required('Read time is required'),
  featured: Yup.boolean(),
  status: Yup.string().oneOf(['draft', 'published', 'archived']),
  content: Yup.array()
    .of(
      Yup.object().shape({
        heading: Yup.string()
          .min(5, 'Heading must be at least 5 characters')
          .required('Heading is required'),
        description: Yup.string()
          .min(50, 'Description must be at least 50 characters')
          .required('Description is required'),
      })
    )
    .min(1, 'At least one content section is required'),
});

const AdminBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const apiBaseUrl = import.meta.env.VITE_BACKEND_URL;

  const initialValues = {
    title: '',
    tagline: '',
    category: 'Freelancing Tips',
    imageUrl: '',
    author: 'FreelancerHub Team',
    readTime: 5,
    featured: false,
    status: 'published',
    content: [{ heading: '', description: '' }],
  };

  const categories = [
    'Freelancing Tips',
    'Career Advice',
    'Productivity',
    'Success Stories',
    'Tools & Resources',
    'Industry News',
    'Other',
  ];

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/blogs`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setBlogs(data.blogs);
      }
    } catch (error) {
      // Error fetching blogs
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const url = editingBlog
        ? `${apiBaseUrl}/api/admin/blogs/${editingBlog.blogId}`
        : `${apiBaseUrl}/api/admin/blogs`;

      const method = editingBlog ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.success) {
        alert(editingBlog ? 'Blog updated successfully!' : 'Blog created successfully!');
        resetForm();
        setShowForm(false);
        setEditingBlog(null);
        fetchBlogs();
      } else {
        alert(data.message || 'Failed to save blog');
      }
    } catch (error) {
      alert('An error occurred while saving the blog');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (blog) => {
    setEditingBlog(blog);
    setShowForm(true);
  };

  const handleDelete = async (blogId) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/blogs/${blogId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        alert('Blog deleted successfully!');
        fetchBlogs();
      } else {
        alert(data.message || 'Failed to delete blog');
      }
    } catch (error) {
      alert('An error occurred while deleting the blog');
    }
  };

  // Stats calculations
  const totalBlogs = blogs.length;
  const publishedBlogs = blogs.filter(b => b.status === 'published').length;
  const featuredBlogs = blogs.filter(b => b.featured).length;

  const headerAction = (
    <button
      onClick={() => {
        setShowForm(!showForm);
        setEditingBlog(null);
      }}
      className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
    >
      {showForm ? 'View Blogs' : 'Create New Blog'}
    </button>
  );

  return (
    <DashboardPage title="Blogs" headerAction={headerAction}>
      {showForm ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">
              {editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {editingBlog ? 'Update your blog post details' : 'Fill in the details to create a new blog'}
            </p>
          </div>

          <div className="p-6">
            <Formik
              initialValues={editingBlog || initialValues}
              validationSchema={blogValidationSchema}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              {({ values, isSubmitting }) => (
                <Form className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <Field
                      name="title"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter blog title"
                    />
                    <ErrorMessage name="title" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  {/* Tagline */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tagline *</label>
                    <Field
                      name="tagline"
                      as="textarea"
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter a catchy tagline"
                    />
                    <ErrorMessage name="tagline" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  {/* Row: Category, Author, Read Time */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                      <Field
                        name="category"
                        as="select"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </Field>
                      <ErrorMessage name="category" component="div" className="text-red-500 text-xs mt-1" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                      <Field
                        name="author"
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Read Time (min) *</label>
                      <Field
                        name="readTime"
                        type="number"
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <ErrorMessage name="readTime" component="div" className="text-red-500 text-xs mt-1" />
                    </div>
                  </div>

                  {/* Image URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL *</label>
                    <Field
                      name="imageUrl"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                    />
                    <ErrorMessage name="imageUrl" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  {/* Row: Status, Featured */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <Field
                        name="status"
                        as="select"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </Field>
                    </div>

                    <div className="flex items-center pt-6">
                      <Field
                        name="featured"
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm font-medium text-gray-700">Mark as Featured</label>
                    </div>
                  </div>

                  {/* Content Sections */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Content Sections *</label>
                    <FieldArray name="content">
                      {({ push, remove }) => (
                        <div className="space-y-4">
                          {values.content.map((section, index) => (
                            <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-medium text-gray-700">Section {index + 1}</span>
                                {values.content.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="text-red-600 hover:text-red-800 text-xs font-medium"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <Field
                                    name={`content.${index}.heading`}
                                    type="text"
                                    placeholder="Section heading"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                  <ErrorMessage name={`content.${index}.heading`} component="div" className="text-red-500 text-xs mt-1" />
                                </div>

                                <div>
                                  <Field
                                    name={`content.${index}.description`}
                                    as="textarea"
                                    rows="3"
                                    placeholder="Section description"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                  <ErrorMessage name={`content.${index}.description`} component="div" className="text-red-500 text-xs mt-1" />
                                </div>
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => push({ heading: '', description: '' })}
                            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors text-sm font-medium"
                          >
                            + Add Section
                          </button>
                        </div>
                      )}
                    </FieldArray>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-sm transition-colors"
                    >
                      {isSubmitting ? 'Saving...' : editingBlog ? 'Update Blog' : 'Create Blog'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingBlog(null);
                      }}
                      className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Blogs</p>
              <p className="text-2xl font-semibold text-gray-900">{totalBlogs}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Published</p>
              <p className="text-2xl font-semibold text-gray-900">{publishedBlogs}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Featured</p>
              <p className="text-2xl font-semibold text-gray-900">{featuredBlogs}</p>
            </div>
          </div>

          {/* Blog List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">All Blogs</h2>
              <p className="text-sm text-gray-500 mt-0.5">Manage your blog posts</p>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
                  <p className="text-gray-500 mt-3">Loading blogs...</p>
                </div>
              ) : blogs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-lg font-medium text-gray-700">No blogs found</p>
                  <p className="text-gray-500 mt-1 mb-4">Create your first blog post to get started</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Create Your First Blog
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {blogs.map((blog) => (
                    <div key={blog.blogId} className="border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                      <div className="p-4 flex justify-between items-center">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <img
                            src={blog.imageUrl}
                            alt={blog.title}
                            className="w-16 h-12 rounded object-cover flex-shrink-0"
                            onError={(e) => { e.target.src = '/assets/blog-default.jpg'; }}
                          />
                          <div className="min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">{blog.title}</h3>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                {blog.category}
                              </span>
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                blog.status === 'published'
                                  ? 'bg-green-100 text-green-700'
                                  : blog.status === 'draft'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {blog.status}
                              </span>
                              {blog.featured && (
                                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                                  Featured
                                </span>
                              )}
                              <span className="text-sm text-gray-500">{blog.readTimeDisplay}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0 ml-4">
                          <button
                            onClick={() => handleEdit(blog)}
                            className="px-3 py-1.5 bg-gray-900 text-white rounded-md text-xs font-medium hover:bg-gray-800 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(blog.blogId)}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardPage>
  );
};

export default AdminBlogs;

