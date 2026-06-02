import { createSlice } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";

export interface User {
  email: string;
  phone: string;
  userId: string;
  role: string;
  accessToken?: string;
  refreshToken?: string;
}
interface AuthState {
  user: Partial<User> | null;
}

const initialState: AuthState = {
  user: {
    email: "",
    phone: "",
    userId: "",
    role: "",
    accessToken: "",
    refreshToken: "",
  },
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      const decode = jwtDecode(action.payload?.accessToken as string) as User;
      if (action.payload.refreshToken) {
        state.user = {
          ...state.user,
          email: decode.email,
          userId: decode.userId,
          role: decode.role,
          accessToken: action.payload.accessToken,
          refreshToken: action.payload.refreshToken,
        };
      } else {
        state.user = {
          ...state.user,
          email: decode.email,
          userId: decode.userId,
          role: decode.role,
          accessToken: action.payload.accessToken,
        };
      }
    },
    logOut: (state) => {
      state.user = null;
    },
  },
});

export const { logOut, setUser } = authSlice.actions;
export default authSlice.reducer;
