'use client';

import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// The picture endpoint sits behind JwtGuard, so a plain <img src="..."> can't
// authenticate itself — the browser won't attach an Authorization header to
// an image request. Fetching it as a blob and handing the object URL to
// <img> is the workaround.
export function CourseImage({
  courseId,
  hasPicture,
  alt,
  className = '',
}: {
  courseId: string;
  hasPicture: boolean;
  alt: string;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!hasPicture) {
      setSrc(null);
      return;
    }

    let objectUrl: string | null = null;
    const token = getAccessToken();

    fetch(`${API_BASE_URL}/courses/${courseId}/picture`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.blob() : Promise.reject()))
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => setSrc(null));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [courseId, hasPicture]);

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} />;
  }

  // Default Ropetech placeholder — same mark as the header Logo.
  return (
    <div className={`flex items-center justify-center bg-brand-700 ${className}`}>
      <span className="text-2xl font-bold text-white">R</span>
    </div>
  );
}
