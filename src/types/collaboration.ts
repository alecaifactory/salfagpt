// Types for Document Collaboration and Annotation System

export interface DocumentAnnotation {
  id: string;
  sourceId: string; // Context source document ID
  userId: string; // Who created the annotation
  userEmail: string;
  userName: string;
  
  // Selection details
  selectionText: string; // The actual text that was selected
  startChar: number; // Character position in document
  endChar: number;
  pageNumber?: number; // PDF page number if available
  
  // Annotation content
  annotationType: 'question' | 'comment' | 'revision-request' | 'highlight';
  content: string; // The question/comment/request text
  
  // Position tracking (for visual markers)
  position: {
    x: number; // Percentage (0-100) of horizontal position
    y: number; // Percentage (0-100) of vertical position
    page?: number; // Page number if PDF
  };
  
  // Status
  status: 'open' | 'resolved' | 'dismissed';
  resolvedBy?: string;
  resolvedAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Responses/Thread
  responses?: AnnotationResponse[];
}

export interface AnnotationResponse {
  id: string;
  annotationId: string;
  userId: string;
  userEmail: string;
  userName: string;
  content: string;
  createdAt: Date;
}

export interface CollaborationInvitation {
  id: string;
  sourceId: string; // Document being shared
  sourceName: string;
  
  // Sender info
  senderId: string;
  senderEmail: string;
  senderName: string;
  
  // Recipient info
  recipientEmail: string;
  recipientName?: string;
  
  // Invitation details
  message: string; // Personalized invitation message
  accessLevel: 'view' | 'comment' | 'edit'; // Permission level
  expiresAt?: Date; // Optional expiration
  
  // Status
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  acceptedAt?: Date;
  declinedAt?: Date;
  
  // Email delivery
  emailSent: boolean;
  emailSentAt?: Date;
  emailProvider?: 'gmail' | 'smtp' | 'sendgrid'; // Which service was used
  
  // Annotations included
  annotationIds?: string[]; // Specific annotations to share
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface ReferralNetwork {
  id: string; // User ID (hashed for privacy)
  hashedId: string; // Public anonymous ID
  
  // Referral info
  invitedBy?: string; // hashedId of referrer
  invitedAt?: Date;
  
  // Network stats
  directReferrals: number; // How many people they invited
  networkSize: number; // Total network size (recursive)
  networkDepth: number; // How far from origin
  
  // Status
  status: 'invited' | 'active' | 'trial' | 'premium';
  trialStartedAt?: Date;
  trialEndsAt?: Date;
  
  // Privacy
  anonymousInGraph: boolean; // Whether to show in public graph
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface GmailConnection {
  id: string; // User ID
  userId: string;
  userEmail: string;
  
  // OAuth tokens
  accessToken: string; // Encrypted
  refreshToken: string; // Encrypted
  expiresAt: Date;
  
  // Scopes granted
  scopes: string[]; // e.g., ['gmail.send', 'gmail.readonly']
  
  // Status
  isConnected: boolean;
  lastUsedAt?: Date;
  
  // Timestamps
  connectedAt: Date;
  updatedAt: Date;
}

export interface InvitationEmailDraft {
  to: string;
  subject: string;
  body: string;
  htmlBody: string;
  
  // Attachment (optional)
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
  
  // Metadata
  invitationId: string;
  sourceId: string;
  annotationIds?: string[];
}


