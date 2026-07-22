import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";

export const usePublicationsStore = create((set) => ({
  publications: [],
  pagination: null,
  isLoading: false,
  error: null,

  fetchPublications: async (params = {}) => {
    set({ isLoading: true, error: null });

    try {
      const response = await axiosInstance.get("/publications", { params });
      set({
        publications: response.data.publications,
        pagination: response.data.pagination,
      });
      return response.data;
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to load publications.";
      set({ error: message });
      toast.error(message);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  createPublication: async (payload) => {
    try {
      const response = await axiosInstance.post("/publications", payload);
      toast.success("Publication created successfully");
      return response.data.publication;
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to create publication.";
      toast.error(message);
      throw error;
    }
  },

  updatePublication: async (id, payload) => {
    try {
      const response = await axiosInstance.put(`/publications/${id}`, payload);
      if (response.data?.message) {
        toast.success(response.data.message);
      } else {
        toast.success("Publication updated successfully");
      }
      return response.data;
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to update publication.";
      toast.error(message);
      throw error;
    }
  },

  deletePublication: async (id) => {
    try {
      const response = await axiosInstance.delete(`/publications/${id}`);
      if (response.data?.warning) {
        toast.success("Publication deleted successfully");
        toast.error(response.data.warning);
      } else {
        toast.success("Publication deleted successfully");
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to delete publication.";
      toast.error(message);
      throw error;
    }
  },
}));