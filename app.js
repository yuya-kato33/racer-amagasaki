// webサーバー

const http =require("http");

const server = http.createServer((req,res) => {
    // ここに処理を記述 外部アクセスを受け取り待って、返す→ex. localhost:8080にアクセス→8行目 "hello world"を表示
    res.writeHead(200,{ "content-Type":"text/html; charset=utf-8"});
    res.write( "<h1>こんばんは</h1>"); //表示される言葉を入れる
    res.end();
});

const port =8080; //port番号 6000は使えない　
server.listen(port);
console.log("server listen on port" + port);


