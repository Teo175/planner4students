import axios from "axios";

const appUrl = "http://127.0.0.1:5000";

const axiosInstance = axios.create({
  baseURL: appUrl,
  headers: { "Content-Type": "application/json" },
});

export default axiosInstance;
