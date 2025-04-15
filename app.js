// webサーバー

const http =require("http");
const express = require('express')
const bodyParser = require('body-parser')

// const server = http.createServer((req,res) => {
//     // ここに処理を記述 外部アクセスを受け取り待って、返す→ex. localhost:8080にアクセス→8行目 "hello world"を表示
//     res.writeHead(200,{ "content-Type":"text/html; charset=utf-8"});
//     res.write( "<h1>こんばんは</h1>"); //表示される言葉を入れる
//     res.end();
// }); 

// サーバーの設定
const app = express(); //expressの初期化
const server = http.Server(app);

const port =8080; //port番号 6000は使えない　
server.listen(port);
console.log("server listen on port" + port);

// angularの指定
app.use (bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use('/',express.static('./angular/dist/angular/browser')); //出力をクライアントがアクセスできるようにする。

// ここから下はアプリによって変化
app.post('/api/portal', function(req,res){ //後ろの関数に1回だけなので関数名がないです。
    console.log("portalAccess!!", req.body); //reqのみだと、大量のデータが来ます。
    res.send({data:"SEND_DATA"});
    res.end();
});

