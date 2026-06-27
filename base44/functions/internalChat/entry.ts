import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { action } = body;

        // Send a new message
        if (action === 'send') {
            const { receiver_email, content } = body;
            
            if (!receiver_email || !content) {
                return Response.json({ error: 'Missing receiver or content' }, { status: 400 });
            }

            const message = await base44.entities.InternalMessage.create({
                sender_email: user.email,
                receiver_email,
                content,
                is_read: false
            });

            return Response.json({ success: true, message });
        }

        // Get conversation with a specific user
        if (action === 'get-conversation') {
            const { other_email } = body;
            
            if (!other_email) {
                return Response.json({ error: 'Missing other_email' }, { status: 400 });
            }

            const allMessages = await base44.entities.InternalMessage.list('created_date', 500);
            
            // Filter messages between current user and other user
            const conversation = allMessages.filter(m => 
                (m.sender_email === user.email && m.receiver_email === other_email) ||
                (m.sender_email === other_email && m.receiver_email === user.email)
            );

            return Response.json({ messages: conversation });
        }

        // Get unread counts per user
        if (action === 'get-unread-counts') {
            const allMessages = await base44.entities.InternalMessage.list('-created_date', 500);
            
            // Count unread messages sent TO current user, grouped by sender
            const unreadCounts = {};
            allMessages.forEach(m => {
                if (m.receiver_email === user.email && !m.is_read) {
                    unreadCounts[m.sender_email] = (unreadCounts[m.sender_email] || 0) + 1;
                }
            });

            return Response.json({ unreadCounts });
        }

        // Mark messages as read
        if (action === 'mark-read') {
            const { sender_email } = body;
            
            if (!sender_email) {
                return Response.json({ error: 'Missing sender_email' }, { status: 400 });
            }

            const allMessages = await base44.entities.InternalMessage.list('-created_date', 500);
            
            // Find unread messages from this sender to current user
            const unreadMessages = allMessages.filter(m => 
                m.sender_email === sender_email && 
                m.receiver_email === user.email && 
                !m.is_read
            );

            // Mark each as read
            for (const msg of unreadMessages) {
                await base44.entities.InternalMessage.update(msg.id, { is_read: true });
            }

            return Response.json({ success: true, markedCount: unreadMessages.length });
        }

        // Get last message preview for each contact
        if (action === 'get-contacts-preview') {
            const allMessages = await base44.entities.InternalMessage.list('-created_date', 500);
            
            // Get messages involving current user
            const myMessages = allMessages.filter(m => 
                m.sender_email === user.email || m.receiver_email === user.email
            );

            // Group by other user and get latest message
            const contactsMap = {};
            myMessages.forEach(m => {
                const otherEmail = m.sender_email === user.email ? m.receiver_email : m.sender_email;
                if (!contactsMap[otherEmail] || new Date(m.created_date) > new Date(contactsMap[otherEmail].created_date)) {
                    contactsMap[otherEmail] = m;
                }
            });

            return Response.json({ previews: contactsMap });
        }

        return Response.json({ error: 'Unknown action' }, { status: 400 });

    } catch (error) {
        console.error("Chat error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});