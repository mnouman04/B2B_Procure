import { createSlice } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: false,
    rfqWizardOpen: false,
  },
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    setSidebar: (state, action) => { state.sidebarOpen = action.payload; },
    openRfqWizard: (state) => { state.rfqWizardOpen = true; },
    closeRfqWizard: (state) => { state.rfqWizardOpen = false; },
  },
});

export const { toggleSidebar, setSidebar, openRfqWizard, closeRfqWizard } = slice.actions;
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectRfqWizardOpen = (state) => state.ui.rfqWizardOpen;
export default slice.reducer;
