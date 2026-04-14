import { ResponseEnum } from '../enums';

interface IBase {
  status: ResponseEnum;
  message: string;
}

export interface IMetadata {
  total?: number;
  page?: number;
  limit?: number;
}

export type MessageType = 'updated' | 'deleted' | 'created' | 'success';

export interface IMessage<T extends string = string> {
  message: T;
}

export interface IResponseOK extends IBase {
  message: MessageType;
  status: ResponseEnum.Success;
  metadata?: IMetadata;
}

export interface IResponseFail extends IBase {
  status: ResponseEnum.Fail;
}

export interface IResponseData<T> extends IBase {
  data: T;
  metadata: IMetadata & { pageCount?: number };
  status: ResponseEnum.Success;
}

export type IResponseTypeData<T> = IResponseData<T> | IResponseFail;

export type ResponseType = IResponseOK | IResponseFail;
