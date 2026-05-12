import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-play-youtube',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './play-youtube.html',
  styleUrl: './play-youtube.css',
})
export class PlayYoutube implements OnInit, OnDestroy {
  imageUrl = '';
  youtubeLiveUrl: SafeResourceUrl | null = null;

  currentRace = 1;

  private timer: any;

  private lastImageUrl = '';
  private lastYoutubeUrl = '';

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) { }

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
    // this.http.get<any>('http://127.0.0.1:8083/api/signage-state').subscribe({
    this.http.get<any>('/api/signage-state').subscribe({
      next: state => {
        const rno2 = String(state.currentRace).padStart(2, '0');

        this.currentRace = state.currentRace;

        // const nextImageUrl =
        //   `http://127.0.0.1:8083/output/${state.hdate}/race/${state.hdate}_${state.jcd}_${rno2}R_race.png`
        const nextImageUrl =
          `/output/${state.hdate}/race/${state.hdate}_${state.jcd}_${rno2}R_race.png`


        // ‘変化時だけ更新
        if (nextImageUrl !== this.lastImageUrl) {
          console.log('PNG切替:', nextImageUrl);

          this.imageUrl = nextImageUrl;
          this.lastImageUrl = nextImageUrl;
        };

        // ==================================
        // youtube
        // ==================================
        const nextYoutubeUrl = state.youtubeLiveUrl || '';

        if (nextYoutubeUrl !== this.lastYoutubeUrl) {
          console.log('Youtube切替:', nextYoutubeUrl);

          this.youtubeLiveUrl = this.sanitizer.bypassSecurityTrustResourceUrl(nextYoutubeUrl);
          this.lastYoutubeUrl = nextYoutubeUrl;
        }
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
