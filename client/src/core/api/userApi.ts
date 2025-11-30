import axiosInstance from "../../utils/axiosConfig";

export const userApi = {
  getProfile: () => {
    return axiosInstance.get("/users/me");
  },

  updateProfile: (data: { full_name?: string; username?: string; email?: string; password?: string }) => {
    return axiosInstance.put("/users/me", data);
  },

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosInstance.post("/users/me/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  deleteAvatar: () => {
    return axiosInstance.delete("/users/me/avatar");
  },

  deleteAccount: () => {
    return axiosInstance.delete("/users/me");
  },
};
