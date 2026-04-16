import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import axios from "axios";
import JobDetailsModal from "../src/components/freelancer/JobDetailsModal";

vi.mock("axios", () => ({
  default: {
    delete: vi.fn(),
  },
}));

const baseJob = {
  id: "job-1",
  title: "Freelance React Build",
  company: "Acme Inc",
  startDate: "2026-04-01",
  daysSinceStart: 10,
  price: "Rs. 50,000",
  progress: 40,
  description: "Build frontend and milestone reporting.",
  tech: ["React", "Node.js"],
  milestones: [
    {
      milestoneId: "m1",
      status: "paid",
      description: "Design handoff",
      deadline: "2026-04-05",
      payment: 10000,
      completionPercentage: 100,
    },
    {
      milestoneId: "m2",
      status: "in-progress",
      description: "Implementation",
      deadline: "2026-04-20",
      payment: 20000,
      completionPercentage: 60,
    },
    {
      milestoneId: "m3",
      status: "not-paid",
      description: "QA and release",
      deadline: "2026-04-30",
      payment: 20000,
      completionPercentage: 0,
    },
  ],
};

describe("JobDetailsModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllTimers();
  });

  test("renders milestone statuses and payment details", async () => {
    render(
      <JobDetailsModal
        isOpen
        onClose={vi.fn()}
        job={baseJob}
        showLeaveButton={false}
      />,
    );

    expect(screen.getByText(/Milestones \(3\)/i)).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("₹10000")).toBeInTheDocument();
    expect(screen.getAllByText("₹20000").length).toBeGreaterThan(0);
  });

  test("calls leave-job API and invokes callbacks after success", async () => {
    const onClose = vi.fn();
    const onJobLeft = vi.fn();

    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(window, "alert").mockImplementation(() => {});
    axios.delete.mockResolvedValue({
      data: {
        message: "Left job successfully",
      },
    });

    render(
      <JobDetailsModal
        isOpen
        onClose={onClose}
        onJobLeft={onJobLeft}
        job={baseJob}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /Leave Job/i }));

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledTimes(1);
    });

    expect(String(axios.delete.mock.calls[0][0])).toContain(
      "/api/freelancer/active_job/leave/job-1",
    );

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onJobLeft).toHaveBeenCalledTimes(1);
    });
  });
});
