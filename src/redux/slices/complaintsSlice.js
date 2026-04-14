import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { graphqlQuery } from '../../utils/graphqlClient';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const MODERATOR_COMPLAINTS_QUERY = `
  query ModeratorComplaints(
    $first: Int!
    $after: String
    $page: Int
    $search: String
    $sortBy: String
    $sortOrder: String
    $complainantTypeIn: [String]
    $againstIn: [String]
    $jobIn: [String]
    $statusIn: [String]
    $priorityIn: [String]
    $typeIn: [String]
  ) {
    moderatorComplaints(
      first: $first
      after: $after
      page: $page
      search: $search
      sortBy: $sortBy
      sortOrder: $sortOrder
      complainantTypeIn: $complainantTypeIn
      againstIn: $againstIn
      jobIn: $jobIn
      statusIn: $statusIn
      priorityIn: $priorityIn
      typeIn: $typeIn
    ) {
      edges {
        cursor
        node {
          complaintId complainantType complainantId complainantName complainantUserId
          freelancerId freelancerName freelancerUserId freelancerRating freelancerEmail
          employerId employerName employerUserId employerRating employerEmail
          jobId jobTitle complaintType priority subject status createdAt updatedAt resolvedAt
        }
      }
      pageInfo { hasNextPage endCursor }
      total
    }
    moderatorComplaintsMeta {
      summary { total pending underReview resolved rejected }
      filterOptions { complainantTypes against jobs statuses priorities types }
    }
  }
`;

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
      const result = await graphqlQuery(MODERATOR_COMPLAINTS_QUERY, {
        first: limit,
        page,
        search: search || undefined,
        sortBy,
        sortOrder,
        complainantTypeIn: complainantTypeIn.length ? complainantTypeIn : null,
        againstIn: againstIn.length ? againstIn : null,
        jobIn: jobIn.length ? jobIn : null,
        statusIn: statusIn.length ? statusIn : null,
        priorityIn: priorityIn.length ? priorityIn : null,
        typeIn: typeIn.length ? typeIn : null,
      });

      const connection = result?.moderatorComplaints;
      const complaints = (connection?.edges || []).map((edge) => edge.node);

      return {
        complaints,
        total: connection?.total || 0,
        pagination: connection?.pageInfo || null,
        stats: result?.moderatorComplaintsMeta?.summary || null,
        filterOptions: result?.moderatorComplaintsMeta?.filterOptions || null,
      };
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
    filterOptions: {
      complainantTypes: [],
      against: [],
      jobs: [],
      statuses: [],
      priorities: [],
      types: [],
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
        state.filterOptions = action.payload.filterOptions || state.filterOptions;
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
