import React from 'react'
import { useAuthStore } from '../stores/authStore'
import { User, Calendar, Award, MessageSquare, Eye } from 'lucide-react'

const ProfilePage: React.FC = () => {
  const { user } = useAuthStore()

  if (!user) {
    return <div>Please log in to view your profile.</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Info */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <div className="text-center">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="h-24 w-24 rounded-full mx-auto mb-4"
                />
              ) : (
                <div className="h-24 w-24 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-12 w-12 text-gray-600" />
                </div>
              )}

              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {user.displayName}
              </h2>
              <p className="text-gray-600 mb-4">@{user.username}</p>

              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Award className="h-4 w-4" />
                  <span>{user.reputation} reputation</span>
                </div>
              </div>

              {user.isVerified && (
                <div className="mt-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Verified
                  </span>
                </div>
              )}

              {(user.isAdmin || user.isModerator) && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {user.isAdmin ? 'Admin' : 'Moderator'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Activity */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Overview</h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <MessageSquare className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-sm text-gray-600">Topics Created</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <MessageSquare className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-sm text-gray-600">Posts Made</div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Recent Activity</h4>
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No recent activity</p>
              </div>
            </div>
          </div>

          <div className="card p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h3>
            <div className="space-y-4">
              <button className="btn btn-outline">Edit Profile</button>
              <button className="btn btn-outline">Change Password</button>
              <button className="btn btn-outline">Notification Settings</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage