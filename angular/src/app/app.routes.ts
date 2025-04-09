import { Routes } from '@angular/router';
import {PortalComponent} from "../app/portal/portal.component"
import {Portal2Component} from "../app/portal2/portal2.component"


export const routes: Routes = 
[
 {path:"",component:PortalComponent,title:"portal"},
 {path:"portal2",component:Portal2Component,title:"portal2"}

];

