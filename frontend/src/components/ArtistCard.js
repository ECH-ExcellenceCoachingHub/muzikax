import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { followCreator, unfollowCreator } from '../services/trackService';
export default function ArtistCard({ creator, followStatus, setFollowStatus }) {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const handleFollowToggle = async (e) => {
        e.stopPropagation();
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        const creatorId = creator._id || creator.id;
        if (!creatorId) {
            console.error('Creator ID not found');
            alert('Creator ID not found. Please try again.');
            return;
        }
        try {
            if (followStatus[creatorId]) {
                await unfollowCreator(creatorId);
                setFollowStatus(prev => (Object.assign(Object.assign({}, prev), { [creatorId]: false })));
                console.log('Successfully unfollowed creator');
            }
            else {
                await followCreator(creatorId);
                setFollowStatus(prev => (Object.assign(Object.assign({}, prev), { [creatorId]: true })));
                console.log('Successfully followed creator');
            }
        }
        catch (error) {
            console.error('Failed to follow/unfollow creator:', error);
            alert('Failed to follow/unfollow creator. Please try again.');
        }
    };
    // Function to generate avatar with first letter of name
    const generateAvatar = (name) => {
        const firstLetter = name.charAt(0).toUpperCase();
        return (_jsx("div", { className: "w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center mx-auto", children: _jsx("span", { className: "text-xl sm:text-2xl font-bold text-white", children: firstLetter }) }));
    };
    return (_jsx("div", { className: "flex-shrink-0 w-40 sm:w-44 md:w-48 group card-bg rounded-xl p-4 transition-all duration-300 hover:border-primary-light/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-primary-light/10 cursor-pointer", onClick: () => router.push(`/artists/${creator._id || creator.id}`), children: _jsxs("div", { className: "flex flex-col items-center text-center", children: [_jsxs("div", { className: "relative mb-3", children: [creator.avatar && creator.avatar.trim() !== '' ? (_jsx("img", { src: creator.avatar, alt: creator.name, className: "w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover mx-auto" })) : (generateAvatar(creator.name)), creator.verified && (_jsx("div", { className: "absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary border-2 border-gray-900 flex items-center justify-center", children: _jsx("svg", { className: "w-3 h-3 text-white", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) }) }))] }), _jsx("h3", { className: "font-bold text-white text-sm sm:text-base truncate w-full", children: creator.name }), _jsx("p", { className: "text-primary-light text-xs sm:text-sm mb-2", children: creator.type }), _jsxs("p", { className: "text-gray-500 text-xs mb-2", children: [(creator.followers || creator.followersCount || 0).toLocaleString(), " followers"] }), _jsx("button", { className: `w-full px-3 py-1.5 ${followStatus[creator._id || creator.id || ''] ? 'bg-gray-600 hover:bg-gray-700 border-gray-600' : 'bg-transparent border border-primary-light text-primary-light hover:bg-primary-light/10'} rounded-full text-xs font-medium transition-colors`, onClick: handleFollowToggle, children: followStatus[creator._id || creator.id || ''] ? 'Unfollow' : 'Follow' })] }) }));
}
