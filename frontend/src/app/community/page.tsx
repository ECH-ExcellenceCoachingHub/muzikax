'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSearchParams, useRouter } from 'next/navigation';
import { FaPlus, FaMusic, FaUserFriends, FaFire, FaShare, FaArrowLeft } from 'react-icons/fa';
import { proxyUpload } from '../../services/s3Service';
import { extractVideoThumbnail, compressImage } from '../../utils/videoThumbnail';

interface Vibe {
  id: string;
  _id?: string;
  userId: any;
  userName: string;
  userAvatar?: string;
  content: string;
  mediaUrl?: string;
  mediaThumbnail?: string;
  postType: 'text' | 'image' | 'video';
  category: string;
  likes: number;
  liked: boolean;
  commentCount: number;
  comments: any[];
  shares: number;
  createdAt: string;
}

const CommunityContent = () => {
  const { t } = useLanguage();
  const { user, fetchUserProfile, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const postIdFromUrl = searchParams.get('postId');
  const [authChecked, setAuthChecked] = useState(false);
  
  const [vibes, setVibes] = useState<Vibe[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newVibe, setNewVibe] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [mediaFile, setMediaFile] = useState<{cdnUrl: string, isImage: boolean, thumbnail?: string} | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedComments, setExpandedComments] = useState<{[key: string]: boolean}>({}); 
  const [newComment, setNewComment] = useState<{[key: string]: string}>({}); 
  const [loadingComments, setLoadingComments] = useState<{[key: string]: boolean}>({}); 
  const [sharedNotification, setSharedNotification] = useState<string | null>(null); 
  const [recommendedArtists, setRecommendedArtists] = useState<any[]>([]); 
  const [loadingArtists, setLoadingArtists] = useState(true); 
  const [followedArtists, setFollowedArtists] = useState<{[key: string]: boolean}>({}); 
  const [showArtistsModal, setShowArtistsModal] = useState(false); 
  const [artistFilter, setArtistFilter] = useState('all'); 
  const [scrolledToPost, setScrolledToPost] = useState(false);

  // Scroll to post if postId is in URL
  useEffect(() => {
    if (postIdFromUrl && vibes.length > 0 && !scrolledToPost) {
      const element = document.getElementById(`vibe-${postIdFromUrl}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight the post
        element.classList.add('ring-2', 'ring-primary', 'ring-offset-4', 'ring-offset-background-deep');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-primary', 'ring-offset-4', 'ring-offset-background-deep');
        }, 3000);
        setScrolledToPost(true);
      }
    }
  }, [postIdFromUrl, vibes, scrolledToPost]);

  // Helper function to make API requests with automatic token refresh
  let refreshPromise: Promise<string | null> | null = null;

  const makeApiRequest = async (url: string, options: RequestInit = {}) => {
    let token = localStorage.getItem('accessToken');
    
    const headers: Record<string, string> = {
      'Authorization': token ? `Bearer ${token}` : '',
      ...(options.headers as Record<string, string>)
    };
    
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    
    const requestConfig = {
      ...options,
      headers
    };
    
    let response = await fetch(url, requestConfig);
    
    if (response.status === 401) {
      if (refreshPromise) {
        token = await refreshPromise;
        if (token) {
          (requestConfig.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
          return await fetch(url, requestConfig);
        }
      }

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        refreshPromise = (async () => {
          try {
            const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh-token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ refreshToken })
            });
            
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              localStorage.setItem('accessToken', refreshData.accessToken);
              localStorage.setItem('refreshToken', refreshData.refreshToken);
              return refreshData.accessToken;
            }
            return null;
          } catch (err) {
            console.error('Token refresh error:', err);
            return null;
          } finally {
            refreshPromise = null;
          }
        })();

        token = await refreshPromise;
        
        if (token) {
          (requestConfig.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
          return await fetch(url, requestConfig);
        } else {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return response;
        }
      } else {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return response;
      }
    }
    
    return response;
  };

  const fetchVibes = async () => {
    try {
      const response = await makeApiRequest(`${process.env.NEXT_PUBLIC_API_URL}/api/community/posts`);
      if (response.ok) {
        const data = await response.json();
        const processedVibes = data.posts.map((post: any) => ({
          ...post,
          id: post.id || post._id,
          likes: post.likes || 0,
          commentCount: typeof post.comments === 'number' ? post.comments : (Array.isArray(post.comments) ? post.comments.length : 0),
          comments: Array.isArray(post.comments) ? post.comments : [],
          liked: post.liked || false
        }));
        setVibes(processedVibes);
      }
    } catch (error) {
      console.error('Error fetching vibes:', error);
    }
  };

  const fetchRecommendedArtists = async () => {
    try {
      setLoadingArtists(true);
      
      let followingIds: string[] = [];
      
      if (user && user.following) {
        followingIds = user.following
          .map((id: any) => {
            if (!id) return '';
            if (typeof id === 'object' && id !== null) {
              return (id._id || id.id || '').toString();
            }
            return String(id);
          })
          .filter((id: string) => id.length > 0);
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/creators?limit=20`);
      
      if (response.ok) {
        const data = await response.json();
        const artists = Array.isArray(data.users) ? data.users : [];
        setRecommendedArtists(artists);
        
        const followedMap: {[key: string]: boolean} = {};
        artists.forEach((artist: any) => {
          const artistId = (artist._id || artist.id || '').toString();
          followedMap[artistId] = followingIds.some(fid => fid === artistId);
        });
        setFollowedArtists(followedMap);
      }
    } catch (error) {
      console.error('Error fetching recommended artists:', error);
    } finally {
      setLoadingArtists(false);
    }
  };

  const getFilteredArtists = () => {
    if (artistFilter === 'following') {
      return recommendedArtists.filter(a => followedArtists[a._id || a.id]);
    } else if (artistFilter === 'notFollowing') {
      return recommendedArtists.filter(a => !followedArtists[a._id || a.id]);
    }
    return recommendedArtists;
  };

  const toggleFollowArtist = async (artistId: string) => {
    try {
      const isFollowing = followedArtists[artistId];
      const method = isFollowing ? 'DELETE' : 'POST';
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      
      const response = await makeApiRequest(
        `${process.env.NEXT_PUBLIC_API_URL}/api/following/${endpoint}/${artistId}`,
        { method }
      );

      if (response.ok) {
        setFollowedArtists(prev => ({
          ...prev,
          [artistId]: !prev[artistId]
        }));
        
        if (fetchUserProfile) {
          fetchUserProfile();
        }
        
        setTimeout(() => {
          fetchRecommendedArtists();
        }, 500);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  useEffect(() => {
    fetchVibes(); // Fetch vibes regardless of user auth
    if (user) {
      fetchRecommendedArtists();
    }
  }, [user]);

  const handleMediaFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      setUploadProgress(0);
      try {
        let accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            });
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              accessToken = refreshData.accessToken;
              localStorage.setItem('accessToken', refreshData.accessToken);
              localStorage.setItem('refreshToken', refreshData.refreshToken);
            }
          }
        }

        if (!accessToken) {
          alert(t('authError'));
          return;
        }

        // Extract thumbnail for videos BEFORE upload
        let thumbnailDataUrl: string | undefined;
        if (file.type.startsWith('video/')) {
          try {
            // Extract thumbnail at 1 second mark
            const rawThumbnail = await extractVideoThumbnail(file, 1);
            // Compress thumbnail for better performance
            thumbnailDataUrl = await compressImage(rawThumbnail, 640, 360, 0.75);
          } catch (error) {
            console.warn('Failed to extract video thumbnail, will use default:', error);
          }
        }

        const { fileUrl } = (await proxyUpload(file, accessToken, (progress) => {
          setUploadProgress(progress);
        })) as any;

        const isImage = file.type.startsWith('image/');
        setMediaFile({
          cdnUrl: fileUrl,
          isImage: isImage,
          thumbnail: thumbnailDataUrl
        });
        setPreviewUrl(fileUrl);
      } catch (error) {
        console.error('Error uploading media:', error);
        alert(t('mediaUploadFailed'));
      } finally {
        setIsUploading(false);
      }
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setPreviewUrl('');
  };

  const createVibe = async () => {
    if (!newVibe.trim() && !mediaFile) return;
    
    try {
      setIsUploading(true);
      
      const postData: any = {
        content: newVibe,
        postType: mediaFile ? (mediaFile.isImage ? 'image' : 'video') : 'text',
        category: selectedCategory === 'all' ? 'general' : selectedCategory
      };

      if (mediaFile) {
        postData.mediaUrl = mediaFile.cdnUrl;
        // Send thumbnail if available (for videos)
        if (mediaFile.thumbnail) {
          postData.mediaThumbnail = mediaFile.thumbnail;
        }
      }
      
      const response = await makeApiRequest(`${process.env.NEXT_PUBLIC_API_URL}/api/community/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      });
      
      if (response.ok) {
        setNewVibe('');
        setMediaFile(null);
        setPreviewUrl('');
        setShowCreateModal(false);
        fetchVibes();
      }
    } catch (error) {
      console.error('Error creating vibe:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteVibe = async (vibeId: string) => {
    if (!window.confirm(t('confirmDeleteVibe'))) {
      return;
    }
    
    try {
      const response = await makeApiRequest(`${process.env.NEXT_PUBLIC_API_URL}/api/community/posts/${vibeId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setVibes(prevVibes => prevVibes.filter(vibe => vibe.id !== vibeId));
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const toggleLike = async (postId: string) => {
    try {
      const response = await makeApiRequest(`${process.env.NEXT_PUBLIC_API_URL}/api/community/posts/${postId}/like`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setVibes(prevVibes => 
          prevVibes.map(vibe => 
            vibe.id === postId 
              ? { ...vibe, likes: data.likes, liked: data.liked } 
              : vibe
          )
        );
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const submitComment = async (postId: string) => {
    const commentText = newComment[postId];
    if (!commentText?.trim()) return;

    try {
      const response = await makeApiRequest(`${process.env.NEXT_PUBLIC_API_URL}/api/community/comments`, {
        method: 'POST',
        body: JSON.stringify({
          postId,
          text: commentText
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        setVibes(prevVibes => 
          prevVibes.map(vibe => 
            vibe.id === postId 
              ? { 
                  ...vibe, 
                  comments: [...(Array.isArray(vibe.comments) ? vibe.comments : []), data.comment],
                  commentCount: (vibe.commentCount || 0) + 1
                } 
              : vibe
          )
        );
        
        setNewComment(prev => ({ ...prev, [postId]: '' }));
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const toggleComments = async (postId: string) => {
    const isExpanding = !expandedComments[postId];
    
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));

    if (isExpanding) {
      try {
        setLoadingComments(prev => ({ ...prev, [postId]: true }));

        const response = await makeApiRequest(
          `${process.env.NEXT_PUBLIC_API_URL}/api/community/comments/post/${postId}?limit=50&offset=0&sortOrder=desc`
        );

        if (response.ok) {
          const data = await response.json();
          const commentsList = Array.isArray(data.comments) ? data.comments : [];
          setVibes(prevVibes =>
            prevVibes.map(vibe =>
              vibe.id === postId
                ? { 
                    ...vibe, 
                    comments: commentsList,
                    commentCount: commentsList.length
                  }
                : vibe
            )
          );
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setLoadingComments(prev => ({ ...prev, [postId]: false }));
      }
    }
  };

  const sharePost = async (postId: string, postTitle: string) => {
    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/community`;
    const shareText = t('checkOutVibe', { title: postTitle });

    try {
      if (navigator.share && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        await navigator.share({
          title: 'MuzikaX Community',
          text: shareText,
          url: shareUrl
        });
        
        await makeApiRequest(`${process.env.NEXT_PUBLIC_API_URL}/api/community/posts/${postId}/share`, {
          method: 'POST'
        }).catch(() => {});
        
        setSharedNotification(t('postSharedSuccess'));
        setTimeout(() => setSharedNotification(null), 3000);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setSharedNotification(t('linkCopied'));
        setTimeout(() => setSharedNotification(null), 3000);
        
        await makeApiRequest(`${process.env.NEXT_PUBLIC_API_URL}/api/community/posts/${postId}/share`, {
          method: 'POST'
        }).catch(() => {});
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(shareUrl);
          setSharedNotification(t('linkCopied'));
          setTimeout(() => setSharedNotification(null), 3000);
        } catch (clipboardError) {
          console.error('Error sharing:', clipboardError);
        }
      }
    }
  };

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return t('secondsAgo', { count: seconds });
    if (seconds < 3600) return t('minutesAgo', { count: Math.floor(seconds / 60) });
    if (seconds < 86400) return t('hoursAgo', { count: Math.floor(seconds / 3600) });
    return t('daysAgo', { count: Math.floor(seconds / 86400) });
  };

  // Check authentication after auth context has time to initialize
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthChecked(true);
      
      // Only redirect if we're not loading AND user is not authenticated
      if (!isLoading && !user) {
        const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/community';
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user, isLoading]);

  // Show loading spinner while checking auth or during initial load
  if (!authChecked || isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredVibes = vibes.filter(vibe => 
    selectedCategory === 'all' || vibe.category === selectedCategory
  );

  return (
    <div className="min-h-screen pt-14 md:pt-0 bg-background">
      {/* Mobile Header with Back Button */}
      <div className="md:hidden sticky top-0 z-50 bg-gray-900/95 backdrop-blur-lg border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white transition-colors p-2 -ml-2"
              aria-label="Go back"
            >
              <FaArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-black text-text-primary">Community</h1>
              <p className="text-xs text-gray-400">Connect & share</p>
            </div>
          </div>
        </div>
      </div>

      {sharedNotification && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-[60] animate-fade-in">
          {sharedNotification}
        </div>
      )}

      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-text-primary">{t('vibes')}</h1>
              <p className="text-text-secondary">{t('vibesSubtitle')}</p>
            </div>

            <div className="mb-6 flex justify-center">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-primary to-primary-hover text-white py-3 px-6 rounded-full font-medium flex items-center space-x-2 hover:from-primary-hover hover:to-primary transition-all shadow-lg"
              >
                <FaPlus className="text-sm" />
                <span>{t('shareVibe')}</span>
              </button>
            </div>

            <div className="mb-6 overflow-x-auto">
              <div className="flex justify-center">
                <div className="flex bg-gray-800/50 backdrop-blur-sm rounded-2xl p-1 gap-1 min-w-max sm:min-w-fit">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`flex items-center px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm transition-colors whitespace-nowrap ${
                      selectedCategory === 'all' 
                        ? 'bg-gradient-to-r from-primary to-primary-hover text-white shadow-lg' 
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <FaUserFriends className="mr-1 text-xs" /> <span className="hidden sm:inline">{t('allVibes')}</span><span className="inline sm:hidden">{t('vibes')}</span>
                  </button>
                  <button
                    onClick={() => setSelectedCategory('artist')}
                    className={`flex items-center px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm transition-colors whitespace-nowrap ${
                      selectedCategory === 'artist' 
                        ? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-lg' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <FaMusic className="mr-1 text-xs" /> <span className="hidden sm:inline">{t('forArtists')}</span><span className="inline sm:hidden">{t('artists')}</span>
                  </button>
                  <button
                    onClick={() => setSelectedCategory('trending')}
                    className={`flex items-center px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm transition-colors whitespace-nowrap ${
                      selectedCategory === 'trending' 
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-medium shadow-lg' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <FaFire className="mr-1 text-xs" /> <span className="hidden sm:inline">{t('onTheFlip')}</span><span className="inline sm:hidden">{t('flip')}</span>
                  </button>
                  <button
                    onClick={() => setShowArtistsModal(true)}
                    className="lg:hidden flex items-center px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm transition-colors text-gray-400 hover:text-white whitespace-nowrap"
                  >
                    <FaMusic className="mr-1 text-xs" /> {t('discover')}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {filteredVibes.length > 0 ? (
                filteredVibes.map((vibe, index) => (
                  <div key={vibe.id || index} id={`vibe-${vibe.id}`} className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-gray-700/50 hover:border-gray-600/50 transition-all">
                    <div className="flex items-start space-x-3">
                      <a href={`/profile/${vibe.userId?._id || vibe.userId || ''}`} className="flex-shrink-0 hover:opacity-80 transition-opacity">
                        {vibe.userAvatar ? (
                          <img src={vibe.userAvatar} alt={vibe.userName} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-primary to-primary-hot flex items-center justify-center">
                            <span className="text-white font-medium text-sm">{vibe.userName ? vibe.userName.charAt(0).toUpperCase() : '?'}</span>
                          </div>
                        )}
                      </a>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <a href={`/profile/${vibe.userId?._id || vibe.userId || ''}`} className="font-semibold text-text-primary truncate hover:text-primary transition-colors">{vibe.userName}</a>
                            <p className="text-xs text-text-secondary">{formatTimeAgo(vibe.createdAt)}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {vibe.category === 'trending' && (
                              <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                                <FaFire className="mr-1 text-xs" /> {t('flip')}
                              </span>
                            )}
                            {(user && (user.id === (vibe.userId?._id || vibe.userId))) && (
                              <button onClick={() => deleteVibe(vibe.id)} className="text-red-500 hover:text-red-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-text-primary mt-2 whitespace-pre-wrap">{vibe.content}</p>
                        
                        {(vibe.mediaUrl) && (
                          <div className="mt-3 overflow-hidden rounded-lg border border-gray-700">
                            {vibe.postType === 'video' ? (
                              <video src={vibe.mediaUrl} controls className="w-full h-auto max-h-80 object-contain bg-black" preload="metadata" />
                            ) : (
                              <img src={vibe.mediaUrl} alt="Vibe" className="w-full h-auto max-h-96 object-cover" />
                            )}
                          </div>
                        )}

                        <div className="flex items-center space-x-6 mt-4 pt-3 border-t border-gray-700/50 text-gray-400 text-sm">
                          <button onClick={() => toggleLike(vibe.id)} className={`flex items-center space-x-1 transition-colors ${vibe.liked ? 'text-red-500' : 'hover:text-red-400'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${vibe.liked ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span>{vibe.likes || 0}</span>
                          </button>

                          <button onClick={() => toggleComments(vibe.id)} className="flex items-center space-x-1 hover:text-blue-400 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span>{vibe.commentCount || 0}</span>
                          </button>

                          <button onClick={() => sharePost(vibe.id, vibe.content.substring(0, 50))} className="flex items-center space-x-1 hover:text-green-400 transition-colors">
                            <FaShare className="h-4 w-4" />
                            <span>{vibe.shares || 0}</span>
                          </button>
                        </div>

                        {expandedComments[vibe.id] && (
                          <div className="mt-4 pt-4 border-t border-gray-700">
                            {loadingComments[vibe.id] ? (
                              <div className="flex justify-center py-4">
                                <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary"></div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {vibe.comments.map((comment, i) => (
                                  <div key={comment.id || i} className="flex space-x-2">
                                    {comment.userId?.avatar || comment.userAvatar ? (
                                      <img src={comment.userId?.avatar || comment.userAvatar} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary-hot flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-xs font-medium">{(comment.userId?.name || comment.userName || '?').charAt(0).toUpperCase()}</span>
                                      </div>
                                    )}
                                    <div className="flex-1 bg-gray-700/50 rounded-lg p-2">
                                      <div className="flex items-center">
                                        <span className="font-medium text-white text-sm">{comment.userId?.name || comment.userName}</span>
                                        <span className="text-xs text-gray-400 ml-2">{formatTimeAgo(comment.createdAt)}</span>
                                      </div>
                                      <p className="text-gray-200 text-sm mt-1">{comment.text}</p>
                                    </div>
                                  </div>
                                ))}
                                
                                {user && (
                                  <div className="flex space-x-2 mt-3">
                                    {user.avatar ? (
                                      <img src={user.avatar} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary-hot flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-xs font-medium">{user.name?.charAt(0).toUpperCase()}</span>
                                      </div>
                                    )}
                                    <div className="flex-1 flex">
                                      <input
                                        type="text"
                                        value={newComment[vibe.id] || ''}
                                        onChange={(e) => setNewComment(prev => ({ ...prev, [vibe.id]: e.target.value }))}
                                        placeholder={t('writeComment')}
                                        className="flex-1 bg-surface text-text-primary rounded-l-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                      />
                                      <button onClick={() => submitComment(vibe.id)} className="bg-gradient-to-r from-primary to-primary-hover text-white px-4 rounded-r-lg text-sm font-medium hover:from-primary-hover hover:to-primary transition-colors">{t('post')}</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8">
                  <p className="text-gray-400">{t('noVibesYet')}</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-5 border border-gray-700/50">
                <h2 className="text-xl font-bold mb-4 text-text-primary">{t('discoverArtists')}</h2>
                <div className="flex gap-2 mb-4">
                  {['all', 'following', 'notFollowing'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setArtistFilter(filter)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${artistFilter === filter ? 'bg-primary text-text-primary' : 'bg-surface text-text-secondary hover:bg-surface-elevated'}`}
                    >
                      {t(filter as any)}
                    </button>
                  ))}
                </div>
                
                {loadingArtists ? (
                  <div className="flex justify-center py-8">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {getFilteredArtists().map((artist: any) => (
                      <div key={artist._id || artist.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-700/30 hover:bg-gray-700/50 transition-colors">
                        {artist.avatar ? (
                          <img src={artist.avatar} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-hot flex items-center justify-center">
                            <span className="text-white font-medium text-sm">{artist.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate text-text-primary">{artist.name}</h3>
                          <p className="text-xs text-text-secondary">{t('followersCount', { count: artist.followersCount || 0 })}</p>
                        </div>
                        <button
                          onClick={() => toggleFollowArtist(artist._id || artist.id)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${followedArtists[artist._id || artist.id] ? 'bg-surface text-text-primary' : 'bg-primary text-text-primary hover:from-primary-hover hover:to-primary'}`}
                        >
                          {followedArtists[artist._id || artist.id] ? t('following') : t('follow')}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-md p-6 border border-gray-700 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-text-primary">{t('shareVibe')}</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">{t('category')}</label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-surface text-text-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none">
                  <option value="general">{t('general')}</option>
                  <option value="artist">{t('forArtists')}</option>
                  <option value="trending">{t('onTheFlip')}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">{t('yourVibe')}</label>
                <textarea value={newVibe} onChange={(e) => setNewVibe(e.target.value)} placeholder={t('yourVibePlaceholder')} className="w-full bg-surface text-text-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none h-32 resize-none" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">{t('addMedia')}</label>
                {!previewUrl ? (
                  <div className="relative border-2 border-dashed border-border-light rounded-xl p-4 text-center hover:border-primary transition-colors">
                    <input type="file" accept="image/*,video/*" onChange={handleMediaFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="flex flex-col items-center">
                      <FaPlus className="text-text-secondary mb-2" />
                      <span className="text-sm text-text-secondary">{t('clickToUpload')}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-lg overflow-hidden border border-gray-700">
                      {mediaFile?.isImage ? (
                        <img src={previewUrl} className="max-h-48 w-full object-contain bg-black/20" />
                      ) : (
                        <>
                          <video src={previewUrl} className="max-h-48 w-full object-contain bg-black" />
                          {/* Show auto-extracted thumbnail preview */}
                          {mediaFile?.thumbnail && (
                            <div className="mt-2 p-2 bg-gray-900/50 rounded-lg">
                              <p className="text-xs text-gray-400 mb-2">Auto-generated Thumbnail:</p>
                              <img src={mediaFile.thumbnail} alt="Video thumbnail" className="w-full h-24 object-cover rounded" />
                            </div>
                          )}
                        </>
                      )}
                      <button onClick={removeMedia} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center">×</button>
                    </div>
                    
                    {/* Optional custom thumbnail upload for videos */}
                    {!mediaFile?.isImage && (
                      <div className="relative border-2 border-dashed border-border-light rounded-xl p-3 text-center hover:border-primary transition-colors">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={async (e) => {
                            if (e.target.files && e.target.files[0]) {
                              const thumbFile = e.target.files[0];
                              try {
                                // Upload custom thumbnail
                                let accessToken = localStorage.getItem('accessToken');
                                if (!accessToken) {
                                  const refreshToken = localStorage.getItem('refreshToken');
                                  if (refreshToken) {
                                    const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh-token`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ refreshToken })
                                    });
                                    if (refreshResponse.ok) {
                                      const refreshData = await refreshResponse.json();
                                      accessToken = refreshData.accessToken;
                                      localStorage.setItem('accessToken', refreshData.accessToken);
                                      localStorage.setItem('refreshToken', refreshData.refreshToken);
                                    }
                                  }
                                }
                                
                                if (accessToken) {
                                  const { fileUrl } = (await proxyUpload(thumbFile, accessToken)) as any;
                                  setMediaFile(prev => prev ? { ...prev, thumbnail: fileUrl } : null);
                                }
                              } catch (error) {
                                console.error('Error uploading custom thumbnail:', error);
                              }
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        />
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-gray-400">📷 Upload Custom Thumbnail</span>
                          <span className="text-[10px] text-gray-500 mt-1">Optional - Replace auto-generated thumbnail</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {isUploading && uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full mt-2">
                    <div className="flex justify-between text-[10px] text-text-secondary mb-1">
                      <span>{t('uploadingVibe')}...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-surface rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={createVibe}
                disabled={isUploading || (!newVibe.trim() && !mediaFile)}
                className="w-full bg-gradient-to-r from-primary to-primary-hover text-white py-3 rounded-xl font-bold hover:shadow-lg disabled:opacity-50 transition-all mt-2"
              >
                {isUploading ? t('uploading') : t('postVibe')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showArtistsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] lg:hidden flex items-end">
          <div className="bg-gray-800 w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="w-12 h-1.5 bg-gray-600 rounded-full mx-auto mb-6" onClick={() => setShowArtistsModal(false)}></div>
            <h2 className="text-xl font-bold mb-4 text-text-primary">{t('discoverArtists')}</h2>
            <div className="space-y-4">
              {recommendedArtists.map((artist: any) => (
                <div key={artist._id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-700/30">
                  <img src={artist.avatar || '/default-avatar.png'} className="w-12 h-12 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate text-text-primary">{artist.name}</h3>
                    <p className="text-xs text-text-secondary">{t('followersCount', { count: artist.followersCount || 0 })}</p>
                  </div>
                  <button
                    onClick={() => toggleFollowArtist(artist._id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${followedArtists[artist._id] ? 'bg-surface text-text-primary' : 'bg-primary text-text-primary hover:from-primary-hover hover:to-primary'}`}
                  >
                    {followedArtists[artist._id] ? t('following') : t('follow')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CommunityPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <CommunityContent />
    </Suspense>
  );
};

export default CommunityPage;
