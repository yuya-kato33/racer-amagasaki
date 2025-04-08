// webサーバー

const http =require("http");

const server = http.createServer((req,res) => {
    // ここに処理を記述 外部アクセスを受け取り待って、返す
    res.writeHead(200,{ "content-Type":"text/html; charset=utf-8"});
    res.write( "<h1>Hello World</h1>");
    res.end();
});

const port =8080;
server.listen(port);
console.log("server listen on port" + port);

