'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { useAuth } from '../contexts/AuthContext';
import { createPlaylist, addTrackToPlaylist } from '../services/userService';
const PlaylistSelectionModal = ({ isOpen, onClose, onTrackAdded }) => {
    const { currentTrack, playlists, createPlaylist: createPlaylistContext } = useAudioPlayer();
    const { isAuthenticated } = useAuth();
    const [showNewPlaylistForm, setShowNewPlaylistForm] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    if (!isOpen || !currentTrack)
        return null;
    const handleCreatePlaylist = async () => {
        if (!newPlaylistName.trim()) {
            setError('Playlist name is required');
            return;
        }
        setLoading(true);
        setError('');
        try {
            // Create playlist using the service with proper parameters
            const newPlaylist = await createPlaylist(newPlaylistName, '', true, [currentTrack.id]);
            if (newPlaylist) {
                // Add the new playlist to context
                createPlaylistContext(newPlaylist.name);
                // Since the track is already added during playlist creation, we can close directly
                onTrackAdded();
                onClose();
            }
            else {
                setError('Failed to create playlist. Please try again.');
            }
        }
        catch (err) {
            setError('An error occurred while creating the playlist');
            console.error(err);
        }
        finally {
            setLoading(false);
            setNewPlaylistName('');
        }
    };
    const handleAddToExistingPlaylist = async () => {
        if (!selectedPlaylistId) {
            setError('Please select a playlist');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const result = await addTrackToPlaylist(selectedPlaylistId, currentTrack.id);
            if (result) {
                onTrackAdded();
                onClose();
            }
            else {
                setError('Failed to add track to playlist. Please try again.');
            }
        }
        catch (err) {
            setError('An error occurred while adding track to playlist');
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "card-bg rounded-2xl p-6 max-w-md w-full border border-gray-700/50", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h3", { className: "text-xl font-bold text-white", children: "Add to Playlist" }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-white transition-colors", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" }) }) })] }), error && (_jsx("div", { className: "mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm", children: error })), !showNewPlaylistForm ? (_jsx("div", { children: playlists.length > 0 ? (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-400 mb-2", children: "Select Playlist" }), _jsxs("select", { value: selectedPlaylistId, onChange: (e) => setSelectedPlaylistId(e.target.value), className: "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary", children: [_jsx("option", { value: "", children: "Choose a playlist" }), playlists.map((playlist) => (_jsxs("option", { value: playlist.id, children: [playlist.name, " (", playlist.tracks.length, " tracks)"] }, playlist.id)))] })] }), _jsxs("div", { className: "flex space-x-3", children: [_jsx("button", { onClick: handleAddToExistingPlaylist, disabled: loading || !selectedPlaylistId, className: `flex-1 px-4 py-2 rounded-lg font-medium ${loading || !selectedPlaylistId
                                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                            : 'bg-primary text-white hover:bg-primary/90'} transition-colors`, children: loading ? 'Adding...' : 'Add to Playlist' }), _jsx("button", { onClick: () => setShowNewPlaylistForm(true), className: "px-4 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors", children: "New" })] })] })) : (_jsxs("div", { className: "text-center py-6", children: [_jsx("p", { className: "text-gray-400 mb-4", children: "You don't have any playlists yet." }), _jsx("button", { onClick: () => setShowNewPlaylistForm(true), className: "px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors", children: "Create New Playlist" })] })) })) : (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-400 mb-2", children: "Playlist Name" }), _jsx("input", { type: "text", value: newPlaylistName, onChange: (e) => setNewPlaylistName(e.target.value), placeholder: "Enter playlist name", className: "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary" })] }), _jsxs("div", { className: "flex space-x-3", children: [_jsx("button", { onClick: handleCreatePlaylist, disabled: loading || !newPlaylistName.trim(), className: `flex-1 px-4 py-2 rounded-lg font-medium ${loading || !newPlaylistName.trim()
                                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                        : 'bg-primary text-white hover:bg-primary/90'} transition-colors`, children: loading ? 'Creating...' : 'Create Playlist' }), _jsx("button", { onClick: () => {
                                        setShowNewPlaylistForm(false);
                                        setNewPlaylistName('');
                                        setError('');
                                    }, className: "px-4 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors", children: "Cancel" })] })] }))] }) }));
};
export default PlaylistSelectionModal;
