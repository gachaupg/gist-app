import { Suspense } from "react";
import SearchContent from "./SearchContent";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
