'use client';
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var AudioPlayerContext_1 = require("../contexts/AudioPlayerContext");
var AuthContext_1 = require("../contexts/AuthContext");
var userService_1 = require("../services/userService");
var PlaylistSelectionModal = function (_a) {
    var isOpen = _a.isOpen, onClose = _a.onClose, onTrackAdded = _a.onTrackAdded;
    var _b = (0, AudioPlayerContext_1.useAudioPlayer)(), currentTrack = _b.currentTrack, playlists = _b.playlists, createPlaylistContext = _b.createPlaylist;
    var isAuthenticated = (0, AuthContext_1.useAuth)().isAuthenticated;
    var _c = (0, react_1.useState)(false), showNewPlaylistForm = _c[0], setShowNewPlaylistForm = _c[1];
    var _d = (0, react_1.useState)(''), newPlaylistName = _d[0], setNewPlaylistName = _d[1];
    var _e = (0, react_1.useState)(''), selectedPlaylistId = _e[0], setSelectedPlaylistId = _e[1];
    var _f = (0, react_1.useState)(false), loading = _f[0], setLoading = _f[1];
    var _g = (0, react_1.useState)(''), error = _g[0], setError = _g[1];
    if (!isOpen || !currentTrack)
        return null;
    var handleCreatePlaylist = function () { return __awaiter(void 0, void 0, void 0, function () {
        var newPlaylist, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!newPlaylistName.trim()) {
                        setError('Playlist name is required');
                        return [2 /*return*/];
                    }
                    setLoading(true);
                    setError('');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, (0, userService_1.createPlaylist)(newPlaylistName, '', true, [currentTrack.id])];
                case 2:
                    newPlaylist = _a.sent();
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
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    setError('An error occurred while creating the playlist');
                    console.error(err_1);
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    setNewPlaylistName('');
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleAddToExistingPlaylist = function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!selectedPlaylistId) {
                        setError('Please select a playlist');
                        return [2 /*return*/];
                    }
                    setLoading(true);
                    setError('');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, (0, userService_1.addTrackToPlaylist)(selectedPlaylistId, currentTrack.id)];
                case 2:
                    result = _a.sent();
                    if (result) {
                        onTrackAdded();
                        onClose();
                    }
                    else {
                        setError('Failed to add track to playlist. Please try again.');
                    }
                    return [3 /*break*/, 5];
                case 3:
                    err_2 = _a.sent();
                    setError('An error occurred while adding track to playlist');
                    console.error(err_2);
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (<div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card-bg rounded-2xl p-6 max-w-md w-full border border-gray-700/50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-text-primary">Add to Playlist</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {error && (<div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>)}

        {!showNewPlaylistForm ? (<div>
            {playlists.length > 0 ? (<div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Select Playlist
                  </label>
                  <select value={selectedPlaylistId} onChange={function (e) { return setSelectedPlaylistId(e.target.value); }} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Choose a playlist</option>
                    {playlists.map(function (playlist) { return (<option key={playlist.id} value={playlist.id}>
                        {playlist.name} ({playlist.tracks.length} tracks)
                      </option>); })}
                  </select>
                </div>

                <div className="flex space-x-3">
                  <button onClick={handleAddToExistingPlaylist} disabled={loading || !selectedPlaylistId} className={"flex-1 px-4 py-2 rounded-lg font-medium ".concat(loading || !selectedPlaylistId
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary/90', " transition-colors")}>
                    {loading ? 'Adding...' : 'Add to Playlist'}
                  </button>
                  <button onClick={function () { return setShowNewPlaylistForm(true); }} className="px-4 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors">
                    New
                  </button>
                </div>
              </div>) : (<div className="text-center py-6">
                <p className="text-gray-400 mb-4">You don't have any playlists yet.</p>
                <button onClick={function () { return setShowNewPlaylistForm(true); }} className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors">
                  Create New Playlist
                </button>
              </div>)}
          </div>) : (<div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Playlist Name
              </label>
              <input type="text" value={newPlaylistName} onChange={function (e) { return setNewPlaylistName(e.target.value); }} placeholder="Enter playlist name" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"/>
            </div>

            <div className="flex space-x-3">
              <button onClick={handleCreatePlaylist} disabled={loading || !newPlaylistName.trim()} className={"flex-1 px-4 py-2 rounded-lg font-medium ".concat(loading || !newPlaylistName.trim()
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary/90', " transition-colors")}>
                {loading ? 'Creating...' : 'Create Playlist'}
              </button>
              <button onClick={function () {
                setShowNewPlaylistForm(false);
                setNewPlaylistName('');
                setError('');
            }} className="px-4 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors">
                Cancel
              </button>
            </div>
          </div>)}
      </div>
    </div>);
};
exports.default = PlaylistSelectionModal;
