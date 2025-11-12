<?php
// api/telegram.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Konfigurasi Telegram Bot
$TELEGRAM_BOT_TOKEN = "8524645623:AAFyGDE4WgyGbN28yCEsr1naVVpPslEblUA";
$TELEGRAM_CHAT_ID = "7706220321";

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['text'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

$text = $input['text'];
$parse_mode = isset($input['parse_mode']) ? $input['parse_mode'] : 'HTML';

// Kirim ke Telegram
$url = "https://api.telegram.org/bot{$TELEGRAM_BOT_TOKEN}/sendMessage";
$data = [
    'chat_id' => $TELEGRAM_CHAT_ID,
    'text' => $text,
    'parse_mode' => $parse_mode
];

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $data,
    CURLOPT_TIMEOUT => 10
]);

$response = curl_exec($ch);
curl_close($ch);

echo json_encode(['status' => 'success']);
?>
