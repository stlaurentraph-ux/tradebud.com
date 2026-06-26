import { resolveCampaignTargetFields } from './campaign-contact-targets';

describe('campaign-contact-targets', () => {
  it('resolves contact ids and denormalized emails from mixed targets', () => {
    expect(
      resolveCampaignTargetFields([
        { contact_id: 'contact_1', email: 'a@example.com', full_name: 'Alice' },
        { contact_id: 'manual-b@example.com', email: 'b@example.com', full_name: 'Bob' },
        { contact_id: 'org-north', email: 'org@example.com', full_name: 'North Coop' },
        { email: 'c@example.com', full_name: 'Carol' },
      ]),
    ).toEqual({
      target_contact_ids: ['contact_1'],
      target_contact_emails: ['a@example.com', 'b@example.com', 'org@example.com', 'c@example.com'],
    });
  });
});
