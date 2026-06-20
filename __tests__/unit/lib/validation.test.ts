import { expect, test, describe } from 'vitest';
import { UserRegistrationSchema, ChallengeCreateSchema, ProofSubmitSchema } from '@/lib/validation/schemas';

describe('Validation Schemas', () => {
  test('UserRegistrationSchema valid payload', () => {
    const valid = { handle: 'johndoe', email: 'john@example.com', password: 'password123', displayName: 'John' };
    expect(UserRegistrationSchema.parse(valid)).toEqual(valid);
  });

  test('UserRegistrationSchema invalid handle', () => {
    const invalid = { handle: 'jo', email: 'john@example.com', password: 'password123' };
    expect(() => UserRegistrationSchema.parse(invalid)).toThrow();
  });

  test('ChallengeCreateSchema valid payload', () => {
    const valid = { title: '100 Days of Code', skillCategory: 'JavaScript', targetDays: 100 };
    expect(ChallengeCreateSchema.parse(valid)).toEqual(valid);
  });

  test('ChallengeCreateSchema invalid category', () => {
    const invalid = { title: 'Learn Things', skillCategory: 'Invalid Category', targetDays: 30 };
    expect(() => ChallengeCreateSchema.parse(invalid)).toThrow();
  });

  test('ProofSubmitSchema valid payload', () => {
    const valid = { challengeId: '123e4567-e89b-12d3-a456-426614174000', proofText: 'I learned a lot about closures today! Here is my detailed summary...'.padEnd(50, ' ') };
    expect(ProofSubmitSchema.parse(valid)).toEqual(valid);
  });
});
