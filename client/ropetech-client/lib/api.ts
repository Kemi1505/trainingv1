const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    // Include cookies too, in case your AuthService also sets one —
    // harmless if it doesn't, but requires CORS `credentials: true` on
    // the API side (see the setup notes).
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    // NestJS's ValidationPipe returns `message` as an array of strings
    // (one per failed field) rather than a single string — join those
    // into one readable line instead of showing "field1,field2".
    const message = Array.isArray(body.message)
      ? body.message.join('. ')
      : body.message ?? `Request failed (${res.status})`;
    throw new Error(message);
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export function getAccessToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

// NOTE: adjust the field names below if your AuthService's login response
// shape differs from { accessToken, refreshToken }.
export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  saveTokens(data.accessToken, data.refreshToken);
  return data;
}

// /auth/register currently only creates the user and doesn't return tokens,
// so "auto-login after signup" is done here by immediately calling login()
// with the same credentials. If you later change the backend so /register
// returns tokens directly, this can just save those instead of re-calling login.
//
// Field name note: your RegisterUserDto expects `confirm_password`
// (snake_case), not `confirmPassword` — that mismatch was the exact
// "confirm_password should not be empty" error. Sent as-is below.
export async function register(
  email: string,
  password: string,
  confirmPassword: string,
): Promise<AuthResponse> {
  await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, confirm_password: confirmPassword }),
  });
  return login(email, password);
}

// Returns null on 404 (no profile yet) instead of throwing, since callers
// use this purely to decide where to route the user next.
export async function fetchMyProfile() {
  const token = getAccessToken();
  try {
    return await request('/users/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return null;
  }
}

export async function fetchDashboard(): Promise<UserDashboard | AdminDashboard> {
  const token = getAccessToken();
  return request('/users/dashboard', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export type CourseDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  pictureMime: string | null;
  pictureName: string | null;
  requirements: string | null;
  category: string | null;
  difficulty: CourseDifficulty;
  learningOutcomes: string[];
  requiresPreviousCertification: boolean;
  isPublished: boolean;
}

export interface CourseBasicsPayload {
  title: string;
  description: string;
  price: number;
  category?: string;
  difficulty?: CourseDifficulty;
  requirements?: string;
  learningOutcomes?: string[];
  requiresPreviousCertification?: boolean;
}

function buildCourseFormData(fields: Partial<CourseBasicsPayload>, picture?: File | null) {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined) return;
    if (key === 'learningOutcomes') {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  });
  if (picture) formData.append('picture', picture);
  return formData;
}

async function multipartRequest<T>(
  path: string,
  method: 'POST' | 'PATCH',
  formData: FormData,
): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = Array.isArray(body.message) ? body.message.join('. ') : body.message;
    throw new Error(message ?? `Request failed (${res.status})`);
  }
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

// Returns drafts too when called by an admin — the backend infers that
// from the JWT role, not from anything passed here.
export async function fetchCourses(): Promise<Course[]> {
  const token = getAccessToken();
  return request('/courses', { headers: { Authorization: `Bearer ${token}` } });
}

export async function fetchCourse(courseId: string): Promise<Course> {
  const token = getAccessToken();
  return request(`/courses/${courseId}`, { headers: { Authorization: `Bearer ${token}` } });
}

export async function createCourse(
  fields: CourseBasicsPayload,
  picture?: File | null,
): Promise<Course> {
  return multipartRequest('/courses', 'POST', buildCourseFormData(fields, picture));
}

export async function updateCourse(
  courseId: string,
  fields: Partial<CourseBasicsPayload>,
  picture?: File | null,
): Promise<Course> {
  return multipartRequest(`/courses/${courseId}`, 'PATCH', buildCourseFormData(fields, picture));
}

export async function publishCourse(courseId: string): Promise<Course> {
  const token = getAccessToken();
  return request(`/courses/${courseId}/publish`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function unpublishCourse(courseId: string): Promise<Course> {
  const token = getAccessToken();
  return request(`/courses/${courseId}/unpublish`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export interface ContentItem {
  id: string;
  title: string;
  mimeType: string;
  fileName: string;
  order: number;
}

export async function fetchContentItems(courseId: string): Promise<ContentItem[]> {
  const token = getAccessToken();
  return request(`/courses/${courseId}/content`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function addContentItem(
  courseId: string,
  title: string,
  order: number,
  file: File,
): Promise<ContentItem> {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('order', String(order));
  formData.append('file', file);
  return multipartRequest(`/courses/${courseId}/content`, 'POST', formData);
}

export async function deleteContentItem(courseId: string, contentId: string) {
  const token = getAccessToken();
  return request(`/courses/${courseId}/content/${contentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  text: string;
  order: number;
  options: (QuestionOption & { id: string })[];
}

export async function fetchQuestions(courseId: string): Promise<Question[]> {
  const token = getAccessToken();
  return request(`/courses/${courseId}/assessment/questions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function addQuestion(
  courseId: string,
  text: string,
  options: QuestionOption[],
  order: number,
): Promise<Question> {
  const token = getAccessToken();
  return request(`/courses/${courseId}/assessment/questions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ text, options, order }),
  });
}

export async function deleteQuestion(courseId: string, questionId: string) {
  const token = getAccessToken();
  return request(`/courses/${courseId}/assessment/questions/${questionId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function logout() {
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
  try {
    await request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  } finally {
    clearTokens();
  }
}



export interface CreateProfilePayload {
  firstName: string;
  lastName: string;
  company?: string;
  phone: string;
  hasPreviousCertification: boolean;
}

export async function createProfile(payload: CreateProfilePayload) {
  const token = getAccessToken();
  return request('/users/profile', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

// Multipart upload — deliberately doesn't set Content-Type so the browser
// can add the correct multipart boundary itself.
export async function uploadCertificate(file: File) {
  const token = getAccessToken();
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/users/certificate`, {
    method: 'POST',
    credentials: 'include',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = Array.isArray(body.message) ? body.message.join('. ') : body.message;
    throw new Error(message ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export interface UserDashboard {
  type: 'user';

  profileComplete: boolean;

  profile: {
    firstName: string;
    lastName: string;
  } | null;

  certificationStatus:
    | 'NONE'
    | 'PENDING'
    | 'VERIFIED'
    | 'REJECTED'
    | null;

  enrollments: {
    id: string;

    course: {
      id: string;
      title: string;
      description: string;
      price: number | string;
      pictureData?: string | null;
      pictureMime?: string | null;
    };

    paymentStatus:
      | 'PENDING'
      | 'APPROVED'
      | 'REJECTED'
      | string;
  }[];
}

export interface AdminDashboard {
  type: 'admin';

  totalUsers: number;
  totalCourses: number;
  totalPublished: number;
  totalUnpublished: number;

  pendingPayments: number;
  approvedPayments: number;

  pendingCertifications: number;
  approvedCertificates: number;

  courses: {
    id: string;
    title: string;
    description: string;
    price: number | string;
    pictureData?: string | null;
    pictureMime?: string | null;
    isPublished: boolean;
  }[];

  enrollments: {
    id: string;
    enrolledAt: string;
    paymentStatus: string;

    user: {
      id: string;
      email: string;

      profile: {
        firstName: string;
        lastName: string;
      } | null;
    };

    course: {
      id: string;
      title: string;
    };
  }[];
}