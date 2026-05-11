import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-signage-play',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './signage-play.html',
  styleUrl: './signage-play.css',
})
export class SignagePlay implements OnInit {
  imageUrl = '';

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const hdate = params['hdate'];
      const jcd = params['jcd'];
      const rno = params['rno'];

      const rno2 = String(rno).padStart(2, '0');

      this.imageUrl = `http://127.0.0.1:8083/output/${hdate}/race/${hdate}_${jcd}_${rno2}R_race.png`;
    })
  }

}
