import { describe, it, expect } from 'vitest';
import { SubmissionSchema } from '../submission';

describe('SubmissionSchema (team_ref)', () => {
  it('accepts team_ref string instead of team array', () => {
    const result = SubmissionSchema.parse({
      synnovator_submission: '2.0',
      project: {
        name: 'My Project',
        track: 'nlp',
        team_ref: 'team-awesome',
      },
    });
    expect(result.project.team_ref).toBe('team-awesome');
  });

  it('accepts submission with mentors', () => {
    const result = SubmissionSchema.parse({
      synnovator_submission: '2.0',
      project: {
        name: 'My Project',
        track: 'nlp',
        team_ref: 'team-awesome',
        mentors: [{ github: 'prof-wang', name: 'Prof Wang' }],
      },
    });
    expect(result.project.mentors).toHaveLength(1);
  });
});
