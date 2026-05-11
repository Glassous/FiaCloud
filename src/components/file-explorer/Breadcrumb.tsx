import './Breadcrumb.css'

interface BreadcrumbProps {
  prefix: string
  onNavigate: (prefix: string) => void
}

interface BreadcrumbPart {
  name: string
  prefix: string
}

function parseParts(prefix: string): BreadcrumbPart[] {
  if (!prefix) return []
  const segments = prefix.split('/').filter(Boolean)
  return segments.map((seg, i) => ({
    name: seg,
    prefix: segments.slice(0, i + 1).join('/') + '/',
  }))
}

export function Breadcrumb({ prefix, onNavigate }: BreadcrumbProps) {
  const parts = parseParts(prefix)

  return (
    <nav className="breadcrumb">
      <button
        className="breadcrumb__item breadcrumb__item--root"
        onClick={() => onNavigate('')}
      >
        <span className="material-symbols-outlined breadcrumb__icon">home</span>
      </button>

      {parts.map((part) => (
        <span key={part.prefix} className="breadcrumb__segment">
          <span className="breadcrumb__sep">/</span>
          <button
            className="breadcrumb__item"
            onClick={() => onNavigate(part.prefix)}
          >
            {part.name}
          </button>
        </span>
      ))}
    </nav>
  )
}
