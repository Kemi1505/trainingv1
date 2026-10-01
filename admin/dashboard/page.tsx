'use client';

import { useEffect, useState } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { ErrorAlert } from '@/components/ErrorAlert';
import { fetchDashboard, getAccessToken, type AdminDashboard, type JwtPayload } from '@/lib/api';
import { decodeJwt } from '@/lib/jwt';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-brand-100 bg-white p-5 shadow-sm">
      <div className="text-2xl font-bold text-brand-800">{value}</div>
      <div className="mt-1 text-sm text-brand-500">{label}</div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const email = decodeJwt<JwtPayload>(getAccessToken() ?? '')?.email;

  useEffect(() => {
    fetchDashboard()
      .then((res) => {
        if (res.type !== 'admin') {
          throw new Error('Invalid dashboard response');
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
    <div className="flex min-h-screen flex-col bg-surface-alt">
      <AppHeader email={email} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        <h1 className="text-2xl font-bold text-brand-800">Admin dashboard</h1>

        {error && (
          <div className="mt-6">
            <ErrorAlert message={error} />
          </div>
        )}

        {data && (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total users" value={data.totalUsers} />
              <StatCard label="Total courses" value={data.totalCourses} />
              <StatCard label="Published courses" value={data.totalPublished} />
              <StatCard label="Unpublished courses" value={data.totalUnpublished} />
              <StatCard label="Pending payments" value={data.pendingPayments} />
              <StatCard label="Approved payments" value={data.approvedPayments} />
              <StatCard label="Pending certifications" value={data.pendingCertifications} />
              <StatCard label="Approved certificates" value={data.approvedCertificates} />
            </div>

            <section className="mt-10">
              <h2 className="text-lg font-semibold text-brand-800">Courses</h2>
              <div className="mt-4 overflow-hidden rounded-md border border-brand-100 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-brand-100 bg-surface-alt text-brand-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium">Price</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.courses.map((course) => (
                      <tr key={course.id} className="border-b border-brand-100 last:border-0">
                        <td className="px-4 py-3 text-brand-800">{course.title}</td>
                        <td className="px-4 py-3 text-brand-600">{Number(course.price).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              course.isPublished
                                ? 'bg-green-50 text-green-700'
                                : 'bg-brand-50 text-brand-500'
                            }`}
                          >
                            {course.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-10">
              <h2 className="text-lg font-semibold text-brand-800">Enrollments</h2>
              <div className="mt-4 overflow-hidden rounded-md border border-brand-100 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-brand-100 bg-surface-alt text-brand-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">User</th>
                      <th className="px-4 py-3 font-medium">Course</th>
                      <th className="px-4 py-3 font-medium">Payment status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.enrollments.map((e, i) => (
                      <tr key={i} className="border-b border-brand-100 last:border-0">
                        <td className="px-4 py-3 text-brand-800">{e.user.email}</td>
                        <td className="px-4 py-3 text-brand-600">{e.course.title}</td>
                        <td className="px-4 py-3 text-brand-600">{e.paymentStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
