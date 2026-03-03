export default function DeniedPage() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center p-8">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-xl text-gray-700">
          You do not have access to this page.
        </p>
      </div>
    </div>
  );
}
