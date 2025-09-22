import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { getCategory } from '../api/categories'
import { getTopics } from '../api/topics'
import HomePage from './HomePage'

const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()

  const { data: category } = useQuery(
    ['category', slug],
    () => getCategory(slug!),
    { enabled: !!slug }
  )

  // Reuse HomePage component but with category filter
  return (
    <div>
      {category && (
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: category.color }}
            />
            <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
          </div>
          <p className="text-gray-600">{category.description}</p>
        </div>
      )}
      <HomePage />
    </div>
  )
}

export default CategoryPage