import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { SeatCategory } from '../../domain/seat-category.enum';
import { ShowOrmEntity } from './show.orm-entity';

/** Price of one seat category for one show. Part of the Show aggregate. */
@Entity({ schema: 'catalog', name: 'show_prices' })
@Check('ck_show_prices_amount', '"amount_minor" >= 0')
@Check('ck_show_prices_currency', `"currency" ~ '^[A-Z]{3}$'`)
export class ShowPriceOrmEntity {
  @PrimaryColumn({
    name: 'show_id',
    type: 'uuid',
    primaryKeyConstraintName: 'pk_show_prices',
  })
  showId!: string;

  @PrimaryColumn({
    name: 'seat_category',
    type: 'enum',
    enum: SeatCategory,
    enumName: 'seat_category',
    primaryKeyConstraintName: 'pk_show_prices',
  })
  category!: SeatCategory;

  @ManyToOne(() => ShowOrmEntity, (show) => show.prices, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({
    name: 'show_id',
    foreignKeyConstraintName: 'fk_show_prices_show',
  })
  show?: ShowOrmEntity;

  /** Minor units (paise). Integers only: never floats for money. */
  @Column({ name: 'amount_minor', type: 'int' })
  amountMinor!: number;

  @Column({ type: 'char', length: 3, default: 'INR' })
  currency!: string;
}
