'use client';

import { useEffect, useState } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { ErrorAlert } from '@/components/ErrorAlert';
import {
  fetchDashboard,
  fetchCourses,
  type Course,
  getAccessToken,
  type UserDashboard,
  type JwtPayload,
} from '@/lib/api';
import { decodeJwt } from '@/lib/jwt';

const statusLabel: Record<string, string> = {
  NONE: 'No certification on file',
  PENDING: 'Certification under review',
  VERIFIED: 'Certification verified',
  REJECTED: 'Certification rejected',
};

export default function DashboardPage() {
  const [data, setData] = useState<UserDashboard | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);

  const email = decodeJwt<JwtPayload>(
    getAccessToken() ?? '',
  )?.email;

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [dashboardData, courseData] = await Promise.all([
          fetchDashboard(),
          fetchCourses(),
        ]);

        if (dashboardData.type !== 'user') {
          throw new Error('Invalid dashboard response');
        }

        setData(dashboardData);
        setCourses(courseData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load dashboard',
        );
      }
    }

    loadDashboard();
  }, []);

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col bg-surface-alt">
        <AppHeader email={email} />

        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
          {error ? (
            <ErrorAlert message={error} />
          ) : (
            <p className="text-sm text-black">
              Loading dashboard...
            </p>
          )}
        </main>
      </div>
    );
  }

  const isNewUser = data.enrollments.length === 0;

  const featuredCourses = courses.slice(0, 6);

  const approvedCourses = data.enrollments.filter(
    (enrollment) => enrollment.paymentStatus === 'APPROVED',
  );

  const pendingCourses = data.enrollments.filter(
    (enrollment) => enrollment.paymentStatus !== 'APPROVED',
  );

  return (
    <div className="flex min-h-screen flex-col bg-surface-alt">
      <AppHeader email={email} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">

        {/* NEW USER */}
        {isNewUser ? (
          <>
            <section className="text-center">
              <h1 className="text-3xl font-bold text-brand-800">
                Ready to start your training?
              </h1>

              <p className="mt-3 text-black">
                Explore our courses and choose the training that is right
                for you.
              </p>

              <a
                href="/courses"
                className="mt-6 inline-flex min-w-[220px] items-center justify-center rounded-md bg-brand-700 px-8 py-4 font-semibold text-white transition hover:bg-brand-600"
              >
                Explore Courses
              </a>
            </section>

            <section className="mt-14">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-brand-800">
                  Featured Courses
                </h2>

                <a
                  href="/courses"
                  className="text-sm font-medium text-brand-700 hover:text-brand-500"
                >
                  View all courses →
                </a>
              </div>

              {featuredCourses.length === 0 ? (
                <p className="mt-5 text-sm text-black">
                  No courses are available yet.
                </p>
              ) : (
                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {featuredCourses.map((course) => (
                    <div
                      key={course.id}
                      className="rounded-md border border-brand-100 bg-white p-5 shadow-sm"
                    >
                      <h3 className="font-semibold text-black">
                        {course.title}
                      </h3>

                      <p className="mt-2 text-sm text-black">
                        {course.description}
                      </p>

                      <p className="mt-4 font-semibold text-black">
                        ₦{Number(course.price).toLocaleString()}
                      </p>

                      <a
                        href={`/courses/${course.id}`}
                        className="mt-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-500"
                      >
                        View course →
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          /* RETURNING USER */
          <>
            <section>
              <h1 className="text-3xl font-bold text-brand-800">
                Welcome back,{' '}
                {data.profile?.firstName ?? 'there'}
              </h1>

              <p className="mt-2 text-black">
                Continue where you left off.
              </p>
            </section>

            {/* MY COURSES */}
            <section className="mt-12">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-brand-800">
                  My Courses
                </h2>

                <a
                  href="/enrollments"
                  className="text-sm font-medium text-brand-700 hover:text-brand-500"
                >
                  View all →
                </a>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {approvedCourses.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="rounded-md border border-brand-100 bg-white p-5 shadow-sm"
                  >
                    <h3 className="font-semibold text-black">
                      {enrollment.course.title}
                    </h3>

                    <span className="mt-3 inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                      Active
                    </span>
                  </div>
                ))}

                {pendingCourses.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="rounded-md border border-brand-100 bg-white p-5 shadow-sm opacity-80"
                  >
                    <h3 className="font-semibold text-black">
                      {enrollment.course.title}
                    </h3>

                    <span className="mt-3 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                      Payment{' '}
                      {enrollment.paymentStatus.toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* EXPLORE MORE TRAINING */}
            <section className="mt-12">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-brand-800">
                  Explore More Training
                </h2>

                <a
                  href="/courses"
                  className="text-sm font-medium text-brand-700 hover:text-brand-500"
                >
                  View all →
                </a>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {featuredCourses.map((course) => (
                  <div
                    key={course.id}
                    className="rounded-md border border-brand-100 bg-white p-5 shadow-sm"
                  >
                    <h3 className="font-semibold text-black">
                      {course.title}
                    </h3>

                    <p className="mt-2 text-sm text-black">
                      {course.description}
                    </p>

                    <p className="mt-4 font-semibold text-black">
                      ₦{Number(course.price).toLocaleString()}
                    </p>

                    <a
                      href={`/courses/${course.id}`}
                      className="mt-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-500"
                    >
                      View course →
                    </a>
                  </div>
                ))}
              </div>
            </section>

            {/* CERTIFICATION */}
            <section className="mt-12">
              <h2 className="text-lg font-semibold text-brand-800">
                Certification
              </h2>

              <div className="mt-4 rounded-md border border-brand-100 bg-white px-5 py-4 text-sm text-black">
                {statusLabel[data.certificationStatus ?? 'NONE']}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}