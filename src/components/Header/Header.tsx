import { useRadarStore } from '../../store/radarStore';
import clsx from 'clsx';

export function Header() {
  const { connection } = useRadarStore();

  const statusConfig = {
    disconnected: { text: 'Disconnected', color: 'bg-radar-danger', pulse: false },
    connecting: { text: 'Connecting...', color: 'bg-radar-warning', pulse: true },
    waiting: { text: 'Waiting for host', color: 'bg-radar-warning', pulse: true },
    connected: { text: 'Connected', color: 'bg-radar-success', pulse: false },
  }[connection.status];

  return (
    <header className="h-14 bg-radar-panel border-b border-radar-border flex items-center justify-between px-4">
      {/* Branding */}
      <div className="flex items-center gap-3">
        <img
          src={`${import.meta.env.BASE_URL}modal_branding.jpeg`}
          alt="prods-gamesense"
          className="h-9 rounded-md shadow-lg"
        />
        <div>
          <h1 className="text-white font-bold text-base leading-tight">prods-gamesense</h1>
          <p className="text-gray-500 text-xs">Web Radar Client</p>
        </div>
      </div>

      {/* Connection Status */}
      <div className="flex items-center gap-3 bg-radar-panel-light rounded-lg px-4 py-2">
        <div className={clsx(
          'w-2.5 h-2.5 rounded-full',
          statusConfig.color,
          statusConfig.pulse && 'animate-pulse'
        )} />
        <span className="text-gray-300 text-sm font-medium">{statusConfig.text}</span>
      </div>
    </header>
  );
}
