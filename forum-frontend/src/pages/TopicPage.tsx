import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  Eye,
  ThumbsUp,
  MessageSquare,
  Share2,
  Flag,
  Edit,
  Pin,
  Lock,
  CheckCircle,
  User,
  Calendar,
  Award
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { getTopic, likeTopic, unlikeTopic } from '../api/topics'
import { getPosts, createPost, likePost, unlikePost } from '../api/posts'
import { useAuthStore } from '../stores/authStore'
import { formatDistanceToNow } from 'date-fns'
import PostEditor from '../components/PostEditor'

const TopicPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [showReplyEditor, setShowReplyEditor] = useState(false)
  const { user, isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: topic, isLoading: topicLoading } = useQuery(
    ['topic', id],
    () => getTopic(Number(id!)),
    {
      enabled: !!id,
    }
  )

  const { data: posts = [], isLoading: postsLoading } = useQuery(
    ['posts', id],
    () => getPosts(Number(id!)),
    {
      enabled: !!id,
    }
  )

  const likeMutation = useMutation(
    (postId: number) => likePost(postId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['posts', id])
      },
    }
  )

  const unlikeMutation = useMutation(
    (postId: number) => unlikePost(postId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['posts', id])
      },
    }
  )

  const replyMutation = useMutation(
    (content: string) => createPost({
      topicId: Number(id!),
      content,
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['posts', id])
        queryClient.invalidateQueries(['topic', id])
        setShowReplyEditor(false)
      },
    }
  )

  const handleLike = (postId: number, isLiked: boolean) => {
    if (!isAuthenticated) return

    if (isLiked) {
      unlikeMutation.mutate(postId)
    } else {
      likeMutation.mutate(postId)
    }
  }

  if (topicLoading || postsLoading) {
    return (
      <div className="space-y-6">
        <div className="card p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    )
  }

  if (!topic) {
    return <div>Topic not found</div>
  }

  return (
    <div className="space-y-6">
      {/* Topic Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              {topic.isPinned && <Pin className="h-5 w-5 text-primary-600" />}
              {topic.isLocked && <Lock className="h-5 w-5 text-gray-500" />}
              {topic.isSolved && <CheckCircle className="h-5 w-5 text-green-600" />}
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-3">{topic.title}</h1>

            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <Link
                to={`/category/${topic.category.slug}`}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${topic.category.color}20`,
                  color: topic.category.color,
                }}
              >
                {topic.category.name}
              </Link>

              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{topic.viewCount} views</span>
              </div>

              <div className="flex items-center space-x-1">
                <MessageSquare className="h-4 w-4" />
                <span>{topic.replyCount} replies</span>
              </div>

              <div className="flex items-center space-x-1">
                <ThumbsUp className="h-4 w-4" />
                <span>{topic.likeCount} likes</span>
              </div>
            </div>

            {/* Tags */}
            {topic.tags && topic.tags.length > 0 && (
              <div className="flex items-center space-x-2 mt-3">
                {topic.tags.map((tag) => (
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

          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
              <Share2 className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
              <Flag className="h-5 w-5" />
            </button>
            {isAuthenticated && user?.id === topic.user.id && (
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                <Edit className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post: any, index: number) => (
          <div key={post.id} className="card">
            <div className="p-6">
              <div className="flex items-start space-x-4">
                {/* User Info Sidebar */}
                <div className="flex-shrink-0 w-32">
                  <div className="text-center">
                    {post.user.avatarUrl ? (
                      <img
                        src={post.user.avatarUrl}
                        alt={post.user.username}
                        className="h-16 w-16 rounded-full mx-auto mb-2"
                      />
                    ) : (
                      <div className="h-16 w-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-2">
                        <User className="h-8 w-8 text-gray-600" />
                      </div>
                    )}

                    <div className="text-sm">
                      <Link
                        to={`/user/${post.user.username}`}
                        className="font-medium text-gray-900 hover:text-primary-600"
                      >
                        {post.user.displayName || post.user.username}
                      </Link>

                      {post.user.isVerified && (
                        <div className="flex items-center justify-center mt-1">
                          <CheckCircle className="h-4 w-4 text-blue-500" />
                        </div>
                      )}

                      <div className="flex items-center justify-center space-x-1 mt-1 text-xs text-gray-500">
                        <Award className="h-3 w-3" />
                        <span>{post.user.reputation}</span>
                      </div>

                      <div className="flex items-center justify-center space-x-1 mt-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>#{index + 1}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      {post.editedAt && (
                        <span className="ml-2">
                          (edited {formatDistanceToNow(new Date(post.editedAt), { addSuffix: true })})
                        </span>
                      )}
                    </div>

                    {post.isSolution && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Solution
                      </span>
                    )}
                  </div>

                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        code({node, inline, className, children, ...props}) {
                          const match = /language-(\w+)/.exec(className || '')
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={tomorrow}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          )
                        }
                      }}
                    >
                      {post.content}
                    </ReactMarkdown>
                  </div>

                  {/* Post Actions */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleLike(post.id, post.isLiked)}
                        disabled={!isAuthenticated}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          post.isLiked
                            ? 'bg-primary-100 text-primary-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>{post.likeCount}</span>
                      </button>

                      {isAuthenticated && (
                        <button className="text-sm text-gray-500 hover:text-gray-700">
                          Reply
                        </button>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <Share2 className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <Flag className="h-4 w-4" />
                      </button>
                      {isAuthenticated && user?.id === post.user.id && (
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply Section */}
      {isAuthenticated && !topic.isLocked && (
        <div className="card p-6">
          {!showReplyEditor ? (
            <button
              onClick={() => setShowReplyEditor(true)}
              className="btn btn-primary"
            >
              Reply to Topic
            </button>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reply to this topic</h3>
              <PostEditor
                onSubmit={(content) => replyMutation.mutate(content)}
                onCancel={() => setShowReplyEditor(false)}
                isSubmitting={replyMutation.isLoading}
                submitText="Post Reply"
              />
            </div>
          )}
        </div>
      )}

      {!isAuthenticated && (
        <div className="card p-6 text-center">
          <p className="text-gray-600 mb-4">You need to be logged in to reply to this topic.</p>
          <div className="space-x-3">
            <Link to="/login" className="btn btn-primary">
              Login
            </Link>
            <Link to="/register" className="btn btn-outline">
              Register
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default TopicPage