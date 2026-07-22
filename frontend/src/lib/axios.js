import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "http://localhost:3000/api",
  //import.meta.env.MODE === "development" ? "http://localhost:5173/api" : "/api",
  withCredentials: true,
});