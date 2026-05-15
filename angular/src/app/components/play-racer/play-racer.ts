import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SelectorPanel } from '../selector-panel/selector-panel';

@Component({
  selector: 'app-play-racer',
  standalone: true,
  imports: [CommonModule, SelectorPanel],
  templateUrl: './play-racer.html',
  styleUrl: './play-racer.css',
})

export class PlayRacer implements OnInit, OnDestroy {
  private timer: any;
  private stateTimer: any;

  private lastJcd = '';

  @ViewChild(SelectorPanel)
  selectorPanel!: SelectorPanel;

  // fade制御
  isVisible = true;

  ngOnInit(): void {

    // ；初回state取得
    this.checkState();

    // 5秒監視
    this.stateTimer = setInterval(() => {
      this.checkState();
    }, 5000);

    // 30秒ごとページ切り替え
    this.timer = setInterval(() => {
      // fade out
      this.isVisible = false;
      // fade完了後にページ切り替え
      setTimeout(() => {
        if (this.selectorPanel) {
          this.selectorPanel.nextPage();
        }

        // fade in
        this.isVisible = true;
      }, 800)
    }, 30000)
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer)
    }
    if (this.stateTimer) {
      clearInterval(this.stateTimer);
    }
  }

  // 状態☑
  private checkState(): void {
    fetch('/api/signage-state')
      .then(r => r.json())
      .then(state => {
        const nextJcd = String(state.jcd).padStart(2, '0');

        // 初回
        if (!this.lastJcd) {
          this.lastJcd = nextJcd;
          return;
        }

        // 変更検知
        if (nextJcd !== this.lastJcd) {
          console.log(
            '場変更検知:', this.lastJcd, '→', nextJcd
          );
          this.lastJcd = nextJcd;

          // selector-panel再読み込み
          if (this.selectorPanel) {
            this.selectorPanel.reloadFromState();
          }
        }
      })

      .catch(err => {
        console.error('checkState error', err);
      });
  }
}
