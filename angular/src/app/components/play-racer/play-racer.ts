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
  @ViewChild(SelectorPanel)
  selectorPanel!: SelectorPanel;

  // fade制御
  isVisible = true;

  ngOnInit(): void {
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
  }
}
