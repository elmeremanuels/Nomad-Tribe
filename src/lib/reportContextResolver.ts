import { Report, Spot, Thread, ThreadReply, MarketItem, PopUpEvent, LookingForRequest, CollabAsk, FamilyProfile, Message, Deal } from '../types';
import { parseISO, format } from 'date-fns';

export interface ReportContext {
  title: string;
  preview: string;
  imageUrl?: string;
  authorId?: string;
  authorName?: string;
  createdAt?: string;
}

export function resolveReportContext(
  report: Report,
  state: { 
    spots: Spot[]; 
    threads: Thread[]; 
    threadReplies: ThreadReply[];
    marketItems: MarketItem[]; 
    events: PopUpEvent[];
    lookingFor: LookingForRequest[]; 
    collabAsks: CollabAsk[];
    profiles: FamilyProfile[]; 
    messages: Record<string, Message[]>; 
    deals: Deal[] 
  }
): ReportContext | null {

  switch (report.targetType) {
    case 'Spot': {
      const spot = state.spots.find(s => s.id === report.targetId);
      if (!spot) return null;
      const author = state.profiles.find(p => p.id === spot.recommendedBy);
      return {
        title: spot.name,
        preview: spot.description || '',
        imageUrl: spot.imageUrl,
        authorId: spot.recommendedBy,
        authorName: author?.familyName,
        createdAt: spot.createdAt,
      };
    }

    case 'Thread': {
      const thread = state.threads.find(t => t.id === report.targetId);
      if (!thread) return null;
      return {
        title: thread.title,
        preview: thread.body,
        authorId: thread.authorId,
        authorName: thread.authorFamilyName,
        createdAt: thread.createdAt,
      };
    }

    case 'ThreadReply': {
      const reply = state.threadReplies.find(r => r.id === report.targetId);
      if (!reply) return null;
      return {
        title: 'Reply in space',
        preview: reply.body,
        authorId: reply.authorId,
        authorName: reply.authorFamilyName,
        createdAt: reply.createdAt,
      };
    }

    case 'MarketItem': {
      const item = state.marketItems.find(i => i.id === report.targetId);
      if (!item) return null;
      const author = state.profiles.find(p => p.id === item.sellerId);
      return {
        title: item.title,
        preview: item.description || '',
        imageUrl: item.imageUrl,
        authorId: item.sellerId,
        authorName: author?.familyName,
        createdAt: item.createdAt,
      };
    }

    case 'Event': {
      const event = state.events.find(e => e.id === report.targetId);
      if (!event) return null;
      const author = state.profiles.find(p => p.id === (event as any).hostId);
      return {
        title: event.title,
        preview: event.description || '',
        authorId: (event as any).hostId,
        authorName: author?.familyName,
        createdAt: (event as any).createdAt,
      };
    }

    case 'LookingFor': {
      const req = state.lookingFor.find(r => r.id === report.targetId);
      if (!req) return null;
      const author = state.profiles.find(p => p.id === req.userId);
      return {
        title: `Looking for: ${req.category}`,
        preview: req.description,
        authorId: req.userId,
        authorName: author?.familyName,
        createdAt: req.createdAt,
      };
    }

    case 'CollabAsk': {
      const ask = state.collabAsks.find(a => a.id === report.targetId);
      if (!ask) return null;
      const author = state.profiles.find(p => p.id === ask.userId);
      return {
        title: `Collab Ask: ${ask.skillNeeded}`,
        preview: ask.description,
        authorId: ask.userId,
        authorName: author?.familyName,
        createdAt: ask.createdAt,
      };
    }

    case 'Message': {
      let msgFound: Message | undefined;
      Object.values(state.messages).some(convoMsgs => {
        msgFound = convoMsgs.find(m => m.id === report.targetId);
        return !!msgFound;
      });
      if (!msgFound) return null;
      const author = state.profiles.find(p => p.id === msgFound!.senderId);
      return {
        title: 'Direct message',
        preview: msgFound!.content,
        authorId: msgFound!.senderId,
        authorName: author?.familyName,
        createdAt: msgFound!.createdAt,
      };
    }

    case 'User': {
      const user = state.profiles.find(p => p.id === report.targetId);
      if (!user) return null;
      return {
        title: user.familyName,
        preview: user.bio || '(no bio)',
        imageUrl: user.photoUrl,
        authorId: user.id,
        authorName: user.familyName,
        createdAt: user.createdAt,
      };
    }

    case 'Deal': {
      const deal = state.deals.find(d => d.id === report.targetId);
      if (!deal) return null;
      return {
        title: deal.name,
        preview: deal.description,
        imageUrl: deal.imageUrl,
        authorName: deal.advertiserName,
        createdAt: deal.createdAt,
      };
    }

    default:
      return null;
  }
}
