import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import PublicJobListing from "../src/pages/Public_JobListing/PublicJobListing";

vi.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    getDashboardRoute: () => "/",
  }),
}));

describe("PublicJobListing", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("loads jobs with page and limit query parameters", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        jobs: [
          {
            jobId: "job-1",
            title: "Frontend Developer",
            imageUrl: "https://example.com/logo.png",
            budget: { amount: 50000, period: "monthly" },
            location: "Remote",
            jobType: "full-time",
            experienceLevel: "Mid",
            remote: true,
            postedDate: new Date().toISOString(),
            description: { skills: ["React"] },
            applicationCount: 5,
            isSponsored: false,
            isBoosted: false,
            tier: 1,
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasPrevPage: false,
          hasNextPage: false,
        },
      }),
    });

    render(
      <MemoryRouter>
        <PublicJobListing />
      </MemoryRouter>,
    );

    await screen.findByText(/Frontend Developer/i);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const firstCallUrl = String(fetchMock.mock.calls[0][0]);
    expect(firstCallUrl).toContain("/api/jobs/api?page=1&limit=10");
  });

  test("navigates to next page when next button is clicked", async () => {
    const pageOne = {
      success: true,
      jobs: [
        {
          jobId: "job-1",
          title: "Backend Developer",
          imageUrl: "https://example.com/logo1.png",
          budget: { amount: 70000, period: "monthly" },
          location: "Bengaluru",
          jobType: "full-time",
          experienceLevel: "Senior",
          remote: false,
          postedDate: new Date().toISOString(),
          description: { skills: ["Node.js"] },
          applicationCount: 2,
          isSponsored: false,
          isBoosted: false,
          tier: 1,
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 20,
        totalPages: 2,
        hasPrevPage: false,
        hasNextPage: true,
      },
    };

    const pageTwo = {
      success: true,
      jobs: [
        {
          jobId: "job-2",
          title: "DevOps Engineer",
          imageUrl: "https://example.com/logo2.png",
          budget: { amount: 90000, period: "monthly" },
          location: "Pune",
          jobType: "contract",
          experienceLevel: "Expert",
          remote: true,
          postedDate: new Date().toISOString(),
          description: { skills: ["AWS"] },
          applicationCount: 4,
          isSponsored: true,
          isBoosted: false,
          tier: 2,
        },
      ],
      pagination: {
        page: 2,
        limit: 10,
        total: 20,
        totalPages: 2,
        hasPrevPage: true,
        hasNextPage: false,
      },
    };

    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce({ ok: true, json: async () => pageOne })
      .mockResolvedValueOnce({ ok: true, json: async () => pageTwo });

    render(
      <MemoryRouter>
        <PublicJobListing />
      </MemoryRouter>,
    );

    await screen.findByText(/Backend Developer/i);

    const nextBtn = screen.getByRole("button", { name: /next page/i });
    await userEvent.click(nextBtn);

    await screen.findByText(/DevOps Engineer/i);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    const secondCallUrl = String(fetchMock.mock.calls[1][0]);
    expect(secondCallUrl).toContain("/api/jobs/api?page=2&limit=10");
  });
});