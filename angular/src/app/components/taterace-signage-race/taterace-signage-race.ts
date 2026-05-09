import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-taterace-signage-race',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './taterace-signage-race.html',
  styleUrl: './taterace-signage-race.css',
})

export class TateraceSignageRace implements OnInit {
  hdate = '';
  jcd = '';
  rno = '';
  teibans = [1, 2, 3, 4, 5, 6];

  constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.hdate = params['hdate'];
      this.jcd = params['jcd'];
      this.rno = params['rno'];
    });
  }


  // Iframe用URL
  getIframeUrl(teiban: number): SafeResourceUrl {
    const url = `/racer?hdate=${this.hdate}&jcd=${this.jcd}&rno=${this.rno}&teiban=${teiban}&capture=1`;

    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

}
