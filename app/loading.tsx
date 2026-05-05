// app/loading.tsx
export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar Skeleton */}
      <div className="h-20 border-b border-[#f0e8de] flex items-center justify-between px-6 md:px-12 animate-pulse">
        <div className="w-24 md:w-32 h-6 bg-[#f5efe6] rounded"></div>
        <div className="w-32 md:w-56 h-8 bg-[#f5efe6] rounded"></div>
        <div className="w-16 md:w-24 h-6 bg-[#f5efe6] rounded"></div>
      </div>

      {/* Hero Skeleton */}
      <div className="h-[75vh] flex flex-col items-center justify-center px-6 animate-pulse space-y-6">
        <div className="w-32 h-4 bg-[#c8882a]/20 rounded-full mb-4"></div>
        <div className="w-full max-w-3xl h-16 md:h-24 bg-[#f5efe6] rounded-2xl"></div>
        <div className="w-3/4 max-w-xl h-12 md:h-16 bg-[#f5efe6] rounded-2xl"></div>
        <div className="w-full max-w-md h-20 bg-[#f5efe6] rounded-2xl mt-4"></div>
        <div className="w-48 h-14 bg-[#1a0a02]/10 rounded-full mt-8"></div>
      </div>
    </div>
  );
}