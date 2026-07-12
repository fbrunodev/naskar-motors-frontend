export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm flex flex-col animate-pulse">
      {/* Photo — h-52 matches VehicleCard */}
      <div className="h-52 bg-gray-200 flex-shrink-0" />
      {/* Content */}
      <div className="px-4 pt-3.5 pb-4 flex flex-col gap-2.5">
        <div className="h-4 bg-gray-200 rounded w-4/5" />
        <div className="h-3 bg-gray-200 rounded w-3/5" />
        <div className="flex gap-4 mt-0.5">
          <div className="h-3.5 bg-gray-200 rounded w-12" />
          <div className="h-3.5 bg-gray-200 rounded w-20" />
        </div>
        <div className="h-3 bg-gray-200 rounded w-24" />
        <div className="h-6 bg-gray-200 rounded w-2/5 mt-auto" />
        <div className="h-10 bg-gray-200 rounded-lg w-full" />
      </div>
    </div>
  );
}
