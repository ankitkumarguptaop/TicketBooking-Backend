import { DomainEvent } from './domain-event';

/**
 * Base class for aggregate roots. Collects domain events raised during a
 * use case; the application layer pulls and publishes them after saving.
 * Pure TypeScript on purpose: no framework imports in the domain layer.
 */
export abstract class AggregateRoot {
  private domainEvents: DomainEvent[] = [];

  protected raise(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = this.domainEvents;
    this.domainEvents = [];
    return events;
  }
}
