import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { TateraceSignage } from '../taterace-signage/taterace-signage';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-taterace-signage-page',
  standalone: true,
  imports: [CommonModule, TateraceSignage],
  templateUrl: './taterace-signage-page.html',
  styleUrls: ['./taterace-signage-page.css']   // ←これ追加
})

export class TateraceSignagePage implements OnInit {

  racer: any;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
  ) { }

  scale = 1;
  isCapture = false;

  ngOnInit(): void {
    // 仮データ (まず表示確認)
    // this.racer = {
    //   teiban: '5',
    //   rno: '12',
    //   rmei: '優勝戦',
    //   toban: '5188',
    //   name: '武井  莉理佳',
    //   shusin: '兵庫'
    // };

    this.route.queryParams.subscribe(params => {

      const hdate = params['hdate'];
      const jcd = params['jcd'];
      const rno = params['rno'];
      const teiban = params['teiban'];

      this.http.get<any[]>(
        `/api/race?hdate=${hdate}&jcd=${jcd}&rno=${rno}`
      ).subscribe(data => {
        // ★ここで1艇だけ抽出
        this.racer = data.find(r => r.teiban == teiban);

      });
    });

    const params = new URLSearchParams(window.location.search);

    this.isCapture = params.get('capture') === '1';
    if (this.isCapture) {
      this.scale = 1;
    } else {
      this.updateScale();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!this.isCapture) {
      this.updateScale();
    }
  }

  private updateScale(): void {
    const baseWidth = 1080;
    const baseHeight = 1920;

    const scaleX = window.innerWidth / baseWidth;
    const scaleY = window.innerHeight / baseHeight;

    this.scale = Math.min(scaleX, scaleY);
  }
}
