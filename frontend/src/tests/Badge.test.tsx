import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Badge } from '../components/ui/Badge';

describe('Badge Component', () => {
  it('renders approved status correctly', () => {
    render(<Badge status="approved" />);
    expect(screen.getByText('Approved')).toBeDefined();
  });

  it('renders in_review status formatted', () => {
    render(<Badge status="in_review" />);
    expect(screen.getByText('In Review')).toBeDefined();
  });

  it('renders open status formatted', () => {
    render(<Badge status="open" />);
    expect(screen.getByText('Open')).toBeDefined();
  });
});

