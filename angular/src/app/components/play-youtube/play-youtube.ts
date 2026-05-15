import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
// import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

@Component({
  selector: 'app-play-youtube',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './play-youtube.html',
  styleUrl: './play-youtube.css',
})
export class PlayYoutube implements OnInit, OnDestroy {
  imageUrl = '';
  currentRace = 1;

  private timer: any;
  private watchDogTimer: any;

  private lastImageUrl = '';
  private lastYoutubeUrl = '';
  private lastVideoId = '';

  private player: any = null;
  private youtubeApiReady = false;
  private pendingVideoId = '';

  private bufferingSince = 0;
  private unstartedSince = 0;
  private lastPlayingAt = 0;
  private recovering = false;

  // 復旧判定
  private readonly BUFFERING_LIMIT_MS = 30_000;
  private readonly UNSTARTED_LIMIT_MS = 45_000;
  private readonly WATCHDOG_INTERVAL_MS = 5_000;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadYoutubeIframeApi();

    // 初回
    this.loadState();

    // 5秒ごと更新
    this.timer = setInterval(() => {
      this.loadState();
    }, 5000);

    this.watchDogTimer = setInterval(() => {
      this.checkYoutubeHealth();
    }, this.WATCHDOG_INTERVAL_MS);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    if (this.watchDogTimer) clearInterval(this.watchDogTimer);

    if (this.player?.destroy) {
      this.player.destroy();
      this.player = null;
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

        if (nextYoutubeUrl && nextYoutubeUrl !== this.lastYoutubeUrl) {
          console.log('Youtube URL切替:', nextYoutubeUrl);

          this.lastYoutubeUrl = nextYoutubeUrl;

          const videoId = this.extractYoutubeVideoId(nextYoutubeUrl);

          if (videoId && videoId !== this.lastVideoId) {
            this.lastVideoId = videoId;
            this.setYoutubeVideo(videoId)
          }
        }
      },

