import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200",
        className
      )}
    />
  );
}

function FieldSkeleton() {
  return (
    <div className="space-y-2">
      <Bone className="h-4 w-24" />
      <Bone className="h-10 w-full" />
    </div>
  );
}

export function FormSkeleton({ fields }: { fields: number }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: fields }).map((_, i) => (
        <FieldSkeleton key={i} />
      ))}
      <Bone className="h-10 w-full mt-2" />
      <div className="pt-6 mt-2 border-t border-gray-200">
        <Bone className="h-4 w-48 mx-auto" />
      </div>
    </div>
  );
}
