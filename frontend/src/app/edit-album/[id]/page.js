'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
// Helper function to refresh token
const refreshToken = async () => {
    try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            return null;
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken })
        });
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            return data.accessToken;
        }
    }
    catch (error) {
        console.error('Error refreshing token:', error);
    }
    return null;
};
// Helper function to make authenticated request with token refresh
const makeAuthenticatedRequest = async (url, options = {}) => {
    let accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
        throw new Error('No access token found');
    }
    // Add authorization header to options
    const requestOptions = Object.assign(Object.assign({}, options), { headers: Object.assign(Object.assign({}, options.headers), { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` }) });
    // Make initial request
    let response = await fetch(url, requestOptions);
    // If token is expired, try to refresh it
    if (response.status === 401) {
        console.log('Token might be expired, attempting to refresh...');
        const newToken = await refreshToken();
        if (newToken) {
            // Retry the request with new token
            requestOptions.headers = Object.assign(Object.assign({}, requestOptions.headers), { 'Authorization': `Bearer ${newToken}` });
            response = await fetch(url, requestOptions);
        }
    }
    return response;
};
export default function EditAlbumPage({ params }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        genre: ''
    });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const router = useRouter();
    const { isAuthenticated, user, isLoading } = useAuth();
    const [albumId, setAlbumId] = useState(null);
    // Unwrap params Promise
    useEffect(() => {
        const unwrapParams = async () => {
            const unwrappedParams = await params;
            setAlbumId(unwrappedParams.id);
        };
        unwrapParams();
    }, []);
    // Check authentication on component mount
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);
    // Fetch album data when component mounts
    useEffect(() => {
        const fetchAlbum = async () => {
            if (!albumId || isLoading)
                return;
            try {
                setLoading(true);
                // Fetch album with token refresh
                const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_URL}/api/albums/${albumId}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch album');
                }
                const album = await response.json();
                // Check if user is authorized to edit this album
                const albumOwnerId = typeof album.creatorId === 'object' ? album.creatorId._id : album.creatorId;
                if (albumOwnerId !== (user === null || user === void 0 ? void 0 : user.id)) {
                    setError('You are not authorized to edit this album');
                    return;
                }
                setFormData({
                    title: album.title,
                    description: album.description || '',
                    genre: album.genre || ''
                });
            }
            catch (err) {
                console.error('Failed to fetch album:', err);
                setError(err.message || 'Failed to load album data');
            }
            finally {
                setLoading(false);
            }
        };
        if (user && !isLoading && albumId) {
            fetchAlbum();
        }
    }, [albumId, user, isLoading]);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => (Object.assign(Object.assign({}, prev), { [name]: value })));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            setError('Title is required');
            return;
        }
        if (!albumId) {
            setError('Album ID is missing');
            return;
        }
        try {
            setSubmitting(true);
            setError(null);
            setSuccess(null);
            // Make API call to update the album with token refresh
            const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_URL}/api/albums/${albumId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    genre: formData.genre
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update album');
            }
            const updatedAlbum = await response.json();
            setSuccess('Album updated successfully!');
            // Redirect to album page after a short delay
            setTimeout(() => {
                router.push(`/album/${albumId}`);
            }, 1500);
        }
        catch (err) {
            console.error('Failed to update album:', err);
            setError(err.message || 'Failed to update album');
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleDelete = async () => {
        if (!albumId)
            return;
        if (!window.confirm('Are you sure you want to delete this album? This action cannot be undone.')) {
            return;
        }
        try {
            setDeleting(true);
            setError(null);
            // Make API call to delete the album with token refresh
            const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_URL}/api/albums/${albumId}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete album');
            }
            // Redirect to profile page after successful deletion
            router.push('/profile');
        }
        catch (err) {
            console.error('Failed to delete album:', err);
            setError(err.message || 'Failed to delete album');
        }
        finally {
            setDeleting(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black flex items-center justify-center", children: _jsx("div", { className: "text-white", children: "Loading album..." }) }));
    }
    if (error && error.includes('authorized')) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black flex items-center justify-center", children: _jsxs("div", { className: "text-white text-center max-w-md p-6", children: [_jsx("h2", { className: "text-xl mb-4", children: "Access Denied" }), _jsx("p", { className: "text-gray-400 mb-6", children: error }), _jsx("button", { onClick: () => router.push('/profile'), className: "px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors", children: "Back to Profile" })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black py-8 sm:py-12", children: [_jsx("div", { className: "absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" }), _jsx("div", { className: "absolute -bottom-40 -right-40 w-96 h-96 bg-primary-light/10 rounded-full blur-3xl -z-10" }), _jsx("div", { className: "container mx-auto px-4 sm:px-8", children: _jsxs("div", { className: "max-w-2xl mx-auto", children: [_jsxs("div", { className: "mb-8", children: [_jsxs("button", { onClick: () => router.back(), className: "flex items-center text-gray-400 hover:text-white mb-6 transition-colors", children: [_jsx("svg", { className: "w-5 h-5 mr-2", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z", clipRule: "evenodd" }) }), "Back"] }), _jsx("h1", { className: "text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-light mb-2", children: "Edit Album" }), _jsx("p", { className: "text-gray-400", children: "Update your album details" })] }), _jsxs("div", { className: "card-bg rounded-2xl p-6 sm:p-8 border border-gray-700/50", children: [error && (_jsx("div", { className: "bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6", children: _jsx("div", { className: "text-red-300", children: error }) })), success && (_jsx("div", { className: "bg-green-900/50 border border-green-700 rounded-lg p-4 mb-6", children: _jsx("div", { className: "text-green-300", children: success }) })), _jsx("form", { onSubmit: handleSubmit, children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "title", className: "block text-sm font-medium text-gray-300 mb-2", children: "Album Title *" }), _jsx("input", { type: "text", id: "title", name: "title", value: formData.title, onChange: handleChange, className: "w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all", placeholder: "Enter album title" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "genre", className: "block text-sm font-medium text-gray-300 mb-2", children: "Genre" }), _jsxs("select", { id: "genre", name: "genre", value: formData.genre, onChange: handleChange, className: "w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all", children: [_jsx("option", { value: "", children: "Select a genre" }), _jsx("option", { value: "afrobeat", children: "Afrobeat" }), _jsx("option", { value: "amapiano", children: "Amapiano" }), _jsx("option", { value: "hiphop", children: "Hip Hop" }), _jsx("option", { value: "rnb", children: "R&B" }), _jsx("option", { value: "afropop", children: "Afropop" }), _jsx("option", { value: "gospel", children: "Gospel" }), _jsx("option", { value: "traditional", children: "Traditional" }), _jsx("option", { value: "dancehall", children: "Dancehall" }), _jsx("option", { value: "reggae", children: "Reggae" }), _jsx("option", { value: "soul", children: "Soul" }), _jsx("option", { value: "jazz", children: "Jazz" }), _jsx("option", { value: "blues", children: "Blues" }), _jsx("option", { value: "pop", children: "Pop" }), _jsx("option", { value: "rock", children: "Rock" }), _jsx("option", { value: "electronic", children: "Electronic" }), _jsx("option", { value: "house", children: "House" }), _jsx("option", { value: "techno", children: "Techno" }), _jsx("option", { value: "drill", children: "Drill" }), _jsx("option", { value: "trap", children: "Trap" }), _jsx("option", { value: "lofi", children: "Lo-Fi" }), _jsx("option", { value: "ambient", children: "Ambient" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "description", className: "block text-sm font-medium text-gray-300 mb-2", children: "Description" }), _jsx("textarea", { id: "description", name: "description", value: formData.description, onChange: handleChange, rows: 4, className: "w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all", placeholder: "Describe your album..." })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 pt-4", children: [_jsx("button", { type: "submit", disabled: submitting, className: "flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium", children: submitting ? 'Updating...' : 'Update Album' }), _jsx("button", { type: "button", onClick: handleDelete, disabled: deleting, className: "px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium", children: deleting ? 'Deleting...' : 'Delete Album' })] })] }) })] })] }) })] }));
}
