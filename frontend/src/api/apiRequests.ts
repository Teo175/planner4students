import { IUser } from "../common";
import axiosInstance from "./axiosInstance";
import { GET_USER_BY_EMAIL_ENDPOINT } from "./endpoints";

export const getUserByEmail = async (email: string): Promise<IUser> => {
    const { data } = await axiosInstance.get<{ data: IUser }>(
      GET_USER_BY_EMAIL_ENDPOINT(email)
    );
    return data.data;
  };