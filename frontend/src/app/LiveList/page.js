"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function LiveListPage() {
  const [streams, setStreams] = useState([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/streams`)
      .then(res => res.json())
      .then(setStreams)
      .catch(console.error);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Live Now</h1>
      {streams.length === 0 && <p>No live streams right now.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {streams.map((stream) => (
          <Link
            href={`/LiveStream/${stream.slug}`}
            key={stream._id}
            className="border rounded-lg p-4 hover:bg-gray-100 transition"
          >
            <h2 className="font-bold">{stream.title}</h2>
            <p className="text-sm text-gray-600">By {stream.seller?.name || "Unknown"}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
