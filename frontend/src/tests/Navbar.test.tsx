import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';

// Mock useAuth
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      email: 'sarah@scopegen.ai',
      full_name: 'Sarah Khan',
      role: 'consultant',
      is_active: true
    },
    logout: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    isLoading: false
  })
}));

describe('ScopeGen Navbar Component', () => {
  it('renders search input with shortcut badge', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/Search proposals, clients, templates\.\.\./i)).toBeDefined();
    expect(screen.getByText('⌘ K')).toBeDefined();
  });

  it('renders user name and role when authenticated', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('Sarah Khan')).toBeDefined();
    expect(screen.getByText('Project Manager')).toBeDefined();
  });
});
