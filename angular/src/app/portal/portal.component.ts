import { Component, NgModule } from '@angular/core'; 
import { Router } from '@angular/router'; //追加
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-portal',
  imports: [CommonModule],
  templateUrl: './portal.component.html',
  styleUrl: './portal.component.sass'
})

export class PortalComponent {
 constructor(

  private router:Router //追加

 ) {}

public name: any;
public names= new Array;

 ngOnInit(): void {
   this.name = "KATO";
   this.names = [{number:0, name:"Ono" }, 
                  {number:1, name:"Yono"},
                  {number:2, name:"Masuda"}, 
                  {number:3, name:"Watanabe"},
                  {number:4, name:"Horie"}
                ]; //項目追加
   for (let i = 0; i < this.names.length; i++) { //最大値変えないと →lengthにしてみよう
   console.log (this.names[i].name); //0番の名前部分を抽出
  
   }
 }

//追加
public screenTransit(){
  console.log("check");
  this.router.navigate(["portal2"]);
} 

}

