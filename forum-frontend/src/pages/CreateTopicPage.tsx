import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'react-query'
import { getCategories } from '../api/categories'
import { createTopic } from '../api/topics'
import PostEditor from '../components/PostEditor'

const CreateTopicPage: React.FC = () => {
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [tags, setTags] = useState('')
  const navigate = useNavigate()

  const { data: categories = [] } = useQuery('categories', getCategories)

  const createMutation = useMutation(createTopic, {
    onSuccess: (data) => {
      navigate(`/topic/${data.topic.id}/${data.topic.slug}`)
    },
    onError: (error: any) => {
      console.error('Create topic error:', error)
    }
  })

  const handleSubmit = (content: string) => {
    if (!title.trim() || !categoryId || !content.trim()) {
      return
    }

    const tagArray = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    createMutation.mutate({
      title: title.trim(),
      content,
      categoryId: parseInt(categoryId),
      tags: tagArray
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Topic</h1>
        <p className="text-gray-600">
          Start a new discussion in the community. Make sure to choose the right category and add relevant tags.
        </p>
      </div>

      <div className="card p-6">
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Topic Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title for your topic..."
              className="input"
              maxLength={255}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              {title.length}/255 characters
            </p>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="input"
              required
            >
              <option value="">Select a category...</option>
              {categories.map((category: any) => (
                <option key={category.id} value={category.id}>
                  {category.name} - {category.description}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
              Tags (optional)
            </label>
            <input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Enter tags separated by commas (e.g., javascript, react, help)"
              className="input"
            />
            <p className="mt-1 text-xs text-gray-500">
              Separate multiple tags with commas. Maximum 5 tags.
            </p>
          </div>

          {/* Content Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <PostEditor
              onSubmit={handleSubmit}
              onCancel={() => navigate(-1)}
              isSubmitting={createMutation.isLoading}
              submitText="Create Topic"
              placeholder="Write your topic content here...

You can use Markdown formatting:
- **bold text**
- *italic text*
- `inline code`
- ```code blocks```
- [links](url)
- Lists and more!"
            />
          </div>

          {createMutation.error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">
                Error creating topic: {(createMutation.error as any)?.response?.data?.error || 'Unknown error'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Guidelines */}
      <div className="card p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Community Guidelines</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• Be respectful and constructive in your discussions</p>
          <p>• Choose the most appropriate category for your topic</p>
          <p>• Use descriptive titles that clearly explain your topic</p>
          <p>• Search existing topics before creating a new one</p>
          <p>• Add relevant tags to help others find your content</p>
          <p>• Follow community rules and terms of service</p>
        </div>
      </div>
    </div>
  )
}

export default CreateTopicPage