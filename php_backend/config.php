<?php
// PHP Backend Configuration for Anti-AI Humanizer

define('NVIDIA_API_KEY', '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');
define('NVIDIA_BASE_URL', 'https://integrate.api.nvidia.com/v1/chat/completions');
define('NVIDIA_MODEL', 'openai/gpt-oss-20b');

define('BASE_DIR', __DIR__);
define('UPLOAD_DIR', __DIR__ . '/storage/uploads/');
define('OUTPUT_DIR', __DIR__ . '/storage/output/');

if (!file_exists(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0777, true);
}
if (!file_exists(OUTPUT_DIR)) {
    mkdir(OUTPUT_DIR, 0777, true);
}

function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    http_response_code(200);
    exit;
}
