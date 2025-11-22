import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import * as api from './services/api';
import { AuthProvider } from './contexts/AuthContext';

// Suppress console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('Not implemented: HTMLFormElement.prototype.submit') ||
       args[0].includes('ReactDOMTestUtils.act is deprecated'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Mock API calls
jest.mock('./services/api');

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Shopping List App - User Perspective Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.resetAllMocks();
    
    // Mock successful login
    api.loginUser.mockResolvedValue({
      token: 'mock-token',
      user: { id: 1, username: 'testuser', email: 'test@example.com' }
    });
    
    // Mock verifyToken - this is critical for authentication
    api.verifyToken.mockResolvedValue({
      valid: true,
      user: { id: 1, username: 'testuser', email: 'test@example.com' }
    });
    
    // Mock empty items list initially
    api.getItems.mockResolvedValue([]);
    api.getAISuggestions.mockResolvedValue({ suggestions: [] });
  });

  test('Użytkownik może zalogować się i zobaczyć ekran logowania', async () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    );

    // Sprawdź czy ekran logowania jest widoczny
    expect(screen.getByRole('heading', { name: 'Zaloguj się' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nazwa użytkownika lub email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Hasło/i)).toBeInTheDocument();
  });

  test('Użytkownik może dodać produkt do listy i zobaczyć go na liście', async () => {
    // Ensure verifyToken mock is set up first
    api.verifyToken.mockResolvedValue({
      valid: true,
      user: { id: 1, username: 'testuser', email: 'test@example.com' }
    });
    
    // Mock successful login - set token before rendering
    localStorage.setItem('token', 'mock-token');
    
    // Mock items after adding
    const mockItems = [
      {
        id: 1,
        name: 'Mleko',
        category: 'Nabiał',
        quantity: 1,
        price: null,
        bought: 0,
        created_at: new Date().toISOString()
      }
    ];

    api.getItems
      .mockResolvedValueOnce([]) // Initial load
      .mockResolvedValueOnce(mockItems); // After adding item

    api.createItem.mockResolvedValue(mockItems[0]);

    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    );

    // Wait for authentication to complete - look for authenticated content
    await waitFor(() => {
      expect(screen.getByText(/Lista Zakupów/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Find and fill the form
    const nameInput = screen.getByLabelText(/Nazwa produktu/i);
    const categorySelect = screen.getByLabelText(/Kategoria/i);
    const submitButton = screen.getByRole('button', { name: /Dodaj produkt/i });

    // Add a product
    fireEvent.change(nameInput, { target: { value: 'Mleko' } });
    fireEvent.change(categorySelect, { target: { value: 'Nabiał' } });
    fireEvent.click(submitButton);

    // Wait for the item to appear on the list
    await waitFor(() => {
      expect(screen.getByText('Mleko')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Verify the item is displayed
    expect(screen.getByText('Mleko')).toBeInTheDocument();
    expect(api.createItem).toHaveBeenCalledWith({
      name: 'Mleko',
      category: 'Nabiał',
      quantity: 1,
      price: null
    });
  });

  test('Użytkownik może oznaczyć produkt jako kupiony', async () => {
    // Ensure verifyToken mock is set up first
    api.verifyToken.mockResolvedValue({
      valid: true,
      user: { id: 1, username: 'testuser', email: 'test@example.com' }
    });
    
    localStorage.setItem('token', 'mock-token');
    
    const mockItems = [
      {
        id: 1,
        name: 'Chleb',
        category: 'Pieczywo',
        quantity: 1,
        price: null,
        bought: 0,
        created_at: new Date().toISOString()
      }
    ];

    api.getItems.mockResolvedValue(mockItems);
    api.updateItem.mockResolvedValue({ ...mockItems[0], bought: 1 });

    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    );

    // Wait for authentication to complete - look for authenticated content
    await waitFor(() => {
      expect(screen.getByText(/Lista Zakupów/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Wait for item to load
    await waitFor(() => {
      expect(screen.getByText('Chleb')).toBeInTheDocument();
    });

    // Find and click the checkbox button to mark as bought
    const checkboxButton = screen.getByLabelText(/Oznacz jako kupione/i);
    fireEvent.click(checkboxButton);

    // Wait for update
    await waitFor(() => {
      expect(api.updateItem).toHaveBeenCalledWith(1, expect.objectContaining({
        bought: 1
      }));
    });
  });

  test('Użytkownik może usunąć produkt z listy', async () => {
    // Ensure verifyToken mock is set up first
    api.verifyToken.mockResolvedValue({
      valid: true,
      user: { id: 1, username: 'testuser', email: 'test@example.com' }
    });
    
    localStorage.setItem('token', 'mock-token');
    
    const mockItems = [
      {
        id: 1,
        name: 'Jabłka',
        category: 'Owoce',
        quantity: 1,
        price: null,
        bought: 0,
        created_at: new Date().toISOString()
      }
    ];

    api.getItems
      .mockResolvedValueOnce(mockItems)
      .mockResolvedValueOnce([]); // After deletion

    api.deleteItem.mockResolvedValue({ message: 'Item deleted successfully' });

    // Mock window.confirm to return true
    window.confirm = jest.fn(() => true);

    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    );

    // Wait for authentication to complete - look for authenticated content
    await waitFor(() => {
      expect(screen.getByText(/Lista Zakupów/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Wait for item to load
    await waitFor(() => {
      expect(screen.getByText('Jabłka')).toBeInTheDocument();
    });

    // Find and click delete button using aria-label
    const deleteButton = screen.getByLabelText(/Usuń produkt/i);
    fireEvent.click(deleteButton);

    // Wait for deletion
    await waitFor(() => {
      expect(api.deleteItem).toHaveBeenCalledWith(1);
    });
  });
});

