import { UIElement, UITree } from "@json-render/core";

export interface PatchOperation {
  op: "set" | "add";
  path: string;
  value: string | UIElement;
}

/**
 * Parse JSON Patch format string and convert to UITree
 * @param patches - JSON Patch format string (each line is a JSON object)
 * @returns UITree structure
 */
export function parsePatchesToTree(patches: string): UITree {
  const lines = patches.trim().split("\n");
  const tree: UITree = { root: "", elements: {} };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const patch: PatchOperation = JSON.parse(trimmed);

      if (patch.op === "set" && patch.path === "/root") {
        tree.root = patch.value as string;
      } else if (patch.op === "add" && patch.path.startsWith("/elements/")) {
        const key = patch.path.replace("/elements/", "");
        tree.elements[key] = patch.value as UIElement;
      }
    } catch {
      // Skip invalid JSON lines
      continue;
    }
  }

  return tree;
}

export const MOCK_PATCHES_DASHBOARD = `{"op":"set","path":"/root","value":"root"}

{"op":"add","path":"/elements/root","value":{"key":"root","type":"Stack","props":{"direction":"vertical","gap":"lg","align":"stretch"},"children":["page-header","alert-section","metrics-grid","charts-grid","forms-section","data-table-section","actions-section","divider-demo","list-demo"]}}

{"op":"add","path":"/elements/page-header","value":{"key":"page-header","type":"Stack","props":{"direction":"vertical","gap":"sm","align":"stretch"},"children":["main-heading","sub-text"]}}
{"op":"add","path":"/elements/main-heading","value":{"key":"main-heading","type":"Heading","props":{"text":"JSON Render Component Showcase","level":"h1"}}}
{"op":"add","path":"/elements/sub-text","value":{"key":"sub-text","type":"Text","props":{"content":"A comprehensive demo of all available components and features","variant":"muted"}}}

{"op":"add","path":"/elements/alert-section","value":{"key":"alert-section","type":"Stack","props":{"direction":"vertical","gap":"sm","align":"stretch"},"children":["heading-alerts","alert-success","alert-warning","alert-error","alert-info"]}}
{"op":"add","path":"/elements/heading-alerts","value":{"key":"heading-alerts","type":"Heading","props":{"text":"Alerts","level":"h3"}}}
{"op":"add","path":"/elements/alert-success","value":{"key":"alert-success","type":"Alert","props":{"message":"Operation completed successfully!","variant":"success"}}}
{"op":"add","path":"/elements/alert-warning","value":{"key":"alert-warning","type":"Alert","props":{"message":"Please review your input before proceeding.","variant":"warning"}}}
{"op":"add","path":"/elements/alert-error","value":{"key":"alert-error","type":"Alert","props":{"message":"An error occurred while processing your request.","variant":"error"}}}
{"op":"add","path":"/elements/alert-info","value":{"key":"alert-info","type":"Alert","props":{"message":"New features are available in the latest update.","variant":"info"}}}

{"op":"add","path":"/elements/metrics-grid","value":{"key":"metrics-grid","type":"Grid","props":{"columns":4,"gap":"md"},"children":["metric-revenue","metric-users","metric-orders","metric-growth"]}}
{"op":"add","path":"/elements/metric-revenue","value":{"key":"metric-revenue","type":"Card","props":{"title":"Total Revenue","description":"Current month earnings","padding":"sm"},"children":["metric-revenue-value"]}}
{"op":"add","path":"/elements/metric-revenue-value","value":{"key":"metric-revenue-value","type":"Metric","props":{"label":"Revenue","valuePath":"/analytics/revenue","format":"currency","trend":"up","trendValue":"/analytics/percentage/0"}}}
{"op":"add","path":"/elements/metric-users","value":{"key":"metric-users","type":"Card","props":{"title":"Active Users","description":"Users online now","padding":"sm"},"children":["metric-users-value"]}}
{"op":"add","path":"/elements/metric-users-value","value":{"key":"metric-users-value","type":"Metric","props":{"label":"Active Users","valuePath":"/analytics/users","format":"number","trend":"up","trendValue":"/analytics/percentage/1"}}}
{"op":"add","path":"/elements/metric-orders","value":{"key":"metric-orders","type":"Card","props":{"title":"Total Orders","description":"Orders this month","padding":"sm"},"children":["metric-orders-value"]}}
{"op":"add","path":"/elements/metric-orders-value","value":{"key":"metric-orders-value","type":"Metric","props":{"label":"Orders","valuePath":"/analytics/orders","format":"number","trend":"down","trendValue":"/analytics/percentage/2"}}}
{"op":"add","path":"/elements/metric-growth","value":{"key":"metric-growth","type":"Card","props":{"title":"Growth Rate","description":"Month over month","padding":"sm"},"children":["metric-growth-value"]}}
{"op":"add","path":"/elements/metric-growth-value","value":{"key":"metric-growth-value","type":"Metric","props":{"label":"Growth","valuePath":"/analytics/growth","format":"percent","trend":"up","trendValue":"/analytics/percentage/3"}}}

{"op":"add","path":"/elements/charts-grid","value":{"key":"charts-grid","type":"Grid","props":{"columns":2,"gap":"md"},"children":["sales-chart-card","traffic-chart-card"]}}
{"op":"add","path":"/elements/sales-chart-card","value":{"key":"sales-chart-card","type":"Card","props":{"title":"Sales by Month","description":"Monthly sales performance","padding":"md"},"children":["sales-chart"]}}
{"op":"add","path":"/elements/sales-chart","value":{"key":"sales-chart","type":"Chart","props":{"title":"Monthly Sales","dataPath":"/analytics/salesByMonth"}}}
{"op":"add","path":"/elements/traffic-chart-card","value":{"key":"traffic-chart-card","type":"Card","props":{"title":"Traffic Sources","description":"Where visitors come from","padding":"md"},"children":["traffic-chart"]}}
{"op":"add","path":"/elements/traffic-chart","value":{"key":"traffic-chart","type":"Chart","props":{"title":"Traffic by Source","dataPath":"/analytics/trafficBySource"}}}

{"op":"add","path":"/elements/forms-section","value":{"key":"forms-section","type":"Card","props":{"title":"Form Components","description":"Input fields with validation and data binding","padding":"md"},"children":["forms-grid"]}}
{"op":"add","path":"/elements/forms-grid","value":{"key":"forms-grid","type":"Grid","props":{"columns":2,"gap":"md"},"children":["form-stack"]}}
{"op":"add","path":"/elements/form-stack","value":{"key":"form-stack","type":"Stack","props":{"direction":"vertical","gap":"sm","align":"stretch"},"children":["text-field-name","text-field-email","select-role","date-picker-start","form-buttons"]}}
{"op":"add","path":"/elements/text-field-name","value":{"key":"text-field-name","type":"TextField","props":{"label":"Full Name","valuePath":"/form/name","placeholder":"Enter your name","type":"text","checks":[{"fn":"required","message":"Name is required"}],"validateOn":"blur"}}}
{"op":"add","path":"/elements/text-field-email","value":{"key":"text-field-email","type":"TextField","props":{"label":"Email Address","valuePath":"/form/email","placeholder":"you@example.com","type":"email","checks":[{"fn":"required","message":"Email is required"},{"fn":"email","message":"Invalid email format"}],"validateOn":"blur"}}}
{"op":"add","path":"/elements/select-role","value":{"key":"select-role","type":"Select","props":{"label":"Role","valuePath":"/form/role","placeholder":"Select a role","options":[{"value":"admin","label":"Administrator"},{"value":"user","label":"User"},{"value":"guest","label":"Guest"},{"value":"moderator","label":"Moderator"}]}}}
{"op":"add","path":"/elements/date-picker-start","value":{"key":"date-picker-start","type":"DatePicker","props":{"label":"Start Date","valuePath":"/form/startDate"}}}
{"op":"add","path":"/elements/form-buttons","value":{"key":"form-buttons","type":"Stack","props":{"direction":"horizontal","gap":"sm","align":"center"},"children":["button-submit","button-cancel","button-delete"]}}
{"op":"add","path":"/elements/button-submit","value":{"key":"button-submit","type":"Button","props":{"label":"Submit","variant":"primary","action":{"name":"submitForm","params":{"form":{"path":"/form"}}}}}}
{"op":"add","path":"/elements/button-cancel","value":{"key":"button-cancel","type":"Button","props":{"label":"Cancel","variant":"secondary","action":{"name":"cancelForm"}}}}
{"op":"add","path":"/elements/button-delete","value":{"key":"button-delete","type":"Button","props":{"label":"Delete","variant":"danger","action":{"name":"deleteItem"}}}}

{"op":"add","path":"/elements/data-table-section","value":{"key":"data-table-section","type":"Card","props":{"title":"Data Table","description":"Table with data binding and formatting","padding":"md"},"children":["data-table"]}}
{"op":"add","path":"/elements/data-table","value":{"key":"data-table","type":"Table","props":{"title":"Recent Transactions","dataPath":"/analytics/recentTransactions","columns":[{"key":"id","label":"ID","format":"text"},{"key":"customer","label":"Customer","format":"text"},{"key":"amount","label":"Amount","format":"currency"},{"key":"status","label":"Status","format":"badge"},{"key":"date","label":"Date","format":"date"}]}}}

{"op":"add","path":"/elements/actions-section","value":{"key":"actions-section","type":"Card","props":{"title":"Button Actions","description":"Different button variants and states","padding":"md"},"children":["actions-stack"]}}
{"op":"add","path":"/elements/actions-stack","value":{"key":"actions-stack","type":"Stack","props":{"direction":"horizontal","gap":"sm","align":"center","wrap":true},"children":["btn-primary","btn-secondary","btn-danger","btn-ghost","btn-disabled"]}}
{"op":"add","path":"/elements/btn-primary","value":{"key":"btn-primary","type":"Button","props":{"label":"Primary","variant":"primary","action":{"name":"primaryAction"}}}}
{"op":"add","path":"/elements/btn-secondary","value":{"key":"btn-secondary","type":"Button","props":{"label":"Secondary","variant":"secondary","action":{"name":"secondaryAction"}}}}
{"op":"add","path":"/elements/btn-danger","value":{"key":"btn-danger","type":"Button","props":{"label":"Danger","variant":"danger","action":{"name":"dangerAction"}}}}
{"op":"add","path":"/elements/btn-ghost","value":{"key":"btn-ghost","type":"Button","props":{"label":"Ghost","variant":"ghost","action":{"name":"ghostAction"}}}}
{"op":"add","path":"/elements/btn-disabled","value":{"key":"btn-disabled","type":"Button","props":{"label":"Disabled","variant":"primary","disabled":true}}}

{"op":"add","path":"/elements/divider-demo","value":{"key":"divider-demo","type":"Stack","props":{"direction":"vertical","gap":"md","align":"stretch"},"children":["divider-heading","divider-content","divider-horizontal"]}}
{"op":"add","path":"/elements/divider-heading","value":{"key":"divider-heading","type":"Heading","props":{"text":"Dividers","level":"h3"}}}
{"op":"add","path":"/elements/divider-content","value":{"key":"divider-content","type":"Text","props":{"content":"Dividers help separate content sections.","variant":"muted"}}}
{"op":"add","path":"/elements/divider-horizontal","value":{"key":"divider-horizontal","type":"Divider","props":{"orientation":"horizontal"}}}

{"op":"add","path":"/elements/list-demo","value":{"key":"list-demo","type":"Card","props":{"title":"List Component","description":"Data-driven list rendering","padding":"md"},"children":["list-heading","list-items"]}}
{"op":"add","path":"/elements/list-heading","value":{"key":"list-heading","type":"Text","props":{"content":"Top performing items:","variant":"muted"}}}
{"op":"add","path":"/elements/list-items","value":{"key":"list-items","type":"List","props":{"dataPath":"/analytics/topItems"}}}
`;
