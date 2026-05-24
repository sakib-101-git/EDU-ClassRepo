const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}

type FetchOptions = RequestInit & { skipAuth?: boolean };

async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { skipAuth, ...init } = options;

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  };

  if (!headers["Content-Type"] && !(init.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (!skipAuth && accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  let res = await fetch(`${BASE}${path}`, { ...init, headers, credentials: "include" });

  // Attempt token refresh on 401
  if (res.status === 401 && !skipAuth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${accessToken}`;
      res = await fetch(`${BASE}${path}`, { ...init, headers, credentials: "include" });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, body?.detail ?? body?.message ?? "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function tryRefresh(): Promise<boolean> {
  // Lazy import to avoid circular dep — store is a client module
  try {
    const { useAuthStore } = await import("./auth-store");
    const refreshToken = useAuthStore.getState().getRefreshToken();
    if (!refreshToken) return false;

    const data = await auth.refresh(refreshToken);
    useAuthStore.getState().setAuth(data.user, data.accessToken, data.refreshToken);
    return true;
  } catch {
    setAccessToken(null);
    return false;
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
  register: (body: RegisterRequest) =>
    request<OtpSentResponse>("/api/auth/register", { method: "POST", body: JSON.stringify(body), skipAuth: true }),

  verifyEmail: (email: string, otp: string) =>
    request<AuthResponse>("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
      skipAuth: true,
    }),

  resendOtp: (email: string) =>
    request<OtpSentResponse>("/api/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
      skipAuth: true,
    }),

  login: (body: LoginRequest) =>
    request<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify(body), skipAuth: true }),

  refresh: (refreshToken: string) =>
    request<AuthResponse>("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
      skipAuth: true,
    }),

  logout: (refreshToken: string) =>
    request<void>("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const users = {
  me: () => request<UserSummary>("/api/users/me"),

  uploadProfilePic: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<{ profilePicUrl: string }>("/api/users/me/profile-pic", { method: "POST", body: fd });
  },
};

// ── Courses ───────────────────────────────────────────────────────────────────
export const courses = {
  list: (params?: { dept?: string; search?: string; page?: number; size?: number }) => {
    const q = new URLSearchParams();
    if (params?.dept)   q.set("dept", params.dept);
    if (params?.search) q.set("search", params.search);
    if (params?.page)   q.set("page", String(params.page));
    if (params?.size)   q.set("size", String(params.size ?? 20));
    return request<Page<Course>>(`/api/courses?${q}`);
  },

  get: (id: string) => request<Course>(`/api/courses/${id}`),

  enrolled: () => request<Course[]>("/api/courses/enrolled"),

  enroll: (id: string) => request<void>(`/api/courses/${id}/enroll`, { method: "POST" }),

  unenroll: (id: string) => request<void>(`/api/courses/${id}/enroll`, { method: "DELETE" }),

  create: (body: { code: string; title: string; departmentCode: string; creditHours: number }) =>
    request<Course>("/api/courses", { method: "POST", body: JSON.stringify(body) }),

  delete: (id: string) => request<void>(`/api/courses/${id}`, { method: "DELETE" }),
};

// ── Materials ─────────────────────────────────────────────────────────────────
export const materials = {
  byCourse: (courseId: string, params?: { facultyId?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.facultyId) q.set("facultyId", params.facultyId);
    if (params?.page)      q.set("page", String(params.page));
    q.set("size", "20");
    return request<Page<Material>>(`/api/materials/course/${courseId}?${q}`);
  },

  pending: (page = 0) =>
    request<Page<Material>>(`/api/materials/pending?page=${page}&size=20`),

  upload: (file: File, courseId: string, facultyId?: string) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("courseId", courseId);
    if (facultyId) fd.append("facultyId", facultyId);
    return request<{ message: string; status: string }>("/api/materials/upload", { method: "POST", body: fd });
  },

  approve: (id: string) => request<void>(`/api/materials/${id}/approve`, { method: "PUT" }),
  reject:  (id: string) => request<void>(`/api/materials/${id}/reject`,  { method: "PUT" }),
  rename:  (id: string, fileName: string) =>
    request<void>(`/api/materials/${id}/rename`, { method: "PUT", body: JSON.stringify({ fileName }) }),
  delete:  (id: string) => request<void>(`/api/materials/${id}`, { method: "DELETE" }),
};

// ── Faculty ───────────────────────────────────────────────────────────────────
export const faculty = {
  list: (dept?: string) => {
    const q = dept ? `?dept=${dept}` : "";
    return request<FacultyMember[]>(`/api/faculty${q}`);
  },
  get: (id: string) => request<FacultyMember>(`/api/faculty/${id}`),
};

// ── Departments ───────────────────────────────────────────────────────────────
export const departments = {
  list: () => request<Department[]>("/api/departments"),
};


// ── Types ─────────────────────────────────────────────────────────────────────
export interface RegisterRequest {
  name: string;
  studentId?: string;
  email: string;
  password: string;
  departmentCode?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  semesterNumber: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface OtpSentResponse {
  email: string;
  message: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserSummary;
}

export interface UserSummary {
  id: string;
  studentId?: string;
  name: string;
  email: string;
  role: "STUDENT" | "FACULTY" | "ADMIN";
  department?: { code: string; name: string };
  gender?: string;
  semesterNumber?: number;
  profilePicUrl?: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  department: { id: string; code: string; name: string };
  creditHours: number;
  faculty: FacultyMember[];
}

export interface Department {
  id: string;
  code: string;
  name: string;
}

export interface FacultyMember {
  id: string;
  shortForm: string;
  name: string;
  department?: Department;
  email?: string;
}

export interface Material {
  id: string;
  course: Course;
  faculty?: FacultyMember;
  uploader: UserSummary;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  contentType: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}


export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
