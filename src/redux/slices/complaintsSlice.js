import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

// Async thunk to fetch complaints
export const fetchComplaints = createAsyncThunk(
  'complaints/fetchComplaints',
  async ({
    page = 1,
    limit = 25,
    search = '',
    sortBy = 'date',
    sortOrder = 'desc',
    complainantTypeIn = [],
    againstIn = [],
    jobIn = [],
    statusIn = [],
    priorityIn = [],
    typeIn = [],
  } = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/moderator/complaints`,
        {
          withCredentials: true,
          params: {
            page,
            limit,
            search: search || undefined,
            sortBy,
            sortOrder,
            complainantTypeIn: complainantTypeIn.length ? complainantTypeIn : undefined,
            againstIn: againstIn.length ? againstIn : undefined,
            jobIn: jobIn.length ? jobIn : undefined,
            statusIn: statusIn.length ? statusIn : undefined,
            priorityIn: priorityIn.length ? priorityIn : undefined,
            typeIn: typeIn.length ? typeIn : undefined,
          },
        }
      );
      
      if (response.data.success) {
        return {
          complaints: response.data.complaints || [],
          total: response.data.total || 0,
          pagination: response.data.pagination || null,
          stats: response.data.stats || null,
        };
      }
      return rejectWithValue('Failed to fetch complaints');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch complaints');
    }
  }
);

// Async thunk to update complaint status
export const updateComplaintStatus = createAsyncThunk(
  'complaints/updateStatus',
  async ({ complaintId, status, moderatorNotes }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/moderator/complaints/${complaintId}`,
        { status, moderatorNotes },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        return { complaintId, status, moderatorNotes };
      }
      return rejectWithValue('Failed to update complaint');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update complaint');
    }
  }
);

// Calculate statistics from complaints
const calculateStats = (complaints) => {
  const stats = {
    total: complaints.length,
    pending: 0,
    underReview: 0,
    resolved: 0,
    rejected: 0,
    byPriority: { low: 0, medium: 0, high: 0 },
    byComplainantType: { freelancer: 0, employer: 0 },
    byType: {}
  };

  complaints.forEach(complaint => {
    // Count by status
    switch (complaint.status) {
      case 'Pending':
        stats.pending++;
        break;
      case 'Under Review':
        stats.underReview++;
        break;
      case 'Resolved':
        stats.resolved++;
        break;
      case 'Rejected':
        stats.rejected++;
        break;
    }

    // Count by priority
    if (complaint.priority === 'Low') stats.byPriority.low++;
    else if (complaint.priority === 'Medium') stats.byPriority.medium++;
    else if (complaint.priority === 'High') stats.byPriority.high++;

    // Count by complainant type
    if (complaint.complainantType === 'Freelancer') {
      stats.byComplainantType.freelancer++;
    } else if (complaint.complainantType === 'Employer') {
      stats.byComplainantType.employer++;
    }

    // Count by complaint type
    const type = complaint.complaintType;
    stats.byType[type] = (stats.byType[type] || 0) + 1;
  });

  return stats;
};

// Sort complaints based on criteria
const sortComplaints = (complaints, sortBy, sortOrder) => {
  const sorted = [...complaints].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'date':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'priority':
        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        aValue = priorityOrder[a.priority] || 0;
        bValue = priorityOrder[b.priority] || 0;
        break;
      case 'status':
        const statusOrder = { 'Pending': 1, 'Under Review': 2, 'Resolved': 3, 'Rejected': 4 };
        aValue = statusOrder[a.status] || 0;
        bValue = statusOrder[b.status] || 0;
        break;
      case 'complainant':
        aValue = a.complainantName?.toLowerCase() || '';
        bValue = b.complainantName?.toLowerCase() || '';
        break;
      default:
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
};

const complaintsSlice = createSlice({
  name: 'complaints',
  initialState: {
    complaints: [],
    filteredComplaints: [],
    selectedComplaint: null,
    filters: {
      status: 'All',
      priority: 'All',
      complainantType: 'All'
    },
    searchTerm: '',
    sortBy: 'date',
    sortOrder: 'desc',
    stats: {
      total: 0,
      pending: 0,
      underReview: 0,
      resolved: 0,
      rejected: 0,
      byPriority: { low: 0, medium: 0, high: 0 },
      byComplainantType: { freelancer: 0, employer: 0 },
      byType: {}
    },
    total: 0,
    pagination: null,
    loading: false,
    error: null
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    toggleSortOrder: (state) => {
      state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
    },
    setSortOrder: (state, action) => {
      state.sortOrder = action.payload;
    },
    selectComplaint: (state, action) => {
      state.selectedComplaint = state.complaints.find(
        c => c.complaintId === action.payload
      ) || null;
    },
    clearSelectedComplaint: (state) => {
      state.selectedComplaint = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch complaints
      .addCase(fetchComplaints.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComplaints.fulfilled, (state, action) => {
        state.loading = false;
        state.complaints = action.payload.complaints;
        state.total = action.payload.total;
        state.pagination = action.payload.pagination;
        state.stats = action.payload.stats || calculateStats(action.payload.complaints);
        state.filteredComplaints = action.payload.complaints;
      })
      .addCase(fetchComplaints.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update complaint status
      .addCase(updateComplaintStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateComplaintStatus.fulfilled, (state, action) => {
        state.loading = false;
        const { complaintId, status, moderatorNotes } = action.payload;
        
        // Update in complaints array
        const complaintIndex = state.complaints.findIndex(
          c => c.complaintId === complaintId
        );
        if (complaintIndex !== -1) {
          state.complaints[complaintIndex].status = status;
          state.complaints[complaintIndex].moderatorNotes = moderatorNotes;
          state.complaints[complaintIndex].updatedAt = new Date().toISOString();
        }

        // Update selected complaint if it's the one being updated
        if (state.selectedComplaint?.complaintId === complaintId) {
          state.selectedComplaint.status = status;
          state.selectedComplaint.moderatorNotes = moderatorNotes;
          state.selectedComplaint.updatedAt = new Date().toISOString();
        }

        // Recalculate stats and keep the current page rows in sync
        state.stats = calculateStats(state.complaints);
        state.filteredComplaints = state.complaints;
      })
      .addCase(updateComplaintStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// Helper function to apply filters and search
const applyFiltersAndSearch = (complaints, filters, searchTerm, sortBy, sortOrder) => {
  let filtered = complaints.filter(complaint => {
    const statusMatch = filters.status === 'All' || complaint.status === filters.status;
    const priorityMatch = filters.priority === 'All' || complaint.priority === filters.priority;
    const complainantMatch = filters.complainantType === 'All' || 
                            complaint.complainantType === filters.complainantType;
    const searchMatch = searchTerm === '' || 
      complaint.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.complainantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.complaintType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusMatch && priorityMatch && complainantMatch && searchMatch;
  });

  // Apply sorting
  filtered = sortComplaints(filtered, sortBy, sortOrder);

  return filtered;
};

export const {
  setFilters,
  setSearchTerm,
  setSortBy,
  toggleSortOrder,
  setSortOrder,
  selectComplaint,
  clearSelectedComplaint
} = complaintsSlice.actions;

export default complaintsSlice.reducer;
