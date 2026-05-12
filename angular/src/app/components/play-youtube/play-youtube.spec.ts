import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayYoutube } from './play-youtube';

describe('PlayYoutube', () => {
  let component: PlayYoutube;
  let fixture: ComponentFixture<PlayYoutube>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayYoutube]
    })
      .compileComponents();

    fixture = TestBed.createComponent(PlayYoutube);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
