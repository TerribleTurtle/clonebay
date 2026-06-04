import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConsentBanner } from '../../src/components/ConsentBanner';
import { useSettingsStore } from '../../src/store/useSettingsStore';

vi.mock('../../src/store/useSettingsStore', () => ({
  useSettingsStore: vi.fn(),
}));

describe('ConsentBanner', () => {
  let mockSetConsentStatus: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
    mockSetConsentStatus = vi.fn();
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
      const state = {
        consentStatus: 'unknown',
        setConsentStatus: mockSetConsentStatus,
      };
      return selector(state);
    });
  });

  it('renders when consentStatus is unknown', () => {
    render(<ConsentBanner />);
    expect(screen.getByText(/Storage Protocol Authorization/i)).toBeInTheDocument();
  });

  it('does not render when consentStatus is granted', () => {
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
      return selector({ consentStatus: 'granted', setConsentStatus: mockSetConsentStatus });
    });
    const { container } = render(<ConsentBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('does not render when consentStatus is denied', () => {
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
      return selector({ consentStatus: 'denied', setConsentStatus: mockSetConsentStatus });
    });
    const { container } = render(<ConsentBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('calls setConsentStatus with granted when Authorize is clicked', () => {
    render(<ConsentBanner />);
    fireEvent.click(screen.getByRole('button', { name: /Authorize/i }));
    expect(mockSetConsentStatus).toHaveBeenCalledWith('granted');
  });

  it('calls setConsentStatus with denied when Decline is clicked', () => {
    render(<ConsentBanner />);
    fireEvent.click(screen.getByRole('button', { name: /Decline/i }));
    expect(mockSetConsentStatus).toHaveBeenCalledWith('denied');
  });
});


