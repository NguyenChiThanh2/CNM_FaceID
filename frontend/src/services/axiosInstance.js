import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api", // đặt sẵn baseURL
  timeout: 10000, // optional: timeout 10s
  headers: {
    "Content-Type": "application/json",
  },
});