import { nvidiaClient } from '../apps/api/src/modules/ai/nvidia/nvidia.client.ts';
import { PROMPT_REGISTRY } from '../apps/api/src/config/constants.ts';

async function testPrompt() {
  const userText = `We are pleased to inform you that your application has been successfully received. It will now be reviewed by our team, and you will be notified once the review process has been completed.`;

  console.log('Sending test prompt to openai/gpt-oss-20b...');
  const res = await nvidiaClient.chatCompletion({
    model: 'openai/gpt-oss-20b',
    messages: [
      { role: 'system', content: PROMPT_REGISTRY.SYSTEM_HUMANIZATION },
      { role: 'user', content: userText }
    ],
    temperature: 0.8,
    top_p: 0.9,
    max_tokens: 4096
  });

  const choice = res.choices[0];
  console.log('\n--- REASONING CONTENT ---');
  console.log(choice.message.reasoning_content || 'None');
  console.log('\n--- REWRITTEN OUTPUT ---');
  console.log(choice.message.content);
}

testPrompt().catch(console.error);
