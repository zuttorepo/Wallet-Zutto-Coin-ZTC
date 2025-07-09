<?php
// === CORS Headers ===
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);
header('Content-Type: application/json');

// === DB Connect ===
$conn = new mysqli("sql107.infinityfree.com", "if0_39159903", "ZuttoCoinWallet", "if0_39159903_zuttocoinrpc");

// === Input ===
$data = json_decode(file_get_contents("php://input"), true);
$address = $conn->real_escape_string($data['address']);
$amount = 10; // Default faucet

// === Insert or Update ===
$sql = "INSERT INTO wallets (address, balance) VALUES ('$address', $amount)
        ON DUPLICATE KEY UPDATE balance = balance + $amount";

if ($conn->query($sql) === TRUE) {
  $res = $conn->query("SELECT balance FROM wallets WHERE address = '$address'");
  $balance = $res->fetch_assoc()['balance'];
  echo json_encode(["balance" => $balance]);
} else {
  echo json_encode(["error" => "DB Error"]);
}

$conn->close();
