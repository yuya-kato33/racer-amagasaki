# traning
 ## test

# 起動方法
## node server.js
## ng buildhng

# 振興会サーバー確認の例　nslookup　2025/07/28
C:\git\race-result-signage>nslookup xml-sv.boatrace.jp 
サーバー:  setup.netvolante.jp
Address:  192.168.1.1

権限のない回答:
名前:    e121498.a.akamaiedge.net
Addresses:  23.193.119.198
          23.193.119.197
Aliases:  xml-sv.boatrace.jp
          xml-sv.boatrace.jp.edgekey.net


## 依存関係壊れたとき
rmdir /s /q node_modules
del package-lock.json
npm install
npm install undici-types --save-dev
ng serve