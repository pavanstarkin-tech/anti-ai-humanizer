<?php
require_once __DIR__ . '/../config.php';

$file = $_GET['file'] ?? '';

// Sanitize filename to prevent directory traversal
$file = basename($file);

if (empty($file)) {
    http_response_code(400);
    die('Missing file parameter');
}

$filePath = OUTPUT_DIR . $file;

if (!file_exists($filePath)) {
    http_response_code(404);
    die('File not found');
}

$ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));

if ($ext === 'docx') {
    header('Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document');
} elseif ($ext === 'txt') {
    header('Content-Type: text/plain; charset=utf-8');
} else {
    header('Content-Type: application/octet-stream');
}

header('Content-Disposition: attachment; filename="' . $file . '"');
header('Content-Length: ' . filesize($filePath));
header('Cache-Control: no-cache, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

readfile($filePath);
exit;
