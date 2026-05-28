"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    if (error.message === "SESSION_KICKED") {
      window.location.href = "/login?kicked=1";
    }
  }, [error]);

  if (error.message === "SESSION_KICKED") {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="rounded-lg bg-white p-8 shadow-md text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">出错了</h2>
        <p className="text-gray-600">{error.message}</p>
      </div>
    </div>
  );
}
