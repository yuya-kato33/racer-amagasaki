import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Racer {
  hdate: string;
  jcd: string;
  toban: string;
  name: string;
  shibu: string;
  kyu: string;
  zsyo: string;
  z2ren: string;
  z3ren: string;
}

@Injectable({
  providedIn: 'root'
})
export class RacerService {

  constructor(private http: HttpClient) {}

  getRacers(hdate: string, jcd:string): Observable<Racer[]> {
    return this.http.get<Racer[]>(`/api/racers?hdate=${hdate}&jcd=${jcd}`);
  }
}
