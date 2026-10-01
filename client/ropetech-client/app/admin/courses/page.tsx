'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { CourseImage } from '@/components/CourseImage';
import { ErrorAlert } from '@/components/ErrorAlert';
import { LinkButton, Button } from '@/components/Button';
import {
  fetchCourses,
  getAccessToken,
  publishCourse,
  unpublishCourse,
  type Course,
  type JwtPayload,
} from '@/lib/api';
import { decodeJwt } from '@/lib/jwt';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const email = decodeJwt<JwtPayload>(getAccessToken() ?? '')?.email;

  function load() {
    setLoading(true);
    fetchCourses()
      .then(setCourses)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load courses'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleToggle(course: Course) {
    setTogglingId(course.id);
    try {
      const updated = course.isPublished
        ? await unpublishCourse(course.id)
        : await publishCourse(course.id);
      setCourses((prev) => prev.map((c) => (c.id === course.id ? { ...c, ...updated } : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update course');
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <AdminLayout email={email}>
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-brand-800">Courses</h1>
          <LinkButton href="/admin/courses/new" pill>
            New Course
          </LinkButton>
        </div>

        {error && (
          <div className="mt-6">
            <ErrorAlert message={error} />
          </div>
        )}

        {!loading && courses.length === 0 && !error && (
          <p className="mt-8 text-sm text-black">No courses yet — create your first one.</p>
        )}

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div
              key={course.id}
              className="overflow-hidden rounded-lg border border-brand-100 bg-white shadow-sm"
            >
              <CourseImage
                courseId={course.id}
                hasPicture={!!course.pictureMime}
                alt={course.title}
                className="h-40 w-full object-cover"
              />
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-brand-800">{course.title}</h3>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                      course.isPublished
                        ? 'bg-green-50 text-green-700'
                        : 'bg-brand-50 text-black'
                    }`}
                  >
                    {course.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-black">{course.category ?? 'Uncategorized'}</p>
                <p className="mt-2 text-sm font-medium text-black">₦{course.price}</p>

                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  disabled={togglingId === course.id}
                  onClick={() => handleToggle(course)}
                >
                  {togglingId === course.id
                    ? 'Updating…'
                    : course.isPublished
                      ? 'Unpublish'
                      : 'Publish'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
