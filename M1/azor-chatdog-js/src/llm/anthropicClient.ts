export class AnthropicLLMClient implements ILLMClient {
  constructor(modelName: string, apiKey: string) {
    this.modelName = modelName;
    this.apiKey = apiKey;
  }
}