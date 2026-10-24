import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db/mongoose';
import { Response, Lead, Connection, Notification, User } from '@/lib/db/models';
import { ok, err } from '@/lib/utils/api-response';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) return err('Unauthorized', 401);

    await connectDB();
    const response = await Response.findById(id).populate('lead');
    if (!response) return err('Response not found', 404);

    const lead = response.lead as any;
    const isCreator = lead.creator.toString() === session.user.id;
    const isAdmin = (session.user as any).role === 'superadmin' || (session.user as any).role === 'staff';

    if (!isCreator && !isAdmin) {
      return err('Only the lead creator can update proposal status', 403);
    }

    const body = await req.json();
    const { status } = body; // 'shortlisted' | 'rejected' | 'connected'

    if (!['pending', 'viewed', 'shortlisted', 'rejected', 'connected'].includes(status)) {
      return err('Invalid status', 400);
    }

    response.status = status;
    if (status === 'viewed') {
      response.isViewed = true;
      response.viewedAt = new Date();
    }
    await response.save();

    // If connected, create Connection document
    if (status === 'connected') {
      const existingConn = await Connection.findOne({
        lead: lead._id,
        creator: lead.creator,
        absorber: response.absorber,
      });

      if (!existingConn) {
        await Connection.create({
          lead: lead._id,
          creator: lead.creator,
          absorber: response.absorber,
          response: response._id,
          status: 'connected',
          contactRevealedAt: new Date(),
        });
      }

      // Notify the absorber
      await Notification.create({
        user: response.absorber,
        title: 'Connection Accepted!',
        message: `Great news! The creator of "${lead.title}" has connected with you. You can now contact each other directly.`,
        type: 'connection_accepted',
        link: '/absorber/connections',
      });
    }

    return ok(response);
  } catch (error) {
    console.error('[PATCH /api/responses/[id]]', error);
    return err('Failed to update response', 500);
  }
}