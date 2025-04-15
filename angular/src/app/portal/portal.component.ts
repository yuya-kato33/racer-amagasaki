import { Component, NgModule } from '@angular/core'; 
import { Router } from '@angular/router'; //追加
import { CommonModule } from '@angular/common';
import { FormsModule } from "@angular/forms";
import { HttpClientModule,HttpClient} from '@angular/common/http';
import { response } from 'express';

@Component({
  selector: 'app-portal',
  imports: [CommonModule,FormsModule,HttpClientModule],
  templateUrl: './portal.component.html',
  styleUrl: './portal.component.sass'
})

export class PortalComponent {
 constructor(

  private router:Router ,
  private httpClient: HttpClient 

 ) {}

public name: any;
public names= new Array;
public result ="";

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

   this.httpClient.post('http://192.168.1.27:8080/api/portal',{"data":"testtesttest"})
   .subscribe(response => {
    console.log(response);
   });
 }

//追加
public screenTransit(){
  console.log("check");
  this.router.navigate(["portal2"]);
} 

}

