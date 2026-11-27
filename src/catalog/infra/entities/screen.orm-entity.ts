import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import { SeatOrmEntity } from './seat.orm-entity';
import { TheatreOrmEntity } from './theatre.orm-entity';

/**
 * Database shape of a screen. The Screen aggregate owns its seats, so they
 * are saved with it (cascade) and replaced together when the layout changes.
 */
@Entity({ schema: 'catalog', name: 'screens' })
@Unique('uq_screens_theatre_name', ['theatreId', 'name'])
export class ScreenOrmEntity {
  @PrimaryColumn('uuid', { primaryKeyConstraintName: 'pk_screens' })
  id!: string;

  @Column({ name: 'theatre_id', type: 'uuid' })
  theatreId!: string;

  /** Same-schema FK. A theatre with screens can't be deleted. Never loaded. */
  @ManyToOne(() => TheatreOrmEntity, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({
    name: 'theatre_id',
    foreignKeyConstraintName: 'fk_screens_theatre',
  })
  theatre?: TheatreOrmEntity;

  /** e.g. "Audi 1", unique within the theatre. */
  @Column({ type: 'varchar', length: 50 })
  name!: string;

  @OneToMany(() => SeatOrmEntity, (seat) => seat.screen, { cascade: true })
  seats!: SeatOrmEntity[];

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ type: 'int' })
  version!: number;
}
