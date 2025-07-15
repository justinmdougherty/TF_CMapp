export interface StepInventoryRequirement {
  requirement_id: string;
  step_id: string;
  inventory_item_id: string;
  quantity_required: number;
  unit_of_measure: string;
}
