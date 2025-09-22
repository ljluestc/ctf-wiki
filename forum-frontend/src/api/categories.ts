import axios from 'axios'

const API_BASE = '/api'

export interface Category {
  id: number
  name: string
  slug: string
  description: string
  color: string
  icon?: string
  parentId?: number
  topicCount: number
  isPrivate: boolean
  createdAt: string
}

export const getCategories = async (): Promise<Category[]> => {
  const response = await axios.get(`${API_BASE}/categories`)
  return response.data
}

export const getCategory = async (slug: string): Promise<Category> => {
  const response = await axios.get(`${API_BASE}/categories/${slug}`)
  return response.data
}