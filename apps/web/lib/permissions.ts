/**
 * Server-side permission helpers for the unified permission model.
 * Do NOT import this file from client components.
 */
import { getRoles } from '@/app/_generated/data';

function normalize(s: string): string {
  return s.toLowerCase();
}

export function isAdmin(login: string): boolean {
  const roles = getRoles();
  return roles.admin.some(a => normalize(a) === normalize(login));
}

export function canEditHackathon(login: string, managedBy: string[]): boolean {
  return isAdmin(login) || managedBy.some(m => normalize(m) === normalize(login));
}

export function canEditProposal(
  login: string,
  managedBy: string[],
  teamMembers: string[],
): boolean {
  return (
    isAdmin(login) ||
    managedBy.some(m => normalize(m) === normalize(login)) ||
    teamMembers.some(t => normalize(t) === normalize(login))
  );
}

export function canEditProfile(login: string, profileOwner: string): boolean {
  return isAdmin(login) || normalize(login) === normalize(profileOwner);
}
