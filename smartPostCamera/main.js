(function () {
    'use strict';
    
    var CAMERA_DELAY_TIME = 1000,
        SENDIMAGE_HOST_URL = "http://kazy.jp/smartPost/sendImage.php",
        server = new GetServer(),
        camera,
        storage,
        previewVideo,
        captureBtn,
        statusLabel,
        httpdMsg,
        isRecording = false;

    function objectDumper(_object) {
        var _msg;
        //オブジェクトのループ
        for (var i in _object){
            _msg = _msg + "[" + i + "] " + _object[i] + "<br />";
        }
        return _msg;
    }
    
    /*
     * カメラを開放
     */
    function releaseCamera() {
        console.log('releaseCamera');

        if (camera) {
            camera.release();
        }
        
        isRecording = false;
        
        statusLabel.innerHTML = httpdMsg;
    }
    
    /*
     * カメラを取得
     */
    function getCamera() {
        console.log('getCamera');
        statusLabel.innerHTML = 'カメラを取得';
        
        // getListOfCameras()は背面カメラ、前面カメラの順に配列が返る
        var _type = navigator.mozCameras.getListOfCameras()[0];

        // カメラ取得時のオプション
        var _options = {
            mode: 'picture',
            recorderProfile: 'jpg',
            previewSize: {
                width: 1280,
                height: 720
            }
        };

        function _onSuccess(__camera) {
            console.log('getCamera:success', __camera);
            statusLabel.innerHTML = 'カメラ取得成功';
            
            camera = __camera;

            // プレビューの再生
            previewVideo.mozSrcObject = __camera;
            previewVideo.play();
            
            // オートフォーカスへ
            var _timeoutID = null;
            _timeoutID = setTimeout(autoFocus, CAMERA_DELAY_TIME);
        }

        function _onError(__error) {
            console.warn('getCamera:error', __error);
            statusLabel.innerHTML = 'カメラ取得失敗';
        }

        //念のため一度リリース
        releaseCamera();
        
        isRecording = true;
        
        //カメラを取得する（Firefox OS 2.1まで）
        navigator.mozCameras.getCamera(_type, _options, _onSuccess, _onError);
    }

    /*
     * オートフォーカス
     */
    function autoFocus() {
        console.log('captureStart');
        statusLabel.innerHTML = 'オートフォーカス';
        
        if (!camera) {return;}

        function _onSuccess(__success) {
            console.log('autoFocus:success', __success);
            statusLabel.innerHTML = 'オートフォーカス成功';
            
            //撮影へ
            var _timeoutID = null;
            _timeoutID = setTimeout(takePicture, CAMERA_DELAY_TIME);
        }

        function _onError(__error) {
            console.warn('autoFocus:error', __error);
            statusLabel.innerHTML = 'オートフォーカス失敗';
        }

        camera.autoFocus(_onSuccess, _onError);
    }

    /*
     * 撮影
     */
    function takePicture() {
        console.log('captureEnd');
        statusLabel.innerHTML = '撮影';
        
        if (!camera) return;

        var _options = {
            pictureSize: camera.capabilities.pictureSizes[0], // 最大サイズ
            fileFormat: 'jpeg'
        };

        function _onSuccess(__file) {
            console.log('takePicture:success', __file);
            statusLabel.innerHTML = '撮影成功';

            //画像をストレージへ保存
            var __filename = 'SmartPost_' + Date.now() + '.jpg';
            storage.addNamed(__file, __filename);
            
            statusLabel.innerHTML = __filename + ' に保存';
            
            //画像送信へ
            var _timeoutID = null;
            _timeoutID = setTimeout(function(){sendImage(__file);}, CAMERA_DELAY_TIME);
        }

        function _onError(__error) {
            console.log('takePicture:error', __error);
            statusLabel.innerHTML = '撮影失敗';
        }

        camera.takePicture(_options, _onSuccess, _onError);
    }
    
    /*
     * 画像送信
     */
    function sendImage(_file){
        console.log('sendImage', _file);
        statusLabel.innerHTML = '画像を送信';
        
        var _formData = new FormData();
		_formData.append('img', _file);
        
        
        var _xhr = new XMLHttpRequest({mozSystem: true});
        _xhr.open("POST", SENDIMAGE_HOST_URL, true);
        _xhr.onload = function (_e) {
            console.log('response: '+_xhr.response);
            statusLabel.innerHTML = '送信成功<br>サーバーレスポンス：'+_xhr.response;
            //カメラリリースへ
            var _timeoutID = null;
            _timeoutID = setTimeout(releaseCamera, CAMERA_DELAY_TIME);
        };
        _xhr.onreadystatechange = function (){
            switch(_xhr.readyState){
            case 1:
                console.log("XMLHttpRequest:onreadystatechange 1");
                statusLabel.innerHTML = '呼出完了';
                break;
            case 2:
                console.log("XMLHttpRequest:onreadystatechange 2");
                statusLabel.innerHTML = 'レスポンスヘッダ受信完了';
                break;
            case 3:
                console.log("XMLHttpRequest:onreadystatechange 3");
                statusLabel.innerHTML = 'レスポンスボディ受信中';
                break;
            case 4:
                console.log("XMLHttpRequest:onreadystatechange 4");
                statusLabel.innerHTML = '通信完了';
                break;
            };
        };
        _xhr.onerror = function (e) {
            console.log("XMLHttpRequest:onerror" + _xhr.statusText);
            statusLabel.innerHTML = _xhr.statusText;
        };

        _xhr.send(_formData);
    }
    
    function getIPAddress() {
        /*
        if(server.ipAddress == ""){
            var _timeoutID = null;
            _timeoutID = setTimeout(getIPAddress, 4000);
        }else{
            httpdMsg = 'Running on ' + server.ipAddress + ':' + server.portNumber;
            statusLabel.innerHTML = httpdMsg;
        }
        */
        
        
        httpdMsg = 'Running on ' + server.ipAddress + ':' + server.portNumber;
        statusLabel.innerHTML = httpdMsg;
    }
    
    
    /*
     * 初期化
     */
    function init() {
        
        //GETサーバー初期化イベント
        server.open(function onOpened() {
            //IPアドレスを表示
            httpdMsg = 'Running on ' + server.ipAddress + ':' + server.portNumber;
            statusLabel = document.getElementById('statusLabel');
            statusLabel.innerHTML = httpdMsg;
            
                var _timeoutID = null;
                _timeoutID = setTimeout(getIPAddress, 20000);
            
        });

        //GETサーバークエリー取得イベント
        server.onData = function (_data) {
            //デバック
            var _now = new Date().toString(),
                _strData = JSON.stringify(_data, undefined, '  ');
            console.log(_now + '\n' + _strData);

            if (_data.isSwitch == "1") {
                // カメラの取得
                if(isRecording == false){
                    getCamera();
                }
            }
        };
        
        storage = navigator.getDeviceStorage('pictures');
        previewVideo = document.getElementById('preview');
        
    }
    
    window.addEventListener('unload', releaseCamera, false);
    window.addEventListener('DOMContentLoaded', init, false);
    
})();
