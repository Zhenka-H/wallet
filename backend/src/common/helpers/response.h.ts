import { ResponseEnum } from '../enums';
import {
  IMessage,
  IResponseOK,
  IResponseFail,
  IResponseData,
  IMetadata,
  MessageType,
} from '../interfaces';

type ExcludeNull<T> = T extends null | undefined ? never : T;
export class Response {
  /**
   * @description The method intended to return a message of success
   *
   * @param payload Message of response
   * @returns
   */
  static ok(payload: IMessage<MessageType>, metadata?: IMetadata): IResponseOK {
    return { status: ResponseEnum.Success, message: payload.message, metadata };
  }

  /**
   * @description The method intended to return a message of fail
   *
   * @param payload Message of response
   * @returns
   */
  static fail(payload: IMessage): IResponseFail {
    return { status: ResponseEnum.Fail, message: payload.message };
  }

  /**
   * @description The method intended to return data
   *
   * @param data The data that is going to return
   * @param metadata The metadata that you can provide
   * @returns
   */
  static returnData<T>(
    data: ExcludeNull<T>,
    metadata: IMetadata = {},
  ): IResponseData<T> {
    let pageCount: number | undefined;
    if (metadata.total && metadata.limit) {
      pageCount = Math.ceil(metadata.total / metadata.limit);
    }
    return {
      data,
      metadata: { ...metadata, pageCount },
      status: ResponseEnum.Success,
      message: 'success',
    };
  }
}
