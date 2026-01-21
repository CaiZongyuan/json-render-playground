import { createCatalog } from "@json-render/core";
import { z } from "zod";

export const dashboardCatalog = createCatalog({
  name: "dashboard",
  components: {
    // Layout Components
    Card: {
      props: z.object({
        title: z.string().nullable(),
        description: z.string().nullable(),
        padding: z.enum(["none", "sm", "md", "lg"]).nullable(),
      }),
      hasChildren: true,
      description: "A card container with optional title",
    },

    Grid: {
      props: z.object({
        columns: z.number().min(1).max(4).nullable(),
        gap: z.enum(["none", "sm", "md", "lg"]).nullable(),
      }),
      hasChildren: true,
      description: "Grid layout with configurable columns",
    },

    Stack: {
      props: z.object({
        direction: z.enum(["horizontal", "vertical"]).nullable(),
        gap: z.enum(["none", "sm", "md", "lg"]).nullable(),
        align: z.enum(["start", "center", "end", "stretch"]).nullable(),
        wrap: z.boolean().nullable(),
      }),
      hasChildren: true,
      description: "Flex stack for horizontal or vertical layouts",
    },

    // Data Display Components
    Metric: {
      props: z.object({
        label: z.string(),
        valuePath: z.string(),
        format: z.enum(["number", "currency", "percent"]).nullable(),
        trend: z.enum(["up", "down", "neutral"]).nullable(),
        trendValue: z.string().nullable(),
      }),
      description: "Display a single metric with optional trend indicator",
    },

    Chart: {
      props: z.object({
        dataPath: z.string(),
        title: z.string().nullable(),
        labelKey: z.string().nullable(),
        valueKey: z.string().nullable(),
      }),
      description: "Display a chart from array data",
    },

    Table: {
      props: z.object({
        dataPath: z.string(),
        columns: z.array(
          z.object({
            key: z.string(),
            label: z.string(),
            format: z.enum(["text", "currency", "date", "badge"]).nullable(),
          }),
        ),
      }),
      description: "Display tabular data",
    },

    List: {
      props: z.object({
        dataPath: z.string(),
        emptyMessage: z.string().nullable(),
      }),
      hasChildren: true,
      description: "Render a list from array data",
    },

    // Interactive Components
    Button: {
      props: z.object({
        label: z.string(),
        variant: z.enum(["primary", "secondary", "danger", "ghost"]).nullable(),
        action: z
          .object({
            name: z.string(),
            params: z.record(z.unknown()).optional(),
          })
          .nullable(),
        disabled: z.boolean().nullable(),
      }),
      description: "Clickable button with action",
    },

    Select: {
      props: z.object({
        label: z.string(),
        valuePath: z.string(),
        options: z.array(
          z.object({
            value: z.string(),
            label: z.string(),
          }),
        ),
        placeholder: z.string().nullable(),
      }),
      description: "Dropdown select input",
    },

    DatePicker: {
      props: z.object({
        label: z.string(),
        valuePath: z.string(),
      }),
      description: "Date picker input",
    },

    // Typography
    Heading: {
      props: z.object({
        text: z.string(),
        level: z.enum(["h1", "h2", "h3", "h4"]).nullable(),
      }),
      description: "Section heading",
    },

    Text: {
      props: z.object({
        content: z.string(),
        variant: z
          .enum(["default", "muted", "success", "warning", "error"])
          .nullable(),
      }),
      description: "Text paragraph",
    },

    // Status Components
    Badge: {
      props: z.object({
        text: z.union([z.string(), z.object({ path: z.string() })]),
        variant: z
          .enum(["default", "success", "warning", "error", "info"])
          .nullable(),
      }),
      description: "Small status badge",
    },

    Alert: {
      props: z.object({
        message: z.union([z.string(), z.object({ path: z.string() })]),
        variant: z.enum(["info", "success", "warning", "error"]).nullable(),
      }),
      description: "Alert/notification banner",
    },

    // Special Components
    Divider: {
      props: z.object({
        orientation: z.enum(["horizontal", "vertical"]).nullable(),
      }),
      description: "Visual divider",
    },

    Empty: {
      props: z.object({
        title: z.string(),
        description: z.string().nullable(),
      }),
      description: "Empty state placeholder",
    },

    TextField: {
      props: z.object({
        label: z.string(),
        valuePath: z.string(),
        placeholder: z.string().nullable(),
        type: z.string().nullable(),
        checks: z
          .array(
            z.object({
              fn: z.string(),
              message: z.string(),
              args: z.record(z.unknown()).optional(),
            }),
          )
          .nullable(),
        validateOn: z.enum(["change", "blur", "submit"]).nullable(),
      }),
      description: "Text input with optional validation checks",
    },
  },
  actions: {
    export_report: { description: "Export the current dashboard to PDF" },
    refresh_data: { description: "Refresh all metrics and charts" },
    view_details: { description: "View detailed information" },
    apply_filter: { description: "Apply the current filter settings" },
  },
  validation: "strict",
});

// Export the component list for the AI prompt
export const componentList = dashboardCatalog.componentNames as string[];
