import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { format } from 'date-fns';
import { ProductionUnit } from '../types/Production';
import { ProjectStep } from '../types/ProjectSteps';

// Define the interface for a timeline task based on production steps
export interface TimelineTask {
  step_id: string;
  step_name: string;
  step_order: number;
  status: string;
  start_date: string | null; // When marked as "In Progress"
  end_date: string | null; // When marked as "Complete"
  duration_days: number | null; // Duration in days
  completed_by: string | null;
}

export interface UnitTimelineProps {
  unit: ProductionUnit;
  steps: ProjectStep[];
  onTimelineDataChange?: (data: { minDate: Date; maxDate: Date; totalDays: number } | null) => void;
}

const UnitTimeline: React.FC<UnitTimelineProps> = ({ unit, steps, onTimelineDataChange }) => {
  // Convert step statuses to timeline tasks
  const timelineTasks = useMemo(() => {
    const tasks: TimelineTask[] = [];

    steps.forEach((step) => {
      const stepStatus = unit.step_statuses?.find(
        (ss) => ss.stepId.toString() === step.step_id.toString(),
      );

      if (stepStatus) {
        let startDate: string | null = null;
        let endDate: string | null = null;
        let durationDays: number | null = null;

        // For timeline purposes, we need to infer start/end dates
        // This assumes you have timestamp data for when status changes occurred
        if (stepStatus.status === 'Complete') {
          // Use completion date as end date
          endDate = stepStatus.completion_timestamp || stepStatus.completedDate || null;

          // For now, we'll estimate start date as the same day if we don't have it
          // In a real implementation, you'd want to track when each status change occurred
          startDate = endDate; // Simplified - you might want to store actual start timestamps
        } else if (stepStatus.status === 'In Progress') {
          // If in progress, use current date as start, no end date yet
          startDate = new Date().toISOString();
        }

        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          if (durationDays === 0) durationDays = 1; // Minimum 1 day for display
        }

        tasks.push({
          step_id: step.step_id.toString(),
          step_name: step.step_name,
          step_order: step.step_order,
          status: stepStatus.status,
          start_date: startDate,
          end_date: endDate,
          duration_days: durationDays,
          completed_by: stepStatus.completed_by_user_name || stepStatus.completedBy || null,
        });
      } else {
        // Step not started yet
        tasks.push({
          step_id: step.step_id.toString(),
          step_name: step.step_name,
          step_order: step.step_order,
          status: 'Not Started',
          start_date: null,
          end_date: null,
          duration_days: null,
          completed_by: null,
        });
      }
    });

    return tasks.sort((a, b) => a.step_order - b.step_order);
  }, [unit.step_statuses, steps]);

  // Filter tasks that have actual dates for timeline display
  const tasksWithDates = useMemo(() => {
    return timelineTasks.filter((task) => task.start_date || task.end_date);
  }, [timelineTasks]);

  // Calculate timeline boundaries
  const { minDate, maxDate, totalDays } = useMemo(() => {
    if (tasksWithDates.length === 0) {
      const today = new Date();
      return {
        minDate: today,
        maxDate: today,
        totalDays: 1,
      };
    }

    const dates = tasksWithDates
      .flatMap((task) => [
        task.start_date ? new Date(task.start_date) : null,
        task.end_date ? new Date(task.end_date) : null,
      ])
      .filter(Boolean) as Date[];

    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));
    const totalDays = Math.max(
      1,
      Math.ceil((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    );

    return { minDate: min, maxDate: max, totalDays };
  }, [tasksWithDates]);

  // Notify parent component about timeline data changes
  React.useEffect(() => {
    if (tasksWithDates.length === 0) {
      onTimelineDataChange?.(null);
    } else {
      onTimelineDataChange?.({ minDate, maxDate, totalDays });
    }
  }, [minDate, maxDate, totalDays, tasksWithDates.length, onTimelineDataChange]);

  // Generate date headers for the timeline
  const generateDateHeaders = () => {
    const headers = [];
    let currentDate = new Date(minDate);
    const endDate = new Date(maxDate);

    // For shorter timelines, show daily headers; for longer ones, show weekly
    const useWeeklyHeaders = totalDays > 14;

    if (useWeeklyHeaders) {
      // Adjust to start of week (Sunday)
      currentDate.setDate(currentDate.getDate() - currentDate.getDay());

      while (currentDate <= endDate) {
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        headers.push({ start: weekStart, end: weekEnd, label: format(weekStart, 'MM/dd') });
        currentDate = new Date(currentDate.setDate(currentDate.getDate() + 7));
      }
    } else {
      // Daily headers
      while (currentDate <= endDate) {
        headers.push({
          start: new Date(currentDate),
          end: new Date(currentDate),
          label: format(currentDate, 'MM/dd'),
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return headers;
  };

  // Calculate bar style for each task
  const getBarStyle = (task: TimelineTask) => {
    if (!task.start_date) return { display: 'none' };

    const taskStart = new Date(task.start_date);

    const daysFromStart = Math.max(
      0,
      (taskStart.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const leftOffset = (daysFromStart / totalDays) * 100;

    let computedWidth = 0;
    if (task.duration_days !== null && task.duration_days > 0) {
      computedWidth = (task.duration_days / totalDays) * 100;
    } else {
      computedWidth = 2; // Minimum width for instant tasks
    }

    // Enforce minimum width and clamp to timeline bounds
    let width = Math.max(2, computedWidth);
    if (leftOffset + width > 100) {
      width = 100 - leftOffset;
    }

    // Color based on status
    let backgroundColor = '#e0e0e0'; // Not Started
    let color = '#000';

    switch (task.status) {
      case 'In Progress':
        backgroundColor = '#ff9800'; // Orange
        color = '#000';
        break;
      case 'Complete':
        backgroundColor = '#4caf50'; // Green
        color = '#fff';
        break;
      case 'N/A':
        backgroundColor = '#9e9e9e'; // Grey
        color = '#fff';
        break;
    }

    return {
      position: 'absolute' as const,
      left: `${leftOffset.toFixed(2)}%`,
      width: `${width.toFixed(2)}%`,
      height: '28px',
      backgroundColor,
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color,
      fontSize: '0.75rem',
      fontWeight: 500,
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      border: '1px solid rgba(0,0,0,0.1)',
    };
  };

  const dateHeaders = generateDateHeaders();

  if (tasksWithDates.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No timeline data available. Steps need to be started to generate timeline information.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Production Timeline
      </Typography>

      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '200px', fontWeight: 600 }}>Step Name</TableCell>
              <TableCell sx={{ p: 0, position: 'relative' }}>
                <Box
                  sx={{
                    display: 'flex',
                    position: 'relative',
                    height: '32px',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  {dateHeaders.map((date, index) => {
                    const leftOffset = (index / dateHeaders.length) * 100;
                    const width = (1 / dateHeaders.length) * 100;

                    return (
                      <Box
                        key={index}
                        sx={{
                          position: 'absolute',
                          left: `${leftOffset}%`,
                          width: `${width}%`,
                          textAlign: 'center',
                          fontSize: '0.75rem',
                          p: '4px 0',
                          borderLeft: index > 0 ? '1px solid' : 'none',
                          borderColor: 'divider',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {date.label}
                      </Box>
                    );
                  })}
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {timelineTasks.map((task) => (
              <TableRow key={task.step_id}>
                <TableCell sx={{ verticalAlign: 'middle', fontWeight: 500 }}>
                  {task.step_order}. {task.step_name}
                </TableCell>
                <TableCell
                  sx={{
                    position: 'relative',
                    height: '40px',
                    p: '4px',
                    overflow: 'hidden',
                  }}
                >
                  {task.start_date && (
                    <Box sx={getBarStyle(task)}>
                      {task.duration_days ? `${task.duration_days}d` : task.status}
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default UnitTimeline;
