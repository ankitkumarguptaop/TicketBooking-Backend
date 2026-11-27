import { Check, Column, Entity, PrimaryColumn } from 'typeorm';
import { MovieCertificate } from '../../domain/movie-certificate.enum';

/**
 * Database shape of a movie. Never leaves the infrastructure layer.
 * language / runtime / certificate are nullable: a movie can be added as a
 * draft and completed later; Movie decides when it is ready to schedule.
 */
@Entity({ schema: 'catalog', name: 'movies' })
@Check('ck_movies_runtime', '"runtime_minutes" BETWEEN 1 AND 600')
@Check('ck_movies_language', `"language" ~ '^[a-z]{2}$'`)
export class MovieOrmEntity {
  @PrimaryColumn('uuid', { primaryKeyConstraintName: 'pk_movies' })
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 30, array: true, default: () => "'{}'" })
  genres!: string[];

  /** ISO 639-1, lower case. */
  @Column({ type: 'varchar', length: 2, nullable: true })
  language!: string | null;

  @Column({ name: 'runtime_minutes', type: 'int', nullable: true })
  runtimeMinutes!: number | null;

  @Column({
    type: 'enum',
    enum: MovieCertificate,
    enumName: 'movie_certificate',
    nullable: true,
  })
  certificate!: MovieCertificate | null;

  /** pg returns DATE as a "YYYY-MM-DD" string (no time zone shift). */
  @Column({ name: 'release_date', type: 'date', nullable: true })
  releaseDate!: string | null;

  @Column({ name: 'poster_url', type: 'varchar', length: 2048, nullable: true })
  posterUrl!: string | null;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  /** Optimistic lock: UPDATE ... WHERE version = $loaded. */
  @Column({ type: 'int' })
  version!: number;
}
