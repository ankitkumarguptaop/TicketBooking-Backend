import {
  Check,
  Column,
  Entity,
  Exclusion,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { ShowStatus } from '../../domain/show-status.enum';
import { MovieOrmEntity } from './movie.orm-entity';
import { ScreenOrmEntity } from './screen.orm-entity';
import { ShowPriceOrmEntity } from './show-price.orm-entity';

/**
 * Database shape of a show. Movie and screen are in the same schema, so
 * they are real FKs (RESTRICT: a movie or screen with shows can't be
 * hard-deleted). Theatre and city come from the screen via a join.
 */
@Entity({ schema: 'catalog', name: 'shows' })
/**
 * "Shows on one screen never overlap, incl. cleaning gap": the DB-level
 * half of the rule (the Show / ShowScheduler check is the other half).
 * Needs the btree_gist extension for "screen_id WITH =".
 */
@Exclusion(
  'ex_shows_screen_no_overlap',
  `USING gist ("screen_id" WITH =, tstzrange("starts_at", "blocked_until", '[)') WITH &&) WHERE ("status" = 'SCHEDULED')`,
)
@Check(
  'ck_shows_times',
  '"ends_at" > "starts_at" AND "blocked_until" >= "ends_at"',
)
@Check(
  'ck_shows_cancelled',
  `("status" = 'CANCELLED') = ("cancelled_at" IS NOT NULL)`,
)
@Index('ix_shows_movie_starts', ['movieId', 'startsAt'], {
  where: `"status" = 'SCHEDULED'`,
})
@Index('ix_shows_starts', ['startsAt'], { where: `"status" = 'SCHEDULED'` })
export class ShowOrmEntity {
  @PrimaryColumn('uuid', { primaryKeyConstraintName: 'pk_shows' })
  id!: string;

  @Column({ name: 'movie_id', type: 'uuid' })
  movieId!: string;

  /** Never loaded; declares fk_shows_movie. */
  @ManyToOne(() => MovieOrmEntity, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'movie_id', foreignKeyConstraintName: 'fk_shows_movie' })
  movie?: MovieOrmEntity;

  @Column({ name: 'screen_id', type: 'uuid' })
  screenId!: string;

  /** Never loaded; declares fk_shows_screen. */
  @ManyToOne(() => ScreenOrmEntity, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({
    name: 'screen_id',
    foreignKeyConstraintName: 'fk_shows_screen',
  })
  screen?: ScreenOrmEntity;

  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt!: Date;

  /** starts_at + movie runtime. */
  @Column({ name: 'ends_at', type: 'timestamptz' })
  endsAt!: Date;

  /** ends_at + cleaning gap: the screen is busy until then. */
  @Column({ name: 'blocked_until', type: 'timestamptz' })
  blockedUntil!: Date;

  @Column({ type: 'enum', enum: ShowStatus, enumName: 'show_status' })
  status!: ShowStatus;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt!: Date | null;

  @Column({
    name: 'cancel_reason',
    type: 'varchar',
    length: 300,
    nullable: true,
  })
  cancelReason!: string | null;

  @OneToMany(() => ShowPriceOrmEntity, (price) => price.show, {
    cascade: true,
  })
  prices!: ShowPriceOrmEntity[];

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ type: 'int' })
  version!: number;
}
