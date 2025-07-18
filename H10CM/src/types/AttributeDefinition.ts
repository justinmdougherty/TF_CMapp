export interface AttributeDefinition {
  attribute_definition_id: string;
  project_id: string;
  attribute_name: string;
  attribute_type: string; // e.g., 'text', 'number', 'date', 'boolean'
  display_order: number;
  is_required: boolean;
  is_auto_generated?: boolean; // New field for auto-generation
  default_value?: string;
}
