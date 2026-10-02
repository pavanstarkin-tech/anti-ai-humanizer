<?php
require_once __DIR__ . '/../config.php';

$zipAvailable = class_exists('ZipArchive');
$curlAvailable = function_exists('curl_init');

// Test NVIDIA API connection
$ch = curl_init(NVIDIA_BASE_URL);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . NVIDIA_API_KEY,
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'model' => NVIDIA_MODEL,
    'messages' => [['role' => 'user', 'content' => 'Say OK']],
    'max_tokens' => 10,
]));
curl_setopt($ch, CURLOPT_TIMEOUT, 5);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$nvidiaOk = ($httpCode >= 200 && $httpCode < 300);

sendJsonResponse([
    'status' => 'healthy',
    'php_version' => PHP_VERSION,
    'zip_archive' => $zipAvailable,
    'curl' => $curlAvailable,
    'nvidia_api' => [
        'status' => $nvidiaOk ? 'connected' : 'error',
        'http_code' => $httpCode,
        'model' => NVIDIA_MODEL,
    ],
    'timestamp' => date('c'),
]);
