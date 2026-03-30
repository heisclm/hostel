import api, {
  setTokenForRole,
  removeTokenForRole,
  removeAllTokens,
  getTokenForRole,
  type TokenRole,
} from "@/lib/api";

export interface RegisterStudentPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  studentId: string;
  level: string;
  programme: string;
  academicYear: string;
}

export interface RegisterManagerPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  businessName: string;
  businessAddress: string;
  businessDescription: string;
  idType: string;
  idNumber: string;
}

export type GuestType =
  | "PARENT_GUARDIAN"
  | "UNIVERSITY_STAFF"
  | "PROSPECTIVE_STUDENT"
  | "VISITOR";

export interface RegisterGuestBasePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  guestType: GuestType;
}

export interface RegisterParentGuardianPayload extends RegisterGuestBasePayload {
  guestType: "PARENT_GUARDIAN";
  beneficiaryName: string;
  beneficiaryPhone: string;
  beneficiaryEmail?: string;
  relationshipType: string;
}

export interface RegisterUniversityStaffPayload extends RegisterGuestBasePayload {
  guestType: "UNIVERSITY_STAFF";
  staffId: string;
  department: string;
}

export interface RegisterProspectiveStudentPayload extends RegisterGuestBasePayload {
  guestType: "PROSPECTIVE_STUDENT";
  admissionNumber: string;
  programmeAdmitted: string;
  expectedMatricDate?: string;
}

export interface RegisterVisitorPayload extends RegisterGuestBasePayload {
  guestType: "VISITOR";
  purpose: string;
  organization?: string;
}

export type RegisterGuestPayload =
  | RegisterParentGuardianPayload
  | RegisterUniversityStaffPayload
  | RegisterProspectiveStudentPayload
  | RegisterVisitorPayload;

export interface ConvertToStudentPayload {
  studentId: string;
  programme?: string;
  level?: number;
  academicYear?: string;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  programme?: string;
  level?: number;
  academicYear?: string;
  emergencyContact?: string;
  businessName?: string;
  beneficiaryName?: string;
  beneficiaryPhone?: string;
  beneficiaryEmail?: string;
  relationshipType?: string;
  staffId?: string;
  department?: string;
  admissionNumber?: string;
  expectedMatricDate?: string;
  programmeAdmitted?: string;
  purpose?: string;
  organization?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: Record<string, unknown>;
    token?: string;
  };
}

function handleAuthResponse(
  response: AuthResponse,
  expectedRole?: TokenRole,
): AuthResponse {
  if (response.success && response.data) {
    const token = response.data.token as string | undefined;
    const user = response.data.user;
    const role = (user?.role as TokenRole) || expectedRole;

    if (token && role) {
      setTokenForRole(role, token);
    }
  }
  return response;
}

