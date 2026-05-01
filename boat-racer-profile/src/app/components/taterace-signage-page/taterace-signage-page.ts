import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TateraceSignage } from '../taterace-signage/taterace-signage';

@Component({
  selector: 'app-taterace-signage-page',
  standalone: true,
  imports: [CommonModule, TateraceSignage],
  template: `
  <app-taterace-signage
  *ngIf="racer"
  [racer]="racer">
  </app-taterace-signage>
  `})

export class TateraceSignagePage {

  racer: any;

  ngOnInit() {
    // 仮データ (まず表示確認)
    this.racer = {
      teiban: '5',
      rno: '12',
      rmei: '優勝戦',
      toban: '5188',
      name: '武井  莉理佳',
      shusin: '兵庫'
    };
  }
}
