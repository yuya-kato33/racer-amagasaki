function　func1() {
    return new Promise((resolve) => {
        setTimeout(()=>{
            console.log("HelloWorld") ;
            resolve(true);
        },1000);
    })
}
function func2(val) {
    console.log("GoodMorning", val);
}

function func3(){
    return func1().then((value) => {
        func2(value);
    });
}

func3();


// これもテストです、pullで反映します。