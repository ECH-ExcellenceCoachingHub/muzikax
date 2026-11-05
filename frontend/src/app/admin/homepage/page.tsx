'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { convertImageUrl } from '../../../utils/imageUtils'

interface Slide {
  id: number
  title: string
  subtitle: string
  image: string
  cta: string
  type: 'explore' | 'upload' | 'vibes' | 'custom'
  link: string
  isActive: boolean
  order: number
}

interface Sections {
  showForYou: boolean
  showPopularBeats: boolean
  showRecommendedPlaylists: boolean
  showTrendingArtists: boolean
}

interface HomepageContent {
  slides: Slide[]
  currentSlide: number
  autoPlayInterval: number
  sections: Sections
}

export default function HomepageManagement() {
  const { isAuthenticated, userRole } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [content, setContent] = useState<HomepageContent>({
    slides: [],
    currentSlide: 0,
    autoPlayInterval: 5000,
    sections: {
      showForYou: true,
      showPopularBeats: true,
      showRecommendedPlaylists: true,
      showTrendingArtists: true
    }
  })
  
  const [newSlide, setNewSlide] = useState<Partial<Slide>>({
    title: '',
    subtitle: '',
    image: '',
    cta: 'Learn More',
    type: 'custom',
    link: '/',
    isActive: true
  })
  
  // Predefined navigation presets for quick selection
  const navigationPresets = [
    { label: 'Home', value: '/' },
    { label: 'Explore', value: '/explore' },
    { label: 'Upload', value: '/upload' },
    { label: 'Community Vibes', value: '/community' },
    { label: 'Charts', value: '/charts' },
    { label: 'Playlists', value: '/playlists' },
    { label: 'Live Rooms', value: '/live-rooms' },
    { label: 'Premium', value: '/premium' },
    { label: 'Custom', value: 'custom' }
  ]
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSlideId, setEditingSlideId] = useState<number | null>(null)

  // Access control is handled once in src/app/admin/layout.tsx.
  useEffect(() => {
    fetchHomepageContent()
  }, [])

  const fetchHomepageContent = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/homepage`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch homepage content')
      }
      
      const data = await response.json()
      setContent(data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching homepage content:', err)
      setLoading(false)
    }
  }

  const handleSaveContent = async () => {
    try {
      setSaving(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/homepage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(content)
      })
      
      if (!response.ok) {
        throw new Error('Failed to save homepage content')
      }
      
      const data = await response.json()
      setContent(data)
      setSaving(false)
      alert('Homepage content saved successfully!')
    } catch (err) {
      console.error('Error saving homepage content:', err)
      setSaving(false)
      alert('Failed to save homepage content')
    }
  }

  const handleReorderSlides = async (dragIndex: number, dropIndex: number) => {
    const reorderedSlides = [...content.slides]
    const draggedSlide = reorderedSlides[dragIndex]
    
    // Remove the dragged slide and insert it at the new position
    reorderedSlides.splice(dragIndex, 1)
    reorderedSlides.splice(dropIndex, 0, draggedSlide)
    
    // Update order values
    reorderedSlides.forEach((slide, index) => {
      slide.order = index
    })
    
    setContent({ ...content, slides: reorderedSlides })
    
    // Save to backend
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/homepage/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          slideIds: reorderedSlides.map(slide => slide.id)
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to reorder slides')
      }
      
      const data = await response.json()
      setContent({ ...content, slides: data.slides })
    } catch (err) {
      console.error('Error reordering slides:', err)
    }
  }

  const handleAddSlide = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/homepage/slides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(newSlide)
      })
      
      if (!response.ok) {
        throw new Error('Failed to add slide')
      }
      
      const data = await response.json()
      setContent({ ...content, slides: data.slides })
      setShowAddForm(false)
      setNewSlide({
        title: '',
        subtitle: '',
        image: '',
        cta: 'Learn More',
        type: 'custom',
        link: '/',
        isActive: true
      })
      alert('Slide added successfully!')
    } catch (err) {
      console.error('Error adding slide:', err)
      alert('Failed to add slide')
    }
  }

  const handleUpdateSlide = async (slideId: number, updates: Partial<Slide>) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/homepage/slides/${slideId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update slide')
      }
      
      const data = await response.json()
      setContent({ ...content, slides: data.slides })
      setEditingSlideId(null)
      alert('Slide updated successfully!')
    } catch (err) {
      console.error('Error updating slide:', err)
      alert('Failed to update slide')
    }
  }

  const handleDeleteSlide = async (slideId: number) => {
    if (!confirm('Are you sure you want to delete this slide?')) return
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/homepage/slides/${slideId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete slide')
      }
      
      const data = await response.json()
      setContent({ ...content, slides: data.slides })
      alert('Slide deleted successfully!')
    } catch (err) {
      console.error('Error deleting slide:', err)
      alert('Failed to delete slide')
    }
  }

  const handleSectionToggle = (section: keyof Sections) => {
    setContent({
      ...content,
      sections: {
        ...content.sections,
        [section]: !content.sections[section]
      }
    })
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('dragIndex', index.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = parseInt(e.dataTransfer.getData('dragIndex'))
    if (dragIndex !== dropIndex) {
      handleReorderSlides(dragIndex, dropIndex)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">

        {/* Slides Management */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Hero Slider Slides</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 btn-primary rounded-lg font-medium"
            >
              {showAddForm ? 'Cancel' : 'Add New Slide'}
            </button>
          </div>

          {/* Add New Slide Form */}
          {showAddForm && (
            <div className="bg-gray-700/50 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">Add New Slide</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={newSlide.title}
                    onChange={(e) => setNewSlide({ ...newSlide, title: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-600 rounded-lg border border-gray-500 focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Enter slide title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Subtitle</label>
                  <input
                    type="text"
                    value={newSlide.subtitle}
                    onChange={(e) => setNewSlide({ ...newSlide, subtitle: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-600 rounded-lg border border-gray-500 focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Enter slide subtitle"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Image URL</label>
                  <input
                    type="url"
                    value={newSlide.image}
                    onChange={(e) => setNewSlide({ ...newSlide, image: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-600 rounded-lg border border-gray-500 focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="https://share.google/FILE_ID or Google Drive link"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    💡 Supports: Google Share (share.google/...), Drive, Photos, Unsplash, Imgur, Cloudinary
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">CTA Button Text</label>
                  <input
                    type="text"
                    value={newSlide.cta}
                    onChange={(e) => setNewSlide({ ...newSlide, cta: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-600 rounded-lg border border-gray-500 focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Enter CTA text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Slide Type</label>
                  <select
                    value={newSlide.type}
                    onChange={(e) => setNewSlide({ ...newSlide, type: e.target.value as any })}
                    className="w-full px-4 py-2 bg-gray-600 rounded-lg border border-gray-500 focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="explore">Explore</option>
                    <option value="upload">Upload</option>
                    <option value="vibes">Vibes</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Navigation Link</label>
                  <select
                    value={navigationPresets.find(p => p.value === newSlide.link)?.value || 'custom'}
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      if (selectedValue === 'custom') {
                        // Keep current custom value
                      } else {
                        setNewSlide({ ...newSlide, link: selectedValue });
                      }
                    }}
                    className="w-full px-4 py-2 bg-gray-600 rounded-lg border border-gray-500 focus:border-primary focus:ring-1 focus:ring-primary mb-2"
                  >
                    {navigationPresets.map((preset) => (
                      <option key={preset.value} value={preset.value}>
                        {preset.label} → {preset.value}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newSlide.link}
                    onChange={(e) => setNewSlide({ ...newSlide, link: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-600 rounded-lg border border-gray-500 focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="/custom-path"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Select a preset or enter custom path
                  </p>
                </div>
              </div>
              <button
                onClick={handleAddSlide}
                className="px-6 py-2 btn-primary rounded-lg font-medium"
              >
                Add Slide
              </button>
            </div>
          )}

          {/* Slides List with Drag and Drop */}
          <div className="space-y-4">
            {content.slides.map((slide, index) => (
              <div
                key={slide.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className="bg-gray-700/50 rounded-lg p-4 cursor-move hover:bg-gray-600/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 text-gray-400 text-2xl">☰</div>
                  <img
                    src={convertImageUrl(slide.image)}
                    alt={slide.title}
                    className="w-32 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{slide.title}</h3>
                        <p className="text-gray-400 text-sm">{slide.subtitle}</p>
                        <div className="flex gap-2 mt-2 text-xs">
                          <span className="px-2 py-1 bg-primary/20 text-primary rounded">
                            {slide.type}
                          </span>
                          <span className={`px-2 py-1 rounded ${slide.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                            {slide.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingSlideId(slide.id)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSlide(slide.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit Slide Form */}
                {editingSlideId === slide.id && (
                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Title</label>
                        <input
                          type="text"
                          defaultValue={slide.title}
                          onChange={(e) => handleUpdateSlide(slide.id, { title: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-600 rounded-lg border border-gray-500 focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Subtitle</label>
                        <input
                          type="text"
                          defaultValue={slide.subtitle}
                          onChange={(e) => handleUpdateSlide(slide.id, { subtitle: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-600 rounded-lg border border-gray-500 focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Image URL</label>
                        <input
                          type="url"
                          defaultValue={slide.image}
                          onChange={(e) => handleUpdateSlide(slide.id, { image: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-600 rounded-lg border border-gray-500 focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">CTA</label>
                        <input
                          type="text"
                          defaultValue={slide.cta}
                          onChange={(e) => handleUpdateSlide(slide.id, { cta: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-600 rounded-lg border border-gray-500 focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Type</label>
                        <select
                          defaultValue={slide.type}
                          onChange={(e) => handleUpdateSlide(slide.id, { type: e.target.value as any })}
                          className="w-full px-4 py-2 bg-gray-600 rounded-lg border border-gray-500 focus:border-primary"
                        >
                          <option value="explore">Explore</option>
                          <option value="upload">Upload</option>
                          <option value="vibes">Vibes</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Link</label>
                        <select
                          value={navigationPresets.find(p => p.value === slide.link)?.value || 'custom'}
                          onChange={(e) => {
                            const selectedValue = e.target.value;
                            if (selectedValue === 'custom') {
                              // Keep current custom value
                            } else {
                              handleUpdateSlide(slide.id, { link: selectedValue });
                            }
                          }}
                          className="w-full px-4 py-2 bg-gray-600 rounded-lg border border-gray-500 focus:border-primary mb-2"
                        >
                          {navigationPresets.map((preset) => (
                            <option key={preset.value} value={preset.value}>
                              {preset.label} → {preset.value}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          defaultValue={slide.link}
                          onChange={(e) => handleUpdateSlide(slide.id, { link: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-600 rounded-lg border border-gray-500 focus:border-primary"
                          placeholder="/custom-path"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Select a preset or enter custom path
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Status</label>
                        <select
                          defaultValue={slide.isActive ? 'true' : 'false'}
                          onChange={(e) => handleUpdateSlide(slide.id, { isActive: e.target.value === 'true' })}
                          className="w-full px-4 py-2 bg-gray-600 rounded-lg border border-gray-500 focus:border-primary"
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingSlideId(null)}
                      className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Homepage Sections Toggle */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Homepage Sections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <h3 className="font-semibold">For You Section</h3>
                <p className="text-sm text-gray-400">Monthly popular tracks</p>
              </div>
              <button
                onClick={() => handleSectionToggle('showForYou')}
                className={`w-12 h-6 rounded-full transition-colors ${content.sections.showForYou ? 'bg-primary' : 'bg-gray-600'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transform transition-transform ${content.sections.showForYou ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <h3 className="font-semibold">Popular Beats</h3>
                <p className="text-sm text-gray-400">Beat tracks showcase</p>
              </div>
              <button
                onClick={() => handleSectionToggle('showPopularBeats')}
                className={`w-12 h-6 rounded-full transition-colors ${content.sections.showPopularBeats ? 'bg-primary' : 'bg-gray-600'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transform transition-transform ${content.sections.showPopularBeats ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <h3 className="font-semibold">Recommended Playlists</h3>
                <p className="text-sm text-gray-400">Curated playlists</p>
              </div>
              <button
                onClick={() => handleSectionToggle('showRecommendedPlaylists')}
                className={`w-12 h-6 rounded-full transition-colors ${content.sections.showRecommendedPlaylists ? 'bg-primary' : 'bg-gray-600'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transform transition-transform ${content.sections.showRecommendedPlaylists ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <h3 className="font-semibold">Trending Artists</h3>
                <p className="text-sm text-gray-400">Popular creators</p>
              </div>
              <button
                onClick={() => handleSectionToggle('showTrendingArtists')}
                className={`w-12 h-6 rounded-full transition-colors ${content.sections.showTrendingArtists ? 'bg-primary' : 'bg-gray-600'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transform transition-transform ${content.sections.showTrendingArtists ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Slider Settings */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Slider Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Auto-Play Interval (ms)</label>
              <input
                type="number"
                value={content.autoPlayInterval}
                onChange={(e) => setContent({ ...content, autoPlayInterval: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-600 rounded-lg border border-gray-500 focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <p className="text-xs text-gray-400 mt-1">Default: 5000ms (5 seconds)</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Current Slide Index</label>
              <input
                type="number"
                value={content.currentSlide}
                onChange={(e) => setContent({ ...content, currentSlide: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-600 rounded-lg border border-gray-500 focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <p className="text-xs text-gray-400 mt-1">Starting slide when page loads</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <button
            onClick={fetchHomepageContent}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium"
          >
            Refresh
          </button>
          <button
            onClick={handleSaveContent}
            disabled={saving}
            className="px-6 py-3 btn-primary rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
