import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  MessageSquare,
  Code,
  Shield,
  BookOpen,
  HelpCircle,
  TrendingUp,
  Clock,
  Star
} from 'lucide-react'
import { useQuery } from 'react-query'
import { getCategories } from '../api/categories'

const Sidebar: React.FC = () => {
  const location = useLocation()
  const { data: categories = [] } = useQuery('categories', getCategories)

  const categoryIcons: Record<string, React.ComponentType<any>> = {
    'general': MessageSquare,
    'development': Code,
    'security': Shield,
    'tutorials': BookOpen,
    'support': HelpCircle,
  }

  const navigationItems = [
    { label: 'Latest', path: '/', icon: Clock },
    { label: 'Popular', path: '/popular', icon: TrendingUp },
    { label: 'Featured', path: '/featured', icon: Star },
  ]

  return (
    <aside className="w-64 flex-shrink-0">
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Navigation</h2>
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="card p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
        <nav className="space-y-2">
          {categories.map((category: any) => {
            const Icon = categoryIcons[category.slug] || MessageSquare
            const isActive = location.pathname === `/category/${category.slug}`

            return (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{category.name}</span>
                </div>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                  {category.topicCount || 0}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="card p-6 mt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Forum Stats</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Topics</span>
            <span className="font-medium">1,234</span>
          </div>
          <div className="flex justify-between">
            <span>Posts</span>
            <span className="font-medium">5,678</span>
          </div>
          <div className="flex justify-between">
            <span>Members</span>
            <span className="font-medium">890</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar