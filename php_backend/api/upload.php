<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../DocxProcessor.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['error' => 'POST method required'], 405);
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    sendJsonResponse(['error' => 'No valid DOCX file uploaded'], 400);
}

$uploadedFile = $_FILES['file'];
$ext = strtolower(pathinfo($uploadedFile['name'], PATHINFO_EXTENSION));

if ($ext !== 'docx') {
    sendJsonResponse(['error' => 'Only .docx files are supported'], 400);
}

$fileId = uniqid('doc_', true);
$targetFileName = $fileId . '_' . preg_replace('/[^a-zA-Z0-9_\.-]/', '_', $uploadedFile['name']);
$targetPath = UPLOAD_DIR . $targetFileName;

if (!move_uploaded_file($uploadedFile['tmp_name'], $targetPath)) {
    sendJsonResponse(['error' => 'Failed to save uploaded file'], 500);
}

try {
    $parsed = DocxProcessor::extractElements($targetPath);

    $bodyParagraphs = [];
    $paraIndex = 0;

    foreach ($parsed['elements'] as $elem) {
        if ($elem['type'] === 'paragraph' && !empty($elem['text'])) {
            $t = $elem['text'];
            $isHeading = (
                strlen($t) < 60 ||
                preg_match('/^[0-9]+(\.[0-9]+)*\s+[A-Z]/', $t) ||
                stripos($t, 'Table ') === 0 ||
                stripos($t, 'Figure ') === 0 ||
                stripos($t, 'Keywords:') === 0 ||
                strtolower($t) === 'abstract' ||
                stripos($t, 'references') === 0
            );

            $paraIndex++;
            $bodyParagraphs[] = [
                'index' => $paraIndex,
                'text' => $t,
                'isHeading' => $isHeading,
                'charCount' => strlen($t),
                'shouldHumanize' => !$isHeading && strlen($t) >= 60,
            ];
        }
    }

    sendJsonResponse([
        'success' => true,
        'documentId' => $fileId,
        'originalFilename' => $uploadedFile['name'],
        'storedFilePath' => $targetPath,
        'tablesCount' => $parsed['tablesCount'],
        'totalParagraphs' => count($bodyParagraphs),
        'humanizableParagraphs' => count(array_filter($bodyParagraphs, fn($p) => $p['shouldHumanize'])),
        'paragraphs' => $bodyParagraphs,
    ]);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
