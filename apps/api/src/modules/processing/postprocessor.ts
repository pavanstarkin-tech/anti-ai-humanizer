/**
 * Post-processor integrated from lynote-ai/humanize-text
 * - AI vocabulary sanitization & replacement
 * - Sentence rhythm disruption & asymmetric burstiness
 * - Clean whitespace and placeholder preservation
 */

export const AI_VOCAB_REPLACEMENTS: Record<string, string[]> = {
  utilize: ['use', 'apply', 'work with'],
  facilitate: ['help', 'support', 'enable'],
  comprehensive: ['full', 'complete', 'thorough'],
  subsequently: ['then', 'after that', 'next'],
  furthermore: ['also', 'plus', 'on top of that'],
  demonstrate: ['show', 'prove', 'illustrate'],
  implement: ['build', 'set up', 'put in place'],
  leverage: ['use', 'take advantage of', 'tap into'],
  optimize: ['improve', 'fine-tune', 'make better'],
  paradigm: ['model', 'approach', 'framework'],
  synergy: ['teamwork', 'combined effect', 'collaboration'],
  methodology: ['method', 'approach', 'process'],
  innovative: ['new', 'creative', 'fresh'],
  streamline: ['simplify', 'speed up', 'smooth out'],
  unprecedented: ['never seen before', 'unheard of', 'groundbreaking'],
  transformative: ['game-changing', 'revolutionary', 'major'],
  ecosystem: ['environment', 'landscape', 'space'],
  scalable: ['flexible', 'expandable', 'growable'],
  robust: ['strong', 'solid', 'reliable'],
  'cutting-edge': ['latest', 'advanced', 'modern'],
  delve: ['dig into', 'explore', 'look at'],
  intricate: ['complex', 'detailed', 'involved'],
  pivotal: ['key', 'crucial', 'central'],
  encompasses: ['includes', 'covers', 'spans'],
  multifaceted: ['complex', 'varied', 'diverse'],
  realm: ['area', 'field', 'world'],
  commendable: ['impressive', 'notable', 'praiseworthy'],
  meticulous: ['careful', 'thorough', 'precise'],
  paramount: ['essential', 'critical', 'top priority'],
  underscore: ['highlight', 'stress', 'emphasize'],
  'a disturbing trend': ['a troubling pattern', 'an alarming trend'],
  'perpetuating and amplifying': ['deepening', 'magnifying', 'compounding'],
  'beneath the surface': ['underneath', 'behind the scenes'],
  'vital role': ['key part', 'major role'],
};

export class LynotePostProcessor {
  /**
   * Replace known AI cliches with natural human synonyms
   */
  public replaceAiVocabulary(text: string): string {
    let result = text;
    for (const [word, replacements] of Object.entries(AI_VOCAB_REPLACEMENTS)) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(result)) {
        const replacement = replacements[Math.floor(Math.random() * replacements.length)];
        result = result.replace(regex, replacement);
      }
    }
    return result;
  }

  /**
   * Disrupt monotonous sentence lengths by merging or varying cadence with em-dashes
   */
  public disruptSentenceRhythm(text: string, shortThreshold = 8): string {
    const paragraphs = text.split(/\n\s*\n/);
    const processedParagraphs = paragraphs.map((para) => {
      const sentences = para.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
      if (sentences.length < 3) return para;

      const result: string[] = [];
      let i = 0;
      while (i < sentences.length) {
        const currentWords = sentences[i].split(/\s+/).length;
        if (
          i + 1 < sentences.length &&
          currentWords < shortThreshold &&
          sentences[i + 1].split(/\s+/).length < shortThreshold &&
          !sentences[i].includes('[') &&
          !sentences[i + 1].includes('[')
        ) {
          const first = sentences[i].replace(/[.!?]+$/, '');
          const second = sentences[i + 1];
          const secondClean = second.charAt(0).toLowerCase() + second.slice(1);
          result.push(`${first} — ${secondClean}`);
          i += 2;
        } else {
          result.push(sentences[i]);
          i += 1;
        }
      }
      return result.join(' ');
    });

    return processedParagraphs.join('\n\n');
  }

  /**
   * Run full post-processing pipeline
   */
  public process(text: string): string {
    let output = this.replaceAiVocabulary(text);
    output = this.disruptSentenceRhythm(output);
    return output;
  }
}

export const lynotePostProcessor = new LynotePostProcessor();