      error: err => {
        console.error('signage-state error', err);
      }
    });
  }

  // ===============================================
  // 関数群
  // ===============================================
  private loadYoutubeIframeApi(): void {
    if (window.YT?.Player) {
      this.youtubeApiReady = true;
      this.createPlayerIfNeeded();
      return;
    }

    window.onYouTubeIframeAPIReady = () => {
      console.log('Youtube Iframe API ready');
      this.youtubeApiReady = true;
      this.createPlayerIfNeeded();
    };

    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (existing) return;

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';

    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
  }

  private createPlayerIfNeeded(): void {
    if (!this.youtubeApiReady) return;
    // 既に作成済みなら何もしない
    if (this.player) return;

    this.player = new window.YT.Player('youtube-player', {
      width: 1080,
      height: 608,
      videoId: this.pendingVideoId || undefined,
      playerVars: {
        autoplay: 1, mute: 1, controls: 0, playsinline: 1, rel: 0, modestbranding: 1, enablejsapi: 1, origin: window.location.origin,
      },
      events: {
        onReady: (event: any) => this.onPlayerReady(event),
        onStateChange: (event: any) => this.onPlayerStateChange(event),
        onError: (event: any) => this.onPlayerError(event),
      }
    });
  }

  private onPlayerReady(event: any): void {
    console.log('Youtube player ready');

    if (this.pendingVideoId) {
      event.target.loadVideoById(this.pendingVideoId);
    }

    event.target.mute();
    event.target.playVideo();
  }

  private onPlayerStateChange(event: any): void {
    const state = event.data;

    switch (state) {
      case window.YT.PlayerState.PLAYING:
        console.log('Youtube PLAYING');
        this.bufferingSince = 0;
        this.unstartedSince = 0;
        this.lastPlayingAt = Date.now();
        this.recovering = false;
        break;

      case window.YT.PlayerState.BUFFERING:
        console.log('youtube BUFFERING');
        if (!this.bufferingSince) {
          this.bufferingSince = Date.now();
        }
        break;

      case window.YT.PlayerState.UNSTARTED:
        console.log('YOUTUBE UNSTARTED');
        if (!this.unstartedSince) {
          this.unstartedSince = Date.now();
        }
        break;

      case window.YT.PlayerState.PAUSED:
        console.log('youtube PAUSED');
        // サイネージでは人が押して止める想定が薄いので再開を試す
        this.safePlayVideo();
        break;

      case window.YT.PlayerState.ENDED:
        console.log('youtube ENDED');
        // LIveの場合でも一時的にENDED扱いになる可能性があるため再開を試す
        this.safePlayVideo();
        break;
    }
  }

  private onPlayerError(event: any): void {
    console.error('youtube player error:', event.data);

    // エラー時も即destroyではなく、まず再生再試行
    this.safePlayVideo();

    setTimeout(() => {
      if (!this.isCurrentlyPlaying()) {
        this.recoverYoutubePlayer('player error');
      }
    }, 10_000);
  }

  private setYoutubeVideo(videoId: string): void {
    this.pendingVideoId = videoId;

    if (!this.youtubeApiReady) return;

    this.createPlayerIfNeeded()
    if (this.player?.loadVideoById) {
      console.log('Youtube video load:', videoId);
      this.resetYoutubeHealthFlags();
      this.player.loadVideoById(videoId);
      this.safePlayVideo();
    }
  }

  private checkYoutubeHealth(): void {
    if (!this.player || this.recovering) return;

    const now = Date.now();

    if (this.bufferingSince && now - this.bufferingSince > this.BUFFERING_LIMIT_MS) {
      this.recoverYoutubePlayer('buffering timeout');
      return;
    }

    if (this.unstartedSince && now - this.unstartedSince > this.UNSTARTED_LIMIT_MS) {
      this.recoverYoutubePlayer('unstarted timeout');
      return;
    }

    // 状態取得できる場合のみ補助☑
    const state = this.getPlayerStateSafe();

    if (
      state === window.YT?.PlayerState?.PAUSED ||
      state === window.YT?.PlayerState?.ENDED
    ) {
      this.safePlayVideo();
    }
  }

  private recoverYoutubePlayer(reason: string): void {
    if (!this.lastVideoId) return;

    console.warn('Youtube recovery:', reason);

    this.recovering = true;
    this.resetYoutubeHealthFlags();

    // まず軽い復旧: 同じplayerで再ロード
    try {
      this.player.loadVideoById(this.lastVideoId);
      this.safePlayVideo();
    } catch (err) {
      console.error('youtube soft recovery failed:', err);
      this.recreateYoutubePlayer();
      return;
    }

    // 15s後も再生に戻らんければ、player再生成
    setTimeout(() => {
      if (!this.isCurrentlyPlaying()) {
        this.recreateYoutubePlayer();
      } else {
        this.recovering = false;
      }
    }, 15_000);
  }

  private recreateYoutubePlayer(): void {
    console.warn('Youtube player recreate');

    try {
      if (this.player?.destroy) {
        this.player.destroy();
      }
    } catch (err) {
      console.error('Youtube destroy failed:', err);
    }

    this.player = null;
    this.recovering = false;
    this.resetYoutubeHealthFlags();

    setTimeout(() => {
      this.createPlayerIfNeeded();
    }, 1000);
  }

  private safePlayVideo(): void {
    try {
      this.player?.playVideo?.();
    } catch (err) {
      console.error('playvideo failed:', err);
    }
  }

  private isCurrentlyPlaying(): boolean {
    return this.getPlayerStateSafe() === window.YT?.PlayerState?.PLAYING;
  }

  private getPlayerStateSafe(): number | null {
    try {
      if (!this.player?.getPlayerState) return null;
      return this.player.getPlayerState();
    } catch {
      return null;
    }
  }

  private resetYoutubeHealthFlags(): void {
    this.bufferingSince = 0;
    this.unstartedSince = 0;
  }

  private extractYoutubeVideoId(url: string): string {
    if (!url) return '';

    // embed形式 https://www.youtube.com/embed/VIDEO_ID?...
    const embedMatch = url.match(/\/embed\/([^?&/]+)/);
    if (embedMatch) return embedMatch[1];

    // watch形式: https://www.youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/[?&]v=([^?&]+)/);
    if (watchMatch) return watchMatch[1];

    // youtu.be形式
    const shortMatch = url.match(/youtu\.be\/([^?&/]+)/);
    if (shortMatch) return shortMatch[1];

    return '';
  }

  onImageError(): void {
    console.error('画像読み込み失敗:', this.imageUrl);
  }
}
