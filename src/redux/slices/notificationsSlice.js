import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:9000";

// Fetch all notifications for current user
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return rejectWithValue(data.error || "Failed to fetch notifications");
      }

      return data.notifications;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Fetch unread notification count
export const fetchUnreadCount = createAsyncThunk(
  "notifications/fetchUnreadCount",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/unread-count`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        return rejectWithValue(data.error || "Failed to fetch unread count");
      }

      return data.count;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  {
    condition: (arg, { getState }) => {
      const notificationsState = getState()?.notifications;
      if (!notificationsState) return true;

      const force = !!arg?.force;
      if (force) return true;
      if (notificationsState.unreadCountLoading) return false;

      const lastFetchedAt = notificationsState.lastUnreadFetchAt || 0;
      const minIntervalMs = 15000;
      return Date.now() - lastFetchedAt >= minIntervalMs;
    },
  }
);

// Mark a notification as read
export const markNotificationAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        return rejectWithValue(
          data.error || "Failed to mark notification as read"
        );
      }

      return notificationId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Mark all notifications as read
export const markAllNotificationsAsRead = createAsyncThunk(
  "notifications/markAllAsRead",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/mark-all-read`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        return rejectWithValue(data.error || "Failed to mark all as read");
      }

      return true;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Delete a notification
export const deleteNotification = createAsyncThunk(
  "notifications/deleteNotification",
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/${notificationId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        return rejectWithValue(data.error || "Failed to delete notification");
      }

      return notificationId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    notifications: [],
    unreadCount: 0,
    unreadCountLoading: false,
    lastUnreadFetchAt: 0,
    loading: false,
    error: null,
  },
  reducers: {
    clearNotificationError: (state) => {
      state.error = null;
    },
    // For real-time updates via socket
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    resetNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.unreadCountLoading = false;
      state.lastUnreadFetchAt = 0;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchNotifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter((n) => !n.read).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // fetchUnreadCount
    builder
      .addCase(fetchUnreadCount.pending, (state) => {
        state.unreadCountLoading = true;
        state.error = null;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
        state.unreadCountLoading = false;
        state.lastUnreadFetchAt = Date.now();
      })
      .addCase(fetchUnreadCount.rejected, (state, action) => {
        state.unreadCountLoading = false;
        state.error = action.payload;
      });

    // markNotificationAsRead
    builder.addCase(markNotificationAsRead.fulfilled, (state, action) => {
      const notification = state.notifications.find(
        (n) => n.notificationId === action.payload
      );
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    });

    // markAllNotificationsAsRead
    builder.addCase(markAllNotificationsAsRead.fulfilled, (state) => {
      state.notifications.forEach((n) => (n.read = true));
      state.unreadCount = 0;
    });

    // deleteNotification
    builder.addCase(deleteNotification.fulfilled, (state, action) => {
      const index = state.notifications.findIndex(
        (n) => n.notificationId === action.payload
      );
      if (index !== -1) {
        if (!state.notifications[index].read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications.splice(index, 1);
      }
    });
  },
});

export const { clearNotificationError, addNotification, resetNotifications } =
  notificationsSlice.actions;

// Selectors
export const selectNotifications = (state) => state.notifications.notifications;
export const selectUnreadCount = (state) => state.notifications.unreadCount;
export const selectNotificationsLoading = (state) =>
  state.notifications.loading;
export const selectNotificationsError = (state) => state.notifications.error;

export default notificationsSlice.reducer;
