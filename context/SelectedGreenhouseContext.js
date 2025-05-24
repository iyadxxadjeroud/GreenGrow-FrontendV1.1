// context/SelectedGreenhouseContext.js
import { createContext, useContext } from 'react';

// Create the context
const SelectedGreenhouseContext = createContext(null);

// Create a custom hook for easy consumption
export const useSelectedGreenhouse = () => {
  const context = useContext(SelectedGreenhouseContext);
  if (context === undefined) {
    throw new Error('useSelectedGreenhouse must be used within a SelectedGreenhouseProvider');
  }
  return context;
};

// This provider will be rendered inside DashboardLayout.js
export const SelectedGreenhouseProvider = ({ children, selectedGreenhouseId }) => {
  return (
    <SelectedGreenhouseContext.Provider value={selectedGreenhouseId}>
      {children}
    </SelectedGreenhouseContext.Provider>
  );
};