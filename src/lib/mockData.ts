/**
 * Mock initial data for the json-render dashboard demo
 * Matches the data paths used in MOCK_PATCHES_DASHBOARD
 */

export interface AnalyticsData {
  revenue: number;
  users: number;
  orders: number;
  growth: number;
  percentage: Array<number>;
  salesByMonth: Array<{ month: string; sales: number }>;
  trafficBySource: Array<{ source: string; visitors: number }>;
  recentTransactions: Array<{
    id: string;
    customer: string;
    amount: number;
    status: string;
    date: string;
  }>;
  topItems: Array<{ name: string; value: number }>;
}

export interface FormData {
  name: string;
  email: string;
  phone: string;
  role: string;
  startDate: string | null;
}

export interface AppData {
  [key: string]: unknown;
  analytics: AnalyticsData;
  form: FormData;
  ui: {
    successMessage?: string;
    errorMessage?: string;
    infoMessage?: string;
  };
}

/**
 * Initial data for the application
 */
export const INITIAL_DATA: AppData = {
  analytics: {
    revenue: 125000,
    users: 3420,
    orders: 892,
    growth: 0.157,
    percentage: [15.7, 16.2, 14.8, 17.5],
    salesByMonth: [
      { month: "Jan", sales: 95000 },
      { month: "Feb", sales: 105000 },
      { month: "Mar", sales: 118000 },
      { month: "Apr", sales: 125000 },
      { month: "May", sales: 132000 },
      { month: "Jun", sales: 145000 },
    ],
    trafficBySource: [
      { source: "Direct", visitors: 12450 },
      { source: "Organic Search", visitors: 8720 },
      { source: "Social Media", visitors: 5430 },
      { source: "Referral", visitors: 3210 },
      { source: "Email", visitors: 1890 },
    ],
    recentTransactions: [
      {
        id: "TXN-001",
        customer: "Alice Johnson",
        amount: 250.0,
        status: "completed",
        date: "2024-01-15",
      },
      {
        id: "TXN-002",
        customer: "Bob Smith",
        amount: 125.5,
        status: "pending",
        date: "2024-01-15",
      },
      {
        id: "TXN-003",
        customer: "Carol White",
        amount: 340.0,
        status: "completed",
        date: "2024-01-14",
      },
      {
        id: "TXN-004",
        customer: "David Brown",
        amount: 89.99,
        status: "failed",
        date: "2024-01-14",
      },
      {
        id: "TXN-005",
        customer: "Eve Davis",
        amount: 175.0,
        status: "completed",
        date: "2024-01-13",
      },
    ],
    topItems: [
      { name: "Premium Plan", value: 45000 },
      { name: "Basic Plan", value: 32000 },
      { name: "Enterprise Plan", value: 28000 },
      { name: "Add-on Pack", value: 15000 },
    ],
  },
  form: {
    name: "",
    email: "",
    phone: "",
    role: "",
    startDate: null,
  },
  ui: {
    successMessage: undefined,
    errorMessage: undefined,
    infoMessage: undefined,
  },
};

/**
 * Action handler type
 */
export type ActionHandler = (
  params?: Record<string, unknown>,
) => void | Promise<void>;

/**
 * Action handlers for the dashboard
 * These handle the actions triggered by UI components
 */
export const ACTION_HANDLERS: Record<string, ActionHandler> = {
  /**
   * Handle form submission
   */
  submitForm: async (params) => {
    console.log("[Action] submitForm called with params:", params);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    alert("Form submitted successfully!");
  },

  /**
   * Handle form cancellation
   */
  cancelForm: (params) => {
    console.log("[Action] cancelForm called with params:", params);
    if (
      confirm(
        "Are you sure you want to cancel? All unsaved changes will be lost.",
      )
    ) {
      // Reset form data would happen here
      alert("Form cancelled.");
    }
  },

  /**
   * Handle item deletion
   */
  deleteItem: async (params) => {
    console.log("[Action] deleteItem called with params:", params);
    const confirmed = confirm(
      "Are you sure you want to delete this item? This action cannot be undone.",
    );
    if (confirmed) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      alert("Item deleted successfully!");
    }
  },

  /**
   * Primary action handler
   */
  primaryAction: (params) => {
    console.log("[Action] primaryAction called with params:", params);
    alert("Primary action executed!");
  },

  /**
   * Secondary action handler
   */
  secondaryAction: (params) => {
    console.log("[Action] secondaryAction called with params:", params);
    alert("Secondary action executed!");
  },

  /**
   * Danger action handler
   */
  dangerAction: async (params) => {
    console.log("[Action] dangerAction called with params:", params);
    const confirmed = confirm(
      "This is a dangerous action. Are you absolutely sure?",
    );
    if (confirmed) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      alert("Dangerous action completed!");
    }
  },

  /**
   * Ghost action handler
   */
  ghostAction: (params) => {
    console.log("[Action] ghostAction called with params:", params);
    alert("Ghost action executed!");
  },

  /**
   * Export data action
   */
  exportData: async (params) => {
    console.log("[Action] exportData called with params:", params);
    const format = (params?.format as string) || "json";
    await new Promise((resolve) => setTimeout(resolve, 800));
    alert(`Data exported as ${format.toUpperCase()}!`);
  },

  /**
   * Navigate action
   */
  navigate: (params) => {
    console.log("[Action] navigate called with params:", params);
    const url = params?.url as string;
    if (url) {
      alert(`Would navigate to: ${url}`);
    }
  },

  /**
   * Refresh data action
   */
  refreshData: async (params) => {
    console.log("[Action] refreshData called with params:", params);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert("Data refreshed!");
  },
};
