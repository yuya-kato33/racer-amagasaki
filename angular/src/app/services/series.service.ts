import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Series {
  hdate_source: string;
  jcd: string;
  jname: string;
  grade: string; 
  title: string;
  start_date: string;
  end_date: string;
  dates: string[];
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeriesService {

  constructor(private http: HttpClient) {}

  getSeries(startDate: string, jcd: string): Observable<Series> {
    return this.http.get<Series>(`/api/series/${startDate}/${jcd}`);
  }

  getRacersBySeries(startDate: string, jcd: string): Observable<any[]> {
    return this.http.get<any[]>(`/api/series/${startDate}/${jcd}/racers`);
  }
}
