<?php
// Lynote-AI Anti-Detection Vocabulary Sanitizer & Rhythm Enhancer

class LynoteSanitizer {
    private static $replacements = [
        '/\bdelve\s+into\b/i' => 'examine',
        '/\bdelve\b/i' => 'explore',
        '/\btapestry\s+of\b/i' => 'complex web of',
        '/\btapestry\b/i' => 'blend',
        '/\btestament\s+to\b/i' => 'proof of',
        '/\bvital\s+role\b/i' => 'key role',
        '/\bpivotal\s+role\b/i' => 'central role',
        '/\bcrucial\s+role\b/i' => 'critical role',
        '/\bparamount\b/i' => 'vital',
        '/\bbeacon\s+of\b/i' => 'symbol of',
        '/\bmultifaceted\b/i' => 'complex',
        '/\bintricate\b/i' => 'detailed',
        '/\bnuanced\b/i' => 'subtle',
        '/\bholistic\s+approach\b/i' => 'broad approach',
        '/\bholistic\b/i' => 'complete',
        '/\bleverage\b/i' => 'use',
        '/\bleveraging\b/i' => 'using',
        '/\butilize\b/i' => 'use',
        '/\butilizing\b/i' => 'using',
        '/\butilization\b/i' => 'use',
        '/\bseamless\b/i' => 'smooth',
        '/\bseamlessly\b/i' => 'smoothly',
        '/\brobust\b/i' => 'strong',
        '/\bfoster\b/i' => 'encourage',
        '/\bfostering\b/i' => 'encouraging',
        '/\bcornerstone\b/i' => 'foundation',
        '/\blinspin\b/i' => 'core part',
        '/\bgame-changer\b/i' => 'major shift',
        '/\brevolutionize\b/i' => 'transform',
        '/\bembark\s+on\b/i' => 'start',
        '/\bin\s+the\s+realm\s+of\b/i' => 'in',
        '/\bit\s+is\s+worth\s+noting\s+that\b/i' => 'notably,',
        '/\bit\s+is\s+important\s+to\s+note\s+that\b/i' => 'importantly,',
        '/\bfirst\s+and\s+foremost\b/i' => 'first,',
        '/\bin\s+conclusion\b/i' => 'overall',
        '/\bto\s+summarize\b/i' => 'in short',
        '/\bmoreover\b/i' => 'also',
        '/\bfurthermore\b/i' => 'plus',
        '/\badditionally\b/i' => 'also',
        '/\brapidly\s+permeated\b/i' => 'swiftly woven into',
        '/\bintrinsically\s+tied\b/i' => 'deeply entangled',
        '/\bunder\s+the\s+guise\s+of\b/i' => 'while claiming',
    ];

    public static function process($text) {
        if (empty($text) || !is_string($text)) {
            return '';
        }

        $result = $text;

        // 1. Vocabulary Replacements
        foreach (self::$replacements as $pattern => $replacement) {
            $result = preg_replace($pattern, $replacement, $result);
        }

        // 2. Sentence rhythm and cadence variation (introduce natural em-dashes for compound clauses)
        $result = preg_replace('/(\w+),\s+(which|where|when)\s+/i', '$1—$2 ', $result);

        // 3. Clean extra spaces
        $result = preg_replace('/[ \t]+/', ' ', $result);
        return trim($result);
    }
}
