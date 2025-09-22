import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { Pin, MessageSquare, Eye, ThumbsUp, Clock, User, CheckCircle } from 'lucide-react'
import { getTopics } from '../api/topics'
import { formatDistanceToNow } from 'date-fns'

const HomePage: React.FC = () => {
  const [sortBy, setSortBy] = useState('latest')

  const { data: topics = [], isLoading } = useQuery(
    ['topics', sortBy],
    () => getTopics({ sort: sortBy }),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Latest Discussions</h1>

        <div className="flex items-center space-x-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input py-1.5 text-sm"
          >
            <option value="latest">Latest</option>
            <option value="popular">Popular</option>
            <option value="trending">Trending</option>
            <option value="unanswered">Unanswered</option>
          </select>
        </div>
      </div>

      {/* Topics List */}
      <div className="space-y-3">
        {topics.map((topic: any) => (
          <div key={topic.id} className="card hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start space-x-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {topic.user.avatarUrl ? (
                    <img
                      src={topic.user.avatarUrl}
                      alt={topic.user.username}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    {topic.isPinned && (
                      <Pin className="h-4 w-4 text-primary-600" />
                    )}
                    {topic.isSolved && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    <Link
                      to={`/topic/${topic.id}/${topic.slug}`}
                      className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                    >
                      {topic.title}
                    </Link>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <Link
                      to={`/category/${topic.category.slug}`}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${topic.category.color}20`,
                        color: topic.category.color,
                      }}
                    >
                      {topic.category.name}
                    </Link>

                    <span className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>{topic.user.displayName || topic.user.username}</span>
                    </span>

                    <span className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true })}</span>
                    </span>
                  </div>

                  {/* Tags */}
                  {topic.tags && topic.tags.length > 0 && (
                    <div className="flex items-center space-x-2 mt-2">
                      {topic.tags.map((tag: any) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex-shrink-0 text-right">
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{topic.replyCount}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{topic.viewCount}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{topic.likeCount}</span>
                    </div>
                  </div>

                  {/* Last reply info */}
                  {topic.lastReplyAt && (
                    <div className="mt-2 text-xs text-gray-400">
                      <div>Last reply by</div>
                      <div className="font-medium">
                        {topic.lastReplyUser?.displayName || topic.lastReplyUser?.username}
                      </div>
                      <div>
                        {formatDistanceToNow(new Date(topic.lastReplyAt), { addSuffix: true })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {topics.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No topics yet</h3>
          <p className="text-gray-500 mb-6">Be the first to start a discussion!</p>
          <Link to="/new-topic" className="btn btn-primary">
            Create New Topic
          </Link>
        </div>
      )}
    </div>
  )
}

export default HomePage