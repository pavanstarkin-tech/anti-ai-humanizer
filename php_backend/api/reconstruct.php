<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../DocxProcessor.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['error' => 'POST method required'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['documentId']) || !isset($input['humanizedMap'])) {
    sendJsonResponse(['error' => 'Missing documentId or humanizedMap'], 400);
}

$documentId = $input['documentId'];
$humanizedMap = $input['humanizedMap']; // associative array [originalText => humanizedText]

// Find original file in UPLOAD_DIR
$matchingFiles = glob(UPLOAD_DIR . $documentId . '_*.docx');
if (empty($matchingFiles)) {
    sendJsonResponse(['error' => 'Source document not found for id ' . $documentId], 404);
}

$sourceDocxPath = $matchingFiles[0];
$baseName = pathinfo($sourceDocxPath, PATHINFO_FILENAME);
$outDocxFileName = $baseName . '_humanized.docx';
$outDocxPath = OUTPUT_DIR . $outDocxFileName;

$outTxtFileName = $baseName . '_humanized_report.txt';
$outTxtPath = OUTPUT_DIR . $outTxtFileName;

try {
    // 1. Reconstruct DOCX in-place
    $result = DocxProcessor::reconstructInPlace($sourceDocxPath, $outDocxPath, $humanizedMap);

    // 2. Generate comparison TXT report
    $txtContent = "================================================================================\n";
    $txtContent .= "HUMANIZATION REPORT: {$baseName}\n";
    $txtContent .= "Generated via PHP Hostinger Backend with In-Place Table & Layout Preservation\n";
    $txtContent .= "Timestamp: " . date('c') . "\n";
    $txtContent .= "================================================================================\n\n";

    $pNum = 0;
    foreach ($humanizedMap as $orig => $hum) {
        $pNum++;
        $txtContent .= "--------------------------------------------------------------------------------\n";
        $txtContent .= "PARAGRAPH {$pNum}\n";
        $txtContent .= "--------------------------------------------------------------------------------\n";
        $txtContent .= "[HUMANIZED]:\n{$hum}\n\n";
        $txtContent .= "[ORIGINAL]:\n{$orig}\n\n";
    }

    file_put_contents($outTxtPath, $txtContent);

    // Determine download URLs based on current host
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
    $host = $_SERVER['HTTP_HOST'] ?? 'acheva.in';
    $baseUrl = $protocol . $host . '/humanizer-api';

    sendJsonResponse([
        'success' => true,
        'docxFile' => $outDocxFileName,
        'txtFile' => $outTxtFileName,
        'replacedParagraphs' => $result['replacedParagraphs'],
        'downloadDocxUrl' => $baseUrl . '/api/download.php?file=' . urlencode($outDocxFileName),
        'downloadTxtUrl' => $baseUrl . '/api/download.php?file=' . urlencode($outTxtFileName),
    ]);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
