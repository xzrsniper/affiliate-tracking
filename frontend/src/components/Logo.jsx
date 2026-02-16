import { Link } from 'react-router-dom';
import { Link as LinkIcon } from 'lucide-react';

export default function Logo({ size = 'md', showText = true, className = '', linkTo = null }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  const logoContent = (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className={`${sizeClasses[size]} bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden`}>
        <img 
          src="/logo.png" 
          alt="LehkoTrack Logo" 
          className="w-full h-full object-contain p-1.5"
          onError={(e) => {
            // Fallback to icon if logo doesn't load
            e.target.style.display = 'none';
            const parent = e.target.parentElement;
            if (parent) {
              parent.innerHTML = '<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>';
            }
          }}
        />
      </div>
      {showText && (
        <span className={`${textSizeClasses[size]} font-bold text-slate-800 dark:text-white`}>
          LehkoTrack
        </span>
      )}
    </div>
  );

  // If linkTo is provided, wrap with Link
  if (linkTo) {
    return (
      <Link to={linkTo} className="flex items-center">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
