import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";

export const useCategoriesStore = create((set) => ({
  categories: [],
  pagination: null,
  isLoading: false,
  error: null,

  fetchCategories: async (params = {}) => {
    set({ isLoading: true, error: null });

    try {
      const response = await axiosInstance.get("/categories", { params });
      set({
        categories: response.data.categories,
        pagination: response.data.pagination,
      });
      return response.data;
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to load categories.";
      set({ error: message });
      toast.error(message);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  createCategory: async (payload) => {
    try {
      const response = await axiosInstance.post("/categories", payload);
      toast.success("Category created successfully");
      return response.data.category;
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to create category.";
      toast.error(message);
      throw error;
    }
  },

  updateCategory: async (id, payload) => {
    try {
      const response = await axiosInstance.put(`/categories/${id}`, payload);
      toast.success("Category updated successfully");
      return response.data.category;
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to update category.";
      toast.error(message);
      throw error;
    }
  },

  deleteCategory: async (id) => {
    try {
      await axiosInstance.delete(`/categories/${id}`);
      toast.success("Category deleted successfully");
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to delete category.";
      toast.error(message);
      throw error;
    }
  },
}));