import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';

/**
 * variant:
 * - light-bg — світлий фон (wordmark на фіолетовій плашці)
 * - dark-bg — темний фон (прозорий wordmark)
 * - auto — за поточною темою
 */
export default function Logo({ size = 'md', variant = 'auto', className = '', linkTo = null }) {
  const { theme } = useTheme();

  const sizeClasses = {
    sm: 'h-8 max-w-[120px]',
    md: 'h-10 max-w-[160px]',
    lg: 'h-11 max-w-[190px]',
    xl: 'h-14 max-w-[230px]'
  };

  const imgClass = `${sizeClasses[size]} w-auto object-contain object-left flex-shrink-0`;

  const wordmark = (
    <img src="/logo-on-dark.png" alt="lehko space" className={imgClass} />
  );

  const useBrandPlate =
    variant === 'light-bg' || (variant === 'auto' && theme === 'light');

  const logoVisual = useBrandPlate ? (
    <div className="inline-flex items-center rounded-xl bg-gradient-to-br from-violet-600 via-violet-500 to-indigo-600 px-3 py-2 shadow-md shadow-violet-500/25">
      {wordmark}
    </div>
  ) : (
    wordmark
  );

  const logoContent = (
    <div className={`inline-flex items-center ${className}`}>{logoVisual}</div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="inline-flex items-center cursor-pointer">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
