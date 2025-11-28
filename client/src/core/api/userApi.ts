import axiosInstance from "../../utils/axiosConfig";

export const userApi = {
  getProfile: async () => {
    return axiosInstance.get("/users/me");
  },

  updateProfile: async (data: { full_name?: string; username?: string; email?: string; password?: string }) => {
    return axiosInstance.put("/users/me", data);
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosInstance.post("/users/me/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  deleteAvatar: async () => {
    return axiosInstance.delete("/users/me/avatar");
  },

  deleteAccount: async () => {
    return axiosInstance.delete("/users/me");
  },
};
