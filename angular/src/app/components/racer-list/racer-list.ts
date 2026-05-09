import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Racer,RacerService } from '../../services/racer.service';

@Component({
  selector: 'app-racer-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './racer-list.html',
  styleUrls: ['./racer-list.css']
})
export class RacerList implements OnChanges {
  @Input() hdate = '';
  @Input() jcd = '';

  racers: Racer[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(private racerService: RacerService) {}

  ngOnChanges(): void {
    if(this.hdate && this.jcd) {
      this.fetchRacers();
      };
  }

  fetchRacers() {
    this.isLoading = true;
    this.error = null;
    this.racerService.getRacers(this.hdate,this.jcd).subscribe({
      next: (data) => {
        console.log('取得データ:', data);
        this.racers = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('選手取得エラー:', err);
        this.error = '選手データの取得に失敗しました';
        this.isLoading = false;
      }
    });
  }

  getPhotoPath(toban: string): string {
    return `/assets/racerphoto/${toban}.jpg`;
  }

  setFallbackImage(event: Event): void {
    const img = event.target as HTMLImageElement;
    // placeholder.png の再読み込み防止
    if(!img.src.includes('placeholder.png')) {
      img.src = '/assets/placeholder.png';
    }
  }
  
  // 支部から全角スペースを削除する
  normalizeShibu(shibu: string):string {
    return shibu.replace(/\s+/g, '').replace(/　/g, ''); // 半角・全角空白を削除
  }
}
