import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { followCreator, unfollowCreator, checkFollowStatus } from '../services/trackService';

interface Creator {
  _id?: string;
  id?: string;
  name: string;
  type: string;
  followers?: number;
  followersCount?: number;
  avatar: string;
  verified?: boolean;
}

interface ArtistCardProps {
  creator: Creator;
  followStatus: Record<string, boolean>;
  setFollowStatus: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export default function ArtistCard({ creator, followStatus, setFollowStatus }: ArtistCardProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const handleFollowToggle = async (e: React.MouseEvent) => {
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
        
        setFollowStatus(prev => ({
          ...prev,
          [creatorId]: false
        }));
        
        console.log('Successfully unfollowed creator');
      } else {
        await followCreator(creatorId);
        
        setFollowStatus(prev => ({
          ...prev,
          [creatorId]: true
        }));
        
        console.log('Successfully followed creator');
      }
    } catch (error) {
      console.error('Failed to follow/unfollow creator:', error);
      alert('Failed to follow/unfollow creator. Please try again.');
    }
  };

  // Function to generate avatar with first letter of name
  const generateAvatar = (name: string) => {
    const firstLetter = name.charAt(0).toUpperCase()
    return (
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center mx-auto">
        <span className="text-xl sm:text-2xl font-bold text-white">{firstLetter}</span>
      </div>
    )
  };

  return (
    <div 
      className="flex-shrink-0 w-40 sm:w-44 md:w-48 group card-bg rounded-xl p-4 cursor-pointer"
      onClick={() => router.push(`/artists/${creator._id || creator.id}`)}
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-3">
          {creator.avatar && creator.avatar.trim() !== '' ? (
            <img
              src={creator.avatar}
              alt={creator.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover mx-auto"
            />
          ) : (
            generateAvatar(creator.name)
          )}
          {creator.verified && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary border-2 border-gray-900 flex items-center justify-center">
              <svg
                className="w-3 h-3 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </div>
          )}
        </div>
        <h3 className="font-bold text-sm sm:text-base truncate w-full text-text-primary">
          {creator.name}
        </h3>
        <p className="text-primary-light text-xs sm:text-sm mb-2">
          {creator.type}
        </p>
        <p className="text-gray-500 text-xs mb-2">
          {(creator.followersCount || creator.followers || 0).toLocaleString()} {t('followers')}
        </p>
        <button 
          className={`w-full px-3 py-1.5 ${followStatus[creator._id || creator.id || ''] ? 'bg-gray-600 hover:bg-gray-700 border-gray-600' : 'bg-transparent border border-primary-light text-primary-light hover:bg-primary-light/10'} rounded-full text-xs font-medium transition-colors`}
          onClick={handleFollowToggle}
        >
          {followStatus[creator._id || creator.id || ''] ? t('unfollow') : t('follow')}
        </button>
      </div>
    </div>
  );
}