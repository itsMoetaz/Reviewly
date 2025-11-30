import { Github, Gitlab } from 'lucide-react';
import { motion } from 'framer-motion';

type Platform = 'GITHUB' | 'GITLAB';

interface PlatformSelectorProps {
  onSelect: (platform: Platform) => void;
}

const platforms = [
  {
    id: 'GITHUB' as Platform,
    name: 'GitHub',
    icon: Github,
    bgColor: 'bg-gray-900 dark:bg-gray-800',
    hoverBg: 'hover:bg-gray-800 dark:hover:bg-gray-700',
    borderColor: 'border-gray-700',
    hoverBorder: 'hover:border-gray-500',
    iconColor: 'text-white',
    glowColor: 'group-hover:shadow-gray-500/25',
  },
  {
    id: 'GITLAB' as Platform,
    name: 'GitLab',
    icon: Gitlab,
    bgColor: 'bg-orange-600 dark:bg-orange-700',
    hoverBg: 'hover:bg-orange-500 dark:hover:bg-orange-600',
    borderColor: 'border-orange-500',
    hoverBorder: 'hover:border-orange-400',
    iconColor: 'text-white',
    glowColor: 'group-hover:shadow-orange-500/25',
  },
];

export const PlatformSelector = ({ onSelect }: PlatformSelectorProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Choose Your Platform
        </h3>
        <p className="text-sm text-muted-foreground">
          Select the platform where your repository is hosted
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {platforms.map((platform, index) => (
          <motion.button
            key={platform.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            onClick={() => onSelect(platform.id)}
            className={`
              group relative flex flex-col items-center justify-center p-6 rounded-xl
              border-2 ${platform.borderColor} ${platform.hoverBorder}
              ${platform.bgColor} ${platform.hoverBg}
              transition-all duration-300 ease-out
              hover:scale-[1.02] hover:shadow-xl ${platform.glowColor}
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
            `}
          >
            {/* Icon Container */}
            <div className={`
              p-4 rounded-full mb-4
              bg-white/10 backdrop-blur-sm
              group-hover:bg-white/20
              transition-all duration-300
            `}>
              <platform.icon className={`w-10 h-10 ${platform.iconColor}`} />
            </div>

            {/* Platform Name */}
            <span className={`text-lg font-semibold ${platform.iconColor} mb-1`}>
              {platform.name}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default PlatformSelector;
