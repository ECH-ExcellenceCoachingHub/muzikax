'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { isAuthenticated, userRole } = useAuth()

  // Access control is handled once in src/app/admin/layout.tsx.
  useEffect(() => {
    setLoading(false)
  }, [])

  // Form states
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'MuzikaX',
    siteDescription: 'The ultimate music streaming platform',
    contactEmail: 'support@muzikax.com',
    maintenanceMode: false
  })

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: true,
    passwordMinLength: 8,
    sessionTimeout: 30
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    userReports: true,
    systemAlerts: true
  })

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would save to the backend
    alert('General settings saved!')
  }

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would save to the backend
    alert('Security settings saved!')
  }

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would save to the backend
    alert('Notification settings saved!')
  }

  return (
    <div className="w-full">

          {/* Tabs */}
          <div className="card-bg rounded-2xl p-4 sm:p-6 mb-6">
            <div className="border-b border-gray-800">
              <nav className="-mb-px flex space-x-6 sm:space-x-8">
                {[
                  { id: 'general', name: 'General' },
                  { id: 'security', name: 'Security' },
                  { id: 'notifications', name: 'Notifications' },
                  { id: 'integrations', name: 'Integrations' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 text-sm sm:text-base font-medium border-b-2 ${
                      activeTab === tab.id
                        ? 'border-primary text-white'
                        : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {/* General Settings */}
              {activeTab === 'general' && (
                <form onSubmit={handleSaveGeneral}>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="siteName" className="block text-sm font-medium text-gray-400 mb-1">
                        Site Name
                      </label>
                      <input
                        type="text"
                        id="siteName"
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                        value={generalSettings.siteName}
                        onChange={(e) => setGeneralSettings({...generalSettings, siteName: e.target.value})}
                      />
                    </div>

                    <div>
                      <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-400 mb-1">
                        Site Description
                      </label>
                      <textarea
                        id="siteDescription"
                        rows={3}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                        value={generalSettings.siteDescription}
                        onChange={(e) => setGeneralSettings({...generalSettings, siteDescription: e.target.value})}
                      ></textarea>
                    </div>

                    <div>
                      <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-400 mb-1">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        id="contactEmail"
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                        value={generalSettings.contactEmail}
                        onChange={(e) => setGeneralSettings({...generalSettings, contactEmail: e.target.value})}
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="maintenanceMode"
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-700 rounded bg-gray-800"
                        checked={generalSettings.maintenanceMode}
                        onChange={(e) => setGeneralSettings({...generalSettings, maintenanceMode: e.target.checked})}
                      />
                      <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-400">
                        Enable Maintenance Mode
                      </label>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors"
                      >
                        Save General Settings
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <form onSubmit={handleSaveSecurity}>
                  <div className="space-y-6">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="twoFactorAuth"
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-700 rounded bg-gray-800"
                        checked={securitySettings.twoFactorAuth}
                        onChange={(e) => setSecuritySettings({...securitySettings, twoFactorAuth: e.target.checked})}
                      />
                      <label htmlFor="twoFactorAuth" className="ml-2 block text-sm text-gray-400">
                        Require Two-Factor Authentication for Admins
                      </label>
                    </div>

                    <div>
                      <label htmlFor="passwordMinLength" className="block text-sm font-medium text-gray-400 mb-1">
                        Minimum Password Length
                      </label>
                      <input
                        type="number"
                        id="passwordMinLength"
                        min="6"
                        max="20"
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                        value={securitySettings.passwordMinLength}
                        onChange={(e) => setSecuritySettings({...securitySettings, passwordMinLength: parseInt(e.target.value) || 8})}
                      />
                    </div>

                    <div>
                      <label htmlFor="sessionTimeout" className="block text-sm font-medium text-gray-400 mb-1">
                        Session Timeout (minutes)
                      </label>
                      <input
                        type="number"
                        id="sessionTimeout"
                        min="5"
                        max="120"
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value) || 30})}
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors"
                      >
                        Save Security Settings
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <form onSubmit={handleSaveNotifications}>
                  <div className="space-y-6">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="emailNotifications"
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-700 rounded bg-gray-800"
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => setNotificationSettings({...notificationSettings, emailNotifications: e.target.checked})}
                      />
                      <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-400">
                        Enable Email Notifications
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="userReports"
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-700 rounded bg-gray-800"
                        checked={notificationSettings.userReports}
                        onChange={(e) => setNotificationSettings({...notificationSettings, userReports: e.target.checked})}
                      />
                      <label htmlFor="userReports" className="ml-2 block text-sm text-gray-400">
                        Send User Reports Daily
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="systemAlerts"
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-700 rounded bg-gray-800"
                        checked={notificationSettings.systemAlerts}
                        onChange={(e) => setNotificationSettings({...notificationSettings, systemAlerts: e.target.checked})}
                      />
                      <label htmlFor="systemAlerts" className="ml-2 block text-sm text-gray-400">
                        System Alerts and Updates
                      </label>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors"
                      >
                        Save Notification Settings
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Integrations Settings */}
              {activeTab === 'integrations' && (
                <div className="space-y-6">
                  <div className="border border-gray-800 rounded-xl p-4 sm:p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-white">Spotify Integration</h3>
                        <p className="text-gray-500 text-sm mt-1">Connect with Spotify for cross-platform sharing</p>
                      </div>
                      <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors">
                        Configure
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-800 rounded-xl p-4 sm:p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-white">Apple Music Integration</h3>
                        <p className="text-gray-500 text-sm mt-1">Sync with Apple Music library</p>
                      </div>
                      <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors">
                        Configure
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-800 rounded-xl p-4 sm:p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-white">Google Analytics</h3>
                        <p className="text-gray-500 text-sm mt-1">Track user engagement and platform metrics</p>
                      </div>
                      <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors">
                        Configure
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-800 rounded-xl p-4 sm:p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-white">Payment Gateway</h3>
                        <p className="text-gray-500 text-sm mt-1">Configure subscription payments</p>
                      </div>
                      <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors">
                        Configure
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Platform Information */}
          <div className="card-bg rounded-2xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Platform Information</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="border border-gray-800 rounded-xl p-4 sm:p-5">
                <div className="text-gray-400 text-sm mb-1">Version</div>
                <div className="text-xl font-bold text-white">v2.1.4</div>
              </div>
              
              <div className="border border-gray-800 rounded-xl p-4 sm:p-5">
                <div className="text-gray-400 text-sm mb-1">Last Deployment</div>
                <div className="text-xl font-bold text-white">Dec 8, 2025</div>
              </div>
              
              <div className="border border-gray-800 rounded-xl p-4 sm:p-5">
                <div className="text-gray-400 text-sm mb-1">Uptime</div>
                <div className="text-xl font-bold text-white">99.98%</div>
              </div>
              
              <div className="border border-gray-800 rounded-xl p-4 sm:p-5">
                <div className="text-gray-400 text-sm mb-1">Database Size</div>
                <div className="text-xl font-bold text-white">2.4 GB</div>
              </div>
              
              <div className="border border-gray-800 rounded-xl p-4 sm:p-5">
                <div className="text-gray-400 text-sm mb-1">Active Connections</div>
                <div className="text-xl font-bold text-white">1,248</div>
              </div>
              
              <div className="border border-gray-800 rounded-xl p-4 sm:p-5">
                <div className="text-gray-400 text-sm mb-1">API Requests (24h)</div>
                <div className="text-xl font-bold text-white">1.2M</div>
              </div>
            </div>
          </div>
        </div>
  )
}
