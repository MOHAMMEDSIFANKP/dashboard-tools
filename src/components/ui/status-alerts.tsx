export const ErrorAlert: React.FC<{
  message: string;
  onDismiss: () => void;
}> = ({ message, onDismiss }) => (
  <div className="flex justify-between items-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
    <p>{message}</p>
    <button
      onClick={onDismiss}
      className="ml-4 text-red-700 hover:text-red-900 font-bold text-lg leading-none"
      aria-label="Dismiss error"
    >
      ×
    </button>
  </div>
);

export const LoadingAlert: React.FC = () => (
  <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
    <p>Loading chart data...</p>
  </div>
);