const svgProps = {
  viewBox: '0 0 24 24',
  width: 18,
  height: 18,
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': true,
  focusable: 'false',
}

function Icon({ children, className = '' }) {
  return (
    <svg {...svgProps} className={`block shrink-0 overflow-visible ${className}`.trim()}>
      {children}
    </svg>
  )
}

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const ICONS = {
  overview: (
    <Icon>
      <path d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5.5v-6h-3v6H5a1 1 0 0 1-1-1v-9.5Z" {...stroke} />
    </Icon>
  ),
  transactions: (
    <Icon>
      <path d="M7 7h11M15 4l3 3-3 3M17 17H6M9 14l-3 3 3 3" {...stroke} />
    </Icon>
  ),
  budgets: (
    <Icon>
      <path d="M5 5h14v14H5V5Z" {...stroke} />
      <path d="M5 10h14M10 5v14" {...stroke} />
    </Icon>
  ),
  goals: (
    <Icon>
      <circle cx="12" cy="12" r="7.25" {...stroke} />
      <circle cx="12" cy="12" r="3" {...stroke} />
    </Icon>
  ),
  reports: (
    <Icon>
      <path d="M5 19V9M10 19V5M15 19v-7M20 19V8" {...stroke} />
    </Icon>
  ),
  books: (
    <Icon>
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15.5H7.5A2.5 2.5 0 0 0 5 21V5.5Z" {...stroke} />
      <path d="M5 18.5h14" {...stroke} />
    </Icon>
  ),
  company: (
    <Icon>
      <path d="M4 20V8l8-4 8 4v12" {...stroke} />
      <path d="M9 20v-6h6v6" {...stroke} />
    </Icon>
  ),
  team: (
    <Icon>
      <circle cx="9" cy="8" r="2.5" {...stroke} />
      <circle cx="16" cy="9" r="2" {...stroke} />
      <path d="M4.5 18.5c.6-2.6 2.6-4 4.5-4s3.9 1.4 4.5 4" {...stroke} />
      <path d="M13.5 14.8c1.2-.5 2.6-.3 3.7.8.8.8 1.3 1.9 1.5 2.9" {...stroke} />
    </Icon>
  ),
  clients: (
    <Icon>
      <circle cx="12" cy="8" r="3" {...stroke} />
      <path d="M5.5 19c1-3.2 3.2-5 6.5-5s5.5 1.8 6.5 5" {...stroke} />
    </Icon>
  ),
  approvals: (
    <Icon>
      <path d="M5 12.5l4.2 4.2L19 7" {...stroke} />
    </Icon>
  ),
  vendors: (
    <Icon>
      <path d="M12 3.5l7 4v9l-7 4-7-4v-9l7-4Z" {...stroke} />
    </Icon>
  ),
  shops: (
    <Icon>
      <path d="M4 10.5L6.5 4h11L20 10.5" {...stroke} />
      <path d="M4 10.5h16V20H4V10.5Z" {...stroke} />
      <path d="M10 20v-5h4v5" {...stroke} />
    </Icon>
  ),
  analytics: (
    <Icon>
      <path d="M5 5h14v14H5V5Z" {...stroke} />
      <path d="M8 15l3-3.5 2.5 2L16 9" {...stroke} />
    </Icon>
  ),
  settings: (
    <Icon>
      <circle cx="12" cy="12" r="3" {...stroke} />
      <path
        d="M12 3.5v2.2M12 18.3v2.2M4.8 7.2l1.9 1.1M17.3 15.7l1.9 1.1M3.5 12h2.2M18.3 12h2.2M4.8 16.8l1.9-1.1M17.3 8.3l1.9-1.1"
        {...stroke}
      />
    </Icon>
  ),
  logout: (
    <Icon>
      <path d="M10 12h9M16 8l4 4-4 4" {...stroke} />
      <path d="M13 5.5H6.5A1.5 1.5 0 0 0 5 7v10a1.5 1.5 0 0 0 1.5 1.5H13" {...stroke} />
    </Icon>
  ),
  menu: (
    <Icon>
      <path d="M5 7h14M5 12h14M5 17h14" {...stroke} />
    </Icon>
  ),
  notifications: (
    <Icon>
      <path d="M6.5 16.5h11M8 16.5V10a4 4 0 1 1 8 0v6.5" {...stroke} />
      <path d="M10 16.5a2 2 0 0 0 4 0" {...stroke} />
      <path d="M12 4.5V3.5" {...stroke} />
    </Icon>
  ),
  add: (
    <Icon>
      <path d="M12 5v14M5 12h14" {...stroke} />
    </Icon>
  ),
  ai: (
    <Icon>
      <path d="M12 3.5l1.6 4.4L18 9.5l-4.4 1.6L12 15.5l-1.6-4.4L6 9.5l4.4-1.6L12 3.5Z" {...stroke} />
      <path d="M18.5 14.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" {...stroke} />
    </Icon>
  ),
}

export default function NavIcon({ name, className = '' }) {
  const icon = ICONS[name] || ICONS.overview
  if (!className) return icon
  return (
    <span className={`inline-flex items-center justify-center ${className}`.trim()}>{icon}</span>
  )
}
