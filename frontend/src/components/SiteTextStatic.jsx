export default function SiteTextStatic({
  value,
  as: Tag = 'span',
  className = '',
  children
}) {
  const displayText =
    value !== undefined && value !== null ? String(value) : typeof children === 'string' ? children : '';

  return <Tag className={className}>{children !== undefined ? children : displayText}</Tag>;
}
