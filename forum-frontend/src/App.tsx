import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import CategoryPage from './pages/CategoryPage'
import TopicPage from './pages/TopicPage'
import CreateTopicPage from './pages/CreateTopicPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import SearchPage from './pages/SearchPage'
import { useAuthStore } from './stores/authStore'

function App() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/topic/:id/:slug?" element={<TopicPage />} />
        <Route path="/search" element={<SearchPage />} />

        {isAuthenticated ? (
          <>
            <Route path="/new-topic" element={<CreateTopicPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </>
        ) : (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </>
        )}
      </Routes>
    </Layout>
  )
}

export default App