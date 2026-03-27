import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-gray-200", className)} />;
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
      <Bone className="mt-2 h-10 w-full" />
      <div className="mt-2 border-t border-gray-200 pt-6">
        <Bone className="mx-auto h-4 w-48" />
      </div>
    </div>
  );
}
