type StatsCardProps = {
  title: string
  value: number
  description: string
  success?: boolean
}

function StatsCard({
  title,
  value,
  description,
  success = false
}: StatsCardProps) {
  return (
    <div className="stat-card">
      <span className="stat-label">{title}</span>

      <strong>{value}</strong>

      <span className={`stat-detail ${success ? 'success' : ''}`}>
        {description}
      </span>
    </div>
  )
}

export default StatsCard