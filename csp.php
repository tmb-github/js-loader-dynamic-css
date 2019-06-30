<?php
// =============================
// CSP: CONTENT SECURITY POLICY:
// =============================

function generateRandomString($length = 10) {
	$characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	$charactersLength = strlen($characters);
	$randomString = '';
	for ($i = 0; $i < $length; $i++) {
		$randomString .= $characters[rand(0, $charactersLength - 1)];
	}
	return $randomString;
}

// return ' nonce-sha256-############################################', etc., unless $hash is empty string:
function hash_format($hash) {
	$formatted = $hash ? " '" . $hash . "'" : "";
	return $formatted;
}

$random_string = generateRandomString();
$hash = hash('sha256', $random_string, true);
$nonce = base64_encode($hash);

// We need to remove the final '=' from nonce, but for it to be a valid base64 number,
// the number of characters should be in multiples of 4, so delete the last 4 characters, not just the final "=":
$nonce = substr($nonce, 0, -4);
$nonce_src = hash_format('nonce-' . $nonce);
$inline_nonce_property = 'nonce="' . $nonce . '"';

$script_src = "script-src 'self' http: https:" . $nonce_src . " 'strict-dynamic' ; ";
$style_src = "style-src 'self'" . $nonce_src . " ; ";

$content_security_policy = "Content-Security-Policy: " . $script_src . $style_src;

header($content_security_policy);
?>
