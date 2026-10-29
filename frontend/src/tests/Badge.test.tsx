import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Badge } from '../components/ui/Badge';

describe('ScopeGen Badge Component', () => {
  it('renders approved status correctly', () => {
    render(<Badge status="approved" />);
    expect(screen.getByText('Approved')).toBeDefined();
  });

  it('renders in_progress status formatted', () => {
    render(<Badge status="in_progress" />);
    expect(screen.getByText('In Progress')).toBeDefined();
  });

  it('renders draft status formatted', () => {
    render(<Badge status="draft" />);
    expect(screen.getByText('Draft')).toBeDefined();
  });

  it('renders client_review status formatted', () => {
    render(<Badge status="client_review" />);
    expect(screen.getByText('Client Review')).toBeDefined();
  });
});
