import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Database shape of a theatre. Never leaves the infrastructure layer.
 * Index ix_theatres_city on lower(city) lives in the migration only
 * (TypeORM can't declare expression indexes).
 */
@Entity({ schema: 'catalog', name: 'theatres' })
export class TheatreOrmEntity {
  @PrimaryColumn('uuid', { primaryKeyConstraintName: 'pk_theatres' })
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 80 })
  city!: string;

  @Column({ type: 'varchar', length: 300 })
  address!: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ type: 'int' })
  version!: number;
}
