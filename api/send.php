<?php
header('Content-Type: application/json');
$data = json_decode(file_get_contents("php://input"), true);
$from = $data['from'];
$to = $data['to'];
$amount = floatval($data['amount']);

$conn = new mysqli("sql107.infinityfree.com", "if0_39159903", "ZuttoCoinWallet", "if0_39159903_XXX");
if ($conn->connect_error) {
  echo json_encode(["status" => "fail", "message" => "DB connection failed"]);
  exit;
}

$conn->begin_transaction();

try {
  // Kurangi dari pengirim
  $stmt1 = $conn->prepare("UPDATE wallets SET balance = balance - ? WHERE address = ? AND balance >= ?");
  $stmt1->bind_param("dss", $amount, $from, $amount);
  $stmt1->execute();

  if ($stmt1->affected_rows === 0) throw new Exception("Saldo tidak cukup");

  // Tambah ke penerima
  $stmt2 = $conn->prepare("INSERT INTO wallets (address, balance) VALUES (?, ?) ON DUPLICATE KEY UPDATE balance = balance + VALUES(balance)");
  $stmt2->bind_param("sd", $to, $amount);
  $stmt2->execute();

  $conn->commit();
  echo json_encode(["status" => "success", "txid" => uniqid("TX")]);
} catch (Exception $e) {
  $conn->rollback();
  echo json_encode(["status" => "fail", "message" => $e->getMessage()]);
}
