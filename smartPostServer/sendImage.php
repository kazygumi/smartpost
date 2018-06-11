<?php

if(isset($_FILES["img"])){
	saveImage();
}else{
	echo 'no img<br>';
}

function saveImage() {
    //タイムゾーン指定
	date_default_timezone_set('Asia/Tokyo');
	//日付取得
	$today = date("YmdHis");   
	//ファイル名
	$dir = './images/';
	$extension = '.jpg';
	$fileName = $dir.$today.$extension;

	//POSTされた画像データの取得
	$img = file_get_contents($_FILES['img']['tmp_name']);
	
	file_put_contents($fileName, $img);
	
	sendImage($fileName);
}

function sendImage($fileName) {
	
	// 宛て先アドレス
	$mailTo      = 'smartpost@kazy.jp';
	// メールのタイトル
	$mailSubject = '[SMART POST]';
	// メール本文
	$mailMessage = 'はがきが投函されました';
	// 差出人のメールアドレス
	$mailFrom    = 'smartpost@kazy.jp';
	// Return-Pathに指定するメールアドレス
	$returnMail  = 'smartpost@kazy.jp';
	 
	// メールで日本語使用するための設定をします。
	mb_language("Ja") ;
	mb_internal_encoding("UTF-8");
	 
	$header  = "From: $mailFrom\r\n";
	$header .= "MIME-Version: 1.0\r\n";
	$header .= "Content-Type: multipart/mixed; boundary=\"__PHPRECIPE__\"\r\n";
	$header .= "\r\n";
	 
	$body  = "--__PHPRECIPE__\r\n";
	$body .= "Content-Type: text/plain; charset=\"ISO-2022-JP\"\r\n";
	$body .= "\r\n";
	$body .= $mailMessage . "\r\n";
	$body .= "--__PHPRECIPE__\r\n";
	 
	// 添付ファイルへの処理をします。
	$handle = fopen($fileName, 'r');
	$attachFile = fread($handle, filesize($fileName));
	fclose($handle);
	$attachEncode = base64_encode($attachFile);
	 
	$body .= "Content-Type: image/jpeg; name=\"$file\"\r\n";
	$body .= "Content-Transfer-Encoding: base64\r\n";
	$body .= "Content-Disposition: attachment; filename=\"$file\"\r\n";
	$body .= "\r\n";
	$body .= chunk_split($attachEncode) . "\r\n";
	$body .= "--__PHPRECIPE__--\r\n";
	 
	// メールの送信と結果の判定をします。セーフモードがOnの場合は第5引数が使えません。
	if (ini_get('safe_mode')) {
		$result = mb_send_mail($mailTo, $mailSubject, $body, $header);
	} else {
		$result = mb_send_mail($mailTo, $mailSubject, $body, $header,'-f' . $returnMail);
	}
	 
	if($result){
		   echo 'メール送信成功';
	}else{
		   echo 'メール送信失敗';
	}
}

?>