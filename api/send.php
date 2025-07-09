<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);
header('Content-Type: application/json');

$conn = new mysqli("sql107.infinityfree.com", "if0_39159903", "ZuttoCoinWallet", "if0_39159903_zuttocoinrpc");

$data = json_decode(file_get_contents("php://input"), true);
$from = $conn->real_escape_string($data['from']);
$to = $conn->real_escape_string($data['to']);
$amount = floatval($data['amount']);

if ($amount <= 0) {
  echo json_encode(["status" => "fail", "message" => "Invalid amount"]);
  exit;
}

// Cek saldo
$res = $conn->query("SELECT balance FROM wallets WHERE address = '$from'");
if (!$res || $res->num_rows == 0) {
  echo json_encode(["status" => "fail", "message" => "Sender not found"]);
  exit;
}
$fromBalance = $res->fetch_assoc()['balance'];
if ($fromBalance < $amount) {
  echo json_encode(["status" => "fail", "message" => "Insufficient balance"]);
  exit;
}

// Proses transaksi
$conn->begin_transaction();
$conn->query("UPDATE wallets SET balance = balance - $amount WHERE address = '$from'");
$conn->query("INSERT INTO wallets (address, balance) VALUES ('$to', $amount)
              ON DUPLICATE KEY UPDATE balance = balance + $amount");
$conn->commit();

$txid = substr(sha1($from . $to . $amount . microtime()), 0, 16);
echo json_encode(["status" => "success", "txid" => $txid]);

$conn->close();
