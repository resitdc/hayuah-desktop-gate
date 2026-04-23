import axios from "axios";
import errorResponseHandler from "../../plugins/axios/errorResponseHandler";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  errorResponseHandler,
);

export default axiosInstance;
