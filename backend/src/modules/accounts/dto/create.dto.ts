import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  readonly name: string;
}
