import { 
  Hand, 
  GraduationCap, 
  Briefcase, 
  Stamp, 
  HeartPulse, 
  Plane, 
  Brain, 
  LucideIcon, 
  MessageSquare,
  Globe,
  Users,
  Shield,
  Lock,
  Heart,
  Star,
  Zap,
  Coffee,
  Camera,
  MapPin,
  TrendingUp,
  Hash
} from 'lucide-react';
import { TopicId } from '../types';

export const TOPIC_ICONS: Record<string, LucideIcon> = {
  'introductions': Hand,
  'worldschooling': GraduationCap,
  'business-tax-money': Briefcase,
  'visas-residency': Stamp,
  'health-insurance-safety': HeartPulse,
  'travel-logistics-gear': Plane,
  'lifestyle-mental-health': Brain,
};

export function getTopicIcon(topicId: string): LucideIcon {
  return TOPIC_ICONS[topicId] || MessageSquare;
}

export const ALL_ICONS = {
  Hand,
  GraduationCap,
  Briefcase,
  Stamp,
  HeartPulse,
  Plane,
  Brain,
  MessageSquare,
  Globe,
  Users,
  Shield,
  Lock,
  Heart,
  Star,
  Zap,
  Coffee,
  Camera,
  MapPin,
  TrendingUp,
  Hash
};

export type IconName = keyof typeof ALL_ICONS;
