import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import JobApplication from "../src/components/jobApplication/JobApplication";

const mockNavigate = vi.fn();
const mockUseAuth = vi.fn();

vi.mock("../src/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ jobId: "job-123" }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../src/components/jobApplication/PersonalInfoStep", () => ({
  default: ({ onNext }) => (
    <div>
      <p>Personal Info Mock</p>
      <button onClick={onNext}>Continue to Step 2</button>
    </div>
  ),
}));

vi.mock("../src/components/jobApplication/ApplicationDetailsStep", () => ({
  default: ({ onSubmit }) => (
    <div>
      <p>Application Details Mock</p>
      <button
        onClick={() =>
          onSubmit({
            coverMessage: "I am a strong fit for this role with deep React and API experience.",
            skillRating: "5",
            availability: "immediate",
            contactEmail: "candidate@example.com",
          })
        }
      >
        Submit Application Mock
      </button>
    </div>
  ),
}));

describe("JobApplication", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllTimers();
    mockNavigate.mockReset();
    mockUseAuth.mockReturnValue({
      user: { role: "Freelancer" },
    });
  });

  test("loads freelancer profile and job details on mount", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            name: "Test User",
            email: "freelancer@example.com",
            phone: "9999999999",
            resume: "/uploads/resume.pdf",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          job: {
            jobId: "job-123",
            title: "React Developer",
          },
        }),
      });

    render(
      <MemoryRouter>
        <JobApplication />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Personal Info Mock")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/api/freelancer/profile");
    expect(String(fetchMock.mock.calls[1][0])).toContain("/api/jobs/api/job-123");
  });

  test("submits application payload and shows success state", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            name: "Test User",
            email: "freelancer@example.com",
            phone: "9999999999",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          job: {
            jobId: "job-123",
            title: "React Developer",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(
      <MemoryRouter>
        <JobApplication />
      </MemoryRouter>,
    );

    await screen.findByText("Personal Info Mock");
    await userEvent.click(screen.getByRole("button", { name: /Continue to Step 2/i }));
    await userEvent.click(
      await screen.findByRole("button", { name: /Submit Application Mock/i }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    const submitUrl = String(fetchMock.mock.calls[2][0]);
    const submitOptions = fetchMock.mock.calls[2][1];

    expect(submitUrl).toContain("/api/freelancer/apply/job-123");
    expect(submitOptions.method).toBe("POST");

    const payload = JSON.parse(submitOptions.body);
    expect(payload).toEqual(
      expect.objectContaining({
        skillRating: "5",
        availability: "immediate",
        contactEmail: "candidate@example.com",
      }),
    );

    expect(await screen.findByText(/Application Submitted!/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Browse Jobs Now/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/jobs");
  });
});
