import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  MenuItem,
  Select,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Autocomplete,
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControlLabel,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useCreateProject } from '../../../hooks/api/useProjectHooks';
import { useCreateAttributeDefinition } from '../../../hooks/api/useAttributeDefinitionHooks';
import { useCreateProjectStep } from '../../../hooks/api/useProjectStepHooks';
import { useCreateStepInventoryRequirement } from '../../../hooks/api/useStepInventoryRequirementHooks';
import { useGetAllInventory } from '../../../hooks/api/useInventoryHooks';

// Types for the modal state
interface LocalAttributeDefinition {
  attribute_name: string;
  attribute_type: 'text' | 'number' | 'date' | 'select';
  is_required: boolean;
  is_auto_generated: boolean; // New field for auto-generation
  display_order: number;
  select_options?: string[];
}

interface LocalProjectStep {
  step_name: string;
  step_description: string;
  step_order: number;
  inventory_requirements: LocalInventoryRequirement[];
}

interface LocalInventoryRequirement {
  inventory_item_id: string;
  quantity_required: number;
  item_name?: string; // For display purposes
  unit_of_measure?: string;
}

interface AddProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const attributeTypes = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select' },
];

const steps = ['Project Details', 'Column Headers', 'Project Steps', 'Review'];

const AddProjectModal: React.FC<AddProjectModalProps> = ({ open, onClose, onSuccess }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Basic project information
  const [projectInfo, setProjectInfo] = useState({
    project_name: '',
    project_description: '',
    project_type: 'OTHER',
  });

  // Attribute definitions (column headers)
  const [attributes, setAttributes] = useState<LocalAttributeDefinition[]>([]);

  // Project steps
  const [projectSteps, setProjectSteps] = useState<LocalProjectStep[]>([]);

  // Hooks
  const createProjectMutation = useCreateProject();
  const createAttributeMutation = useCreateAttributeDefinition();
  const createStepMutation = useCreateProjectStep();
  const createInventoryRequirementMutation = useCreateStepInventoryRequirement();
  const { data } = useGetAllInventory();
  const inventoryItems = Array.isArray(data?.data) ? data.data : [];

  // Reset form when modal closes
  const handleClose = () => {
    setActiveStep(0);
    setProjectInfo({ project_name: '', project_description: '', project_type: 'OTHER' });
    setAttributes([]);
    setProjectSteps([]);
    setIsSubmitting(false);
    setSubmitError(null);
    onClose();
  };

  // Navigation
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Attribute management
  const addAttribute = () => {
    const newAttribute: LocalAttributeDefinition = {
      attribute_name: '',
      attribute_type: 'text',
      is_required: false,
      is_auto_generated: false,
      display_order: attributes.length + 1,
    };
    setAttributes([...attributes, newAttribute]);
  };

  const updateAttribute = (index: number, field: keyof LocalAttributeDefinition, value: any) => {
    const updated = [...attributes];
    updated[index] = { ...updated[index], [field]: value };
    setAttributes(updated);
  };

  const removeAttribute = (index: number) => {
    const updated = attributes.filter((_, i) => i !== index);
    // Reorder display_order
    updated.forEach((attr, i) => {
      attr.display_order = i + 1;
    });
    setAttributes(updated);
  };

  // Step management
  const addStep = () => {
    const newStep: LocalProjectStep = {
      step_name: '',
      step_description: '',
      step_order: projectSteps.length + 1,
      inventory_requirements: [],
    };
    setProjectSteps([...projectSteps, newStep]);
  };

  const updateStep = (index: number, field: keyof LocalProjectStep, value: any) => {
    const updated = [...projectSteps];
    updated[index] = { ...updated[index], [field]: value };
    setProjectSteps(updated);
  };

  const removeStep = (index: number) => {
    const updated = projectSteps.filter((_, i) => i !== index);
    // Reorder step_order
    updated.forEach((step, i) => {
      step.step_order = i + 1;
    });
    setProjectSteps(updated);
  };

  // Inventory requirement management
  const addInventoryRequirement = (stepIndex: number) => {
    const updated = [...projectSteps];
    updated[stepIndex].inventory_requirements.push({
      inventory_item_id: '',
      quantity_required: 1,
    });
    setProjectSteps(updated);
  };

  const updateInventoryRequirement = (
    stepIndex: number,
    reqIndex: number,
    field: keyof LocalInventoryRequirement,
    value: any,
  ) => {
    const updated = [...projectSteps];
    updated[stepIndex].inventory_requirements[reqIndex] = {
      ...updated[stepIndex].inventory_requirements[reqIndex],
      [field]: value,
    };
    setProjectSteps(updated);
  };

  const removeInventoryRequirement = (stepIndex: number, reqIndex: number) => {
    const updated = [...projectSteps];
    updated[stepIndex].inventory_requirements = updated[stepIndex].inventory_requirements.filter(
      (_, i) => i !== reqIndex,
    );
    setProjectSteps(updated);
  };

  // Form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      console.log('Starting project creation...');

      // 1. Create the project
      console.log('Creating project with data:', projectInfo);
      const createdProject = await createProjectMutation.mutateAsync({
        ...projectInfo,
        status: 'Planning', // Set default status to Planning (more realistic for new projects)
        last_modified: new Date().toISOString(),
      });

      console.log('Project created successfully:', createdProject);
      const projectId = createdProject.project_id.toString();

      // 2. Create attribute definitions
      console.log('Creating attributes:', attributes);
      for (let i = 0; i < attributes.length; i++) {
        const attribute = attributes[i];
        console.log(`Creating attribute ${i + 1}:`, attribute);
        try {
          await createAttributeMutation.mutateAsync({
            project_id: projectId,
            attribute_name: attribute.attribute_name,
            attribute_type: attribute.attribute_type,
            is_required: attribute.is_required,
            is_auto_generated: attribute.is_auto_generated,
            display_order: attribute.display_order,
          });
        } catch (attrError) {
          console.error(`Error creating attribute ${i + 1}:`, attrError);
          const errorMessage = attrError instanceof Error ? attrError.message : 'Unknown error';
          throw new Error(
            `Failed to create attribute "${attribute.attribute_name}": ${errorMessage}`,
          );
        }
      }

      // 3. Create project steps and their inventory requirements
      console.log('🔧 DEBUG: About to create project steps...');
      console.log('🔧 DEBUG: projectSteps array:', projectSteps);
      console.log('🔧 DEBUG: projectSteps length:', projectSteps.length);

      if (projectSteps.length === 0) {
        console.log('⚠️ WARNING: No project steps defined - skipping step creation');
      }

      for (let i = 0; i < projectSteps.length; i++) {
        const step = projectSteps[i];
        console.log(`Creating step ${i + 1}:`, step);

        let createdStep;
        try {
          createdStep = await createStepMutation.mutateAsync({
            project_id: parseInt(projectId),
            step_name: step.step_name,
            step_description: step.step_description,
            step_order: step.step_order,
            step_code: `STEP${step.step_order}`, // Generate unique step code
          });
        } catch (stepError) {
          console.error(`Error creating step ${i + 1}:`, stepError);
          const errorMessage = stepError instanceof Error ? stepError.message : 'Unknown error';
          throw new Error(`Failed to create step "${step.step_name}": ${errorMessage}`);
        }

        console.log(`Step ${i + 1} created successfully:`, createdStep);
        const stepId = createdStep.step_id.toString();

        // 4. Create inventory requirements for this step
        console.log(
          `Creating inventory requirements for step ${i + 1}:`,
          step.inventory_requirements,
        );
        for (let j = 0; j < step.inventory_requirements.length; j++) {
          const requirement = step.inventory_requirements[j];
          if (requirement.inventory_item_id) {
            console.log(`Creating inventory requirement ${j + 1}:`, requirement);
            try {
              const inventoryItem = inventoryItems.find(
                (item) => item.inventory_item_id.toString() === requirement.inventory_item_id,
              );
              await createInventoryRequirementMutation.mutateAsync({
                step_id: stepId,
                inventory_item_id: requirement.inventory_item_id,
                quantity_required: requirement.quantity_required,
                unit_of_measure: inventoryItem?.unit_of_measure || 'units',
              });
            } catch (reqError) {
              console.error(`Error creating inventory requirement ${j + 1}:`, reqError);
              const errorMessage = reqError instanceof Error ? reqError.message : 'Unknown error';
              throw new Error(
                `Failed to create inventory requirement for step "${step.step_name}": ${errorMessage}`,
              );
            }
          }
        }
      }

      console.log('Project creation completed successfully');
      // Success - close modal and call success callback
      handleClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating project:', error);
      console.error('Error details:', error);

      // More detailed error message
      let errorMessage = 'Failed to create project. ';
      if (error instanceof Error) {
        errorMessage += `Error: ${error.message}`;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage += `Details: ${JSON.stringify(error)}`;
      }

      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validation
  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return projectInfo.project_name.trim() !== '';
      case 1:
        return attributes.every((attr) => attr.attribute_name.trim() !== '');
      case 2:
        return projectSteps.every((step) => step.step_name.trim() !== '');
      case 3:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'grid', gap: '1rem', pt: 1 }}>
            <TextField
              fullWidth
              label="Project Name"
              value={projectInfo.project_name}
              onChange={(e) => setProjectInfo({ ...projectInfo, project_name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Project Description"
              multiline
              rows={4}
              value={projectInfo.project_description}
              onChange={(e) =>
                setProjectInfo({ ...projectInfo, project_description: e.target.value })
              }
              placeholder="Enter a brief description of the project..."
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ pt: 1 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Typography variant="h6">Column Headers (Attributes)</Typography>
              <Button startIcon={<AddIcon />} onClick={addAttribute}>
                Add Attribute
              </Button>
            </Box>
            {attributes.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No attributes defined. Click "Add Attribute" to define column headers for your
                project.
              </Typography>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Required</TableCell>
                      <TableCell>Auto-Generated</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>{' '}
                  <TableBody>
                    {attributes.map((attr, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField
                            size="small"
                            value={attr.attribute_name}
                            onChange={(e) =>
                              updateAttribute(index, 'attribute_name', e.target.value)
                            }
                            placeholder="Attribute name"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            size="small"
                            value={attr.attribute_type}
                            onChange={(e) =>
                              updateAttribute(index, 'attribute_type', e.target.value)
                            }
                          >
                            {attributeTypes.map((type) => (
                              <MenuItem key={type.value} value={type.value}>
                                {type.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </TableCell>
                        <TableCell>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={attr.is_required}
                                onChange={(e) =>
                                  updateAttribute(index, 'is_required', e.target.checked)
                                }
                              />
                            }
                            label=""
                          />
                        </TableCell>
                        <TableCell>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={attr.is_auto_generated}
                                onChange={(e) =>
                                  updateAttribute(index, 'is_auto_generated', e.target.checked)
                                }
                                disabled={attr.attribute_type === 'date'} // Disable for date types
                              />
                            }
                            label=""
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => removeAttribute(index)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        );

      case 2:
        return (
          <Box sx={{ pt: 1 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Typography variant="h6">Project Steps</Typography>
              <Button startIcon={<AddIcon />} onClick={addStep}>
                Add Step
              </Button>
            </Box>
            {projectSteps.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No steps defined. Click "Add Step" to define the workflow steps for your project.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {projectSteps.map((step, stepIndex) => (
                  <Card key={stepIndex} variant="outlined">
                    <CardHeader
                      title={`Step ${step.step_order}`}
                      action={
                        <IconButton onClick={() => removeStep(stepIndex)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      }
                    />
                    <CardContent>
                      <Box sx={{ display: 'grid', gap: 2 }}>
                        <TextField
                          fullWidth
                          label="Step Name"
                          value={step.step_name}
                          onChange={(e) => updateStep(stepIndex, 'step_name', e.target.value)}
                          required
                        />
                        <TextField
                          fullWidth
                          label="Step Description"
                          multiline
                          rows={2}
                          value={step.step_description}
                          onChange={(e) =>
                            updateStep(stepIndex, 'step_description', e.target.value)
                          }
                        />

                        <Divider />

                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Typography variant="subtitle2">Inventory Requirements</Typography>
                          <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => addInventoryRequirement(stepIndex)}
                          >
                            Add Item
                          </Button>
                        </Box>

                        {step.inventory_requirements.map((req, reqIndex) => (
                          <Box
                            key={reqIndex}
                            sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
                          >
                            <Autocomplete
                              sx={{ flex: 1 }}
                              options={inventoryItems}
                              getOptionLabel={(option) => option.item_name || ''}
                              value={
                                inventoryItems.find(
                                  (item) =>
                                    item.inventory_item_id.toString() === req.inventory_item_id,
                                ) || null
                              }
                              onChange={(_, value) => {
                                updateInventoryRequirement(
                                  stepIndex,
                                  reqIndex,
                                  'inventory_item_id',
                                  value?.inventory_item_id?.toString() || '',
                                );
                                updateInventoryRequirement(
                                  stepIndex,
                                  reqIndex,
                                  'item_name',
                                  value?.item_name || '',
                                );
                                updateInventoryRequirement(
                                  stepIndex,
                                  reqIndex,
                                  'unit_of_measure',
                                  value?.unit_of_measure || '',
                                );
                              }}
                              renderInput={(params) => (
                                <TextField {...params} label="Inventory Item" size="small" />
                              )}
                            />
                            <TextField
                              type="number"
                              label="Quantity"
                              size="small"
                              value={req.quantity_required}
                              onChange={(e) =>
                                updateInventoryRequirement(
                                  stepIndex,
                                  reqIndex,
                                  'quantity_required',
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              sx={{ width: 100 }}
                            />
                            <IconButton
                              onClick={() => removeInventoryRequirement(stepIndex, reqIndex)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        );

      case 3:
        return (
          <Box sx={{ pt: 1 }}>
            <Typography variant="h6" gutterBottom>
              Review Project Setup
            </Typography>

            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Project Information
                </Typography>
                <Typography>
                  <strong>Name:</strong> {projectInfo.project_name}
                </Typography>
                <Typography>
                  <strong>Description:</strong> {projectInfo.project_description}
                </Typography>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Column Headers ({attributes.length})
                </Typography>
                {attributes.map((attr, index) => (
                  <Chip
                    key={index}
                    label={`${attr.attribute_name} (${attr.attribute_type})`}
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Project Steps ({projectSteps.length})
                </Typography>
                {projectSteps.map((step, index) => (
                  <Box key={index} sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>
                        {step.step_order}. {step.step_name}
                      </strong>
                      {step.inventory_requirements.length > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          {' '}
                          ({step.inventory_requirements.length} inventory items)
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>

            {submitError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {submitError}
              </Alert>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Project</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Box sx={{ flex: '1 1 auto' }} />
        <Button
          disabled={activeStep === 0 || isSubmitting}
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
        >
          Back
        </Button>
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!canProceed() || isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isSubmitting ? 'Creating...' : 'Create Project'}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!canProceed()}
            endIcon={<ArrowForwardIcon />}
          >
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AddProjectModal;
