export type UserRole = 'patient' | 'doctor' | 'admin';

export interface User {
  avatarUrl: any;
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  specialization?: string; // for doctors
  license?: string; // for doctors
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  reason: string;
  notes?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  date: string;
  notes?: string;
}

export interface HealthRecord {
  id: string;
  patientId: string;
  date: string;
  type: string;
  description: string;
  attachments?: string[];
  doctorId?: string;
  doctorName?: string;
}

export interface PharmacyProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  inStock: boolean;
  imageUrl?: string;
  prescriptionRequired: boolean;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  date: string;
  shippingAddress: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

// Agents & Conversations
export type ConversationStatus = 'open' | 'closed';
export type MessageDirection = 'inbound' | 'outbound';
export type MessageSenderType = 'customer' | 'agent' | 'system';

export interface Conversation {
  id: number;
  subject?: string;
  status: ConversationStatus;
  source: 'sms' | 'email' | 'chat';
  customerPhone?: string;
  twilioPhone?: string;
  patientId?: string | null;
  agentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  senderType: MessageSenderType;
  direction: MessageDirection;
  body: string;
  customerPhone?: string;
  twilioPhone?: string;
  createdAt: string;
}

// AI Assistants
export interface Assistant {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  skills: Record<string, boolean>;
  createdAt: string;
}

export interface AssistantRun {
  id: string;
  assistantId: string;
  task:
    | 'appointments_review'
    | 'orders_review'
    | 'waiting_list_confirm'
    | 'appointments_reschedule'
    | 'orders_followup'
    | 'phone_verification_review';
  status: 'completed' | 'failed';
  result: any;
  createdAt: string;
}
