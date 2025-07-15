export interface AttributeDefinition {
  attribute_definition_id: string;
  project_id: string;
  attribute_name: string;
  attribute_type: string; // e.g., 'text', 'number', 'date', 'boolean'
  display_order: number;
  is_required: boolean;
  default_value?: string;
}
