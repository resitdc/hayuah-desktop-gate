import { AxiosError } from "axios";

const errorResponseHandler = (error: AxiosError) => {
  if (error) {
    return Promise.reject(error);
  }
};

export default errorResponseHandler;
