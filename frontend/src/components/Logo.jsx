import { Link } from 'react-router-dom';

/**
 * variant:
 * - light-bg — білий/світлий фон (logo.png)
 * - dark-bg — темний фон (logo-on-dark.png)
 * - auto — перемикається разом із dark mode (для шапок сайту)
 */
export default function Logo({ size = 'md', variant = 'auto', className = '', linkTo = null }) {
  const sizeClasses = {
    sm: 'h-9 max-w-[130px]',
    md: 'h-11 max-w-[170px]',
    lg: 'h-14 max-w-[210px]',
    xl: 'h-16 max-w-[250px]'
  };

  const imgClass = `${sizeClasses[size]} w-auto object-contain object-left flex-shrink-0`;

  const lightLogo = (
    <img src="/logo.png" alt="lehko space" className={imgClass} />
  );

  const darkLogo = (
    <img src="/logo-on-dark.png" alt="lehko space" className={imgClass} />
  );

  let logoVisual = null;
  if (variant === 'light-bg') {
    logoVisual = lightLogo;
  } else if (variant === 'dark-bg') {
    logoVisual = darkLogo;
  } else {
    logoVisual = (
      <>
        <img src="/logo.png" alt="lehko space" className={`${imgClass} dark:hidden`} />
        <img src="/logo-on-dark.png" alt="lehko space" className={`${imgClass} hidden dark:block`} />
      </>
    );
  }

  const logoContent = (
    <div className={`inline-flex items-center ${className}`}>
      {logoVisual}
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
