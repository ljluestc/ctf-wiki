import axios from 'axios'

const API_BASE = '/api'

export interface Topic {
  id: number
  title: string
  slug: string
  content?: string
  user: {
    id: number
    username: string
    displayName: string
    avatarUrl?: string
    reputation: number
    isVerified: boolean
  }
  category: {
    id: number
    name: string
    slug: string
    color: string
  }
  tags?: Array<{
    id: number
    name: string
    color: string
  }>
  isPinned: boolean
  isLocked: boolean
  isSolved: boolean
  viewCount: number
  replyCount: number
  likeCount: number
  createdAt: string
  updatedAt: string
  lastReplyAt?: string
  lastReplyUser?: {
    id: number
    username: string
    displayName: string
    avatarUrl?: string
  }
}

export interface TopicsQuery {
  sort?: 'latest' | 'popular' | 'trending' | 'unanswered'
  category?: string
  tag?: string
  page?: number
  limit?: number
  search?: string
}

export const getTopics = async (params: TopicsQuery = {}): Promise<Topic[]> => {
  const response = await axios.get(`${API_BASE}/topics`, { params })
  return response.data
}

export const getTopic = async (id: number): Promise<Topic> => {
  const response = await axios.get(`${API_BASE}/topics/${id}`)
  return response.data
}

export const createTopic = async (data: {
  title: string
  content: string
  categoryId: number
  tags?: string[]
}): Promise<Topic> => {
  const response = await axios.post(`${API_BASE}/topics`, data)
  return response.data
}

export const updateTopic = async (id: number, data: Partial<Topic>): Promise<Topic> => {
  const response = await axios.put(`${API_BASE}/topics/${id}`, data)
  return response.data
}

export const deleteTopic = async (id: number): Promise<void> => {
  await axios.delete(`${API_BASE}/topics/${id}`)
}

export const likeTopic = async (id: number): Promise<void> => {
  await axios.post(`${API_BASE}/topics/${id}/like`)
}

export const unlikeTopic = async (id: number): Promise<void> => {
  await axios.delete(`${API_BASE}/topics/${id}/like`)
}