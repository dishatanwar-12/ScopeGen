import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { DashboardPage } from '../pages/DashboardPage';

// Mock the API service
vi.mock('../services/api', () => ({
  api: {
    getDashboardStats: vi.fn().mockResolvedValue({
      total_proposals: 32,
      approved_proposals: 4,
      draft_proposals: 18,
      in_review_proposals: 10,
      total_clients: 9,
      total_projects: 8,
      open_questions: 1,
      recent_proposals: [
        {
          id: 'p-1',
          title: 'Website Redesign Proposal',
          project_title: 'Acme Technologies',
          status: 'in_progress',
          version: 1,
          updated_at: new Date().toISOString()
        }
      ]
    }),
    getTemplates: vi.fn().mockResolvedValue([{ id: 'tpl-1', name: 'Standard SOW' }]),
    getAiStatus: vi.fn().mockResolvedValue({
      status: 'connected',
      model: 'meta/llama-3.3-70b-instruct'
    })
  }
}));

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

describe('ScopeGen Clean Dynamic DashboardPage', () => {
  it('renders clean hero title without static watch button or dummy stats', () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Turn Conversations into/i)).toBeDefined();
    expect(screen.getByText(/Compelling Proposals/i)).toBeDefined();
    expect(screen.getAllByText('Create New Proposal').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Watch how it works')).toBeNull();
  });

  it('renders dynamic metrics cards', () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Total Proposals')).toBeDefined();
    expect(screen.getByText('In Progress')).toBeDefined();
    expect(screen.getByText('Clients')).toBeDefined();
    expect(screen.getByText('Templates')).toBeDefined();
  });

  it('renders Recent Proposals section with dynamic proposals', () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Recent Proposals')).toBeDefined();
  });

  it('renders AI Engine status card with live model info', () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    expect(screen.getByText('NVIDIA NIM Hosted Model')).toBeDefined();
    expect(screen.getByText(/zero price fabrication guarantee/i)).toBeDefined();
  });

  it('renders functional Quick Actions', () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Quick Actions')).toBeDefined();
    expect(screen.getByText('Upload Discovery Notes')).toBeDefined();
    expect(screen.getByText('Browse Templates')).toBeDefined();
    expect(screen.getByText('Manage Clients')).toBeDefined();
  });
});
