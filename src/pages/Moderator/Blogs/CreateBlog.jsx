import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, FieldArray, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import DashboardPage from '../../../components/DashboardPage';

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

const CreateBlog = () => {
  const navigate = useNavigate();
  const apiBaseUrl = import.meta.env.VITE_BACKEND_URL;
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');

  const initialValues = {
    title: '',
    tagline: '',
    category: 'Freelancing Tips',
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setImageError('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setImageError('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
      setImageError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      if (!imageFile) {
        setImageError('Blog image is required');
        setSubmitting(false);
        return;
      }

      setUploadingImage(true);

      // First upload the image
      const formData = new FormData();
      formData.append('image', imageFile);

      const uploadResponse = await fetch(`${apiBaseUrl}/api/moderator/blogs/upload-image`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadData.success) {
        setImageError(uploadData.message || 'Failed to upload image');
        setUploadingImage(false);
        setSubmitting(false);
        return;
      }

      setUploadingImage(false);

      // Now create the blog with the image URL
      const blogData = {
        ...values,
        imageUrl: uploadData.imageUrl,
      };

      const response = await fetch(`${apiBaseUrl}/api/moderator/blogs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(blogData),
      });

      const data = await response.json();

      if (data.success) {
        navigate('/moderator/blogs', { state: { message: 'Blog created successfully!' } });
      } else {
        alert(data.message || 'Failed to create blog');
      }
    } catch (error) {
      alert('An error occurred while creating the blog');
    } finally {
      setSubmitting(false);
    }
  };

  const headerAction = (
    <button
      onClick={() => navigate('/moderator/blogs')}
      className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
    >
      Back to Blogs
    </button>
  );

  return (
    <DashboardPage title="Create New Blog" headerAction={headerAction}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Create New Blog Post</h2>
          <p className="text-sm text-gray-500 mt-0.5">Fill in the details to create a new blog</p>
        </div>

        <div className="p-6">
          <Formik
            initialValues={initialValues}
            validationSchema={blogValidationSchema}
            onSubmit={handleSubmit}
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

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blog Image *</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
                    <div className="space-y-2 text-center">
                      {imagePreview ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="relative inline-block">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="max-h-48 max-w-xs rounded-lg object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setImageFile(null);
                                setImagePreview(null);
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                              aria-label="Remove image"
                            >
                              ×
                            </button>
                          </div>
                          <label className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-blue-200 bg-blue-50 text-blue-700 text-sm font-medium cursor-pointer hover:bg-blue-100">
                            <span>Change image</span>
                            <input
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleImageChange}
                            />
                          </label>
                        </div>
                      ) : (
                        <>
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <label className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-blue-200 bg-blue-50 text-blue-700 text-sm font-medium cursor-pointer hover:bg-blue-100">
                            <span>Upload an image</span>
                            <input
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleImageChange}
                            />
                          </label>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                        </>
                      )}
                    </div>
                  </div>
                  {imageError && <div className="text-red-500 text-xs mt-1">{imageError}</div>}
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
                    disabled={isSubmitting || uploadingImage}
                    className="flex-1 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-sm transition-colors"
                  >
                    {uploadingImage ? 'Uploading Image...' : isSubmitting ? 'Creating...' : 'Create Blog'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/moderator/blogs')}
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
    </DashboardPage>
  );
};

export default CreateBlog;
