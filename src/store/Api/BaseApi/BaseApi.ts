import { logOut, setUser } from "@/store/features/AuthSlice/authSlice";
import {
  BaseQueryFn,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as any;
    const token = state.auth.user?.accessToken;
    if (token) {
      headers.set("Authorization", `${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  if (result.error && result.error.status === 400) {
    const state = api.getState() as any;
    const refreshToken = state.auth.user?.refreshToken;
    console.log(refreshToken);
    if (!refreshToken) {
      api.dispatch(logOut());
      return result;
    }
    const refreshResult = await baseQuery(
      {
        url: "user/refreshToken",
        method: "POST",
        body: {
          authorization: refreshToken,
        },
      },
      api,
      extraOptions
    );
    if (refreshResult.data) {
      api.dispatch(setUser(refreshResult.data as any));
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logOut());
    }
  }
  return result;
};

const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
  tagTypes: ["Courses", "User", "Support", "Badges"],
});
export default baseApi;
