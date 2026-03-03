export default function HomePage() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center p-8 bg-[#243119]">
      <h1 className="text-4xl font-bold mb-4 text-[#96BE8C]">Public Homepage</h1>
      <p className="text-lg text-[#96BE8C]/80 max-w-md text-center font-medium">
        Welcome to Project 2. Please sign in with Google using the button in the navigation bar to access the dashboard.
      </p>
    </div>
  );
}
