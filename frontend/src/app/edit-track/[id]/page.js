'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { fetchTrackById } from '../../../services/trackService';
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
export default function EditTrackPage({ params }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        genre: '',
        type: 'song'
    });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const router = useRouter();
    const { isAuthenticated, user, isLoading } = useAuth();
    const [trackId, setTrackId] = useState(null);
    // Unwrap params Promise
    useEffect(() => {
        const unwrapParams = async () => {
            const unwrappedParams = await params;
            setTrackId(unwrappedParams.id);
        };
        unwrapParams();
    }, []);
    // Check authentication on component mount
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);
    // Fetch track data when component mounts
    useEffect(() => {
        const fetchTrack = async () => {
            var _a, _b;
            if (!trackId || isLoading)
                return;
            try {
                setLoading(true);
                const track = await fetchTrackById(trackId);
                // Detailed debugging for authorization check
                console.log('=== DETAILED AUTHORIZATION DEBUG ===');
                console.log('Track ID from URL params:', trackId);
                console.log('Full track data:', JSON.stringify(track, null, 2));
                console.log('Track creatorId:', track.creatorId);
                console.log('Track creatorId type:', typeof track.creatorId);
                console.log('Track creatorId constructor:', (_b = (_a = track.creatorId) === null || _a === void 0 ? void 0 : _a.constructor) === null || _b === void 0 ? void 0 : _b.name);
                console.log('User data:', JSON.stringify(user, null, 2));
                console.log('User ID:', user === null || user === void 0 ? void 0 : user.id);
                console.log('User ID type:', typeof (user === null || user === void 0 ? void 0 : user.id));
                // Check if user is authorized to edit this track
                // Handle both cases: when creatorId is populated (object) or not (ObjectId)
                const trackOwnerId = track.creatorId && typeof track.creatorId === 'object' && track.creatorId !== null && '_id' in track.creatorId ?
                    track.creatorId._id.toString() :
                    track.creatorId.toString();
                if (trackOwnerId !== (user === null || user === void 0 ? void 0 : user.id)) {
                    const errorMsg = `You are not authorized to edit this track. Track owner ID: "${trackOwnerId}", Your ID: "${user === null || user === void 0 ? void 0 : user.id}"`;
                    console.log('ERROR DETAILS:', errorMsg);
                    setError(errorMsg);
                    return;
                }
                setFormData({
                    title: track.title,
                    description: track.description,
                    genre: track.genre,
                    type: track.type
                });
            }
            catch (err) {
                console.error('Failed to fetch track:', err);
                setError(err.message || 'Failed to load track data');
            }
            finally {
                setLoading(false);
            }
        };
        if (user && !isLoading && trackId) {
            fetchTrack();
        }
    }, [trackId, user, isLoading]);
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
        if (!trackId) {
            setError('Track ID is missing');
            return;
        }
        try {
            setSubmitting(true);
            setError(null);
            // Make API call to update the track
            const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${trackId}`, {
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
                throw new Error(errorData.message || 'Failed to update track');
            }
            // Redirect to profile page after successful update
            router.push('/profile');
        }
        catch (err) {
            console.error('Failed to update track:', err);
            setError(err.message || 'Failed to update track');
        }
        finally {
            setSubmitting(false);
        }
    };
    // Show loading state while checking auth
    if (isLoading || loading) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black flex items-center justify-center", children: _jsx("div", { className: "text-white", children: "Loading..." }) }));
    }
    // Don't render the page if not authenticated
    if (!isAuthenticated) {
        return null;
    }
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black py-8 sm:py-12", children: [_jsx("div", { className: "absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" }), _jsx("div", { className: "absolute -bottom-40 -right-40 w-96 h-96 bg-primary-light/10 rounded-full blur-3xl -z-10" }), _jsx("div", { className: "container mx-auto px-4 sm:px-8", children: _jsxs("div", { className: "max-w-2xl mx-auto", children: [_jsxs("div", { className: "text-center mb-8 sm:mb-12", children: [_jsx("h1", { className: "text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-light mb-3 sm:mb-4", children: "Edit Track" }), _jsx("p", { className: "text-gray-400 text-sm sm:text-base", children: "Update your track information" })] }), _jsxs("div", { className: "card-bg rounded-2xl p-6 sm:p-8 border border-gray-700/50", children: [error && (_jsx("div", { className: "bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6", children: _jsx("div", { className: "text-red-300", children: error }) })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "title", className: "block text-sm font-medium text-gray-300 mb-2", children: "Track Title *" }), _jsx("input", { type: "text", id: "title", name: "title", value: formData.title, onChange: handleChange, className: "w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm sm:text-base", placeholder: "Enter track title", required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "description", className: "block text-sm font-medium text-gray-300 mb-2", children: "Description" }), _jsx("textarea", { id: "description", name: "description", value: formData.description, onChange: handleChange, rows: 4, className: "w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm sm:text-base", placeholder: "Describe your track..." })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "genre", className: "block text-sm font-medium text-gray-300 mb-2", children: "Genre" }), _jsx("input", { type: "text", id: "genre", name: "genre", value: formData.genre, onChange: handleChange, className: "w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm sm:text-base", placeholder: "Enter genre (e.g., Afrobeat, Hip Hop)" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "type", className: "block text-sm font-medium text-gray-300 mb-2", children: "Track Type" }), _jsxs("select", { id: "type", name: "type", value: formData.type, onChange: handleChange, className: "w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm sm:text-base", disabled: true, children: [_jsx("option", { value: "song", children: "Song" }), _jsx("option", { value: "beat", children: "Beat" }), _jsx("option", { value: "mix", children: "Mix" })] }), _jsx("p", { className: "text-gray-500 text-xs mt-1", children: "Track type cannot be changed after upload" })] }), _jsxs("div", { className: "flex justify-end gap-4 pt-4", children: [_jsx("button", { type: "button", onClick: () => router.back(), className: "px-5 py-2.5 sm:px-6 sm:py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors text-sm sm:text-base", children: "Cancel" }), _jsx("button", { type: "submit", disabled: submitting, className: "px-5 py-2.5 sm:px-6 sm:py-3 gradient-primary rounded-lg text-white font-medium hover:opacity-90 transition-opacity text-sm sm:text-base disabled:opacity-50", children: submitting ? 'Updating...' : 'Update Track' })] })] })] })] }) })] }));
}
