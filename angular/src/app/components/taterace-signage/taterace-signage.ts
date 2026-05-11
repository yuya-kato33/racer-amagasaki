import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-taterace-signage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './taterace-signage.html',
  styleUrl: './taterace-signage.css',
})
export class TateraceSignage {

  @Input() racer: any;

  // 枠番色
  getBgColor(teiban: string): string {
    const map: any = {
      '1': '#ffffff',
      '2': '#000000',
      '3': '#d00000',
      '4': '#0040ff',
      '5': '#ffd800',
      '6': '#008a00'
    };
    return map[teiban] || '#ffffff';
  }

  // 文字色
  getTextColor(teiban: string): string {
    const map: any = {
      '1': '#000000',
      '2': '#ffffff',
      '3': '#ffffff',
      '4': '#ffffff',
      '5': '#000000',
      '6': '#ffffff'
    };
    return map[teiban] || '#000000';
  }

  // レース番号 (01→1)
  formatRaceNo(rno: string): string {
    return String(Number(rno));
  }

  // レース名
  getRaceTitle(): string {
    return this.racer.rmei || this.racer.rsname || '';
  }

  // 画像パス
  getPhoto(): string {
    return `/assets/racerphoto/${this.racer.toban}.jpg`;
  }

  // 場名
  getPlaceName(): string {
    const map: any = {
      '01': 'BOATRACE KIRYU',
      '02': 'BOATRACE TODA',
      '03': 'BOATRACE EDOGAWA',
      '04': 'BOATRACE HEIWAJIMA',
      '05': 'BOATRACE TAMAGAWA',
      '06': 'BOATRACE HAMANAKO',
      '07': 'BOATRACE GAMAGORI',
      '08': 'BOATRACE TOKONAME',
      '09': 'BOATRACE TSU',
      '10': 'BOATRACE MIKUNI',
      '11': 'BOATRACE BIWAKO',
      '12': 'BOATRACE SUMINOE',
      '13': 'BOATRACE AMAGASAKI',
      '14': 'BOATRACE NARUTO',
      '15': 'BOATRACE MARUGAME',
      '16': 'BOATRACE KOJIMA',
      '17': 'BOATRACE MIYAJIMA',
      '18': 'BOATRACE TOKUYAMA',
      '19': 'BOATRACE SHIMONOSEKI',
      '20': 'BOATRACE WAKAMATSU',
      '21': 'BOATRACE ASHIYA',
      '22': 'BOATRACE FUKUOKA',
      '23': 'BOATRACE KARATSU',
      '24': 'BOATRACE OMURA'
    };

    return map[this.racer.jcd] || 'BOATRACE;'
  }
}
