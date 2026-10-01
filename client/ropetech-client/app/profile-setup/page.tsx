'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/Button';
import { ErrorAlert } from '@/components/ErrorAlert';
import {
  createProfile,
  getAccessToken,
  uploadCertificate,
  type JwtPayload,
} from '@/lib/api';
import { decodeJwt } from '@/lib/jwt';

const countryCodes = [
  { code: '+1', country: 'United States / Canada' },
  { code: '+20', country: 'Egypt' },
  { code: '+27', country: 'South Africa' },
  { code: '+30', country: 'Greece' },
  { code: '+31', country: 'Netherlands' },
  { code: '+32', country: 'Belgium' },
  { code: '+33', country: 'France' },
  { code: '+34', country: 'Spain' },
  { code: '+39', country: 'Italy' },
  { code: '+44', country: 'United Kingdom' },
  { code: '+49', country: 'Germany' },
  { code: '+52', country: 'Mexico' },
  { code: '+55', country: 'Brazil' },
  { code: '+60', country: 'Malaysia' },
  { code: '+61', country: 'Australia' },
  { code: '+62', country: 'Indonesia' },
  { code: '+63', country: 'Philippines' },
  { code: '+64', country: 'New Zealand' },
  { code: '+65', country: 'Singapore' },
  { code: '+66', country: 'Thailand' },
  { code: '+81', country: 'Japan' },
  { code: '+82', country: 'South Korea' },
  { code: '+86', country: 'China' },
  { code: '+90', country: 'Turkey' },
  { code: '+91', country: 'India' },
  { code: '+92', country: 'Pakistan' },
  { code: '+93', country: 'Afghanistan' },
  { code: '+94', country: 'Sri Lanka' },
  { code: '+234', country: 'Nigeria' },
  { code: '+254', country: 'Kenya' },
  { code: '+255', country: 'Tanzania' },
  { code: '+256', country: 'Uganda' },
  { code: '+260', country: 'Zambia' },
  { code: '+263', country: 'Zimbabwe' },
  { code: '+971', country: 'United Arab Emirates' },
  { code: '+966', country: 'Saudi Arabia' },
];

export default function ProfileSetupPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');

  const [countryCode, setCountryCode] = useState('+234');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [hasPreviousCertification, setHasPreviousCertification] =
    useState<boolean | null>(null);

  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!countryCode) {
      setError('Please select your country code');
      return;
    }

    if (hasPreviousCertification === null) {
      setError('Please let us know whether you have a previous certification');
      return;
    }

    if (hasPreviousCertification && !certificateFile) {
      setError('Please select your previous certification');
      return;
    }

    setLoading(true);

    try {
      const phone = `${countryCode}${phoneNumber.trim()}`;

      await createProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        company: company.trim() || undefined,
        phone,
        hasPreviousCertification,
      });

      if (hasPreviousCertification && certificateFile) {
        await uploadCertificate(certificateFile);
      }

      router.push('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong',
      );
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;

    if (!file) {
      setCertificateFile(null);
      return;
    }

    const allowedTypes = ['application/pdf', 'image/png'];

    if (!allowedTypes.includes(file.type)) {
      setCertificateFile(null);
      setError('Please select a PDF or PNG file');
      return;
    }

    setError(null);
    setCertificateFile(file);
  }

  const email = decodeJwt<JwtPayload>(
    getAccessToken() ?? '',
  )?.email;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AppHeader email={email} />

      <main className="flex flex-1 justify-center px-6 py-12 sm:py-16">
        <div className="w-full max-w-lg">
          <h1 className="text-2xl font-bold text-brand-800">
            Complete your profile
          </h1>

          <p className="mt-1 text-sm text-black">
            Just a few details before you start browsing courses.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* First name */}
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-black"
              >
                First name
              </label>

              <input
                id="firstName"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 w-full rounded-md border border-brand-200 px-3 py-2.5 text-sm text-black focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Last name */}
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-black"
              >
                Last name
              </label>

              <input
                id="lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 w-full rounded-md border border-brand-200 px-3 py-2.5 text-sm text-black focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Company */}
            <div>
              <label
                htmlFor="company"
                className="block text-sm font-medium text-black"
              >
                Company{' '}
                <span className="font-normal text-gray-500">
                  (optional)
                </span>
              </label>

              <input
                id="company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="mt-1 w-full rounded-md border border-brand-200 px-3 py-2.5 text-sm text-black focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-black"
              >
                Phone number
              </label>

              <div className="mt-1 flex gap-2">
                <select
                  id="countryCode"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  required
                  className="w-44 rounded-md border border-brand-200 bg-white px-3 py-2.5 text-sm text-black focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">Code</option>

                  {countryCodes.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.code} — {country.country}
                    </option>
                  ))}
                </select>

                <input
                  id="phoneNumber"
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="801 234 5678"
                  className="min-w-0 flex-1 rounded-md border border-brand-200 px-3 py-2.5 text-sm text-black focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Previous certification */}
            <fieldset>
              <legend className="block text-sm font-medium text-black">
                Do you have a previous certification?
              </legend>

              <div className="mt-3 flex gap-6">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-black">
                  <input
                    type="radio"
                    name="hasPreviousCertification"
                    checked={hasPreviousCertification === true}
                    onChange={() =>
                      setHasPreviousCertification(true)
                    }
                    className="h-4 w-4"
                  />
                  Yes
                </label>

                <label className="flex cursor-pointer items-center gap-2 text-sm text-black">
                  <input
                    type="radio"
                    name="hasPreviousCertification"
                    checked={hasPreviousCertification === false}
                    onChange={() => {
                      setHasPreviousCertification(false);
                      setCertificateFile(null);
                    }}
                    className="h-4 w-4"
                  />
                  No
                </label>
              </div>
            </fieldset>

            {/* Certificate upload only when Yes */}
            {hasPreviousCertification === true && (
              <div className="rounded-md border border-brand-100 bg-brand-50 p-4">
                <label
                  htmlFor="certificate"
                  className="block text-sm font-medium text-black"
                >
                  Upload your previous certification
                </label>

                <p className="mt-1 text-xs text-black">
                  PDF or PNG only. An admin will review it.
                </p>

                <input
                  id="certificate"
                  type="file"
                  accept="application/pdf,image/png"
                  onChange={handleFileChange}
                  required
                  className="mt-3 block w-full text-sm text-black file:mr-4 file:rounded-md file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
                />

                {certificateFile && (
                  <p className="mt-2 text-xs text-black">
                    Selected: {certificateFile.name}
                  </p>
                )}
              </div>
            )}

            {error && <ErrorAlert message={error} />}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Saving…' : 'Complete profile'}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
