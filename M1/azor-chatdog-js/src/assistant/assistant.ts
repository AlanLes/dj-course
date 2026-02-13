/**
 * Assistant class representing AI assistant configuration
 */

export class Assistant {
  private _id: string;
  private _systemPrompt: string;
  private _name: string;

  constructor(id: string, systemPrompt: string, name: string) {
    this._id = id;
    this._systemPrompt = systemPrompt;
    this._name = name;
  }

  get id(): string {
    return this._id;
  }

  get systemPrompt(): string {
    return this._systemPrompt;
  }

  get name(): string {
    return this._name;
  }
}