export const authService = {
  registerStudent: async (
    payload: RegisterStudentPayload,
  ): Promise<AuthResponse> => {
    const response = await api.post("/auth/register/student", payload);
    return handleAuthResponse(response.data, "STUDENT");
  },

  registerManager: async (
    payload: RegisterManagerPayload,
    idDocument: File,
  ): Promise<AuthResponse> => {
    const formData = new FormData();
    formData.append("firstName", payload.firstName);
    formData.append("lastName", payload.lastName);
    formData.append("email", payload.email);
    formData.append("phone", payload.phone);
    formData.append("password", payload.password);
    formData.append("businessName", payload.businessName);
    formData.append("businessAddress", payload.businessAddress);
    formData.append("businessDescription", payload.businessDescription);
    formData.append("idType", payload.idType);
    formData.append("idNumber", payload.idNumber);
    formData.append("idImage", idDocument);

    const response = await api.post("/auth/register/manager", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return handleAuthResponse(response.data, "MANAGER");
  },

  registerGuest: async (
    payload: RegisterGuestPayload,
  ): Promise<AuthResponse> => {
    const response = await api.post("/auth/register/guest", payload);
    return handleAuthResponse(response.data, "GUEST");
  },

  registerParentGuardian: async (
    payload: Omit<RegisterParentGuardianPayload, "guestType">,
  ): Promise<AuthResponse> => {
    return authService.registerGuest({
      ...payload,
      guestType: "PARENT_GUARDIAN",
    });
  },

  registerUniversityStaff: async (
    payload: Omit<RegisterUniversityStaffPayload, "guestType">,
  ): Promise<AuthResponse> => {
    return authService.registerGuest({
      ...payload,
      guestType: "UNIVERSITY_STAFF",
    });
  },

  registerProspectiveStudent: async (
    payload: Omit<RegisterProspectiveStudentPayload, "guestType">,
  ): Promise<AuthResponse> => {
    return authService.registerGuest({
      ...payload,
      guestType: "PROSPECTIVE_STUDENT",
    });
  },

  registerVisitor: async (
    payload: Omit<RegisterVisitorPayload, "guestType">,
  ): Promise<AuthResponse> => {
    return authService.registerGuest({
      ...payload,
      guestType: "VISITOR",
    });
  },

  convertToStudent: async (
    payload: ConvertToStudentPayload,
  ): Promise<AuthResponse> => {
    const response = await api.post("/auth/convert-to-student", payload);

    if (response.data.success && response.data.data?.token) {
      removeTokenForRole("GUEST");
      setTokenForRole("STUDENT", response.data.data.token);
    }

    return response.data;
  },

  login: async (
    email: string,
    password: string,
    loginAs?: "STUDENT" | "MANAGER" | "GUEST",
  ): Promise<AuthResponse> => {
    const response = await api.post("/auth/login", {
      email,
      password,
      loginAs,
    });
    return handleAuthResponse(response.data);
  },

  logout: async (role?: TokenRole): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } catch {}

    if (role) {
      removeTokenForRole(role);
    } else {
      removeAllTokens();
    }
  },

  logoutRole: async (role: TokenRole): Promise<void> => {
    const token = getTokenForRole(role);
    if (token) {
      try {
        await api.post("/auth/logout", null, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {}
    }
    removeTokenForRole(role);
  },

  getMe: async (): Promise<AuthResponse> => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  getMeForRole: async (role: TokenRole): Promise<AuthResponse> => {
    const token = getTokenForRole(role);
    if (!token) {
      return { success: false, message: "No session found for this role" };
    }

    const response = await api.get("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  updateProfile: async (
    payload: UpdateProfilePayload,
  ): Promise<AuthResponse> => {
    const response = await api.put("/auth/profile", payload);
    return response.data;
  },

  changePassword: async (
    payload: ChangePasswordPayload,
  ): Promise<AuthResponse> => {
    const response = await api.put("/auth/change-password", payload);
    return response.data;
  },

  forgotPassword: async (email: string): Promise<AuthResponse> => {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  },

  resetPassword: async (
    token: string,
    password: string,
    confirmPassword?: string,
  ): Promise<AuthResponse> => {
    const response = await api.put(`/auth/reset-password/${token}`, {
      password,
      confirmPassword: confirmPassword || password,
    });
    return response.data;
  },
};

export const guestTypeLabels: Record<GuestType, string> = {
  PARENT_GUARDIAN: "Parent/Guardian",
  UNIVERSITY_STAFF: "University Staff",
  PROSPECTIVE_STUDENT: "Prospective Student",
  VISITOR: "Visitor",
};

export const guestTypeDescriptions: Record<GuestType, string> = {
  PARENT_GUARDIAN: "I want to book accommodation for my child/ward",
  UNIVERSITY_STAFF: "I am a staff member looking for accommodation",
  PROSPECTIVE_STUDENT: "I have been admitted but don't have a student ID yet",
  VISITOR: "I am a visitor looking for temporary accommodation",
};

export const relationshipTypes = [
  { value: "parent", label: "Parent" },
  { value: "guardian", label: "Guardian" },
  { value: "sponsor", label: "Sponsor" },
  { value: "sibling", label: "Sibling" },
  { value: "other", label: "Other" },
];
