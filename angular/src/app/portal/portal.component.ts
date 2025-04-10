import { Component } from '@angular/core'; 

@Component({
  selector: 'app-portal',
  imports: [],
  templateUrl: './portal.component.html',
  styleUrl: './portal.component.sass'
})
export class PortalComponent {
 constructor() {}

public name: any;

 ngOnInit(): void {
   this.name = "KATO";

 }
}

