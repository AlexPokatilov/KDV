interface Props {
  message: string
}

export function ErrorBanner({ message }: Props) {
  return (
    <div className="error-banner">
      <span className="error-icon">⚠</span>
      <span>{message}</span>
    </div>
  )
}
