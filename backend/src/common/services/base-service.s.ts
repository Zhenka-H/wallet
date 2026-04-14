import { BaseEntity } from 'typeorm';

export interface IResItem<T> {
  data: T;
  isSuccess: boolean;
}

export interface IRes<T> {
  data: T[];
  total?: number;
}

export interface IResUpdate<T> {
  data: T;
  isSuccess: boolean;
}

export interface IResCreate<T> {
  data?: T;
  isSuccess: boolean;
}

export abstract class BaseService<T extends BaseEntity> {
  abstract findOne(...args: unknown[]): Promise<IResItem<T>>;
  abstract findAll(...args: unknown[]): Promise<IRes<T>>;
  abstract create(...args: unknown[]): Promise<IResCreate<T>>;
  abstract update(...args: unknown[]): Promise<IResUpdate<T>>;
}
