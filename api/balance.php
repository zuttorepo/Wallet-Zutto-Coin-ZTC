<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);
header('Content-Type: application/json');

$conn = new mysqli("sql107.infinityfree.com", "if0_39159903", "ZuttoCoinWallet", "if0_39159903_zuttocoinrpc");

$address = $conn->real_escape_string($_GET['address']);
$res = $conn->query("SELECT balance FROM wallets WHERE address = '$address'");

if ($row = $res->fetch_assoc()) {
  echo json_encode(["balance" => $row['balance']]);
} else {
  echo json_encode(["balance" => 0]);
}

$conn->close();
