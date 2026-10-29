import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';

describe('ScopeGen Sidebar Component', () => {
  it('renders ScopeGen branding and tagline', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );

    expect(screen.getByText('ScopeGen')).toBeDefined();
    expect(screen.getByText(/AI-POWERED PROPOSALS/i)).toBeDefined();
  });

  it('renders all main navigation links', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );

    expect(screen.getByText('Dashboard')).toBeDefined();
    expect(screen.getByText('New Proposal')).toBeDefined();
    expect(screen.getByText('Templates')).toBeDefined();
    expect(screen.getByText('Clients')).toBeDefined();
    expect(screen.getByText('Service Packages')).toBeDefined();
    expect(screen.getByText('Proposals')).toBeDefined();
    expect(screen.getByText('Settings')).toBeDefined();
  });

  it('renders the bottom NVIDIA LLM badge', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );

    expect(screen.getByText(/NVIDIA LLM/i)).toBeDefined();
    expect(screen.getByText(/Transform ideas into professional proposals with AI\./i)).toBeDefined();
  });
});
