import axios from 'axios'

const API_BASE = '/api'

export interface Post {
  id: number
  topicId: number
  content: string
  rawContent: string
  postNumber: number
  isSolution: boolean
  likeCount: number
  isLiked: boolean
  replyToPostId?: number
  user: {
    id: number
    username: string
    displayName: string
    avatarUrl?: string
    reputation: number
    isVerified: boolean
    joinedAt: string
  }
  createdAt: string
  updatedAt: string
  editedAt?: string
  editedBy?: {
    username: string
    displayName: string
  }
}

export const getPosts = async (topicId: number): Promise<Post[]> => {
  const response = await axios.get(`${API_BASE}/posts/topic/${topicId}`)
  return response.data
}

export const createPost = async (data: {
  topicId: number
  content: string
  replyToPostId?: number
}): Promise<Post> => {
  const response = await axios.post(`${API_BASE}/posts`, data)
  return response.data
}

export const updatePost = async (id: number, data: {
  content: string
}): Promise<Post> => {
  const response = await axios.put(`${API_BASE}/posts/${id}`, data)
  return response.data
}

export const deletePost = async (id: number): Promise<void> => {
  await axios.delete(`${API_BASE}/posts/${id}`)
}

export const likePost = async (id: number): Promise<void> => {
  await axios.post(`${API_BASE}/posts/${id}/like`)
}

export const unlikePost = async (id: number): Promise<void> => {
  await axios.delete(`${API_BASE}/posts/${id}/like`)
}

export const markAsSolution = async (id: number): Promise<void> => {
  await axios.post(`${API_BASE}/posts/${id}/solution`)
}