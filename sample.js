function loopA() {
    setTimeout(()=>{
        console.log("HelloWorld") ;
    },1000); //あえて時間がかかるように表示

}
function loopB() {
    console.log("GoodMorning");
}

loopA();
loopB();


