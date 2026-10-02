<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../LynoteSanitizer.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['error' => 'POST method required'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || (!isset($input['text']) && !isset($input['paragraphs']))) {
    sendJsonResponse(['error' => 'Missing text or paragraphs payload'], 400);
}

function callNvidiaHumanize($paragraphText) {
    $prompt = <<<PROMPT
ORIGINAL PARAGRAPH:
"""
{$paragraphText}
"""

REWRITE & HUMANIZE INSTRUCTIONS:
1. REPHRASE BOLDLY: Restructure sentence orders, convert passive verbs to active, and break up stiff robotic rhythms.
2. VARY CADENCE: Alternate between punchy short observations and smooth flowing sentences with natural conversational transitions.
3. REMOVE AI CLICHES: Eliminate stiff robotic jargon (e.g. "rapidly permeated", "intrinsically tied", "under the guise of", "delve", "testament to", "tapestry"). Use vibrant, natural, authentic wording instead.
4. ABSOLUTE FIDELITY: Keep all factual points, numbers, percentages, dates, scholar names, and protected citation tags (like [CITATION_001], [CITATION_002], [TABLE_001], etc.) 100% intact.
5. Return ONLY the rewritten text directly. No JSON, no markdown fences, no pleasantries.
PROMPT;

    $ch = curl_init(NVIDIA_BASE_URL);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . NVIDIA_API_KEY,
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'model' => NVIDIA_MODEL,
        'messages' => [
            ['role' => 'system', 'content' => 'You are an expert human author. Completely humanize and rewrite the text naturally while preserving 100% of facts and citations.'],
            ['role' => 'user', 'content' => $prompt]
        ],
        'temperature' => 0.85,
        'max_tokens' => 2048,
    ]));
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        throw new Exception("NVIDIA API request failed with HTTP {$httpCode}: {$response}");
    }

    $json = json_decode($response, true);
    $rawContent = $json['choices'][0]['message']['content'] ?? '';

    // Sanitize with Lynote-AI
    return LynoteSanitizer::process($rawContent);
}

// Single paragraph mode
if (isset($input['text'])) {
    try {
        $humanized = callNvidiaHumanize($input['text']);
        sendJsonResponse([
            'success' => true,
            'originalText' => $input['text'],
            'humanizedText' => $humanized,
        ]);
    } catch (Exception $e) {
        sendJsonResponse(['error' => $e->getMessage()], 500);
    }
}

// Batch paragraphs mode
if (isset($input['paragraphs']) && is_array($input['paragraphs'])) {
    $results = [];
    foreach ($input['paragraphs'] as $item) {
        $orig = is_array($item) ? ($item['text'] ?? '') : (string)$item;
        if (empty($orig) || strlen($orig) < 50) {
            $results[] = [
                'originalText' => $orig,
                'humanizedText' => $orig,
            ];
            continue;
        }

        try {
            $hum = callNvidiaHumanize($orig);
            $results[] = [
                'originalText' => $orig,
                'humanizedText' => $hum,
            ];
        } catch (Exception $e) {
            $results[] = [
                'originalText' => $orig,
                'humanizedText' => $orig,
                'error' => $e->getMessage(),
            ];
        }
    }

    sendJsonResponse([
        'success' => true,
        'total' => count($results),
        'results' => $results,
    ]);
}
