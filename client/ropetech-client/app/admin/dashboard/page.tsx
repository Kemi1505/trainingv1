'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { ErrorAlert } from '@/components/ErrorAlert';
import {
  fetchDashboard,
  getAccessToken,
  type AdminDashboard,
  type JwtPayload,
} from '@/lib/api';
import { decodeJwt } from '@/lib/jwt';

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-md border border-brand-100 bg-white p-5 shadow-sm">
      <div className="text-2xl font-bold text-brand-800">
        {value}
      </div>

      <div className="mt-1 text-sm text-black">
        {label}
      </div>
    </div>
  );
}

function formatStatus(status: string) {
  if (status === 'APPROVED') {
    return 'Active';
  }

  if (status === 'PENDING') {
    return 'Payment pending';
  }

  if (status === 'REJECTED') {
    return 'Rejected';
  }

  return status;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const email = decodeJwt<JwtPayload>(
    getAccessToken() ?? '',
  )?.email;

  useEffect(() => {
    fetchDashboard()
      .then((res) => {
        if (res.type !== 'admin') {
          throw new Error('Admin dashboard access required');
        }

        setData(res);
      })
      .catch((err) =>
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load dashboard',
        ),
      );
  }, []);

  return (
    <AdminLayout email={email}>
      <div className="mx-auto w-full max-w-6xl">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-brand-800">
            Welcome back, Admin
          </h1>

          <p className="mt-2 text-sm text-black">
            Here&apos;s what&apos;s happening with your training platform.
          </p>
        </div>

        {error && (
          <div className="mt-6">
            <ErrorAlert message={error} />
          </div>
        )}

        {data && (
          <>
            {/* Statistics */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Published courses"
                value={data.totalPublished ?? 0}
              />

              <StatCard
                label="Unpublished courses"
                value={data.totalUnpublished ?? 0}
              />

              <StatCard
                label="Total users"
                value={data.totalUsers ?? 0}
              />
            </div>

            {/* Pending Actions */}
            <section className="mt-10">
              <h2 className="text-lg font-semibold text-brand-800">
                Pending Actions
              </h2>

              <div className="mt-4 overflow-hidden rounded-md border border-brand-100 bg-white shadow-sm">
                {/* Payment confirmations */}
                <div className="flex items-center justify-between gap-4 border-b border-brand-100 px-5 py-5">
                  <div className="flex items-center gap-4">
                    <span className="min-w-8 text-xl font-bold text-brand-800">
                      {data.pendingPayments ?? 0}
                    </span>

                    <span className="text-sm text-black">
                      Payment confirmations need review
                    </span>
                  </div>

                  <a
                    href="/admin/payments"
                    className="shrink-0 text-sm font-semibold text-brand-700 hover:text-brand-500"
                  >
                    View →
                  </a>
                </div>

                {/* Certifications */}
                <div className="flex items-center justify-between gap-4 border-b border-brand-100 px-5 py-5">
                  <div className="flex items-center gap-4">
                    <span className="min-w-8 text-xl font-bold text-brand-800">
                      {data.pendingCertifications ?? 0}
                    </span>

                    <span className="text-sm text-black">
                      Previous certifications need review
                    </span>
                  </div>

                  <a
                    href="/admin/certifications"
                    className="shrink-0 text-sm font-semibold text-brand-700 hover:text-brand-500"
                  >
                    View →
                  </a>
                </div>

                {/* Course drafts */}
                <div className="flex items-center justify-between gap-4 px-5 py-5">
                  <div className="flex items-center gap-4">
                    <span className="min-w-8 text-xl font-bold text-brand-800">
                      {data.totalUnpublished ?? 0}
                    </span>

                    <span className="text-sm text-black">
                      New course drafts
                    </span>
                  </div>

                  <a
                    href="/admin/courses"
                    className="shrink-0 text-sm font-semibold text-brand-700 hover:text-brand-500"
                  >
                    View →
                  </a>
                </div>
              </div>
            </section>

            {/* Recent Enrollments */}
            <section className="mt-10">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-brand-800">
                  Recent Enrollments
                </h2>

                <a
                  href="/admin/enrollments"
                  className="text-sm font-semibold text-brand-700 hover:text-brand-500"
                >
                  View all →
                </a>
              </div>

              <div className="mt-4 overflow-hidden rounded-md border border-brand-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead className="border-b border-brand-100 bg-surface-alt">
                      <tr>
                        <th className="px-5 py-3 font-medium text-black">
                          User
                        </th>

                        <th className="px-5 py-3 font-medium text-black">
                          Course
                        </th>

                        <th className="px-5 py-3 font-medium text-black">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {(data.enrollments ?? []).length === 0 ? (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-5 py-8 text-center text-sm text-black"
                          >
                            No enrollments yet.
                          </td>
                        </tr>
                      ) : (
                        data.enrollments.map((enrollment) => {
                          const firstName =
                            enrollment.user.profile?.firstName ?? '';

                          const lastName =
                            enrollment.user.profile?.lastName ?? '';

                          const fullName =
                            `${firstName} ${lastName}`.trim();

                          return (
                            <tr
                              key={enrollment.id}
                              className="border-b border-brand-100 last:border-0"
                            >
                              <td className="px-5 py-4 text-black">
                                {fullName ||
                                  enrollment.user.email}
                              </td>

                              <td className="px-5 py-4 text-black">
                                {enrollment.course.title}
                              </td>

                              <td className="px-5 py-4 text-black">
                                {formatStatus(
                                  enrollment.paymentStatus,
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
