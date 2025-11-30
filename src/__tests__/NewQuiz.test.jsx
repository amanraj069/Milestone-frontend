import React from 'react';
import { render, screen } from '@testing-library/react';
import NewQuiz from '../pages/Admin/Quizzes/NewQuiz';

test('renders Add New Skill Quiz header', () => {
  render(<NewQuiz />);
  expect(screen.getByText(/Add New Skill Quiz/i)).toBeInTheDocument();
});
