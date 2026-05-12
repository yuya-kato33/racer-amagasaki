import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayRacer } from './play-racer';

describe('PlayRacer', () => {
  let component: PlayRacer;
  let fixture: ComponentFixture<PlayRacer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayRacer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayRacer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
