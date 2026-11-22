import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice.js";
import usersReducer from "./slices/usersSlice.js";
import marketplaceReducer from "./slices/marketplaceSlice.js";
import bookingsReducer from "./slices/bookingsSlice.js";
import financeReducer from "./slices/financeSlice.js";
import supportReducer from "./slices/supportSlice.js";
import platformReducer from "./slices/platformSlice.js";
import filesReducer from "./slices/filesSlice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    marketplace: marketplaceReducer,
    bookings: bookingsReducer,
    finance: financeReducer,
    support: supportReducer,
    platform: platformReducer,
    files: filesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
