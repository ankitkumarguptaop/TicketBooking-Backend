import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import { SeatCategory } from '../../domain/seat-category.enum';
import { ScreenOrmEntity } from './screen.orm-entity';

/** One physical chair on a screen. Part of the Screen aggregate. */
@Entity({ schema: 'catalog', name: 'seats' })
/** "Seat numbers unique within a screen": last line of defence. */
@Unique('uq_seats_screen_label', ['screenId', 'row', 'number'])
/** Two chairs can't occupy the same spot on the map. */
@Unique('uq_seats_screen_position', ['screenId', 'gridRow', 'gridCol'])
@Check('ck_seats_number', '"seat_number" >= 1')
@Check('ck_seats_grid', '"grid_row" >= 0 AND "grid_col" >= 0')
export class SeatOrmEntity {
  @PrimaryColumn('uuid', { primaryKeyConstraintName: 'pk_seats' })
  id!: string;

  @Column({ name: 'screen_id', type: 'uuid' })
  screenId!: string;

  @ManyToOne(() => ScreenOrmEntity, (screen) => screen.seats, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({
    name: 'screen_id',
    foreignKeyConstraintName: 'fk_seats_screen',
  })
  screen?: ScreenOrmEntity;

  @Column({ name: 'row_label', type: 'varchar', length: 3 })
  row!: string;

  @Column({ name: 'seat_number', type: 'int' })
  number!: number;

  @Column({ type: 'enum', enum: SeatCategory, enumName: 'seat_category' })
  category!: SeatCategory;

  @Column({ name: 'grid_row', type: 'int' })
  gridRow!: number;

  @Column({ name: 'grid_col', type: 'int' })
  gridCol!: number;
}
