<?php
header('Content-Type: application/json');
$address = $_GET['address'];

$conn = new mysqli("sql107.infinityfree.com", "if0_39159903", "ZuttoCoinWallet", "if0_39159903_XXX");

if ($conn->connect_error) {
  echo json_encode(["error" => "DB error"]); exit;
}

$stmt = $conn->prepare("SELECT balance FROM wallets WHERE address = ?");
$stmt->bind_param("s", $address);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
  echo json_encode(["balance" => $row["balance"]]);
} else {
  echo json_encode(["balance" => 0]);
}
