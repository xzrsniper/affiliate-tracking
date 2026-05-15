import { Link } from 'react-router-dom';

export default function Logo({ size = 'md', variant = 'default', className = '', linkTo = null }) {
  const heightClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
    xl: 'h-16'
  };

  const logoContent = (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={variant === 'on-dark' ? '/logo-on-dark.png' : '/logo.png'}
        alt="lehko space"
        className={`${heightClasses[size]} w-auto object-contain flex-shrink-0`}
      />
    </div>
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
