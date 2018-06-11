(function () {
    'use strict';

    var ledPort,
        buttonPort,
        buttonStatus = 0,
        ledTimer,
        postTimer,
        SENDFIRE_HOST_URL = 'http://192.168.43.19';
    
    /*
    * LED On
    */
    function LedOn() {
        console.log("LedOn");
        ledPort.write(1);
        clearTimeout(ledTimer);
        ledTimer = setTimeout(LedOff, 4000);
        
        sendFire();
    }
    
    /*
    * LED Off
    */
    function LedOff() {
        console.log("LedOff");
        
    
        if(buttonStatus == 0){
            ledPort.write(0);
        }else{
            LedOn();
        }
        
    }
    
    /*
    * ファイヤーする
    */
    function sendFire() {
        console.log("sendFire");
        
        var _xhr = new XMLHttpRequest({mozSystem: true});
        //_xhr.open("GET", SENDFIRE_HOST_URL + '/put?isSwitch=1', true);
        _xhr.open("GET",'http://192.168.179.4/put?isSwitch=1', true);
        _xhr.onload = function (_e) {
            console.log('送信成功 response: '+_xhr.response);
        };
        
        _xhr.onreadystatechange = function (){
            switch(_xhr.readyState){
            case 1:
                console.log("XMLHttpRequest:onreadystatechange 1 呼出完了");
                break;
            case 2:
                console.log("XMLHttpRequest:onreadystatechange 2 レスポンスヘッダ受信完了");
                break;
            case 3:
                console.log("XMLHttpRequest:onreadystatechange 3 レスポンスボディ受信中");
                break;
            case 4:
                console.log("XMLHttpRequest:onreadystatechange 4 通信完了");
                break;
            };
        };
        _xhr.onerror = function (e) {
            console.log("XMLHttpRequest:onerror" + _xhr.statusText);
        };

        _xhr.send(null);
    }
    
    /*
    * 初期化
    */
    function init() {
        console.log("init");
        
        // WebGPIO push button
        navigator.requestGPIOAccess().then(
            function(gpioAccess) {
            console.log("GPIO ready!");
            return gpioAccess;
        }).then(gpio=>{
            ledPort = gpio.ports.get(198);
            buttonPort = gpio.ports.get(199);
            return Promise.all([
                ledPort.export("out"),
                buttonPort.export("in")
            ]).then(()=>{
                buttonPort.onchange = function(v){
                    console.log("buttonPort: " + v);
                    buttonStatus = v;
                    if(buttonStatus == 1){
                        clearTimeout(postTimer);
                        postTimer = setTimeout(LedOn, 4000);
                    }
                    
                }
            });
        }).catch(error=>{
        console.log("Failed to get GPIO access catch: " + error.message);
        });
    }

    window.addEventListener('DOMContentLoaded', init, false);
    
})();