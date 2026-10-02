import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  PORT: z.string().default('4000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().default('mysql://root:password@localhost:3306/humanizer_db'),
  JWT_SECRET: z.string().default('dev-jwt-super-secret-key-with-minimum-32-characters-length'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  STORAGE_PATH: z.string().default('./uploads'),
  MAX_FILE_SIZE_BYTES: z.string().default('26214400').transform((val) => parseInt(val, 10)),

  // NVIDIA AI Multi-Model Infrastructure
  NVIDIA_API_BASE_URL: z.string().default('https://integrate.api.nvidia.com/v1'),
  NVIDIA_API_KEY: z.string().default(''),
  USE_MOCK_NVIDIA: z.string().default('false').transform((val) => val === 'true'),

  // Role-to-Model Default Mappings
  NVIDIA_CLASSIFIER_MODEL: z.string().default('meta/llama-3.3-70b-instruct'),
  NVIDIA_GENERAL_WRITER_MODEL: z.string().default('meta/llama-3.3-70b-instruct'),
  NVIDIA_MEDICAL_MODEL: z.string().default('meta/llama-3.3-70b-instruct'),
  NVIDIA_SCIENTIFIC_MODEL: z.string().default('mistralai/mistral-large-2-instruct'),
  NVIDIA_LEGAL_MODEL: z.string().default('meta/llama-3.3-70b-instruct'),
  NVIDIA_TECHNICAL_MODEL: z.string().default('deepseek-ai/deepseek-r1'),
  NVIDIA_NATURALNESS_EVALUATOR_MODEL: z.string().default('meta/llama-3.3-70b-instruct'),
  NVIDIA_MEANING_EVALUATOR_MODEL: z.string().default('meta/llama-3.3-70b-instruct'),
  NVIDIA_FACT_EVALUATOR_MODEL: z.string().default('deepseek-ai/deepseek-r1'),
  NVIDIA_REFINEMENT_MODEL: z.string().default('mistralai/mistral-large-2-instruct'),

  // Quality & Iteration Parameters
  MAX_ITERATIONS: z.string().default('5').transform((val) => parseInt(val, 10)),
  CANDIDATE_COUNT: z.string().default('3').transform((val) => parseInt(val, 10)),
  QUALITY_TARGET: z.string().default('80').transform((val) => parseInt(val, 10)),
  MIN_MEANING_PRESERVATION: z.string().default('85').transform((val) => parseInt(val, 10)),
  MIN_FACTUAL_CONSISTENCY: z.string().default('85').transform((val) => parseInt(val, 10)),
  MIN_TERMINOLOGY_SCORE: z.string().default('80').transform((val) => parseInt(val, 10)),
  MIN_CITATION_SCORE: z.string().default('90').transform((val) => parseInt(val, 10)),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform((val) => parseInt(val, 10)),
  RATE_LIMIT_MAX: z.string().default('300').transform((val) => parseInt(val, 10)),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables configuration:', parsed.error.format());
  process.exit(1);
}

export const ENV = parsed.data;
