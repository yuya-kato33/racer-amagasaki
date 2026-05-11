import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-signage-play',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './signage-play.html',
  styleUrl: './signage-play.css',
})
export class SignagePlay implements OnInit, OnDestroy {
  imageUrl = '';

  currentRace = 1;

  private timer: any;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    // 初回
    this.loadState();

    // 5秒ごと更新
    this.timer = setInterval(() => {
      this.loadState();
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);

    }
  }

  loadState(): void {
    this.http.get<any>('http://127.0.0.1:8083/api/signage-state').subscribe({
      next: state => {
        const rno2 = String(state.currentRace).padStart(2, '0');

        this.currentRace = state.currentRace;

        this.imageUrl = `http://127.0.0.1:8083/output/${state.hdate}/race/${state.hdate}_${state.jcd}_${rno2}R_race.png`;

        console.log('signage image=', this.imageUrl);
      },
      error: err => {
        console.error('signage-state error', err);
      }
    });
  }

  onImageError(): void {
    console.error('画像読み込み失敗:', this.imageUrl);
  }
}
