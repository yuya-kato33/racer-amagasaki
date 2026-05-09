import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Route } from '@angular/router';
import { TateraceSignage } from '../taterace-signage/taterace-signage';

@Component({
  selector: 'app-taterace-signage-race',
  standalone: true,
  imports: [CommonModule, TateraceSignage],
  templateUrl: './taterace-signage-race.html',
  styleUrl: './taterace-signage-race.css',
})

export class TateraceSignageRace implements OnInit {
  racers: any[] = [];

  constructor(private http: HttpClient, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const hdate = params['hdate'];
      const jcd = params['jcd'];
      const rno = params['rno'];

      this.http.get<any[]>(`/api/race?hdate=${hdate}&jcd=${jcd}&rno=${rno}`)
        .subscribe(data => {

          // 艇番順にソート
          this.racers = [...data].sort(
            (a, b) => Number(a.teiban) - Number(b.teiban)
          );
        });
    });
  }

}
