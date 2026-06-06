import { useConnectionState } from "../store/selectors";

export function ConnectionBanner() {
  const { connectionStatus, error } = useConnectionState();

  const statusLabel = {
    disconnected: "Backend disconnected",
    connecting: "Backend connecting…",
    connected: "Backend connected",
  }[connectionStatus];

  return (
    <div className={`connection-banner connection-banner--${connectionStatus}`}>
      <span>{statusLabel}</span>
      {error ? <span className="connection-banner__error">{error}</span> : null}
    </div>
  );
}
