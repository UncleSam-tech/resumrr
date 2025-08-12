export function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center text-gray-600 bg-gray-50 ring-1 ring-gray-200 rounded-md p-8">
      {message}
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-4 bg-gray-200 rounded w-full" />
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="text-center text-red-700 bg-red-50 ring-1 ring-red-200 rounded-md p-6">
      Failed to load candidates.{' '}
      <button type="button" onClick={onRetry} className="underline">Retry</button>
    </div>
  );
}

