export type FieldRosterSource = 'roster' | 'provisional';

export type FieldRosterMemberStatus = 'pending' | 'in_progress' | 'completed';

export type FieldRosterEntry = {
  farmerId: string;
  source: FieldRosterSource;
  fullName: string;
  village: string;
  phone: string | null;
  nationalId: string | null;
  email: string | null;
  producerContactId: string | null;
  campaignId: string | null;
  assignmentId: string | null;
  status: FieldRosterMemberStatus;
  createdAt: number;
  updatedAt: number;
};

export type ProvisionalMemberInput = {
  fullName: string;
  village: string;
  phone?: string | null;
  nationalId?: string | null;
  email?: string | null;
};
