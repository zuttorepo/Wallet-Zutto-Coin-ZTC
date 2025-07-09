<?php
header('Content-Type: application/json');
$data = json_decode(file_get_contents("php://input"), true);
$address = $data['address'];

$conn = new mysqli("sql107.infinityfree.com", "if0_39159903", "ZuttoCoinWallet", "if0_39159903_XXX");

if ($conn->connect_error) {
  echo json_encode(["error" => "DB error"]); exit;
}

// Jika belum ada, buat wallet dengan balance default
$stmt = $conn->prepare("INSERT INTO wallets (address, balance) VALUES (?, 100) ON DUPLICATE KEY UPDATE balance = balance + 10");
$stmt->bind_param("s", $address);
$stmt->execute();

// Ambil saldo baru
$stmt = $conn->prepare("SELECT balance FROM wallets WHERE address = ?");
$stmt->bind_param("s", $address);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();

echo json_encode(["balance" => $row["balance"]]);
