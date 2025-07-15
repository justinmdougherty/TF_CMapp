// Enhanced Calendar with Project Integration
import { useMemo, useState, useCallback } from 'react';
import { CardContent, CircularProgress, Alert } from '@mui/material';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendar.css';
import PageContainer from 'src/components/container/PageContainer';
import BlankCard from 'src/components/shared/BlankCard';
import Breadcrumb from 'src/layouts/full/shared/breadcrumb/Breadcrumb';
import { useGetProjects } from 'src/hooks/api/useProjectHooks';
import { Project, ProjectStatus } from 'src/types/Project';

moment.locale('en-GB');
const localizer = momentLocalizer(moment);

type EvType = {
  title: string;
  allDay?: boolean;
  start: Date;
  end: Date;
  resource?: {
    projectId: number;
    status: ProjectStatus;
    eventType: 'start' | 'completion' | 'estimated' | 'timeline' | 'estimated-timeline';
  };
};

const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'Calendar',
  },
];

const BigCalendar = ({ isBreadcrumb }: { isBreadcrumb: boolean }) => {
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());

  // Fetch project data
  const { data: projects, isLoading, isError } = useGetProjects();

  // Convert projects to calendar events
  const projectEvents = useMemo(() => {
    if (!projects) return [];

    const events: EvType[] = [];

    projects.forEach((project: Project) => {
      // Create timeline events that span from start to completion
      if (project.project_start_date) {
        let endDate: Date;
        let title = project.project_name;
        let eventType: 'timeline' | 'estimated-timeline' = 'timeline';

        // Determine the end date for the timeline
        if (project.project_end_date) {
          // Project is completed - use actual end date
          endDate = new Date(project.project_end_date);
          title = `${project.project_name} (Completed)`;
        } else if (project.estimated_completion_date) {
          // Project is ongoing - use estimated completion
          endDate = new Date(project.estimated_completion_date);
          title = `${project.project_name} (Est. Completion)`;
          eventType = 'estimated-timeline';
        } else {
          // No end date available, create a single-day start event
          endDate = new Date(project.project_start_date);
          title = `${project.project_name} (Started)`;
        }

        const timelineEvent = {
          title,
          start: new Date(project.project_start_date),
          end: endDate,
          allDay: true,
          resource: {
            projectId: project.project_id,
            status: project.status,
            eventType,
          },
        };
        events.push(timelineEvent);
      } else {
        // Project has no start date but has estimated completion
        if (project.estimated_completion_date) {
          const estEvent = {
            title: `${project.project_name} (Est. Target)`,
            start: new Date(project.estimated_completion_date),
            end: new Date(project.estimated_completion_date),
            allDay: true,
            resource: {
              projectId: project.project_id,
              status: project.status,
              eventType: 'estimated' as const,
            },
          };
          events.push(estEvent);
        }
      }
    });

    return events;
  }, [projects]);

  const handleSelectEvent = useCallback((event: EvType) => {
    console.log('Selected event:', event);
    // You can add more functionality here like showing project details
  }, []);

  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate);
  }, []);

  const handleViewChange = useCallback((newView: View) => {
    setView(newView);
  }, []);

  const eventStyleGetter = useCallback((event: EvType) => {
    let backgroundColor = '#3174ad';
    let opacity = 0.8;
    let borderStyle = '0px';

    if (event.resource) {
      // Base color by project status
      switch (event.resource.status) {
        case 'Active':
          backgroundColor = '#39b69a';
          break;
        case 'Planning':
          backgroundColor = '#615dff';
          break;
        case 'Completed':
          backgroundColor = '#1a97f5';
          break;
        case 'On Hold':
          backgroundColor = '#fdd43f';
          break;
        case 'Inactive':
          backgroundColor = '#fc4b6c';
          break;
        case 'Archived':
          backgroundColor = '#6c757d';
          break;
        default:
          backgroundColor = '#3174ad';
      }

      // Adjust styling based on event type
      switch (event.resource.eventType) {
        case 'timeline':
          // Solid timeline bar for projects with start and end dates
          opacity = 0.9;
          break;
        case 'estimated-timeline':
          // Slightly transparent and dashed border for estimated timelines
          opacity = 0.6;
          borderStyle = '2px dashed rgba(255,255,255,0.5)';
          break;
        case 'estimated':
          // Single day estimated events
          opacity = 0.7;
          borderStyle = '1px dotted rgba(255,255,255,0.8)';
          break;
        default:
          opacity = 0.8;
      }
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity,
        color: 'white',
        border: borderStyle,
        display: 'block',
      },
    };
  }, []);

  if (isLoading) {
    return (
      <PageContainer title="Calendar" description="Loading calendar with project timelines">
        {isBreadcrumb ? <Breadcrumb title="Calendar" items={BCrumb} /> : null}
        <BlankCard>
          <CardContent>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '400px',
              }}
            >
              <CircularProgress />
              <span style={{ marginLeft: '16px' }}>Loading project timelines...</span>
            </div>
          </CardContent>
        </BlankCard>
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer title="Calendar" description="Error loading calendar">
        {isBreadcrumb ? <Breadcrumb title="Calendar" items={BCrumb} /> : null}
        <BlankCard>
          <CardContent>
            <Alert severity="error">
              Failed to load project data for calendar. Please check your connection and try again.
            </Alert>
          </CardContent>
        </BlankCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Calendar" description="Project timelines and calendar events">
      {isBreadcrumb ? <Breadcrumb title="Calendar" items={BCrumb} /> : null}
      <BlankCard>
        <CardContent sx={{ pt: 4, pb: 2, mt: 2 }}>
          <Calendar
            localizer={localizer}
            events={projectEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 'calc(100vh - 280px)', minHeight: '600px' }}
            onSelectEvent={handleSelectEvent}
            onNavigate={handleNavigate}
            onView={handleViewChange}
            view={view}
            date={date}
            eventPropGetter={eventStyleGetter}
            popup
            showMultiDayTimes
            step={60}
            showAllEvents
          />
        </CardContent>
      </BlankCard>
    </PageContainer>
  );
};

export default BigCalendar;
