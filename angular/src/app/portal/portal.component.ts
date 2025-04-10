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
   this.names = ["Ono" , "Yono","Masuda"];

 }

//追加
public screenTransit(){
  console.log("check");
  this.router.navigate(["portal2"]);
} 

}

