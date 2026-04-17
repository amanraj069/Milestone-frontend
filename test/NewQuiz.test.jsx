import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import NewQuiz from '../src/pages/Moderator/Quizzes/NewQuiz';

vi.mock('../src/components/DashboardLayout', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

test('renders Add New Skill Quiz header', () => {
  render(<NewQuiz />);
  expect(screen.getByText(/Add New Skill Quiz/i)).toBeInTheDocument();
});

test('blocks submit with invalid fields and does not call API', async () => {
  const fetchMock = vi.spyOn(global, 'fetch');
  const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

  render(<NewQuiz />);

  await userEvent.click(screen.getByRole('button', { name: /Create Skill Quiz/i }));

  expect(alertMock).toHaveBeenCalledWith('Please fix all validation errors before submitting');
  expect(fetchMock).not.toHaveBeenCalled();
  expect(screen.getByText(/Title is required/i)).toBeInTheDocument();
  expect(screen.getByText(/Skill name is required/i)).toBeInTheDocument();

  fetchMock.mockRestore();
  alertMock.mockRestore();
});