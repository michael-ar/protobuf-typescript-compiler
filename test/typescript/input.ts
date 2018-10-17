import * as shared from './shared';

export type Enum = 'ONE' | 'TWO';

export type CustomType = {
  bar?: string;
};

export type Message = {
  foo: string;
  enumField: Enum;
  repeatedField?: Array<string>;
  custom: CustomType;
  mapField?: { [x: string]: string };
  boolean?: boolean;
  int?: number;
  sharedMessage: shared.Message;
} & (optionA | optionB);

type optionA = {
  optionA: string;
  oneofField?: 'optionA';
};

type optionB = {
  optionB: string;
  oneofField?: 'optionB';
};
