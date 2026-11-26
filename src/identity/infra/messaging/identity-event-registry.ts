import { DomainEvent } from '../../../shared/domain/domain-event';
import { AdminAccessApproved } from '../../domain/events/admin-access-approved.event';
import { AdminAccessRejected } from '../../domain/events/admin-access-rejected.event';
import { AdminAccessRequestCancelled } from '../../domain/events/admin-access-request-cancelled.event';
import { AdminAccessRequested } from '../../domain/events/admin-access-requested.event';
import { AdminRoleGranted } from '../../domain/events/admin-role-granted.event';
import { AdminRoleRevoked } from '../../domain/events/admin-role-revoked.event';
import { ContactVerified } from '../../domain/events/contact-verified.event';
import { PasswordChanged } from '../../domain/events/password-changed.event';
import { RefreshTokenReuseDetected } from '../../domain/events/refresh-token-reuse-detected.event';
import { SessionRevoked } from '../../domain/events/session-revoked.event';
import { SessionStarted } from '../../domain/events/session-started.event';
import { UserRegistered } from '../../domain/events/user-registered.event';

type EventClass = abstract new (...args: never[]) => DomainEvent;

/**
 * Every event the identity context stores in its outbox, by a stable name.
 * The name is what goes into `outbox.event_type`, so renaming a class does
 * not orphan rows already written. Add new events here, or saving fails.
 */
const EVENTS: Record<string, EventClass> = {
  UserRegistered,
  ContactVerified,
  PasswordChanged,
  SessionStarted,
  SessionRevoked,
  RefreshTokenReuseDetected,
  AdminAccessRequested,
  AdminAccessApproved,
  AdminAccessRejected,
  AdminAccessRequestCancelled,
  AdminRoleGranted,
  AdminRoleRevoked,
};

const NAME_BY_CLASS = new Map<EventClass, string>(
  Object.entries(EVENTS).map(([name, cls]) => [cls, name]),
);

/** Fields that are Dates in memory and ISO strings in JSON. */
const DATE_FIELDS = ['occurredAt'] as const;

export function eventTypeOf(event: DomainEvent): string {
  const name = NAME_BY_CLASS.get(event.constructor as EventClass);
  if (!name) {
    throw new Error(
      `${event.constructor.name} is not in the identity event registry`,
    );
  }
  return name;
}

/** Plain JSON for the `payload` column. */
export function serializeEvent(event: DomainEvent): object {
  return JSON.parse(JSON.stringify(event)) as object;
}

/**
 * Rebuilds a real instance of the event class, keeping the ORIGINAL eventId.
 * The constructor is NOT called (it would mint a new eventId), so the
 * object is created from the prototype and the stored fields copied on.
 * `instanceof` and @EventsHandler routing both work on the result.
 */
export function deserializeEvent(
  eventType: string,
  payload: object,
): DomainEvent {
  const cls = EVENTS[eventType];
  if (!cls) throw new Error(`Unknown identity event type "${eventType}"`);
  const event = Object.assign(
    Object.create(cls.prototype as object) as object,
    payload,
  ) as Record<string, unknown>;
  for (const field of DATE_FIELDS) {
    if (typeof event[field] === 'string') {
      event[field] = new Date(event[field]);
    }
  }
  return event as unknown as DomainEvent;
}
