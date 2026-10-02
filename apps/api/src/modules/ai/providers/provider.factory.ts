import { IAIProvider } from './base.provider.js';
import { MockAIProvider } from './mock.provider.js';
import { NvidiaProviderAdapter } from './nvidia.provider.js';
import { ENV } from '../../../config/env.js';

export class ProviderFactory {
  private static mockInstance: MockAIProvider | null = null;
  private static nvidiaInstance: NvidiaProviderAdapter | null = null;

  public static getMockProvider(): MockAIProvider {
    if (!this.mockInstance) {
      this.mockInstance = new MockAIProvider();
    }
    return this.mockInstance;
  }

  public static getNvidiaProvider(): NvidiaProviderAdapter {
    if (!this.nvidiaInstance) {
      this.nvidiaInstance = new NvidiaProviderAdapter();
    }
    return this.nvidiaInstance;
  }

  public static getProvider(): IAIProvider {
    if (ENV.USE_MOCK_NVIDIA || ENV.NODE_ENV === 'test' || !ENV.NVIDIA_API_KEY) {
      return this.getMockProvider();
    }
    return this.getNvidiaProvider();
  }
}
