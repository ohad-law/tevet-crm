import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");
    const body = await req.json();
    const { action } = body;

    // List calendars
    if (action === 'list_calendars') {
      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await response.json();
      return Response.json({ calendars: data.items || [] });
    }

    // List events
    if (action === 'list_events') {
      const { calendarId = 'primary', timeMin, timeMax, maxResults = 50 } = body;
      const params = new URLSearchParams({
        maxResults: String(maxResults),
        singleEvents: 'true',
        orderBy: 'startTime'
      });
      if (timeMin) params.append('timeMin', timeMin);
      if (timeMax) params.append('timeMax', timeMax);

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      const data = await response.json();
      return Response.json({ events: data.items || [] });
    }

    // Create event
    if (action === 'create_event') {
      const { calendarId = 'primary', event } = body;
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        }
      );
      const data = await response.json();
      return Response.json({ event: data });
    }

    // Update event
    if (action === 'update_event') {
      const { calendarId = 'primary', eventId, event } = body;
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        }
      );
      const data = await response.json();
      return Response.json({ event: data });
    }

    // Delete event
    if (action === 'delete_event') {
      const { calendarId = 'primary', eventId } = body;
      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      return Response.json({ success: true });
    }

    // Sync hearing to calendar
    if (action === 'sync_hearing') {
      const { hearing, caseName, caseNumber } = body;
      
      const event = {
        summary: `דיון: ${caseName} (#${caseNumber})`,
        description: hearing.description || '',
        start: {
          dateTime: new Date(hearing.date).toISOString(),
          timeZone: 'Asia/Jerusalem'
        },
        end: {
          dateTime: new Date(new Date(hearing.date).getTime() + 60 * 60 * 1000).toISOString(),
          timeZone: 'Asia/Jerusalem'
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 60 },
            { method: 'popup', minutes: 1440 } // 1 day before
          ]
        }
      };

      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        }
      );
      const data = await response.json();
      return Response.json({ event: data });
    }

    // Sync milestone to calendar
    if (action === 'sync_milestone') {
      const { milestone, caseName } = body;
      
      const event = {
        summary: `יעד: ${milestone.milestone_name} - ${caseName}`,
        description: milestone.notes || '',
        start: {
          date: milestone.due_date
        },
        end: {
          date: milestone.due_date
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 1440 }, // 1 day before
            { method: 'popup', minutes: 4320 }  // 3 days before
          ]
        }
      };

      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        }
      );
      const data = await response.json();
      return Response.json({ event: data });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Google Calendar error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});